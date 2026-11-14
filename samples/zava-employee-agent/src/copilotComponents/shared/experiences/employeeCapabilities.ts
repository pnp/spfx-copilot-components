import { getFamilyExperience } from './familyExperienceCatalog';
import type { ZavaFamilyId } from '../models/families';

export interface IEmployeeCapability {
  readonly key: string;
  readonly tool: string;
  readonly family: ZavaFamilyId;
  readonly title: string;
  readonly purpose: string;
  readonly prompt: string;
  readonly operation: 'Information' | 'Request' | 'Review';
}
const family = (
  key: string, tool: string, purpose: string, prompt: string,
  operation: IEmployeeCapability['operation'] = 'Information'
): IEmployeeCapability => {
  const definition = getFamilyExperience(key);
  return { key, tool, family: definition.family, title: definition.title, purpose, prompt, operation };
};
export const EMPLOYEE_CAPABILITIES: readonly IEmployeeCapability[] = [
  { key: 'getMyHrDashboard', tool: 'GetMyHRDashboard', family: 'home', title: 'My HR dashboard', purpose: 'See a cross-family HR overview and open the full employee workspace.', prompt: 'Show my HR dashboard for this week.', operation: 'Information' },
  { key: 'getProfileHealth', tool: 'GetProfileHealth', family: 'home', title: 'Profile completeness', purpose: 'Inspect missing profile details without exposing pay or case data.', prompt: 'Is my employee profile complete?', operation: 'Information' },
  { key: 'getNextBestActions', tool: 'GetNextBestActions', family: 'home', title: 'Ranked HR priorities', purpose: 'Choose the next action from ranked employee signals, rather than a broad dashboard.', prompt: 'Show my ranked next HR actions for this week.', operation: 'Information' },
  { key: 'getWorklifeSnapshot', tool: 'GetWorklifeSnapshot', family: 'home', title: 'Worklife snapshot', purpose: 'Review HR metrics and a scoped worklife timeline.', prompt: 'Show my HR worklife snapshot for this month.', operation: 'Information' },
  { key: 'getEmployeeMilestones', tool: 'GetEmployeeMilestones', family: 'home', title: 'Employee milestones', purpose: 'Discover recognition, anniversaries and upcoming career moments.', prompt: 'What employee milestones are coming up?', operation: 'Information' },
  { key: 'policyAnswer', tool: 'AskPolicy', family: 'policy', title: 'A sourced policy answer', purpose: 'Inspect one policy and its jurisdiction, effective date and source.', prompt: 'What parental leave policy applies in Finland?', operation: 'Information' },
  { key: 'policyComparison', tool: 'ComparePolicies', family: 'policy', title: 'Compare policy jurisdictions', purpose: 'Compare one policy across explicitly named jurisdictions.', prompt: 'Compare parental leave policies in Finland and Sweden.', operation: 'Information' },
  family('leaveBalance', 'GetLeaveBalance', 'Inspect available leave and carryover; this does not create a request.', 'Show my available vacation balance.'),
  family('requestTimeOff', 'RequestTimeOff', 'Review editable dates and coverage before a session-only leave request.', 'Draft a vacation request for November 9 through November 13, 2026.', 'Request'),
  family('latestPay', 'GetLatestPay', 'Inspect one pay statement with the sample privacy controls.', 'Show an overview of my latest pay statement.'),
  family('explainPayChange', 'ExplainPayChange', 'Explain changes between two named pay periods.', 'Explain my pay change from June to July 2026.'),
  family('compareBenefitPlans', 'CompareBenefitPlans', 'Compare plan trade-offs for the stated family and coverage priorities.', 'Compare benefit plans for an employee with two children, prioritizing dental coverage and a low deductible.'),
  family('startLifeEvent', 'StartLifeEvent', 'Review a benefits-change draft after a life event, not a plan comparison.', 'Draft a benefits life-event change for the birth of a child.', 'Request'),
  family('createHrCase', 'CreateHRCase', 'Prepare a private HR case and review what would be shared.', 'Draft a private HR support case about a payroll deduction question.', 'Request'),
  family('requiredLearning', 'GetRequiredLearning', 'Prioritize assigned mandatory learning and its deadlines.', 'Show my mandatory learning due in the next 14 days.'),
  family('totalRewardsSummary', 'GetTotalRewards', 'Inspect annual employment value, not a single payslip.', 'Show an overview of my annual total rewards.'),
  family('approvalInbox', 'GetApprovalInbox', 'Review manager decisions with explicit confirmation; browsing never approves.', 'Show the leave requests awaiting my approval.', 'Review'),
  family('teamAbsenceCalendar', 'GetTeamAbsenceCalendar', 'Inspect absence and coverage without deciding a request.', 'Show my team absence coverage for next week.'),
  family('findExpert', 'FindExpert', 'Find people by stated expertise, rather than reporting structure.', 'Find colleagues with accessibility expertise.'),
  family('exploreOrganization', 'ExploreOrganization', 'Inspect reporting structure and organization context.', 'Show the Customer Experience organization structure.')
];

export function findEmployeeCapabilities(query: string, category?: ZavaFamilyId): readonly IEmployeeCapability[] {
  const needle = query.trim().toLowerCase();
  return EMPLOYEE_CAPABILITIES.filter(item => (!category || item.family === category) &&
    `${item.title} ${item.purpose} ${item.prompt}`.toLowerCase().indexOf(needle) >= 0);
}
