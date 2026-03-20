# WorkNest

**Multi-tenant HR & Workforce Management System**

A production-ready, PostgreSQL-backed HRIS built with [NestJS 11](https://nestjs.com) and TypeScript, designed for African and emerging markets. WorkNest covers the full employee lifecycle in a single, multi-tenant platform.

---

## Modules

| Module | Migration | Tables |
|---|---|---|
| Core Configuration | V001 | Tenants, Employees, Departments, Designations, Work Locations, Users, Roles, Audit Logs |
| Workflows & Approvals | V002 | Workflow definitions, instances, steps, approvals |
| Recruitment & ATS | V003 | Job postings, applications, interviews, offers |
| Document Management | V004 | Document templates, employee documents, signatures |
| Onboarding & Offboarding | V005 | Onboarding checklists, asset assignments, exit interviews |
| Time, Attendance & Leave | V006 | Timesheets, leave requests, schedules, shift swaps |
| Payroll & Benefits | V007 | Pay structures, payroll runs, deductions, tax, benefits |
| Performance Management & LMS | V008 | Review cycles, goals, competencies, skills, courses, PIPs |
| Employee Engagement | V009 | Surveys, pulse checks, recognition, feedback |
| Employee Self-Service | V010 | ESS requests — leave, payslips, documents, IT |
| HR Compliance & Finance | V011 | Salary history, asset catalog, disciplinary cases, loans, notifications |

**Total: 165+ tables across 11 migrations**

---

## Tech Stack

- **Runtime**: Node.js 22 / TypeScript 5.7
- **Framework**: NestJS 11
- **Database**: PostgreSQL 15+ (uuid-ossp, citext)
- **Schema**: Flyway-compatible versioned migrations with DOWN scripts
- **Security**: Row-Level Security (RLS) tenant isolation on all tables, bcrypt password hashing, MFA support
- **API Docs**: Swagger UI at `/api/docs`

---

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Testing

### API Smoke Tests (Production Validation)
These tests validate all endpoints work end-to-end against the live deployment:

```bash
# Basic endpoint test (list operations only) — 57 endpoints
$ node scripts/smoke-test.mjs

# Comprehensive CRUD test (create → read → update → delete) — 18+ resources
$ node scripts/smoke-test-crud.mjs
```

**Output**: JSON files with response shapes for frontend integration
- `scripts/api-responses.json`
- `scripts/crud-responses.json`

See [TESTING.md](./TESTING.md) for detailed testing guide, coverage analysis, and troubleshooting.

### Unit & E2E Tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

**Live Production**: https://worknest-01d4.onrender.com/api
- **API Docs**: https://worknest-01d4.onrender.com/api/docs (Swagger UI)
- **Database**: Supabase PostgreSQL 15+ with pooler
- **Status**: ✅ All 11 modules live and tested

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
