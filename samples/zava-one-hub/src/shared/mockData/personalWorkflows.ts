import { businessDateRange, dateOnlyAtDayOffset, EVERGREEN_NOW, formatDate } from '../utils/evergreenDates';

const currentYear = EVERGREEN_NOW.getUTCFullYear();
const nextYear = currentYear + 1;
const plannedLeave = businessDateRange(23, 5);
const priorPersonalDay = businessDateRange(-15, 1);
const priorVacation = businessDateRange(-80, 5);

export const approvalFixtures = [
  { id: 'APR-2841', personId: 'person-diego', type: 'budget', title: 'Project Aurora budget change', due: 'Due today', summary: 'Approve an additional €48,000 for accessibility validation and customer deployment support.', details: [['Amount', '€48,000'], ['Cost center', 'Aurora / EMEA'], ['Requested by', 'Diego Siciliani'], ['Effective', formatDate(dateOnlyAtDayOffset(7), { month: 'long', day: 'numeric', year: 'numeric' })]], risk: 'Budget remains within the approved quarterly program envelope.' },
  { id: 'APR-2837', personId: 'person-miriam', type: 'publication', title: 'Customer story publication', due: 'Due tomorrow', summary: 'Approve the final customer story for the upcoming town hall and intranet publication.', details: [['Channel', 'Town hall + intranet'], ['Audience', 'All employees'], ['Requested by', 'Miriam Graham'], ['Publish date', formatDate(dateOnlyAtDayOffset(7), { month: 'long', day: 'numeric', year: 'numeric' })]], risk: 'Customer approval and accessibility review are complete.' },
  { id: 'APR-2829', personId: 'person-johanna', type: 'supplier', title: 'Accessibility lab supplier', due: `Due ${formatDate(dateOnlyAtDayOffset(4))}`, summary: 'Approve the assistive-technology supplier for the Helsinki lab.', details: [['Value', '€21,800'], ['Term', '12 months'], ['Requested by', 'Johanna Lorenz'], ['Start date', formatDate(dateOnlyAtDayOffset(11), { month: 'long', day: 'numeric', year: 'numeric' })]], risk: 'Security review is complete; procurement terms are standard.' }
] as const;

export const initialTimeOff = [
  { id: `PTO-${currentYear}-0831`, leaveType: 'Vacation', dates: `${formatDate(plannedLeave.start)}-${formatDate(plannedLeave.end, { day: 'numeric', year: 'numeric' })}`, days: 5, status: 'Pending approval' },
  { id: `PTO-${currentYear}-0794`, leaveType: 'Personal', dates: formatDate(priorPersonalDay.start, { month: 'short', day: 'numeric', year: 'numeric' }), days: 1, status: 'Approved' },
  { id: `PTO-${currentYear}-0688`, leaveType: 'Vacation', dates: `${formatDate(priorVacation.start)}-${formatDate(priorVacation.end, { day: 'numeric', year: 'numeric' })}`, days: 5, status: 'Approved' }
] as const;

export function businessDays(start: string, end: string): number {
  const first = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime()) || last < first) return 0;
  let count = 0;
  for (let timestamp = first.getTime(); timestamp <= last.getTime(); timestamp += 24 * 60 * 60 * 1000) {
    const day = new Date(timestamp).getUTCDay();
    if (day !== 0 && day !== 6) count += 1;
  }
  return count;
}

export const equityData = [
  { quarter: `Q1 FY${String(currentYear).slice(-2)}`, value: 12400, kind: 'Received' },
  { quarter: `Q2 FY${String(currentYear).slice(-2)}`, value: 13100, kind: 'Received' },
  { quarter: `Q3 FY${String(currentYear).slice(-2)}`, value: 11800, kind: 'Received' },
  { quarter: `Q4 FY${String(currentYear).slice(-2)}`, value: 14200, kind: 'Received' },
  { quarter: `Q1 FY${String(nextYear).slice(-2)}`, value: 15600, kind: 'Estimate' }
] as const;

export interface IRoomFixture {
  id: string;
  name: string;
  capacity: number;
  features: string;
}

export const roomsByOffice: Readonly<Record<string, readonly IRoomFixture[]>> = {
  Helsinki: [{ id: 'HEL-NOR', name: 'Northern Lights', capacity: 6, features: 'Teams / Accessible / Whiteboard' }, { id: 'HEL-SAUNA', name: 'Sauna', capacity: 10, features: 'Teams / Large display' }, { id: 'HEL-BIRCH', name: 'Birch', capacity: 4, features: 'Focus room / Accessible' }],
  Redmond: [{ id: 'RED-CEDAR', name: 'Cedar', capacity: 4, features: 'Teams / Whiteboard' }, { id: 'RED-ORCA', name: 'Orca', capacity: 6, features: 'Teams / Accessible' }, { id: 'RED-RAINIER', name: 'Rainier', capacity: 12, features: 'Town hall setup' }],
  Singapore: [{ id: 'SIN-MERLION', name: 'Merlion', capacity: 8, features: 'Teams / Accessible' }, { id: 'SIN-GARDEN', name: 'Garden', capacity: 4, features: 'Focus room' }, { id: 'SIN-BAY', name: 'Bay', capacity: 10, features: 'Teams / Dual display' }]
};

export const knownIssues = [
  { id: 'INC-1042', title: 'VPN sign-in delays', status: 'Monitoring', detail: 'Some users may see a second sign-in prompt. Service recovery is in progress.' },
  { id: 'INC-1038', title: 'Teams call quality / Singapore', status: 'Resolved', detail: 'The network routing issue was resolved at 08:40 SGT.' }
];

export const initialPersonalIssues = [
  { id: 'ZIT-2841', title: 'Laptop battery replacement', category: 'Device', impact: 'Medium', status: 'In progress', detail: 'Replacement device appointment scheduled for Monday.' },
  { id: 'ZIT-2798', title: 'Design software access', category: 'Access', impact: 'Low', status: 'Waiting for you', detail: 'Manager approval is required before access can be granted.' }
];