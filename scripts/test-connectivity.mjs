/**
 * Diagnostic script to test API connectivity
 */

const BASE = 'https://worknest-01d4.onrender.com/api';
const TENANT_ID = '00000000-0000-0000-0000-000000000001';

async function testConnection() {
  console.log('Testing connection to:', BASE);
  console.log('Timeout: 5 seconds per request\n');

  try {
    console.log('1. Testing /departments (unauthenticated)...');
    const start1 = Date.now();
    const r1 = await fetch(`${BASE}/departments`, {
      method: 'GET',
      headers: { 'x-tenant-id': TENANT_ID },
      signal: AbortSignal.timeout(5000),
    });
    const time1 = Date.now() - start1;
    console.log(`   Status: ${r1.status} (${time1}ms)\n`);

    console.log('2. Testing /auth/login...');
    const start2 = Date.now();
    const r2 = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': TENANT_ID,
      },
      body: JSON.stringify({
        email: 'admin@worknest.dev',
        password: 'Admin@12345',
      }),
      signal: AbortSignal.timeout(5000),
    });
    const time2 = Date.now() - start2;
    const body2 = await r2.text();
    console.log(`   Status: ${r2.status} (${time2}ms)`);
    console.log(`   Response: ${body2.slice(0, 200)}\n`);

    console.log('✅ API is responding');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testConnection();
