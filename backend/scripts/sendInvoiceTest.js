#!/usr/bin/env node
/*
  Smoke test: POST /api/invoices/send/:id

  Usage (env vars):
    API_URL - e.g. http://localhost:5000
    INVOICE_ID - invoice id
    TOKEN - Bearer token
    RECIPIENT - recipient email

  Example:
    API_URL=http://localhost:5000 INVOICE_ID=... TOKEN=... RECIPIENT=test@example.com node backend/scripts/sendInvoiceTest.js
*/

const http = require('http');
const https = require('https');
const { URL } = require('url');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const INVOICE_ID = process.env.INVOICE_ID;
const TOKEN = process.env.TOKEN || process.env.AUTH_TOKEN;
const RECIPIENT = process.env.RECIPIENT;

if (!INVOICE_ID || !TOKEN || !RECIPIENT) {
  console.error('Missing required env vars. Ensure INVOICE_ID, TOKEN, and RECIPIENT are set.');
  process.exit(1);
}

const target = new URL(`${API_URL.replace(/\/$/, '')}/api/invoices/send/${INVOICE_ID}`);
const data = JSON.stringify({ email: RECIPIENT });

const lib = target.protocol === 'https:' ? https : http;
const options = {
  method: 'POST',
  hostname: target.hostname,
  port: target.port || (target.protocol === 'https:' ? 443 : 80),
  path: target.pathname + target.search,
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'Authorization': `Bearer ${TOKEN}`
  }
};

const req = lib.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      console.log('Response:', JSON.parse(body));
    } catch (e) {
      console.log('Response body:', body);
    }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err);
});

req.write(data);
req.end();
