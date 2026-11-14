import { formatOfficeTime, OFFICE_DEMO_INSTANT } from './officeTime';

describe('office time formatting', () => {
  test('derives demo office times from IANA zones', () => {
    expect(formatOfficeTime(OFFICE_DEMO_INSTANT, 'America/Los_Angeles')).toMatch(/^07:40\b/);
    expect(formatOfficeTime(OFFICE_DEMO_INSTANT, 'Europe/Helsinki')).toMatch(/^17:40\b/);
    expect(formatOfficeTime(OFFICE_DEMO_INSTANT, 'Asia/Singapore')).toMatch(/^22:40\b/);
  });

  test('honors daylight-saving changes while Singapore remains stable', () => {
    const winter = new Date('2026-01-15T12:00:00Z');
    const summer = new Date('2026-07-15T12:00:00Z');

    expect(formatOfficeTime(winter, 'America/Los_Angeles')).toMatch(/^04:00\b/);
    expect(formatOfficeTime(summer, 'America/Los_Angeles')).toMatch(/^05:00\b/);
    expect(formatOfficeTime(winter, 'Europe/Helsinki')).toMatch(/^14:00\b/);
    expect(formatOfficeTime(summer, 'Europe/Helsinki')).toMatch(/^15:00\b/);
    expect(formatOfficeTime(winter, 'Asia/Singapore')).toMatch(/^20:00\b/);
    expect(formatOfficeTime(summer, 'Asia/Singapore')).toMatch(/^20:00\b/);
  });

  test('handles a local-date rollover after UTC midnight', () => {
    expect(formatOfficeTime(new Date('2026-09-26T21:30:00Z'), 'Asia/Singapore')).toMatch(/^05:30\b/);
  });
});