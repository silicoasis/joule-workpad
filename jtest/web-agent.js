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
   3. Parse DDG HTML — extract up to 5 result titles + snippets
   ───────────────────────────────────────────────────────────────────────── */
function stripHtml(s) {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function parseDDG(html) {
  const results = [];
  /* Each organic result is wrapped in <div class="result..."> */
  const blockRe = /<div[^>]+class="[^"]*result__body[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
  let bm;
  while ((bm = blockRe.exec(html)) !== null && results.length < 5) {
    const block = bm[1];
    const titleM   = /<a[^>]+class="result__a"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
    const snippetM = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i.exec(block)
                  || /<div[^>]+class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(block);
    const urlM     = /<a[^>]+class="result__url"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
    if (titleM || snippetM) {
      results.push({
        title:   titleM   ? stripHtml(titleM[1])   : '',
        snippet: snippetM ? stripHtml(snippetM[1]) : '',
        url:     urlM     ? stripHtml(urlM[1])      : '',
      });
    }
  }

  /* Fallback: simpler snippet-only pass */
  if (results.length === 0) {
    const snipRe = /class="result__snippet"[^>]*>([\s\S]*?)<\/[ad]>/g;
    let sm;
    while ((sm = snipRe.exec(html)) !== null && results.length < 5) {
      const s = stripHtml(sm[1]);
      if (s.length > 20) results.push({ title: '', snippet: s, url: '' });
    }
  }

  return results;
}

/* ─────────────────────────────────────────────────────────────────────────
   4. Build search-context string for the LLM system prompt
   ───────────────────────────────────────────────────────────────────────── */
function buildContext(query, instant, htmlResults) {
  const lines = [`[Web search results for: "${query}"]`, ''];

  if (instant?.AbstractText) {
    lines.push(`**${instant.AbstractSource || 'Summary'}:** ${instant.AbstractText}`);
    if (instant.AbstractURL) lines.push(`Source: ${instant.AbstractURL}`);
    lines.push('');
  }

  const topics = (instant?.RelatedTopics || [])
    .filter(t => t.Text && !t.Topics)   /* skip category headers */
    .slice(0, 3);
  if (topics.length > 0) {
    lines.push('**Related:**');
    topics.forEach(t => lines.push(`- ${t.Text.replace(/\s*https?:\/\/\S+/g, '').trim()}`));
    lines.push('');
  }

  const topResults = htmlResults.filter(r => r.snippet).slice(0, 4);
  if (topResults.length > 0) {
    lines.push('**Top results:**');
    topResults.forEach((r, i) => {
      const title = r.title ? `**${r.title}** — ` : '';
      lines.push(`${i + 1}. ${title}${r.snippet}`);
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
    ? 'You are Joule, SAP\'s AI assistant. The following web search results have been ' +
      'gathered to help answer the user\'s question. Synthesize the information accurately, ' +
      'cite relevant details, and indicate when information is from the search results. ' +
      'Use markdown formatting (headings, bullet lists, code blocks, tables) where appropriate.\n\n' +
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
      /* Run DDG instant + HTML search in parallel */
      const [instant, html] = await Promise.allSettled([
        ddgInstant(userText),
        ddgHtml(userText),
      ]).then(r => [
        r[0].status === 'fulfilled' ? r[0].value : null,
        r[1].status === 'fulfilled' ? r[1].value : '',
      ]);

      const htmlResults  = parseDDG(html);
      const hasResults   = (instant?.AbstractText) || htmlResults.length > 0;
      const searchCtx    = hasResults ? buildContext(userText, instant, htmlResults) : null;

      console.log(`[agent] search: ${htmlResults.length} results, instant=${!!instant?.AbstractText}`);

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