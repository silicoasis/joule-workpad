#!/usr/bin/env node
/**
 * hai-relay.js — CORS relay for the HAI proxy + OpenAI Whisper transcription
 *
 * Routes:
 *   POST /              → HAI proxy at http://localhost:6655/anthropic/v1/messages
 *   POST /transcribe    → OpenAI Whisper at https://api.openai.com/v1/audio/transcriptions
 *                         Requires:  OPENAI_API_KEY env var
 *
 * Usage:
 *   node hai-relay.js
 *   OPENAI_API_KEY=sk-...  node hai-relay.js
 *   PORT=6660              node hai-relay.js
 */

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const RELAY_PORT     = parseInt(process.env.PORT      ?? '6656', 10);
const STATIC_PORT    = parseInt(process.env.STATIC_PORT ?? '3000', 10);
const HAI_HOST       = 'localhost';
const HAI_PORT       = 6655;
const HAI_PATH       = '/anthropic/v1/messages';
const OPENAI_KEY     = process.env.OPENAI_API_KEY || '';
const ALLOWED_ORIGIN = '*';

/* ── helpers ─────────────────────────────────────────────────────────────── */
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version, authorization',
    'Access-Control-Max-Age':       '86400',
  };
}

/* ── Static file serving ─────────────────────────────────────────────────── */
const JTEST_ROOT   = __dirname;                                   // jtest/
const LIBRARY_ROOT = path.resolve(__dirname, '..', 'library');   // library/

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.ttf':  'font/ttf',
  '.otf':  'font/otf',
  '.webp': 'image/webp',
};

function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0];                  // strip query string
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  let filePath;
  if (urlPath.startsWith('/library/')) {
    /* ../library/ → serves the shared component library */
    filePath = path.join(LIBRARY_ROOT, urlPath.slice('/library'.length));
  } else {
    filePath = path.join(JTEST_ROOT, urlPath.slice(1));
  }

  /* Security: prevent path traversal outside allowed roots */
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(JTEST_ROOT) && !normalized.startsWith(LIBRARY_ROOT)) {
    res.writeHead(403, corsHeaders()); res.end('Forbidden'); return;
  }

  fs.readFile(normalized, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') { res.writeHead(404, corsHeaders()); res.end('Not Found'); }
      else { res.writeHead(500, corsHeaders()); res.end('Server Error'); }
      return;
    }
    const ext  = path.extname(normalized).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { ...corsHeaders(), 'Content-Type': mime, 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

function jsonError(res, status, msg) {
  if (res.headersSent) return;
  res.writeHead(status, { ...corsHeaders(), 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: msg }));
}

/* ── server ──────────────────────────────────────────────────────────────── */
const server = http.createServer((req, res) => {

  /* Attach CORS to every response */
  Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));

  /* OPTIONS preflight (handles all routes) */
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  /* ── GET → serve static files ──────────────────────────────────────── */
  if (req.method === 'GET') {
    serveStatic(req, res);
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  /* ── POST /transcribe  →  OpenAI Whisper ────────────────────────────── */
  if (req.url === '/transcribe') {
    if (!OPENAI_KEY) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'no_key',
        message: 'Restart hai-relay.js with:  OPENAI_API_KEY=sk-…  node hai-relay.js',
      }));
      return;
    }

    /* Buffer the incoming multipart/form-data body unchanged */
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks);

      const options = {
        hostname: 'api.openai.com',
        port:     443,
        path:     '/v1/audio/transcriptions',
        method:   'POST',
        headers: {
          'Authorization':  `Bearer ${OPENAI_KEY}`,
          'Content-Type':   req.headers['content-type'] || 'multipart/form-data',
          'Content-Length': body.length,
        },
      };

      const proxy = https.request(options, (upstream) => {
        const status = upstream.statusCode;
        res.writeHead(status, {
          ...corsHeaders(),
          'Content-Type': upstream.headers['content-type'] ?? 'application/json',
        });
        upstream.pipe(res);
      });

      proxy.on('error', (err) => {
        console.error('[relay] OpenAI error:', err.message);
        jsonError(res, 502, 'openai_unavailable: ' + err.message);
      });

      proxy.write(body);
      proxy.end();
    });
    return;
  }

  /* ── POST /  (default)  →  HAI proxy ───────────────────────────────── */
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    const body    = Buffer.concat(chunks);
    const headers = {
      'Content-Type':      'application/json',
      'Content-Length':    body.length,
      'anthropic-version': req.headers['anthropic-version'] ?? '2023-06-01',
      'x-api-key':         req.headers['x-api-key']
                           ?? req.headers['authorization']?.replace(/^Bearer\s+/i, '')
                           ?? '',
    };

    const options = {
      hostname: HAI_HOST,
      port:     HAI_PORT,
      path:     HAI_PATH,
      method:   'POST',
      headers,
    };

    const proxy = http.request(options, (upstream) => {
      res.writeHead(upstream.statusCode, {
        ...corsHeaders(),
        'Content-Type': upstream.headers['content-type'] ?? 'application/json',
      });
      upstream.pipe(res);
    });

    proxy.on('error', (err) => {
      console.error('[relay] upstream error:', err.message);
      jsonError(res, 502, 'HAI proxy unavailable: ' + err.message);
    });

    proxy.write(body);
    proxy.end();
  });
});

server.listen(RELAY_PORT, '127.0.0.1', () => {
  console.log(`[hai-relay] CORS relay     http://localhost:${RELAY_PORT}`);
  console.log(`[hai-relay] App (Chrome)   http://localhost:${RELAY_PORT}/`);
  console.log(`[hai-relay] POST /          → http://${HAI_HOST}:${HAI_PORT}${HAI_PATH}`);
  if (OPENAI_KEY) {
    console.log(`[hai-relay] POST /transcribe → OpenAI Whisper  ✓  (key set)`);
  } else {
    console.log(`[hai-relay] POST /transcribe → ✗  NOT AVAILABLE`);
    console.log(`[hai-relay]   To enable voice:  OPENAI_API_KEY=sk-…  node hai-relay.js`);
  }
  console.log('');
  console.log('[hai-relay] ──────────────────────────────────────────────────');
  console.log(`[hai-relay]  Open in Edge/Arc/Chrome:  http://localhost:${RELAY_PORT}/`);
  console.log('[hai-relay]  Speech Recognition works on localhost (not file://)');
  console.log('[hai-relay] ──────────────────────────────────────────────────');
});
