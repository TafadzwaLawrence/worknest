/**
 * WorkNest API — comprehensive endpoint smoke test
 * Target: https://worknest-01d4.onrender.com
 * Run:    node scripts/smoke-test.mjs
 * Output: scripts/api-responses.json  ← frontend integration reference
 */
import https from 'https';
import { writeFileSync } from 'fs';

const BASE = 'https://worknest-01d4.onrender.com/api';
const TENANT_ID = '00000000-0000-0000-0000-000000000001';

let TOKEN = '';
let results = [];
let responses = {};
let createdIds = {};

// ─── HTTP helper ─────────────────────────────────────────────────────────────
async function req(method, path, body, extraHeaders = {}) {
  return new Promise((resolve) => {
    const url = new URL(BASE + path);
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json', ...extraHeaders };
    if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);

    const opts = {
      method,
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      headers,
    };
    const r = https.request(opts, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(buf); } catch { parsed = buf; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    r.on('error', e => resolve({ status: 0, body: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

function pass(name, detail = '') {
  results.push({ ok: true, name, detail });
  console.log(`  ✓ ${name}${detail ? ' — ' + detail : ''}`);
}
function fail(name, status, body) {
  results.push({ ok: false, name, status, body });
  console.log(`  ✗ ${name} — HTTP ${status}: ${JSON.stringify(body).slice(0, 140)}`);
}
function check(name, r, expectedStatus = [200, 201]) {
  const ok = (Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus]).includes(r.status);
  if (ok) { pass(name, `HTTP ${r.status}`); responses[name] = r.body; }
  else fail(name, r.status, r.body);
  return ok;
}

// ─── Tests ───────────────────────────────────────────────────────────────────
console.log('\n════════════════════════════════════════');
console.log('  WorkNest API Smoke Tests → Render');
console.log(`  ${BASE}`);
console.log('  (cold start may take ~30s on first request)');
console.log('════════════════════════════════════════');

// ── Auth ──────────────────────────────────────────────────────────────────────
console.log('\n[Auth]');
let r = await req('POST', '/auth/register', {
  username: 'smoketest',
  email: 'smoketest@worknest.dev',
  password: 'Smoke@12345',
  tenantId: TENANT_ID,
});
check('POST /auth/register', r, [201, 409]);

r = await req('POST', '/auth/login',
  { email: 'admin@worknest.dev', password: 'Admin@12345' },
  { 'x-tenant-id': TENANT_ID },
);
if (check('POST /auth/login', r)) {
  TOKEN = r.body.accessToken || '';
  // Don't save actual tokens to disk — only shape
  responses['POST /auth/login'] = { accessToken: '<jwt>', refreshToken: '<jwt>', expiresIn: r.body.expiresIn };
  if (TOKEN) pass('JWT token acquired');
}

// ── Core — Tenants ────────────────────────────────────────────────────────────
console.log('\n[Core — Tenants]');
r = await req('GET', '/tenants');
check('GET /tenants', r);

// ── Core — Departments ───────────────────────────────────────────────────────
console.log('\n[Core — Departments]');
r = await req('POST', '/departments', { name: 'Engineering', code: 'ENG' });
if (check('POST /departments', r, [201, 409])) createdIds.dept = r.body.id;
r = await req('GET', '/departments');
check('GET /departments', r);

// ── Core — Designations ──────────────────────────────────────────────────────
console.log('\n[Core — Designations]');
r = await req('POST', '/designations', { title: 'Software Engineer', code: 'SE-001' });
if (check('POST /designations', r, [201, 409])) createdIds.designation = r.body.id;
r = await req('GET', '/designations');
check('GET /designations', r);

// ── Core — Work Locations ────────────────────────────────────────────────────
console.log('\n[Core — Work Locations]');
r = await req('POST', '/work-locations', { name: 'Harare HQ', code: 'HRE-HQ', type: 'office' });
if (check('POST /work-locations', r, [201, 409])) createdIds.workLocation = r.body.id;
r = await req('GET', '/work-locations');
check('GET /work-locations', r);

// ── Core — Employees ─────────────────────────────────────────────────────────
console.log('\n[Core — Employees]');
r = await req('POST', '/employees', {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@worknest.dev',
  employee_code: 'EMP-001',
  date_of_join: '2024-01-15',
  ...(createdIds.dept && { department_id: createdIds.dept }),
});
if (check('POST /employees', r, [201, 409])) createdIds.employee = r.body.id;
r = await req('GET', '/employees');
check('GET /employees', r);

// ── Core — Roles ──────────────────────────────────────────────────────────────
console.log('\n[Core — Roles]');
r = await req('GET', '/roles');
check('GET /roles', r);

// ── Workflows ─────────────────────────────────────────────────────────────────
console.log('\n[Workflows]');
r = await req('GET', '/workflows');
check('GET /workflows', r);
r = await req('GET', '/workflow-instances');
check('GET /workflow-instances', r);

// ── Recruitment ───────────────────────────────────────────────────────────────
console.log('\n[Recruitment]');
r = await req('GET', '/recruitment/job-requisitions');
check('GET /recruitment/job-requisitions', r);
r = await req('GET', '/recruitment/applications');
check('GET /recruitment/applications', r);
r = await req('GET', '/recruitment/pipelines');
check('GET /recruitment/pipelines', r);
r = await req('GET', '/recruitment/interviews');
check('GET /recruitment/interviews', r);
r = await req('GET', '/recruitment/offers');
check('GET /recruitment/offers', r);

// ── Documents ─────────────────────────────────────────────────────────────────
console.log('\n[Documents]');
r = await req('GET', '/documents/storage-locations');
check('GET /documents/storage-locations', r);
r = await req('GET', '/documents/categories');
check('GET /documents/categories', r);
r = await req('GET', '/documents/retention-policies');
check('GET /documents/retention-policies', r);
r = await req('GET', '/documents');
check('GET /documents', r);

// ── Onboarding ────────────────────────────────────────────────────────────────
console.log('\n[Onboarding]');
r = await req('GET', '/onboarding/templates');
check('GET /onboarding/templates', r);
r = await req('GET', '/onboarding/cases');
check('GET /onboarding/cases', r);

// ── Time & Leave ──────────────────────────────────────────────────────────────
console.log('\n[Time & Leave]');
r = await req('GET', '/time-attendance/leave-types');
check('GET /time-attendance/leave-types', r);
r = await req('GET', '/time-attendance/leave-periods');
check('GET /time-attendance/leave-periods', r);
r = await req('GET', '/time-attendance/records');
check('GET /time-attendance/records', r);
r = await req('GET', '/time-attendance/rules');
check('GET /time-attendance/rules', r);
r = await req('GET', '/time-attendance/holidays');
check('GET /time-attendance/holidays', r);

// ── Payroll ───────────────────────────────────────────────────────────────────
console.log('\n[Payroll]');
r = await req('GET', '/payroll/pay-structures');
check('GET /payroll/pay-structures', r);
r = await req('GET', '/payroll/benefit-plans');
check('GET /payroll/benefit-plans', r);
r = await req('GET', '/payroll/pay-periods');
check('GET /payroll/pay-periods', r);
r = await req('GET', '/payroll/runs');
check('GET /payroll/runs', r);
r = await req('GET', '/payroll/expense-reports');
check('GET /payroll/expense-reports', r);
r = await req('GET', '/payroll/time-entries');
check('GET /payroll/time-entries', r);

// ── Performance ───────────────────────────────────────────────────────────────
console.log('\n[Performance]');
r = await req('GET', '/performance/reviews/cycles');
check('GET /performance/reviews/cycles', r);
r = await req('GET', '/performance/reviews/templates');
check('GET /performance/reviews/templates', r);
r = await req('GET', '/performance/goals');
check('GET /performance/goals', r);
r = await req('GET', '/performance/competencies');
check('GET /performance/competencies', r);
r = await req('GET', '/performance/learning/courses');
check('GET /performance/learning/courses', r);
r = await req('GET', '/performance/development/plans');
check('GET /performance/development/plans', r);

// ── Engagement ────────────────────────────────────────────────────────────────
console.log('\n[Engagement]');
r = await req('GET', '/engagement/surveys');
check('GET /engagement/surveys', r);
r = await req('GET', '/engagement/recognition');
check('GET /engagement/recognition', r);
r = await req('GET', '/engagement/feedback');
check('GET /engagement/feedback', r);
r = await req('GET', '/engagement/pulse');
check('GET /engagement/pulse', r);

// ── ESS ───────────────────────────────────────────────────────────────────────
console.log('\n[Employee Self-Service]');
r = await req('GET', '/ess/settings');
check('GET /ess/settings', r, [200, 404]);
r = await req('GET', '/ess/profile-requests');
check('GET /ess/profile-requests', r);
r = await req('GET', '/ess/time-off');
check('GET /ess/time-off', r);
r = await req('GET', '/ess/documents/required-acks');
check('GET /ess/documents/required-acks', r);

// ── HR Compliance ─────────────────────────────────────────────────────────────
console.log('\n[HR Compliance]');
r = await req('GET', '/salary-revisions');
check('GET /salary-revisions', r);
r = await req('GET', '/assets');
check('GET /assets', r);
r = await req('GET', '/disciplinary/cases');
check('GET /disciplinary/cases', r);
r = await req('GET', '/loans');
check('GET /loans', r);
r = await req('GET', '/notifications');
check('GET /notifications', r);
r = await req('GET', '/notifications/unread');
check('GET /notifications/unread', r);

// ─── Save responses ───────────────────────────────────────────────────────────
const output = {
  generated: new Date().toISOString(),
  baseUrl: BASE,
  tenantId: TENANT_ID,
  createdIds,
  responses,
  summary: {
    passed: results.filter(t => t.ok).length,
    failed: results.filter(t => !t.ok).length,
    failures: results.filter(t => !t.ok).map(t => ({ endpoint: t.name, status: t.status, error: t.body?.message })),
  },
};
writeFileSync('scripts/api-responses.json', JSON.stringify(output, null, 2));
console.log('\n  → Saved: scripts/api-responses.json');

// ─── Summary ──────────────────────────────────────────────────────────────────
const passed = results.filter(t => t.ok).length;
const failed = results.filter(t => !t.ok).length;
console.log('\n════════════════════════════════════════');
console.log(`  Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\n  Failed tests:');
  results.filter(t => !t.ok).forEach(t => {
    console.log(`  ✗ ${t.name} — HTTP ${t.status}`);
    if (t.body?.message) console.log(`    ${JSON.stringify(t.body.message)}`);
  });
}
console.log('════════════════════════════════════════\n');
