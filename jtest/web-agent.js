#!/usr/bin/env node
/**
 * web-agent.js — Browser-search agent for Joule
 *
 * Listens on port 6657.  Frontend POSTs { userText } to /agent.
 * The agent:
 *   1. Searches DuckDuckGo (Instant Answer API + HTML results — no key needed)
 *   2. Extracts snippets and builds a search-context block
 *   3. Calls HAI relay (localhost:6656) with the augmented prompt
 *   4. Returns the LLM answer as JSON { text }
 *
 * Usage:  node web-agent.js
 *         AGENT_PORT=6658 node web-agent.js
 */

const http  = require('http');
const https = require('https');

const AGENT_PORT = parseInt(process.env.AGENT_PORT ?? '6657', 10);
const HAI_RELAY_HOST = '127.0.0.1';
const HAI_RELAY_PORT = 6656;
const DEFAULT_API_KEY = '14615e0f-2fcb-4bb1-8b0a-4fd166743715';
const DEFAULT_MODEL   = 'anthropic--claude-4.5-haiku';

/* ─────────────────────────────────────────────────────────────────────────
   0. Airport / flight query detection + OpenSky Network real-time API
   ───────────────────────────────────────────────────────────────────────── */
const IATA_TO_ICAO = {
  SFO:'KSFO',LAX:'KLAX',JFK:'KJFK',ORD:'KORD',ATL:'KATL',DFW:'KDFW',
  DEN:'KDEN',SEA:'KSEA',MIA:'KMIA',BOS:'KBOS',LAS:'KLAS',PHX:'KPHX',
  IAH:'KIAH',CLT:'KCLT',MCO:'KMCO',MSP:'KMSP',EWR:'KEWR',LGA:'KLGA',
  FLL:'KFLL',DTW:'KDTW',PHL:'KPHL',SLC:'KSLC',PDX:'KPDX',AUS:'KAUS',
  BNA:'KBNA',OAK:'KOAK',SJC:'KSJC',
  LHR:'EGLL',CDG:'LFPG',AMS:'EHAM',FRA:'EDDF',
  NRT:'RJAA',HND:'RJTT',ICN:'RKSI',SIN:'WSSS',
  DXB:'OMDB',SYD:'YSSY',YYZ:'CYYZ',
};

function detectFlightQuery(text) {
  const up = text.toUpperCase();
  // Match IATA codes
  for (const [iata, icao] of Object.entries(IATA_TO_ICAO)) {
    if (new RegExp(`\\b${iata}\\b`).test(up)) {
      const isArr = /arri[vw]|inbound|incoming|landing/i.test(text);
      const isDep = /depar|outbound|outgoing|takeoff/i.test(text);
      return { iata, icao, type: isDep ? 'departure' : 'arrival' };
    }
  }
  return null;
}

/* OpenSky Network free REST API — no key required (rate-limited to ~1 req/5s anonymous) */
function fetchOpenSkyFlights(icao, type) {
  const now = Math.floor(Date.now() / 1000);
  const begin = now - 7200; /* last 2h */
  const endpoint = type === 'departure' ? 'departure' : 'arrival';
  const path = `/api/flights/${endpoint}?airport=${icao}&begin=${begin}&end=${now}`;
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'opensky-network.org',
      path,
      method:   'GET',
      headers:  { 'Accept': 'application/json', 'User-Agent': 'joule-agent/1.0' },
    }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { const d = JSON.parse(buf); resolve(Array.isArray(d) ? d : []); }
        catch { resolve([]); }
      });
    });
    req.on('error', () => resolve([]));
    req.setTimeout(8000, () => { req.destroy(); resolve([]); });
    req.end();
  });
}

function formatFlightTable(flights, iata, type) {
  if (!flights || flights.length === 0) return '';
  const label = type === 'departure' ? `Departures from ${iata}` : `Arrivals at ${iata}`;
  const rows = flights.slice(0, 15).map(f => {
    const cs  = (f.callsign || '').trim() || '—';
    const dep = f.estDepartureAirport || '—';
    const arr = f.estArrivalAirport   || '—';
    const ts  = f.lastSeen || f.firstSeen;
    const time = ts
      ? new Date(ts * 1000).toLocaleTimeString('en-US',
          { hour: '2-digit', minute: '2-digit', timeZone: 'America/Los_Angeles' })
      : '—';
    return type === 'departure'
      ? `| ${cs} | ${arr} | ${time} |`
      : `| ${cs} | ${dep} | ${time} |`;
  }).join('\n');
  const header = type === 'departure'
    ? `## ${label} (last 2 h, Pacific Time)\n\n| Flight | Destination | Time |\n|---|---|---|\n`
    : `## ${label} (last 2 h, Pacific Time)\n\n| Flight | Origin | Time |\n|---|---|---|\n`;
  return `[OpenSky Network live data]\n\n${header}${rows}\n`;
}

/* ─────────────────────────────────────────────────────────────────────────
   1. DuckDuckGo Instant Answer API (returns JSON, no API key)
   ───────────────────────────────────────────────────────────────────────── */
function ddgInstant(query) {
  const q = encodeURIComponent(query);
  const path = `/?q=${q}&format=json&no_html=1&skip_disambig=1`;
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.duckduckgo.com',
      path,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; joule-web-agent/1.0)' },
    }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); }
        catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(5000, () => { req.destroy(); resolve(null); });
    req.end();
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   2. DuckDuckGo HTML search (returns top-result snippets)
   ───────────────────────────────────────────────────────────────────────── */
function ddgHtml(query) {
  const q = encodeURIComponent(query);
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'html.duckduckgo.com',
      path: `/html/?q=${q}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
                      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    }, (res) => {
      /* Follow single redirect */
      if (res.statusCode >= 301 && res.statusCode <= 302 && res.headers.location) {
        const loc = res.headers.location;
        res.resume();
        https.get(loc, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res2) => {
          let buf = '';
          res2.on('data', c => buf += c);
          res2.on('end', () => resolve(buf));
        }).on('error', () => resolve(''));
        return;
      }
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => resolve(buf));
    });
    req.on('error', () => resolve(''));
    req.setTimeout(8000, () => { req.destroy(); resolve(''); });
    req.end();
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   3. Parse DDG HTML — extract up to 5 result titles + snippets + real URLs
   ───────────────────────────────────────────────────────────────────────── */
function stripHtml(s) {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

/* Extract the real href from a DDG result link.
   DDG wraps results as: //duckduckgo.com/l/?uddg=URL_ENCODED&amp;rut=... */
function extractRealUrl(rawHref) {
  if (!rawHref) return '';
  try {
    /* Decode HTML entity &amp; → & */
    const href = rawHref.replace(/&amp;/g, '&');
    if (href.includes('uddg=')) {
      /* Handle both //duckduckgo.com/l/... and /l/... and https://... */
      const base = href.startsWith('//')
        ? 'https:' + href
        : href.startsWith('/')
          ? 'https://duckduckgo.com' + href
          : href;
      const u = new URL(base);
      const uddg = u.searchParams.get('uddg');
      return uddg ? decodeURIComponent(uddg) : '';
    }
    return href.startsWith('http') ? href : '';
  } catch { return ''; }
}

function parseDDG(html) {
  const results = [];

  /* Flatten extraction: match all result__a anchors and result__snippet anchors separately.
     DDG always renders them in the same order (title then snippet per result). */
  const titleRe   = /<a[^>]+class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const snippetRe = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

  const titles = [];
  let tm;
  while ((tm = titleRe.exec(html)) !== null && titles.length < 6) {
    titles.push({ url: extractRealUrl(tm[1]), title: stripHtml(tm[2]) });
  }

  const snippets = [];
  let sm;
  while ((sm = snippetRe.exec(html)) !== null && snippets.length < 6) {
    snippets.push(stripHtml(sm[1]));
  }

  const count = Math.min(titles.length, Math.max(snippets.length, titles.length), 5);
  for (let i = 0; i < count; i++) {
    results.push({
      title:   titles[i]?.title   || '',
      url:     titles[i]?.url     || '',
      snippet: snippets[i]        || '',
    });
  }

  return results;
}

/* ─────────────────────────────────────────────────────────────────────────
   3b. Fetch a web page and extract its visible text content (≤ 3000 chars)
       Skips known paywalled/JS-only domains gracefully.
   ───────────────────────────────────────────────────────────────────────── */
const SKIP_DOMAINS = ['youtube.com', 'twitter.com', 'facebook.com', 'instagram.com',
                      'reddit.com', 'linkedin.com', 'tiktok.com'];

function extractText(html, maxChars) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"').replace(/&nbsp;/g,' ').replace(/&#x27;/g,"'")
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, maxChars);
}

function fetchPageText(pageUrl, maxChars = 2500, _depth = 0) {
  if (_depth > 2) return Promise.resolve('');
  const FETCH_TIMEOUT_MS = 5000;

  const fetchPromise = new Promise((resolve) => {
    let url;
    try { url = new URL(pageUrl); } catch { resolve(''); return; }
    if (SKIP_DOMAINS.some(d => url.hostname.includes(d))) { resolve(''); return; }

    const lib = url.protocol === 'https:' ? https : http;
    let buf = '';
    let settled = false;
    const done = (raw) => {
      if (settled) return;
      settled = true;
      resolve(raw.length > 50 ? extractText(raw, maxChars) : '');
    };

    const req = lib.request({
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method:   'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
                      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    }, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302 ||
           res.statusCode === 303 || res.statusCode === 307) && res.headers.location) {
        res.resume();
        fetchPageText(res.headers.location, maxChars, _depth + 1).then(resolve);
        settled = true;
        return;
      }
      if (res.statusCode !== 200) { res.resume(); done(''); return; }

      res.on('data', c => {
        buf += c;
        if (buf.length > 150000) {
          /* Cap hit — process what we have now, stop downloading */
          req.destroy();
          done(buf);
        }
      });
      res.on('end',  () => done(buf));
      res.on('error',() => done(buf)); /* resolve with whatever we have */
    });
    req.on('error', () => done(buf));
    req.setTimeout(3500, () => { req.destroy(); done(buf); });
    req.end();
  });

  const timeoutPromise = new Promise(r => setTimeout(() => r(''), FETCH_TIMEOUT_MS));
  return Promise.race([fetchPromise, timeoutPromise]);
}

/* ─────────────────────────────────────────────────────────────────────────
   4. Build search-context string for the LLM system prompt
      Now includes fetched page content for top results when available.
   ───────────────────────────────────────────────────────────────────────── */
function buildContext(query, instant, htmlResults, pageContents) {
  const lines = [`[Web search results for: "${query}"]`, ''];

  if (instant?.AbstractText) {
    lines.push(`**${instant.AbstractSource || 'Summary'}:** ${instant.AbstractText}`);
    if (instant.AbstractURL) lines.push(`Source: ${instant.AbstractURL}`);
    lines.push('');
  }

  const topics = (instant?.RelatedTopics || [])
    .filter(t => t.Text && !t.Topics)
    .slice(0, 3);
  if (topics.length > 0) {
    lines.push('**Related:**');
    topics.forEach(t => lines.push(`- ${t.Text.replace(/\s*https?:\/\/\S+/g, '').trim()}`));
    lines.push('');
  }

  const topResults = htmlResults.filter(r => r.snippet).slice(0, 4);
  if (topResults.length > 0) {
    lines.push('**Search result snippets:**');
    topResults.forEach((r, i) => {
      const title = r.title ? `**${r.title}** — ` : '';
      const src   = r.url   ? ` (${r.url})` : '';
      lines.push(`${i + 1}. ${title}${r.snippet}${src}`);
    });
    lines.push('');
  }

  /* Add fetched page content for context-rich results */
  if (pageContents && pageContents.length > 0) {
    lines.push('**Page content (fetched from top results):**');
    pageContents.forEach((pc, i) => {
      if (pc.text && pc.text.length > 50) {
        lines.push(`\n--- Source ${i + 1}: ${pc.url} ---`);
        lines.push(pc.text.slice(0, 2000));
      }
    });
    lines.push('');
  }

  return lines.join('\n');
}

/* ─────────────────────────────────────────────────────────────────────────
   5. Call HAI relay → get answer text
   ───────────────────────────────────────────────────────────────────────── */
function callHAI(userText, searchContext, apiKey, model) {
  const system = searchContext
    ? 'You are Joule, SAP\'s AI assistant with web search capability. ' +
      'The web search has already been performed and the results are provided below — ' +
      'do NOT say you cannot browse the internet or access real-time data, because the ' +
      'search was done for you and the content is included here. ' +
      'Use the provided search results and page content to answer the question as accurately ' +
      'and specifically as possible. If the search results contain the exact information asked for ' +
      '(e.g. flight schedules, prices, news), present it directly. ' +
      'Use markdown formatting (headings, bullet lists, tables) where appropriate.\n\n' +
      searchContext
    : 'You are Joule, SAP\'s AI assistant. Be helpful, concise, and professional. ' +
      'Use markdown formatting where appropriate.';

  const payload = JSON.stringify({
    model:      model || DEFAULT_MODEL,
    max_tokens: 1200,
    system,
    messages: [{ role: 'user', content: userText }],
  });

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname:  HAI_RELAY_HOST,
      port:      HAI_RELAY_PORT,
      path:      '/',
      method:    'POST',
      headers: {
        'Content-Type':      'application/json',
        'Content-Length':    Buffer.byteLength(payload),
        'x-api-key':         apiKey || DEFAULT_API_KEY,
        'anthropic-version': '2023-06-01',
      },
    }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(buf);
          const text = json?.content?.[0]?.text ?? '';
          if (!text) reject(new Error(`empty HAI response (status ${res.statusCode})`));
          else resolve(text);
        } catch (e) {
          reject(new Error('HAI response parse error: ' + e.message));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(25000, () => { req.destroy(); reject(new Error('HAI timeout')); });
    req.write(payload);
    req.end();
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   6. HTTP server
   ───────────────────────────────────────────────────────────────────────── */
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return;
  }

  if (req.method !== 'POST' || req.url !== '/agent') {
    res.writeHead(req.method === 'POST' ? 404 : 405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Use POST /agent' }));
    return;
  }

  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', async () => {
    let body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString());
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid JSON body' }));
      return;
    }

    const { userText, apiKey, model } = body;
    if (!userText || typeof userText !== 'string') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'userText is required' }));
      return;
    }

    console.log(`[agent] query: "${userText.slice(0, 80)}..."`);

    try {
      /* ── Check for airport/flight query → use OpenSky API directly ── */
      const flightQ = detectFlightQuery(userText);
      let flightData = '';
      if (flightQ) {
        console.log(`[agent] flight query: ${flightQ.iata} (${flightQ.icao}) type=${flightQ.type}`);
        const flights = await fetchOpenSkyFlights(flightQ.icao, flightQ.type);
        console.log(`[agent] opensky: ${flights.length} flights`);
        flightData = formatFlightTable(flights, flightQ.iata, flightQ.type);
      }

      /* ── Run DDG instant + HTML search in parallel ── */
      const [instant, html] = await Promise.allSettled([
        ddgInstant(userText),
        ddgHtml(userText),
      ]).then(r => [
        r[0].status === 'fulfilled' ? r[0].value : null,
        r[1].status === 'fulfilled' ? r[1].value : '',
      ]);

      const htmlResults = parseDDG(html);
      console.log(`[agent] search: ${htmlResults.length} results, instant=${!!instant?.AbstractText}`);

      /* Fetch page content from top 2 results with a combined 8s hard cap */
      const topUrls = htmlResults
        .filter(r => r.url && r.url.startsWith('http'))
        .slice(0, 2);
      const pageContents = await Promise.race([
        Promise.all(topUrls.map(r => fetchPageText(r.url).then(text => ({ url: r.url, text })))),
        new Promise(r => setTimeout(() => r([]), 8000)),
      ]);
      const richPages = pageContents.filter(p => p.text && p.text.length > 100);
      console.log(`[agent] fetched ${richPages.length}/${topUrls.length} pages`);

      /* ── Build context — prepend flight data if available ── */
      const hasResults  = !!flightData || (instant?.AbstractText) || htmlResults.length > 0 || richPages.length > 0;
      let searchCtx = hasResults ? buildContext(userText, instant, htmlResults, richPages) : null;
      if (flightData && searchCtx) {
        searchCtx = flightData + '\n\n' + searchCtx;
      } else if (flightData) {
        searchCtx = flightData;
      }

      const answer = await callHAI(userText, searchCtx, apiKey, model);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ text: answer, searched: hasResults }));

    } catch (err) {
      console.error('[agent] error:', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

server.listen(AGENT_PORT, '127.0.0.1', () => {
  console.log(`[web-agent] listening  http://localhost:${AGENT_PORT}/agent`);
  console.log(`[web-agent] → HAI relay  http://${HAI_RELAY_HOST}:${HAI_RELAY_PORT}`);
});