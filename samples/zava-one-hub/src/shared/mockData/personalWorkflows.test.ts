import {
  approvalFixtures,
  businessDays,
  equityData,
  initialPersonalIssues,
  initialTimeOff,
  knownIssues,
  roomsByOffice
} from './personalWorkflows';

describe('Personal workflow fixtures', () => {
  test('calculates inclusive weekdays and rejects invalid ranges', () => {
    expect(businessDays('2026-11-09', '2026-11-13')).toBe(5);
    expect(businessDays('2026-11-13', '2026-11-16')).toBe(2);
    expect(businessDays('2026-11-14', '2026-11-15')).toBe(0);
    expect(businessDays('2026-11-16', '2026-11-13')).toBe(0);
    expect(businessDays('invalid', '2026-11-13')).toBe(0);
  });

  test('keeps approval and time-off records uniquely addressable', () => {
    expect(new Set(approvalFixtures.map((approval) => approval.id)).size).toBe(approvalFixtures.length);
    expect(new Set(initialTimeOff.map((request) => request.id)).size).toBe(initialTimeOff.length);
    expect(approvalFixtures.every((approval) => approval.details.length >= 4 && !!approval.risk)).toBe(true);
  });

  test('separates received equity from the forward estimate', () => {
    expect(equityData.filter((item) => item.kind === 'Received')).toHaveLength(4);
    expect(equityData.filter((item) => item.kind === 'Estimate')).toHaveLength(1);
    expect(equityData[equityData.length - 1].kind).toBe('Estimate');
  });

  test('offers capacity-filterable rooms in every office', () => {
    expect(Object.keys(roomsByOffice)).toEqual(['Helsinki', 'Redmond', 'Singapore']);
    expect(Object.keys(roomsByOffice).every((office) => roomsByOffice[office].length >= 3)).toBe(true);
    expect(roomsByOffice.Helsinki.filter((room) => room.capacity >= 6).map((room) => room.id)).toEqual(['HEL-NOR', 'HEL-SAUNA']);
  });

  test('keeps personal requests separate from known service incidents', () => {
    expect(initialPersonalIssues.every((issue) => issue.id.startsWith('ZIT-'))).toBe(true);
    expect(knownIssues.every((issue) => issue.id.startsWith('INC-'))).toBe(true);
    expect(new Set([...initialPersonalIssues, ...knownIssues].map((issue) => issue.id)).size).toBe(initialPersonalIssues.length + knownIssues.length);
  });
});