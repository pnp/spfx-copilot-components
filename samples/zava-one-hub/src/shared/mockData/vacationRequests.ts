import type { IVacationRequest } from '../models/zavaOne';
import { businessDateRange, isoAtDayOffset } from '../utils/evergreenDates';

const diegoLeave = businessDateRange(16, 5);
const johannaLeave = businessDateRange(9, 3);
const joniLeave = businessDateRange(12, 3);
const pradeepLeave = businessDateRange(23, 5);
const gradyLeave = businessDateRange(19, 2);
const leeLeave = businessDateRange(35, 10);

export const initialVacationRequests: readonly IVacationRequest[] = [
  {
    id: 'vac-1042', requesterId: 'person-diego', startDate: diegoLeave.start, endDate: diegoLeave.end,
    workdays: 5, requestedHours: 40, submittedAt: isoAtDayOffset(-2, 9, 15), status: 'pending',
    leaveType: 'Annual leave', balanceBefore: 18, projectedBalance: 13, coverage: 'clear',
    coverageNote: 'Joni covers the customer review; Aurora release handoff is complete.',
    requesterNote: 'Family visit after the Aurora milestone. I have transferred the Friday support review.',
    revision: 3, history: []
  },
  {
    id: 'vac-1043', requesterId: 'person-johanna', startDate: johannaLeave.start, endDate: johannaLeave.end,
    workdays: 3, requestedHours: 24, submittedAt: isoAtDayOffset(-2, 10, 40), status: 'pending',
    leaveType: 'Annual leave', balanceBefore: 11, projectedBalance: 8, coverage: 'attention',
    coverageNote: 'Accessibility lab opening is covered; one design review needs a new facilitator.',
    requesterNote: 'Short autumn break. Grady can cover the lab clinic.', revision: 2, history: []
  },
  {
    id: 'vac-1044', requesterId: 'person-joni', startDate: joniLeave.start, endDate: joniLeave.end,
    workdays: 3, requestedHours: 24, submittedAt: isoAtDayOffset(-3, 16, 5), status: 'pending',
    leaveType: 'Family leave', balanceBefore: 9, projectedBalance: 6, coverage: 'conflict',
    coverageNote: 'Overlaps Diego and the upcoming town hall support rotation.',
    requesterNote: 'Family care appointment. Dates are fixed.', revision: 4, history: []
  },
  {
    id: 'vac-1038', requesterId: 'person-pradeep', startDate: pradeepLeave.start, endDate: pradeepLeave.end,
    workdays: 5, requestedHours: 40, submittedAt: isoAtDayOffset(-5, 8, 20), status: 'approved',
    leaveType: 'Annual leave', balanceBefore: 22, projectedBalance: 17, coverage: 'clear',
    coverageNote: 'Singapore forecast review delegated to Lee.', requesterNote: 'School holiday week.',
    revision: 5,
    history: [{ id: 'decision-1038', decision: 'approved', decidedAt: isoAtDayOffset(-4, 14, 10), decidedBy: 'Megan Bowen', reference: 'ZAVA-LEAVE-1038' }]
  },
  {
    id: 'vac-1036', requesterId: 'person-grady', startDate: gradyLeave.start, endDate: gradyLeave.end,
    workdays: 2, requestedHours: 16, submittedAt: isoAtDayOffset(-6, 13, 45), status: 'declined',
    leaveType: 'Personal day', balanceBefore: 4, projectedBalance: 2, coverage: 'conflict',
    coverageNote: 'Both accessibility lab facilitators would be unavailable.', requesterNote: 'Personal appointment.',
    revision: 3,
    history: [{ id: 'decision-1036', decision: 'declined', decidedAt: isoAtDayOffset(-5, 11, 30), decidedBy: 'Megan Bowen', rationale: 'Please choose a day after the lab launch coverage window.', reference: 'ZAVA-LEAVE-1036' }]
  },
  {
    id: 'vac-1045', requesterId: 'person-lee', startDate: leeLeave.start, endDate: leeLeave.end,
    workdays: 10, requestedHours: 80, submittedAt: isoAtDayOffset(-2, 11, 15), status: 'pending',
    leaveType: 'Annual leave', balanceBefore: 12, projectedBalance: 2, coverage: 'attention',
    coverageNote: 'Long request spans the Q2 design planning kickoff.', requesterNote: 'Long-planned family travel.',
    revision: 1, history: []
  }
];