// build.js — Netlify build script for The Green House
// Injects Supabase credentials into index.html at build time.
//
// Required in Netlify → Site Settings → Environment Variables:
//   SUPABASE_URL      e.g. https://xxxx.supabase.co
//   SUPABASE_ANON_KEY e.g. eyJhbGci...

const fs = require('fs');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('ERROR: SUPABASE_URL and/or SUPABASE_ANON_KEY are not set.');
  process.exit(1);
}

// Values MUST be single-quoted so the output is valid JavaScript.
// {url:'https://...', key:'eyJ...'} is correct.
// {url:https://...}                 is a syntax error.
const injection = `<script>window.__GH_SUPABASE={url:'${url}',key:'${key}'};</script>`;

let html = fs.readFileSync('index.html', 'utf8');

if (html.includes('<!-- NETLIFY ENV INJECTION -->')) {
  html = html.replace('<!-- NETLIFY ENV INJECTION -->', injection);
  console.log('Injected via comment placeholder.');
} else if (html.includes('window.__GH_SUPABASE=')) {
  // Prior build already injected — update values in place
  html = html.replace(/<script>window\.__GH_SUPABASE=\{[^<]*\}<\/script>/, injection);
  console.log('Updated existing injection.');
} else {
  html = html.replace('</head>', injection + '\n</head>');
  console.log('Injected before </head> (fallback).');
}

fs.writeFileSync('index.html', html);

// Sanity check
const ok = html.includes(`url:'${url}'`) && html.includes(`key:'${key}'`);
if (ok) {
  console.log('OK  URL:', url);
  console.log('OK  Key:', key.slice(0, 20) + '...');
} else {
  console.error('ERROR: Injection verification failed.');
  process.exit(1);
}
