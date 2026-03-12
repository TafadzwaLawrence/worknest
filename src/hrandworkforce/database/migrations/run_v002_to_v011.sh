#!/usr/bin/env bash
set -euo pipefail

DB_URL="${1:-${DB_URL:-}}"
if [[ -z "$DB_URL" ]]; then
  echo "ERROR: DB_URL not set." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

run() {
  echo "  Applying $1"
  psql "$DB_URL" --single-transaction -v ON_ERROR_STOP=1 -f "${SCRIPT_DIR}/$2"
}

echo "=== Applying V002–V011 ==="
run "V002" "Workflows/V002__workflows.sql"
run "V003" "RecruitmentApplicantTracking/V003__recruitment_applicant_tracking.sql"
run "V004" "DocumentManagement/V004__document_management.sql"
run "V005" "OnboardingAndOffbording/V005__onboarding_offboarding.sql"
run "V006" "TimeAttendanceLeavemanagementEmployeeScheduling/V006__time_attendance_leave_scheduling.sql"
run "V007" "PayrollBenefitsManagement/V007__payroll_benefits.sql"
run "V008" "EmployeePerformanceManagement/V008__performance_management.sql"
run "V009" "EmployeeEngagement/V009__employee_engagement.sql"
run "V010" "EmployeeSelfService/V010__employee_self_service.sql"
run "V011" "HRComplianceAndFinance/V011__hr_compliance_finance.sql"
echo "=== All migrations applied successfully ==="
