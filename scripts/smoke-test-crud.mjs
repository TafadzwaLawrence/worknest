/**
 * WorkNest API — Full CRUD Smoke Test
 * Tests create → read → update → delete for every resource across all modules
 * Target: https://worknest-01d4.onrender.com
 * Run:    node scripts/smoke-test-crud.mjs
 * Output: scripts/crud-responses.json  ← full request/response pairs for debugging
 */
import { writeFileSync } from 'fs';

const BASE = 'https://worknest-01d4.onrender.com/api';
const TENANT_ID = '00000000-0000-0000-0000-000000000001';

let TOKEN = '';
let results = [];
let responses = {};
let createdIds = {};

// ─── HTTP helper ─────────────────────────────────────────────────────────────
async function req(method, path, body, extraHeaders = {}) {
  try {
    const url = BASE + path;
    const headers = { 'Content-Type': 'application/json', ...extraHeaders };
    if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
    
    const opts = {
      method,
      headers,
      timeout: 10000,
    };
    
    const response = await fetch(url, {
      ...opts,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    let parsed;
    try {
      const text = await response.text();
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = null;
    }
    
    return { status: response.status, body: parsed };
  } catch (e) {
    return { status: 0, body: { error: e.message } };
  }
}

function pass(name) {
  results.push({ ok: true, name });
  console.log(`  ✓ ${name}`);
}
function fail(name, status, body) {
  results.push({ ok: false, name, status, body });
  console.log(`  ✗ ${name} — HTTP ${status}: ${JSON.stringify(body).slice(0, 100)}`);
}
function check(name, r, expectedStatus = [200, 201, 204], save = false) {
  const ok = (Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus]).includes(r.status);
  if (ok) {
    pass(name);
    if (save) responses[name] = r.body;
  } else {
    fail(name, r.status, r.body);
  }
  return ok;
}

// ─── Tests ───────────────────────────────────────────────────────────────────
console.log('\n════════════════════════════════════════');
console.log('  WorkNest API — Full CRUD Smoke Tests');
console.log(`  ${BASE}`);
console.log('════════════════════════════════════════\n');

// ── Auth (setup) ──────────────────────────────────────────────────────────────
console.log('[Auth — Setup]');
let r = await req('POST', '/auth/login',
  { email: 'admin@worknest.dev', password: 'Admin@12345' },
  { 'x-tenant-id': TENANT_ID },
);
if (check('Login', r)) {
  TOKEN = r.body.accessToken || '';
  if (TOKEN) pass('JWT acquired');
}

// ── Core: Departments (CRUD pattern) ──────────────────────────────────────────
console.log('\n[Core — Departments CRUD]');
// CREATE
r = await req('POST', '/departments', { name: 'Engineering-CRUD', code: 'ENG-CRUD' });
if (check('POST /departments', r, [201, 409])) {
  createdIds.dept = r.body.id;
  pass(`Created dept ID: ${createdIds.dept}`);
}

// READ
if (createdIds.dept) {
  r = await req('GET', `/departments/${createdIds.dept}`);
  check(`GET /departments/:id`, r, [200]);
}

// UPDATE
if (createdIds.dept) {
  r = await req('PATCH', `/departments/${createdIds.dept}`, { name: 'Engineering-Updated' });
  check(`PATCH /departments/:id`, r, [200]);
}

// DELETE
if (createdIds.dept) {
  r = await req('DELETE', `/departments/${createdIds.dept}`);
  check(`DELETE /departments/:id`, r, [204, 200]);
}

// ── Core: Designations ────────────────────────────────────────────────────────
console.log('\n[Core — Designations CRUD]');
r = await req('POST', '/designations', { title: 'Senior Engineer-CRUD', code: 'SEN-ENG-CRUD' });
if (check('POST /designations', r, [201, 409])) {
  createdIds.designation = r.body.id;
}

if (createdIds.designation) {
  r = await req('GET', `/designations/${createdIds.designation}`);
  check(`GET /designations/:id`, r, [200]);
  
  r = await req('PATCH', `/designations/${createdIds.designation}`, { title: 'Senior Engineer-Updated' });
  check(`PATCH /designations/:id`, r, [200]);
  
  r = await req('DELETE', `/designations/${createdIds.designation}`);
  check(`DELETE /designations/:id`, r, [204, 200]);
}

// ── Core: Work Locations ──────────────────────────────────────────────────────
console.log('\n[Core — Work Locations CRUD]');
r = await req('POST', '/work-locations', { name: 'Harare Office-CRUD', code: 'HRE-CRUD', type: 'office' });
if (check('POST /work-locations', r, [201, 409])) {
  createdIds.workLocation = r.body.id;
}

if (createdIds.workLocation) {
  r = await req('GET', `/work-locations/${createdIds.workLocation}`);
  check(`GET /work-locations/:id`, r, [200]);
  
  r = await req('PATCH', `/work-locations/${createdIds.workLocation}`, { name: 'Harare HQ-Updated' });
  check(`PATCH /work-locations/:id`, r, [200]);
  
  r = await req('DELETE', `/work-locations/${createdIds.workLocation}`);
  check(`DELETE /work-locations/:id`, r, [204, 200]);
}

// ── Core: Roles ───────────────────────────────────────────────────────────────
console.log('\n[Core — Roles CRUD]');
r = await req('POST', '/roles', { name: 'Test Manager-CRUD', code: 'TM-CRUD', permissions: ['read', 'write'] });
if (check('POST /roles', r, [201, 409])) {
  createdIds.role = r.body.id;
}

if (createdIds.role) {
  r = await req('GET', `/roles/${createdIds.role}`);
  check(`GET /roles/:id`, r, [200]);
  
  r = await req('PATCH', `/roles/${createdIds.role}`, { name: 'Test Manager-Updated' });
  check(`PATCH /roles/:id`, r, [200]);
  
  r = await req('DELETE', `/roles/${createdIds.role}`);
  check(`DELETE /roles/:id`, r, [204, 200]);
}

// ── Core: Employees (required for other CRUD chains) ────────────────────────────
console.log('\n[Core — Employees CRUD]');
r = await req('POST', '/employees', {
  first_name: 'TestCRUD',
  last_name: 'User',
  email: 'testcrud@worknest.dev',
  employee_code: 'TC-001',
  date_of_join: '2025-01-15',
});
if (check('POST /employees', r, [201, 409])) {
  createdIds.employee = r.body.id;
}

if (createdIds.employee) {
  r = await req('GET', `/employees/${createdIds.employee}`);
  check(`GET /employees/:id`, r, [200]);
  
  r = await req('PATCH', `/employees/${createdIds.employee}`, { first_name: 'TestCRUD-Updated' });
  check(`PATCH /employees/:id`, r, [200]);
}

// ── Payroll: Pay Structures ───────────────────────────────────────────────────
console.log('\n[Payroll — Pay Structures CRUD]');
r = await req('POST', '/payroll/pay-structures', {
  name: 'Test Salary Structure',
  description: 'For CRUD testing',
  base_salary: 50000,
  currency: 'USD',
});
if (check('POST /payroll/pay-structures', r, [201, 409])) {
  createdIds.payStructure = r.body.id;
}

if (createdIds.payStructure) {
  r = await req('GET', `/payroll/pay-structures/${createdIds.payStructure}`);
  check(`GET /payroll/pay-structures/:id`, r, [200]);
  
  r = await req('PATCH', `/payroll/pay-structures/${createdIds.payStructure}`, { base_salary: 55000 });
  check(`PATCH /payroll/pay-structures/:id`, r, [200]);
  
  r = await req('DELETE', `/payroll/pay-structures/${createdIds.payStructure}`);
  check(`DELETE /payroll/pay-structures/:id`, r, [204, 200]);
}

// ── Payroll: Benefit Plans ────────────────────────────────────────────────────
console.log('\n[Payroll — Benefit Plans CRUD]');
r = await req('POST', '/payroll/benefit-plans', {
  name: 'Test Health Plan',
  description: 'Test CRUD health insurance',
  plan_type: 'health_insurance',
  coverage_type: 'employee_plus_dependents',
});
if (check('POST /payroll/benefit-plans', r, [201, 409])) {
  createdIds.benefitPlan = r.body.id;
}

if (createdIds.benefitPlan) {
  r = await req('GET', `/payroll/benefit-plans/${createdIds.benefitPlan}`);
  check(`GET /payroll/benefit-plans/:id`, r, [200]);
  
  r = await req('PATCH', `/payroll/benefit-plans/${createdIds.benefitPlan}`, { name: 'Test Health Plan-Updated' });
  check(`PATCH /payroll/benefit-plans/:id`, r, [200]);
  
  r = await req('DELETE', `/payroll/benefit-plans/${createdIds.benefitPlan}`);
  check(`DELETE /payroll/benefit-plans/:id`, r, [204, 200]);
}

// ── Payroll: Pay Periods ──────────────────────────────────────────────────────
console.log('\n[Payroll — Pay Periods CRUD]');
r = await req('POST', '/payroll/pay-periods', {
  name: 'Test Period Jan 2026',
  start_date: '2026-01-01',
  end_date: '2026-01-31',
  payment_date: '2026-02-05',
  period_type: 'monthly',
});
if (check('POST /payroll/pay-periods', r, [201, 409])) {
  createdIds.payPeriod = r.body.id;
}

if (createdIds.payPeriod) {
  r = await req('GET', `/payroll/pay-periods/${createdIds.payPeriod}`);
  check(`GET /payroll/pay-periods/:id`, r, [200]);
  
  r = await req('PATCH', `/payroll/pay-periods/${createdIds.payPeriod}`, { name: 'Test Period Jan 2026-Updated' });
  check(`PATCH /payroll/pay-periods/:id`, r, [200]);
}

// ── Time & Attendance: Leave Types ─────────────────────────────────────────────
console.log('\n[Time & Attendance — Leave Types CRUD]');
r = await req('POST', '/time-attendance/leave-types', {
  name: 'Test Vacation',
  code: 'VAC-TEST',
  is_paid: true,
  requires_approval: true,
});
if (check('POST /time-attendance/leave-types', r, [201, 409])) {
  createdIds.leaveType = r.body.id;
}

if (createdIds.leaveType) {
  r = await req('GET', `/time-attendance/leave-types/${createdIds.leaveType}`);
  check(`GET /time-attendance/leave-types/:id`, r, [200]);
  
  r = await req('PATCH', `/time-attendance/leave-types/${createdIds.leaveType}`, { name: 'Test Vacation-Updated' });
  check(`PATCH /time-attendance/leave-types/:id`, r, [200]);
  
  r = await req('DELETE', `/time-attendance/leave-types/${createdIds.leaveType}`);
  check(`DELETE /time-attendance/leave-types/:id`, r, [204, 200]);
}

// ── Time & Attendance: Leave Periods ───────────────────────────────────────────
console.log('\n[Time & Attendance — Leave Periods CRUD]');
r = await req('POST', '/time-attendance/leave-periods', {
  name: 'Test Period 2026',
  start_date: '2026-01-01',
  end_date: '2026-12-31',
  carryover_limit: 10,
});
if (check('POST /time-attendance/leave-periods', r, [201, 409])) {
  createdIds.leavePeriod = r.body.id;
}

if (createdIds.leavePeriod) {
  r = await req('GET', `/time-attendance/leave-periods/${createdIds.leavePeriod}`);
  check(`GET /time-attendance/leave-periods/:id`, r, [200]);
  
  r = await req('PATCH', `/time-attendance/leave-periods/${createdIds.leavePeriod}`, { name: 'Test Period 2026-Updated' });
  check(`PATCH /time-attendance/leave-periods/:id`, r, [200]);
}

// ── Time & Attendance: Holidays ────────────────────────────────────────────────
console.log('\n[Time & Attendance — Holidays CRUD]');
r = await req('POST', '/time-attendance/holidays', {
  name: 'Test Holiday',
  date: '2026-03-20',
  is_public: true,
});
if (check('POST /time-attendance/holidays', r, [201, 409])) {
  createdIds.holiday = r.body.id;
}

if (createdIds.holiday) {
  r = await req('GET', `/time-attendance/holidays/${createdIds.holiday}`);
  check(`GET /time-attendance/holidays/:id`, r, [200]);
  
  r = await req('PATCH', `/time-attendance/holidays/${createdIds.holiday}`, { name: 'Test Holiday-Updated' });
  check(`PATCH /time-attendance/holidays/:id`, r, [200]);
  
  r = await req('DELETE', `/time-attendance/holidays/${createdIds.holiday}`);
  check(`DELETE /time-attendance/holidays/:id`, r, [204, 200]);
}

// ── Performance: Competencies CRUD ─────────────────────────────────────────────
console.log('\n[Performance — Competencies CRUD]');
r = await req('POST', '/performance/competencies', {
  name: 'Test Competency',
  description: 'Testing CRUD operations',
});
if (check('POST /performance/competencies', r, [201, 409])) {
  createdIds.competency = r.body.id;
}

if (createdIds.competency) {
  r = await req('GET', `/performance/competencies/${createdIds.competency}`);
  check(`GET /performance/competencies/:id`, r, [200]);
  
  r = await req('PATCH', `/performance/competencies/${createdIds.competency}`, { name: 'Test Competency-Updated' });
  check(`PATCH /performance/competencies/:id`, r, [200]);
}

// ── Performance: Goals CRUD ───────────────────────────────────────────────────
console.log('\n[Performance — Goals CRUD]');
r = await req('POST', '/performance/goals', {
  title: 'Test Goal',
  description: 'Complete CRUD testing',
  target_date: '2026-12-31',
  goal_type: 'individual',
});
if (check('POST /performance/goals', r, [201, 409])) {
  createdIds.goal = r.body.id;
}

if (createdIds.goal) {
  r = await req('GET', `/performance/goals/${createdIds.goal}`);
  check(`GET /performance/goals/:id`, r, [200]);
  
  r = await req('PATCH', `/performance/goals/${createdIds.goal}`, { title: 'Test Goal-Updated' });
  check(`PATCH /performance/goals/:id`, r, [200]);
}

// ── Document Management CRUD ──────────────────────────────────────────────────
console.log('\n[Documents CRUD]');
r = await req('POST', '/documents', {
  title: 'Test Document',
  file_type: 'pdf',
  file_size: 1024,
  file_url: 'https://example.com/test.pdf',
  storage_location_id: null,
});
if (check('POST /documents', r, [201, 409])) {
  createdIds.document = r.body.id;
}

if (createdIds.document) {
  r = await req('GET', `/documents/${createdIds.document}`);
  check(`GET /documents/:id`, r, [200]);
  
  r = await req('PATCH', `/documents/${createdIds.document}`, { title: 'Test Document-Updated' });
  check(`PATCH /documents/:id`, r, [200]);
}

// ── Recruitment: Job Requisitions CRUD ─────────────────────────────────────────
console.log('\n[Recruitment — Job Requisitions CRUD]');
r = await req('POST', '/recruitment/job-requisitions', {
  job_title: 'Test Engineer',
  department_id: null,
  num_positions: 2,
  status: 'open',
});
if (check('POST /recruitment/job-requisitions', r, [201, 409])) {
  createdIds.jobRequisition = r.body.id;
}

if (createdIds.jobRequisition) {
  r = await req('GET', `/recruitment/job-requisitions/${createdIds.jobRequisition}`);
  check(`GET /recruitment/job-requisitions/:id`, r, [200]);
  
  r = await req('PATCH', `/recruitment/job-requisitions/${createdIds.jobRequisition}`, { job_title: 'Test Engineer-Updated' });
  check(`PATCH /recruitment/job-requisitions/:id`, r, [200]);
}

// ── Engagement: Surveys CRUD ──────────────────────────────────────────────────
console.log('\n[Engagement — Surveys CRUD]');
r = await req('POST', '/engagement/surveys', {
  name: 'Test Survey',
  description: 'Testing engagement surveys',
  starts_at: new Date().toISOString(),
  ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
});
if (check('POST /engagement/surveys', r, [201, 409])) {
  createdIds.survey = r.body.id;
}

if (createdIds.survey) {
  r = await req('GET', `/engagement/surveys/${createdIds.survey}`);
  check(`GET /engagement/surveys/:id`, r, [200]);
  
  r = await req('PATCH', `/engagement/surveys/${createdIds.survey}`, { name: 'Test Survey-Updated' });
  check(`PATCH /engagement/surveys/:id`, r, [200]);
}

// ── Onboarding: Templates CRUD ────────────────────────────────────────────────
console.log('\n[Onboarding — Templates CRUD]');
r = await req('POST', '/onboarding/templates', {
  name: 'Test Onboarding Template',
  description: 'Testing template CRUD',
});
if (check('POST /onboarding/templates', r, [201, 409])) {
  createdIds.onboardingTemplate = r.body.id;
}

if (createdIds.onboardingTemplate) {
  r = await req('GET', `/onboarding/templates/${createdIds.onboardingTemplate}`);
  check(`GET /onboarding/templates/:id`, r, [200]);
  
  r = await req('PATCH', `/onboarding/templates/${createdIds.onboardingTemplate}`, { name: 'Test Template-Updated' });
  check(`PATCH /onboarding/templates/:id`, r, [200]);
}

// ── Workflows CRUD ────────────────────────────────────────────────────────────
console.log('\n[Workflows CRUD]');
r = await req('POST', '/workflows', {
  name: 'Test Workflow',
  description: 'Testing workflow CRUD',
  entity_type: 'leave_request',
  is_active: true,
});
if (check('POST /workflows', r, [201, 409])) {
  createdIds.workflow = r.body.id;
}

if (createdIds.workflow) {
  r = await req('GET', `/workflows/${createdIds.workflow}`);
  check(`GET /workflows/:id`, r, [200]);
  
  r = await req('PATCH', `/workflows/${createdIds.workflow}`, { name: 'Test Workflow-Updated' });
  check(`PATCH /workflows/:id`, r, [200]);
}

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
writeFileSync('scripts/crud-responses.json', JSON.stringify(output, null, 2));
console.log('\n  → Saved: scripts/crud-responses.json');

// ─── Summary ──────────────────────────────────────────────────────────────────
const passed = results.filter(t => t.ok).length;
const failed = results.filter(t => !t.ok).length;
console.log('\n════════════════════════════════════════');
console.log(`  Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\n  Failed tests:');
  results.filter(t => !t.ok).forEach(t => {
    console.log(`  ✗ ${t.name} — HTTP ${t.status}`);
  });
}
console.log('════════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
