import { fileBadge, formatBytes, formatMoney, statusLabel, STATUS_LABELS, STATUS_TONES } from './format';
import { ALL_STATUSES } from '../models/sources';

describe('formatMoney', () => {
  it('formats with two decimals and thousands separators', () => {
    expect(formatMoney(1284.5)).toBe('$1,284.50');
    expect(formatMoney(77.4)).toBe('$77.40');
    expect(formatMoney(12450)).toBe('$12,450.00');
    expect(formatMoney(0)).toBe('$0.00');
    expect(formatMoney(1234567.891)).toBe('$1,234,567.89');
  });

  it('keeps the sign outside the symbol', () => {
    expect(formatMoney(-25.5)).toBe('-$25.50');
  });
});

describe('formatBytes', () => {
  it('scales to B, KB and MB', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(421_888)).toBe('412 KB');
    expect(formatBytes(2_202_010)).toBe('2.1 MB');
  });
});

describe('fileBadge', () => {
  it('reads the extension', () => {
    expect(fileBadge('Riverside-Print-Co_INV-20417.pdf')).toBe('PDF');
    expect(fileBadge('ER-Aug_Okafor.xlsx')).toBe('XLSX');
    expect(fileBadge('notes')).toBe('FILE');
  });
});

describe('status presentation', () => {
  it('labels and tones every status — colour is never the only signal', () => {
    ALL_STATUSES.forEach(s => {
      expect(STATUS_LABELS[s]).toBeTruthy();
      expect(['amber', 'green', 'red']).toContain(STATUS_TONES[s]);
    });
  });

  it('maps the semantic tones the designs use', () => {
    expect(STATUS_TONES.received).toBe('amber');
    expect(STATUS_TONES.pendingReview).toBe('amber');
    expect(STATUS_TONES.approved).toBe('green');
    expect(STATUS_TONES.paid).toBe('green');
    expect(STATUS_TONES.returned).toBe('red');
  });

  it('shortens only "Pending review", and only when asked', () => {
    expect(statusLabel('pendingReview')).toBe('Pending review');
    expect(statusLabel('pendingReview', true)).toBe('Pending');
    expect(statusLabel('approved', true)).toBe('Approved');
    ALL_STATUSES.forEach(s => expect(statusLabel(s)).toBe(STATUS_LABELS[s]));
  });
});
