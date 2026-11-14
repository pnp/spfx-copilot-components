export const OFFICE_DEMO_INSTANT = new Date('2026-09-26T14:40:00Z');

export function formatOfficeTime(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short'
  }).format(instant).replace(',', '');
}