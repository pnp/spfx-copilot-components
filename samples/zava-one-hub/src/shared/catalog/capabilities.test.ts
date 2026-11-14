import { zavaCapabilities } from './capabilities';

describe('Zava One capability catalog', () => {
  test('contains 35 unique, fully described capabilities', () => {
    expect(zavaCapabilities).toHaveLength(35);
    expect(new Set(zavaCapabilities.map((capability) => capability.id)).size).toBe(35);
    expect(new Set(zavaCapabilities.map((capability) => capability.intentKey)).size).toBe(35);
    expect(new Set(zavaCapabilities.map((capability) => capability.webPartName)).size).toBe(35);
    expect(new Set(zavaCapabilities.map((capability) => capability.copilotName)).size).toBe(35);
    expect(new Set(zavaCapabilities.map((capability) => capability.route)).size).toBe(35);
    expect(new Set(zavaCapabilities.map((capability) => `Use when ${capability.useWhen}. Do not use when ${capability.doNotUse}.`)).size).toBe(35);
    expect(zavaCapabilities.every((capability) => !!capability.useWhen && !!capability.doNotUse)).toBe(true);
  });

  test('gives each feature a unique default layout identity', () => {
    const layouts = zavaCapabilities.map((capability) => `${capability.id.toLowerCase()}-${capability.grammar}-summary`);
    expect(new Set(layouts).size).toBe(35);
  });

  test('keeps vacation requests distinct from time off and general approvals', () => {
    const vacation = zavaCapabilities.find((capability) => capability.id === 'C35');
    const timeOff = zavaCapabilities.find((capability) => capability.id === 'C16');
    const approvals = zavaCapabilities.find((capability) => capability.id === 'C05');

    expect(vacation?.intentKey).toBe('vacationApprovals');
    expect(timeOff?.intentKey).toBe('timeOff');
    expect(approvals?.intentKey).toBe('approvals');
    expect(vacation?.doNotUse).toContain('own time off');
  });

  test('keeps every Personal Copilot component expandable to full screen', () => {
    const personalCapabilities = zavaCapabilities.filter((capability) => capability.tab === 'personal');
    expect(personalCapabilities).toHaveLength(18);
    expect(new Set(personalCapabilities.map((capability) => capability.copilotName)).size).toBe(18);
  });

  test('keeps every Company capability available to the Company portal', () => {
    const companyCapabilities = zavaCapabilities.filter((capability) => capability.tab === 'company');
    expect(companyCapabilities).toHaveLength(17);
    expect(new Set(companyCapabilities.map((capability) => capability.intentKey)).size).toBe(17);
  });
});