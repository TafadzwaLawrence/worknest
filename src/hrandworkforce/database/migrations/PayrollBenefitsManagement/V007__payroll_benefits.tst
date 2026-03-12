Title: Payroll & Benefits Management Schema – Documentation

Scope
- Domain: Payroll processing and benefits administration within a multi-tenant HR system.
- Purpose: Define structure for employee pay, taxes, benefits, payroll runs, earnings/deductions/taxes, time entries, adjustments, and reporting.
- Integrations: Core HR (employees, users, tenants), Benefits, Time and Attendance, and optional downstream reporting/filing tools.
- Multitenancy: tenant_id on all tenant-scoped tables, enforced with tenant validation trigger.
- Governance: Audit fields (created_at, updated_at), soft deletes on select entities; explicit BEFORE UPDATE triggers to maintain updated_at.

Database Extensions and Helpers
- uuid-ossp: provides uuid_generate_v4() for PKs.
- citext: case-insensitive text (available for reuse).
- update_updated_at_column(): Generic trigger function to set NEW.updated_at = CURRENT_TIMESTAMP on updates.

Enumerated Types
- pay_frequency: weekly, biweekly, semimonthly, monthly, custom
- pay_method: direct_deposit, check, cash, payroll_card
- employment_status: active, on_leave, terminated, retired
- deduction_type: tax, benefit, garnish, retirement, other
- benefit_type: health, dental, vision, retirement, life_insurance, disability, flex_spending, hsa, other
- tax_filing_status: single, married, married_separate, head_household, qualifying_widow
- payroll_status: draft, processing, processed, approved, paid, reversed, cancelled

Logical Domains
- Employee Compensation
  - pay_structures
- Taxes
  - employee_tax_info
  - tax_jurisdictions
- Benefits
  - benefit_plans
  - benefit_enrollments
  - dependents
- Payroll Processing
  - pay_periods
  - payroll_runs
  - payroll_records
  - payroll_earnings
  - payroll_deductions
  - payroll_taxes
- Time & Attendance
  - time_entries
- Adjustments & Corrections
  - payroll_adjustments
- Reports & Filings
  - payroll_reports
- Reporting Views
  - employee_compensation_summary
  - payroll_run_summary

Tables and Structures
1) pay_structures
- Purpose: Define employee pay arrangements (salary/hourly/commission/bonus) with effective dating and primary designation.
- Fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE
  - pay_type TEXT NOT NULL
  - pay_rate NUMERIC(12,2) NOT NULL
  - currency TEXT DEFAULT 'USD'
  - effective_date DATE NOT NULL
  - end_date DATE
  - is_primary BOOLEAN DEFAULT false
  - description TEXT
  - created_by UUID REFERENCES users(id)
  - created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - updated_at TIMESTAMPTZ NOT NULL DEFAULT now() [maintained by trigger]
  - deleted_at TIMESTAMPTZ (soft delete)
- Indexes: idx_pay_structures_employee(tenant_id, employee_id), idx_pay_structures_effective(tenant_id, effective_date)
- Triggers: update_pay_structures_updated_at; tenant validation trigger (trg_validate_payroll_tenant)

2) employee_tax_info
- Purpose: Store employee tax filing details for payroll tax calculations.
- Fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE
  - filing_status tax_filing_status
  - allowances INT DEFAULT 0
  - additional_withholding NUMERIC(10,2) DEFAULT 0
  - exempt_federal BOOLEAN DEFAULT false
  - exempt_state BOOLEAN DEFAULT false
  - exempt_local BOOLEAN DEFAULT false
  - social_security_number TEXT (sensitive; encrypt in production)
  - w4_certificate JSONB
  - state_withholding_cert JSONB
  - created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - updated_at TIMESTAMPTZ NOT NULL DEFAULT now() [maintained by trigger]
- Constraints: UNIQUE(tenant_id, employee_id)
- Indexes: idx_tax_info_employee(tenant_id, employee_id)
- Triggers: update_employee_tax_info_updated_at; tenant validation trigger

3) tax_jurisdictions
- Purpose: Define tax jurisdictions and rate schedules with effective dating.
- Fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - jurisdiction_type TEXT NOT NULL ('federal','state','local')
  - jurisdiction_code TEXT NOT NULL (e.g., 'CA','US-FED')
  - name TEXT NOT NULL
  - effective_date DATE NOT NULL
  - end_date DATE
  - tax_rates JSONB NOT NULL (e.g., {regular: rate, supplemental: rate})
  - created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - updated_at TIMESTAMPTZ NOT NULL DEFAULT now() [maintained by trigger]
- Constraints: UNIQUE(tenant_id, jurisdiction_code, effective_date)
- Triggers: update_tax_jurisdictions_updated_at

4) benefit_plans
- Purpose: Company-offered benefit plans with eligibility and contribution models.
- Fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - name TEXT NOT NULL
  - description TEXT
  - benefit_type benefit_type NOT NULL
  - provider_name TEXT
  - plan_code TEXT
  - eligibility_rules JSONB
  - employer_contribution JSONB
  - employee_contribution JSONB
  - effective_date DATE NOT NULL
  - end_date DATE
  - is_active BOOLEAN DEFAULT true
  - created_by UUID REFERENCES users(id)
  - created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - updated_at TIMESTAMPTZ NOT NULL DEFAULT now() [maintained by trigger]
  - deleted_at TIMESTAMPTZ (soft delete)
- Constraints: UNIQUE(tenant_id, name)
- Indexes: idx_benefit_plans_active(tenant_id, is_active)
- Triggers: update_benefit_plans_updated_at

5) benefit_enrollments
- Purpose: Employee elections into benefit plans.
- Fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE
  - benefit_plan_id UUID NOT NULL REFERENCES benefit_plans(id) ON DELETE CASCADE
  - coverage_level TEXT ('employee','employee+spouse','family')
  - election_amount NUMERIC(10,2)
  - effective_date DATE NOT NULL
  - end_date DATE
  - is_active BOOLEAN DEFAULT true
  - enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE
  - created_by UUID REFERENCES users(id)
  - created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - updated_at TIMESTAMPTZ NOT NULL DEFAULT now() [maintained by trigger]
- Constraints: UNIQUE(tenant_id, employee_id, benefit_plan_id, effective_date)
- Indexes: idx_benefit_enrollments_employee(tenant_id, employee_id), idx_benefit_enrollments_effective(tenant_id, effective_date)
- Triggers: update_benefit_enrollments_updated_at; tenant validation trigger

6) dependents
- Purpose: Dependents/beneficiaries for benefits.
- Fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE
  - first_name TEXT NOT NULL
  - last_name TEXT NOT NULL
  - relationship TEXT NOT NULL ('spouse','child','domestic_partner')
  - date_of_birth DATE
  - ssn TEXT (sensitive; encrypt in production)
  - is_beneficiary BOOLEAN DEFAULT false
  - created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - updated_at TIMESTAMPTZ NOT NULL DEFAULT now() [maintained by trigger]
  - deleted_at TIMESTAMPTZ (soft delete)
- Triggers: update_dependents_updated_at

7) pay_periods
- Purpose: Define payroll periods with frequency, dates, and pay date.
- Fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - period_name TEXT NOT NULL
  - pay_frequency pay_frequency NOT NULL
  - start_date DATE NOT NULL
  - end_date DATE NOT NULL
  - pay_date DATE NOT NULL
  - is_processed BOOLEAN DEFAULT false
  - created_by UUID REFERENCES users(id)
  - created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - updated_at TIMESTAMPTZ NOT NULL DEFAULT now() [maintained by trigger]
- Constraints: UNIQUE(tenant_id, start_date, end_date)
- Indexes: idx_pay_periods_dates(tenant_id, start_date, end_date)
- Triggers: update_pay_periods_updated_at

8) payroll_runs
- Purpose: Execution of payroll for a given pay_period with totals and approval metadata.
- Fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - pay_period_id UUID NOT NULL REFERENCES pay_periods(id) ON DELETE CASCADE
  - run_number INT NOT NULL DEFAULT 1
  - status payroll_status DEFAULT 'draft'
  - processed_by UUID REFERENCES users(id)
  - processed_at TIMESTAMPTZ
  - approved_by UUID REFERENCES users(id)
  - approved_at TIMESTAMPTZ
  - total_gross NUMERIC(15,2) DEFAULT 0
  - total_net NUMERIC(15,2) DEFAULT 0
  - total_taxes NUMERIC(15,2) DEFAULT 0
  - total_deductions NUMERIC(15,2) DEFAULT 0
  - employee_count INT DEFAULT 0
  - created_by UUID REFERENCES users(id)
  - created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - updated_at TIMESTAMPTZ NOT NULL DEFAULT now() [maintained by trigger]
- Constraints: UNIQUE(tenant_id, pay_period_id, run_number)
- Indexes: idx_payroll_runs_period(tenant_id, pay_period_id)
- Triggers: update_payroll_runs_updated_at

9) payroll_records
- Purpose: Per-employee payroll snapshot for a run.
- Fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE
  - employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE
  - pay_period_id UUID NOT NULL REFERENCES pay_periods(id) ON DELETE CASCADE
  - regular_hours NUMERIC(6,2) DEFAULT 0
  - overtime_hours NUMERIC(6,2) DEFAULT 0
  - double_time_hours NUMERIC(6,2) DEFAULT 0
  - regular_pay NUMERIC(12,2) DEFAULT 0
  - overtime_pay NUMERIC(12,2) DEFAULT 0
  - double_time_pay NUMERIC(12,2) DEFAULT 0
  - gross_pay NUMERIC(12,2) DEFAULT 0
  - net_pay NUMERIC(12,2) DEFAULT 0
  - status payroll_status DEFAULT 'draft'
  - pay_method pay_method
  - bank_account_info JSONB (sensitive; encrypt in production)
  - check_number TEXT
  - created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - updated_at TIMESTAMPTZ NOT NULL DEFAULT now() [maintained by trigger]
- Constraints: UNIQUE(tenant_id, payroll_run_id, employee_id)
- Indexes: idx_payroll_records_employee(tenant_id, employee_id), idx_payroll_records_run(tenant_id, payroll_run_id)
- Triggers: update_payroll_records_updated_at; tenant validation trigger

10) payroll_earnings
- Purpose: Additional earnings components (bonus, commission, reimbursements) per payroll record.
- Fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - payroll_record_id UUID NOT NULL REFERENCES payroll_records(id) ON DELETE CASCADE
  - earning_type TEXT NOT NULL
  - amount NUMERIC(12,2) NOT NULL
  - description TEXT
  - hours NUMERIC(6,2)
  - rate NUMERIC(10,2)
  - created_at TIMESTAMPTZ NOT NULL DEFAULT now()

11) payroll_deductions
- Purpose: Deduction lines (benefits, garnishments, retirement) per payroll record.
- Fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - payroll_record_id UUID NOT NULL REFERENCES payroll_records(id) ON DELETE CASCADE
  - deduction_type deduction_type NOT NULL
  - benefit_plan_id UUID REFERENCES benefit_plans(id) ON DELETE SET NULL
  - description TEXT NOT NULL
  - amount NUMERIC(12,2) NOT NULL
  - is_pre_tax BOOLEAN DEFAULT false
  - created_at TIMESTAMPTZ NOT NULL DEFAULT now()

12) payroll_taxes
- Purpose: Computed tax obligations per payroll record per jurisdiction and tax_type.
- Fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - payroll_record_id UUID NOT NULL REFERENCES payroll_records(id) ON DELETE CASCADE
  - jurisdiction_id UUID NOT NULL REFERENCES tax_jurisdictions(id) ON DELETE CASCADE
  - tax_type TEXT NOT NULL ('federal_income','social_security','medicare','state_income', ...)
  - taxable_amount NUMERIC(12,2) DEFAULT 0
  - tax_amount NUMERIC(12,2) DEFAULT 0
  - employer_tax_amount NUMERIC(12,2) DEFAULT 0
  - created_at TIMESTAMPTZ NOT NULL DEFAULT now()
- Constraints: UNIQUE(tenant_id, payroll_record_id, jurisdiction_id, tax_type)

13) time_entries
- Purpose: Raw time logs influencing payroll (regular/OT/double), with approvals.
- Fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE
  - entry_date DATE NOT NULL
  - start_time TIMESTAMPTZ NOT NULL
  - end_time TIMESTAMPTZ
  - regular_hours NUMERIC(6,2)
  - overtime_hours NUMERIC(6,2)
  - double_time_hours NUMERIC(6,2)
  - break_minutes INT DEFAULT 0
  - pay_code TEXT ('regular','overtime','vacation','sick')
  - project_code TEXT
  - task_description TEXT
  - is_approved BOOLEAN DEFAULT false
  - approved_by UUID REFERENCES users(id)
  - approved_at TIMESTAMPTZ
  - created_by UUID REFERENCES users(id)
  - created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - updated_at TIMESTAMPTZ NOT NULL DEFAULT now() [maintained by trigger]
  - deleted_at TIMESTAMPTZ (soft delete)
- Indexes: idx_time_entries_date(tenant_id, entry_date), idx_time_entries_employee_date(tenant_id, employee_id, entry_date)
- Triggers: update_time_entries_updated_at; tenant validation trigger

14) payroll_adjustments
- Purpose: Adjustments/corrections/voids applied to prior payroll outcomes.
- Fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - original_payroll_record_id UUID REFERENCES payroll_records(id) ON DELETE SET NULL
  - adjustment_type TEXT NOT NULL ('correction','adjustment','void')
  - reason TEXT NOT NULL
  - amount NUMERIC(12,2) NOT NULL
  - effective_date DATE NOT NULL
  - processed_by UUID REFERENCES users(id)
  - processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - created_by UUID REFERENCES users(id)
  - created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - metadata JSONB DEFAULT '{}'::jsonb

15) payroll_reports
- Purpose: Generated statutory/management reports and filing metadata per period.
- Fields
  - id UUID PK DEFAULT uuid_generate_v4()
  - tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
  - report_type TEXT NOT NULL ('941','w2','w3','state_unemployment', ...)
  - reporting_period TEXT NOT NULL (e.g., 'Q1-2024', '2024')
  - generated_date DATE NOT NULL DEFAULT CURRENT_DATE
  - filing_deadline DATE
  - filed_date DATE
  - status TEXT DEFAULT 'draft' ('draft','generated','filed')
  - file_reference TEXT
  - total_wages NUMERIC(15,2) DEFAULT 0
  - total_taxes NUMERIC(15,2) DEFAULT 0
  - employee_count INT DEFAULT 0
  - created_by UUID REFERENCES users(id)
  - created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  - updated_at TIMESTAMPTZ NOT NULL DEFAULT now() [maintained by trigger]

Indexes Summary (including cross-module)
- Employees (cross-module): idx_employees_tenant(tenant_id), idx_employees_user(user_id), idx_employees_status(tenant_id, employment_status)
- Pay structures: idx_pay_structures_employee, idx_pay_structures_effective
- Employee tax info: idx_tax_info_employee
- Benefit plans: idx_benefit_plans_active
- Benefit enrollments: idx_benefit_enrollments_employee, idx_benefit_enrollments_effective
- Pay periods: idx_pay_periods_dates
- Payroll runs: idx_payroll_runs_period
- Payroll records: idx_payroll_records_employee, idx_payroll_records_run
- Time entries: idx_time_entries_date, idx_time_entries_employee_date

Triggers & Validation
- Updated_at triggers
  - update_pay_structures_updated_at
  - update_employee_tax_info_updated_at
  - update_tax_jurisdictions_updated_at
  - update_benefit_plans_updated_at
  - update_benefit_enrollments_updated_at
  - update_dependents_updated_at
  - update_pay_periods_updated_at
  - update_payroll_runs_updated_at
  - update_payroll_records_updated_at
  - update_time_entries_updated_at
  - update_payroll_reports_updated_at
- Tenant isolation trigger function
  - trg_validate_payroll_tenant(): Validates that referenced employee_id, benefit_plan_id, and pay_period_id (when present) belong to the same tenant as NEW.tenant_id.
- Tenant validation trigger attachments
  - pay_structures, employee_tax_info, benefit_enrollments, payroll_records, time_entries

Reporting Views
- employee_compensation_summary
  - Returns employee details with primary pay structure info, active benefit count, and total benefit cost (sum of employee_contribution values on active enrollments).
  - Joins: employees e (filtering deleted_at IS NULL), pay_structures ps (is_primary = true, not deleted).
- payroll_run_summary
  - Returns summary of each payroll_run with pay_period metadata and processor name.
  - Joins: payroll_runs pr, pay_periods pp, users u (processor)

Security and Compliance Notes
- Sensitive fields (SSN, bank_account_info) should be encrypted at rest in production (e.g., pgcrypto).
- Consider Row Level Security (RLS) for strict tenant isolation beyond application-level checks.
- Add operational/audit triggers for sensitive operations as needed.

Cross-Module Dependencies
- tenants(id): anchor for multitenancy.
- users(id): processed_by, approved_by, created_by, approvers.
- employees(id): core HR linkage for pay, time, tax, and records.
- employment_status enum is defined here but used by cross-module index on employees.

Operational Notes
- Effective dating is used across compensation, benefits, and jurisdictions to preserve history.
- Payroll lifecycle spans: define pay_periods -> create payroll_runs -> generate payroll_records -> compute earnings/deductions/taxes -> approve -> pay -> report.
- Deductions support pre-/post-tax handling; benefits can link to deductions for mapping.
- Time entries feed hours into payroll; approvals present for audit.
- Adjustments can correct previous runs; reports/filings track statutory obligations.

Implementation Caveats
- Ensure uuid-ossp and citext extensions are enabled before creating objects.
- Provide employees, users, and tenants tables prior to applying this schema.
- The pay_structures.updated_at column in SQL should be NOT NULL DEFAULT now(); the trigger ensures freshness. Review for typographical mismatch if encountered in DDL.

End of documentation.