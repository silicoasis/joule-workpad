#!/usr/bin/env node
/**
 * web-agent.js — Generic browser-search agent for Joule
 *
 * Pipeline for every query:
 *   1. DuckDuckGo Instant Answer + HTML search (no key)
 *   2. Static HTTP fetch of top result URLs  (fast, 5 s cap)
 *   3. Headless Chrome scrape for any URL where static content is thin
 *      (handles JS-rendered pages, SPAs, real-time schedules, etc.)
 *   4. Call HAI relay (Claude) with rich context
 *   5. Return { text } — data presented directly in chat
 */

const http   = require('http');
const https  = require('https');
const { chromium } = require('playwright-core');

const CHROME_PATH    = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const AGENT_PORT     = parseInt(process.env.AGENT_PORT ?? '6657', 10);
const HAI_RELAY_HOST = '127.0.0.1';
const HAI_RELAY_PORT = 6656;
const DEFAULT_API_KEY = '14615e0f-2fcb-4bb1-8b0a-4fd166743715';
const DEFAULT_MODEL   = 'anthropic--claude-4.5-haiku';

/* ── Domains to always skip (login walls / bot blocks) ─────────────────── */
const SKIP_DOMAINS = [
  'youtube.com','twitter.com','x.com','facebook.com','instagram.com',
  'reddit.com','linkedin.com','tiktok.com','pinterest.com',
];

/* ── Well-known free public APIs ────────────────────────────────────────── */
/* Crypto prices via CoinGecko (free, no key) */
const CRYPTO_IDS = {
  bitcoin:'bitcoin',btc:'bitcoin',
  ethereum:'ethereum',eth:'ethereum',
  solana:'solana',sol:'solana',
  dogecoin:'dogecoin',doge:'dogecoin',
  bnb:'binancecoin',
  xrp:'ripple',ripple:'ripple',
  cardano:'cardano',ada:'cardano',
  avalanche:'avalanche-2',avax:'avalanche-2',
};

function detectCryptoQuery(text) {
  const lower = text.toLowerCase();
  if (!/price|value|worth|cost|usd|market|rate/i.test(lower)) return null;
  for (const [kw, id] of Object.entries(CRYPTO_IDS)) {
    if (lower.includes(kw)) return id;
  }
  return null;
}

function fetchCryptoPrice(coinId) {
  return new Promise((resolve) => {
    const path = `/api/v3/simple/price?ids=${coinId}&vs_currencies=usd,eur&include_24hr_change=true&include_market_cap=true`;
    const req = https.request({
      hostname: 'api.coingecko.com', path, method: 'GET',
      headers: { 'Accept': 'application/json', 'User-Agent': 'joule-agent/2.0' },
    }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try {
          const d = JSON.parse(buf);
          const coin = d[coinId];
          if (!coin) { resolve(''); return; }
          const name = coinId.charAt(0).toUpperCase() + coinId.slice(1);
          const usd  = coin.usd?.toLocaleString('en-US') || '—';
          const chg  = coin.usd_24h_change?.toFixed(2) || '—';
          const cap  = coin.usd_market_cap
            ? '$' + (coin.usd_market_cap / 1e9).toFixed(2) + 'B'
            : '—';
          resolve(`[CoinGecko live price]\n\n**${name}**\n- Price: $${usd} USD\n- 24h change: ${chg}%\n- Market cap: ${cap}\n`);
        } catch { resolve(''); }
      });
    });
    req.on('error', () => resolve(''));
    req.setTimeout(5000, () => { req.destroy(); resolve(''); });
    req.end();
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   1.  DuckDuckGo — Instant Answer JSON + HTML search results
   ═════════════════════════════════════════════════════════════════════════ */
function ddgInstant(query) {
  const q = encodeURIComponent(query);
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.duckduckgo.com',
      path: `/?q=${q}&format=json&no_html=1&skip_disambig=1`,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; joule-agent/2.0)' },
    }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => { try { resolve(JSON.parse(buf)); } catch { resolve(null); } });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(5000, () => { req.destroy(); resolve(null); });
    req.end();
  });
}

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
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        res.resume();
        https.get(res.headers.location, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (r2) => {
          let buf = '';
          r2.on('data', c => buf += c);
          r2.on('end', () => resolve(buf));
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

/* ── Parse DDG HTML → [{title, url, snippet}] ──────────────────────────── */
function stripHtml(s) {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&nbsp;/g,' ')
    .replace(/\s+/g,' ').trim();
}

function extractRealUrl(rawHref) {
  if (!rawHref) return '';
  try {
    const href = rawHref.replace(/&amp;/g, '&');
    if (href.includes('uddg=')) {
      const base = href.startsWith('//')
        ? 'https:' + href
        : href.startsWith('/') ? 'https://duckduckgo.com' + href : href;
      const uddg = new URL(base).searchParams.get('uddg');
      return uddg ? decodeURIComponent(uddg) : '';
    }
    return href.startsWith('http') ? href : '';
  } catch { return ''; }
}

function parseDDG(html) {
  const titleRe   = /<a[^>]+class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const snippetRe = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
  const titles = []; let tm;
  while ((tm = titleRe.exec(html)) !== null && titles.length < 6)
    titles.push({ url: extractRealUrl(tm[1]), title: stripHtml(tm[2]) });
  const snippets = []; let sm;
  while ((sm = snippetRe.exec(html)) !== null && snippets.length < 6)
    snippets.push(stripHtml(sm[1]));
  return Array.from({ length: Math.min(titles.length, 5) }, (_, i) => ({
    title:   titles[i]?.title   || '',
    url:     titles[i]?.url     || '',
    snippet: snippets[i]        || '',
  }));
}

/* ═══════════════════════════════════════════════════════════════════════════
   2.  Static HTTP page fetch  (fast, no JS execution)
   ═════════════════════════════════════════════════════════════════════════ */
function staticFetch(pageUrl, maxChars = 3000, _depth = 0) {
  if (_depth > 2) return Promise.resolve('');
  return Promise.race([
    new Promise((resolve) => {
      let url; try { url = new URL(pageUrl); } catch { resolve(''); return; }
      if (SKIP_DOMAINS.some(d => url.hostname.includes(d))) { resolve(''); return; }
      const lib = url.protocol === 'https:' ? https : http;
      let buf = '', settled = false;
      const done = (raw) => {
        if (settled) return; settled = true;
        if (raw.length < 50) { resolve(''); return; }
        const text = raw
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi,  ' ')
          .replace(/<(nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
          .replace(/&quot;/g,'"').replace(/&nbsp;/g,' ')
          .replace(/\s{2,}/g, ' ').trim().slice(0, maxChars);
        resolve(text);
      };
      const req = lib.request({
        hostname: url.hostname, path: url.pathname + url.search, method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
                        'AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      }, (res) => {
        if ([301,302,303,307].includes(res.statusCode) && res.headers.location) {
          res.resume(); settled = true;
          staticFetch(res.headers.location, maxChars, _depth + 1).then(resolve);
          return;
        }
        if (res.statusCode !== 200) { res.resume(); done(''); return; }
        res.on('data', c => { buf += c; if (buf.length > 200000) { req.destroy(); done(buf); } });
        res.on('end',  () => done(buf));
        res.on('error',() => done(buf));
      });
      req.on('error', () => done(buf));
      req.setTimeout(4000, () => { req.destroy(); done(buf); });
      req.end();
    }),
    new Promise(r => setTimeout(() => r(''), 5500)),
  ]);
}

/* ═══════════════════════════════════════════════════════════════════════════
   3.  Headless Chrome scrape — generic smart extraction
       Handles tables, article text, repeating list items, schedule pages, etc.
   ═════════════════════════════════════════════════════════════════════════ */
async function headlessFetch(pageUrl, maxChars = 8000) {
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000); /* let lazy JS finish */

    const text = await page.evaluate((max) => {
      /* ── Strategy A: HTML <table> rows ── */
      const tables = document.querySelectorAll('table');
      let tableText = '';
      tables.forEach(t => {
        Array.from(t.querySelectorAll('tr')).slice(0, 80).forEach(r => {
          const cells = Array.from(r.querySelectorAll('td,th'))
            .map(c => c.innerText?.trim()).filter(Boolean).join('\t');
          if (cells) tableText += cells + '\n';
        });
      });
      if (tableText.length > 150) return ('[TABLE DATA]\n' + tableText).slice(0, max);

      /* ── Strategy B: <main> / <article> / [role=main] content ── */
      const main = document.querySelector('main,[role=main],article,#content,.content,.main-content,#main');
      if (main) {
        ['script','style','nav','footer','header','aside'].forEach(tag =>
          main.querySelectorAll(tag).forEach(el => el.remove()));
        const mt = (main.innerText || main.textContent || '').replace(/\s{2,}/g,' ').trim();
        if (mt.length > 200) return mt.slice(0, max);
      }

      /* ── Strategy C: Time/schedule/flight line extraction ── */
      const raw = (document.body?.innerText || '').replace(/\r/g, '');
      const TIME_OR_FLIGHT = /\d{1,2}:\d{2}|[A-Z]{2}\d{3,4}/;
      const NOISE = /^(Flights?|Terminals?|Parking|Services?|Transport|Car Rental|Reviews?|FAQs?|Menu|Home|Search|Filter|Show|All|Morning|Afternoon|Evening|Night|\+|<|>|\|)$/i;
      const schedLines = raw.split('\n').map(l => l.trim())
        .filter(l => l.length > 3 && TIME_OR_FLIGHT.test(l) && !NOISE.test(l));
      if (schedLines.length > 8)
        return '[SCHEDULE DATA]\n' + schedLines.slice(0, 200).join('\n').slice(0, max);

      /* ── Strategy D: Repeating item extraction (news articles, product lists) ── */
      const candidates = [
        'article', '.article', '.post', '.item', '.result', '.card',
        '.news-item', '.product', 'li[class]', '[class*=item]', '[class*=row]',
      ];
      for (const sel of candidates) {
        const items = Array.from(document.querySelectorAll(sel)).slice(0, 30);
        if (items.length >= 3) {
          const itemText = items
            .map(el => (el.innerText || '').replace(/\s{2,}/g,' ').trim())
            .filter(t => t.length > 20)
            .join('\n---\n');
          if (itemText.length > 200) return ('[LIST ITEMS]\n' + itemText).slice(0, max);
        }
      }

      /* ── Strategy E: Full page text fallback ── */
      ['script','style','nav','footer','header','aside'].forEach(tag =>
        document.querySelectorAll(tag).forEach(el => el.remove()));
      return ((document.body?.innerText || '').replace(/\s{2,}/g, ' ').trim()).slice(0, max);
    }, maxChars);

    await browser.close();
    return text;
  } catch (err) {
    console.error('[agent] headless error:', err.message.slice(0, 100));
    try { await browser?.close(); } catch {}
    return '';
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   4.  Build LLM context block
   ═════════════════════════════════════════════════════════════════════════ */
function buildContext(query, instant, htmlResults, pageContents) {
  const lines = [`[Web search results for: "${query}"]`, ''];

  if (instant?.AbstractText) {
    lines.push(`**${instant.AbstractSource || 'Summary'}:** ${instant.AbstractText}`);
    if (instant.AbstractURL) lines.push(`Source: ${instant.AbstractURL}`);
    lines.push('');
  }
  const relTopics = (instant?.RelatedTopics || []).filter(t => t.Text && !t.Topics).slice(0, 3);
  if (relTopics.length) {
    lines.push('**Related:**');
    relTopics.forEach(t => lines.push(`- ${t.Text.replace(/\s*https?:\/\/\S+/g,'').trim()}`));
    lines.push('');
  }

  const topSnippets = htmlResults.filter(r => r.snippet).slice(0, 4);
  if (topSnippets.length) {
    lines.push('**Search snippets:**');
    topSnippets.forEach((r, i) => {
      const src = r.url ? ` (${r.url})` : '';
      lines.push(`${i+1}. ${r.title ? `**${r.title}** — ` : ''}${r.snippet}${src}`);
    });
    lines.push('');
  }

  if (pageContents?.length) {
    lines.push('**Fetched page content:**');
    pageContents.forEach((pc, i) => {
      if (pc.text?.length > 50) {
        lines.push(`\n--- Source ${i+1}: ${pc.url} ---`);
        lines.push(pc.text.slice(0, 6000));
      }
    });
    lines.push('');
  }

  return lines.join('\n');
}

/* ═══════════════════════════════════════════════════════════════════════════
   5.  Call HAI relay (Claude)
   ═════════════════════════════════════════════════════════════════════════ */
function callHAI(userText, searchCtx, apiKey, model) {
  const system = searchCtx
    ? 'You are Joule, an AI assistant with real-time web access. ' +
      'A web search was just performed and the raw results are provided below — ' +
      'DO NOT say you cannot browse the internet or access real-time data. ' +
      'DO NOT redirect the user to external websites unless they explicitly ask for links. ' +
      'Present the information DIRECTLY and COMPLETELY in your response. ' +
      'If the content contains structured data (schedules, prices, tables, lists), ' +
      'format it as a markdown table or list and show ALL entries available. ' +
      'Be specific, use actual numbers/names/times from the data, not generic descriptions.\n\n' +
      searchCtx
    : 'You are Joule, an AI assistant. Be helpful, concise, and professional. ' +
      'Use markdown formatting where appropriate.';

  const payload = JSON.stringify({
    model:      model || DEFAULT_MODEL,
    max_tokens: 3000,
    system,
    messages: [{ role: 'user', content: userText }],
  });

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: HAI_RELAY_HOST, port: HAI_RELAY_PORT, path: '/', method: 'POST',
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
          const j = JSON.parse(buf);
          const t = j?.content?.[0]?.text ?? '';
          if (!t) reject(new Error(`empty response (status ${res.statusCode})`));
          else resolve(t);
        } catch (e) { reject(new Error('parse error: ' + e.message)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('HAI timeout')); });
    req.write(payload);
    req.end();
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   6.  HTTP server
   ═════════════════════════════════════════════════════════════════════════ */
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST' || req.url !== '/agent') {
    res.writeHead(req.method === 'POST' ? 404 : 405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Use POST /agent' })); return;
  }

  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', async () => {
    let body;
    try { body = JSON.parse(Buffer.concat(chunks).toString()); }
    catch { res.writeHead(400,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:'invalid JSON'})); return; }

    const { userText, apiKey, model } = body;
    if (!userText || typeof userText !== 'string') {
      res.writeHead(400,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:'userText required'})); return;
    }

    console.log(`[agent] query: "${userText.slice(0, 90)}"`);

    try {
      /* ── Step 0: Direct public APIs (crypto, etc.) ──────────────── */
      const cryptoId = detectCryptoQuery(userText);
      let directApiData = '';
      if (cryptoId) {
        console.log(`[agent] crypto API: ${cryptoId}`);
        directApiData = await fetchCryptoPrice(cryptoId);
        if (directApiData) console.log('[agent] crypto: got price data');
      }

      /* ── Step 1: DDG search (retry once on empty, rate-limit guard) */
      let instant = null, html = '';
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 1500)); /* backoff */
        const [iRes, hRes] = await Promise.allSettled([
          ddgInstant(userText), ddgHtml(userText),
        ]);
        instant = iRes.status === 'fulfilled' ? iRes.value : null;
        html    = hRes.status === 'fulfilled' ? hRes.value : '';
        if (parseDDG(html).length > 0) break; /* got results, stop retrying */
        console.log(`[agent] DDG empty, attempt ${attempt + 1}`);
      }
      const htmlResults = parseDDG(html);
      console.log(`[agent] search: ${htmlResults.length} results, instant=${!!instant?.AbstractText}`);

      /* ── Step 2: Static HTTP fetch of top 3 URLs ────────────────── */
      const topUrls = htmlResults.filter(r => r.url?.startsWith('http')).slice(0, 3);
      const staticPages = await Promise.race([
        Promise.all(topUrls.map(r => staticFetch(r.url).then(text => ({ url: r.url, text })))),
        new Promise(r => setTimeout(() => r([]), 9000)),
      ]);

      /* Classify pages as "rich" (> 300 useful chars) or "thin" */
      const richPages  = staticPages.filter(p => p.text?.length > 300);
      const thinUrls   = staticPages
        .filter(p => !p.text || p.text.length <= 300)
        .map(p => p.url)
        .filter(Boolean);

      console.log(`[agent] static: ${richPages.length} rich, ${thinUrls.length} thin`);

      /* ── Step 3: Headless Chrome for thin/missing pages ─────────── */
      /* Try headless for all thin pages, run them sequentially to avoid
         opening multiple Chrome instances at once.  Stop as soon as we
         have at least 2 rich results. */
      const headlessPages = [...richPages];
      for (const url of thinUrls) {
        if (headlessPages.length >= 2) break;
        console.log(`[agent] headless: ${url}`);
        const text = await Promise.race([
          headlessFetch(url, 8000),
          new Promise(r => setTimeout(() => r(''), 22000)),
        ]);
        if (text.length > 100) {
          headlessPages.push({ url, text });
          console.log(`[agent] headless: got ${text.length} chars`);
        } else {
          console.log('[agent] headless: thin result');
        }
      }

      /* ── Step 4: Build context & call Claude ────────────────────── */
      const hasContent = !!directApiData || !!instant?.AbstractText || htmlResults.length > 0 || headlessPages.length > 0;
      let searchCtx = hasContent ? buildContext(userText, instant, htmlResults, headlessPages) : null;
      if (directApiData) {
        searchCtx = directApiData + (searchCtx ? '\n\n' + searchCtx : '');
      }

      const answer = await callHAI(userText, searchCtx, apiKey, model);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ text: answer, searched: hasContent }));

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