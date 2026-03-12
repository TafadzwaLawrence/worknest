import https from 'https';

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZW5kcG10ZXlwdWZqZHFuam9uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzMxNDc1NiwiZXhwIjoyMDg4ODkwNzU2fQ.NpZacQDo41tMh8wurjUmFaV3Spm8FG5OYuqCld10IwQ';
const BASE = 'https://czendpmteypufjdqnjon.supabase.co/rest/v1';

async function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method,
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    const r = https.request(opts, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

// 1. Seed tenant
console.log('\n=== 1. Seed tenant ===');
let r = await req('POST', '/tenants', {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'WorkNest Demo',
  subdomain: 'worknest-demo',
  is_active: true,
  contact_email: 'admin@worknest.dev',
  timezone: 'UTC',
  currency: 'USD',
  country_code: 'ZW',
});
console.log('Status:', r.status);
console.log('Body:', r.body || '(empty — likely inserted OK or already exists)');
