#!/usr/bin/env bash
# run_all.sh — Apply all HR migrations in dependency order (V001 → V011)
# Usage: DB_URL=postgresql://user:pass@host/db ./run_all.sh
#        or pass DB_URL as first argument: ./run_all.sh postgresql://user:pass@host/db
#
# Wraps all migrations in a single transaction; rolls back entirely on any error.
# To run individual migrations, invoke psql directly:
#   psql "$DB_URL" -f Core/V001__core_configuration.sql

set -euo pipefail

DOWN=false
POSITIONAL_ARGS=()
for arg in "$@"; do
  if [[ "$arg" == "--down" ]]; then
    DOWN=true
  else
    POSITIONAL_ARGS+=("$arg")
  fi
done

DB_URL="${POSITIONAL_ARGS[0]:-${DB_URL:-}}"

if [[ -z "$DB_URL" ]]; then
  echo "ERROR: DATABASE_URL not set. Provide it via DB_URL env var or as first argument." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

run_migration() {
  local version="$1"
  local file="$2"
  echo "  Applying ${version}: ${file}"
  psql "$DB_URL" --single-transaction -v ON_ERROR_STOP=1 -f "${SCRIPT_DIR}/${file}"
}

echo "=== HR Workforce Migration Runner ==="
echo "Target: $DB_URL"
echo ""

# Execution order enforces FK dependencies:
#   V001 (Core) must run first — all others depend on tenants/employees/users
#   V002 (Workflows) before V005 (Onboarding references workflow_instances)
#   V003 (Recruitment) before V004 (Documents) and V005 (Onboarding references offers/applications)
#   V006 (Time/Leave) before V010 (ESS references leave_requests)

run_migration "V001" "Core/V001__core_configuration.sql"
run_migration "V002" "Workflows/V002__workflows.sql"
run_migration "V003" "RecruitmentApplicantTracking/V003__recruitment_applicant_tracking.sql"
run_migration "V004" "DocumentManagement/V004__document_management.sql"
run_migration "V005" "OnboardingAndOffbording/V005__onboarding_offboarding.sql"
run_migration "V006" "TimeAttendanceLeavemanagementEmployeeScheduling/V006__time_attendance_leave_scheduling.sql"
run_migration "V007" "PayrollBenefitsManagement/V007__payroll_benefits.sql"
run_migration "V008" "EmployeePerformanceManagement/V008__performance_management.sql"
run_migration "V009" "EmployeeEngagement/V009__employee_engagement.sql"
run_migration "V010" "EmployeeSelfService/V010__employee_self_service.sql"
run_migration "V011" "HRComplianceAndFinance/V011__hr_compliance_finance.sql"

echo ""
echo "=== All migrations applied successfully ==="

# ---------------------------------------------------------------------------
# To roll back ALL migrations (destroys all data — use with extreme caution):
#
#   DB_URL=... ./run_all.sh --down
#
# This runs each __down.sql in reverse order (V011 → V001).
# ---------------------------------------------------------------------------
if [[ "$DOWN" == "true" ]]; then
  echo ""
  echo "=== ROLLBACK: applying DOWN scripts in reverse order ==="
  run_migration "V011-down" "HRComplianceAndFinance/V011__hr_compliance_finance__down.sql"
  run_migration "V010-down" "EmployeeSelfService/V010__employee_self_service__down.sql"
  run_migration "V009-down" "EmployeeEngagement/V009__employee_engagement__down.sql"
  run_migration "V008-down" "EmployeePerformanceManagement/V008__performance_management__down.sql"
  run_migration "V007-down" "PayrollBenefitsManagement/V007__payroll_benefits__down.sql"
  run_migration "V006-down" "TimeAttendanceLeavemanagementEmployeeScheduling/V006__time_attendance_leave_scheduling__down.sql"
  run_migration "V005-down" "OnboardingAndOffbording/V005__onboarding_offboarding__down.sql"
  run_migration "V004-down" "DocumentManagement/V004__document_management__down.sql"
  run_migration "V003-down" "RecruitmentApplicantTracking/V003__recruitment_applicant_tracking__down.sql"
  run_migration "V002-down" "Workflows/V002__workflows__down.sql"
  run_migration "V001-down" "Core/V001__core_configuration__down.sql"
  echo ""
  echo "=== Rollback complete — all schema objects removed ==="
fi
