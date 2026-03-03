#!/usr/bin/env node
/**
 * hai-relay.js — Tiny CORS relay for the HAI proxy
 *
 * Bridges browser requests (same port blocked by CORS) to
 * the local HAI proxy at http://localhost:6655/anthropic/.
 *
 * Usage:  node hai-relay.js          (starts on port 6656)
 *         PORT=6660 node hai-relay.js
 */

const http  = require('http');
const https = require('https');

const RELAY_PORT  = parseInt(process.env.PORT ?? '6656', 10);
const HAI_HOST    = 'localhost';
const HAI_PORT    = 6655;
const HAI_PATH    = '/anthropic/v1/messages';
const ALLOWED_ORIGIN = '*';           // all localhost origins ok for dev

const server = http.createServer((req, res) => {
  /* CORS preflight */
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, anthropic-version, authorization');
  res.setHeader('Access-Control-Max-Age',       '86400');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  /* Collect request body */
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    const body    = Buffer.concat(chunks);
    const headers = {
      'Content-Type':      'application/json',
      'Content-Length':    body.length,
      'anthropic-version': req.headers['anthropic-version'] ?? '2023-06-01',
      'x-api-key':         req.headers['x-api-key'] ?? req.headers['authorization']?.replace(/^Bearer\s+/i, '') ?? '',
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
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Content-Type': upstream.headers['content-type'] ?? 'application/json',
      });
      upstream.pipe(res);
    });

    proxy.on('error', (err) => {
      console.error('[relay] upstream error:', err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'HAI proxy unavailable', detail: err.message }));
      }
    });

    proxy.write(body);
    proxy.end();
  });
});

server.listen(RELAY_PORT, '127.0.0.1', () => {
  console.log(`[hai-relay] listening on http://localhost:${RELAY_PORT}`);
  console.log(`[hai-relay] forwarding POST → http://${HAI_HOST}:${HAI_PORT}${HAI_PATH}`);
});