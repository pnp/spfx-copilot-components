import { currencyCodeForLocaleId, currencySymbolForLocaleId, formatCurrencyValue } from '../logic/currency';
import {
  coerceHyperlinkPrefill,
  formatHyperlinkLabel,
  hyperlinkErrorMessage,
  hyperlinkUrlProblem,
  toFieldUrlValue,
  validatedHttpsUrl
} from '../logic/hyperlink';
import { buildItemPayload, formatAnswer } from '../logic/payload';
import { coercePrefillValue } from '../logic/prefill';
import { validateValue } from '../logic/validation';
import { field } from './helpers';

const scriptUrl = (rest: string): string => `java${'script:'}${rest}`;

const amount = field({ internalName: 'Amount', title: 'Amount', kind: 'currency', required: true, maxLength: 32, currencyLocaleId: 1033 });
const receipt = field({ internalName: 'Receipt', title: 'Receipt', kind: 'hyperlink', required: true, maxLength: 255 });

describe('currency formatting', () => {
  it('maps common LCIDs to a symbol and leaves an unknown locale without one', () => {
    expect(currencyCodeForLocaleId(1033)).toBe('USD');
    expect(currencySymbolForLocaleId(1033)).toBe('$');
    expect(currencySymbolForLocaleId(2057)).toBe('£');
    expect(currencySymbolForLocaleId(1031)).toBe('€');
    expect(currencySymbolForLocaleId(1053)).toBe('kr');
    expect(currencySymbolForLocaleId(9999)).toBe('');
    expect(currencySymbolForLocaleId(undefined)).toBe('');
  });

  it('formats a review value with the currency, or as a plain number when the LCID is unknown', () => {
    expect(formatCurrencyValue(1250.5, 1033, 'en-US')).toBe('$1,250.50');
    expect(formatCurrencyValue(1250.5, 9999, 'en-US')).toBe('1,250.5');
    expect(formatAnswer(amount, '1250.50', 'en-US')).toBe('$1,250.50');
    expect(formatAnswer(field({ ...amount, currencyLocaleId: undefined }), '1250.5', 'en-US')).toBe('1,250.5');
    expect(formatAnswer(amount, '', 'en-US')).toBe('');
  });
});

describe('hyperlink URL validation', () => {
  it('accepts https URLs and rejects http, javascript, data and credentials', () => {
    expect(hyperlinkUrlProblem('https://contoso.com/receipts/8841')).toBeUndefined();
    expect(validatedHttpsUrl('HTTPS://Contoso.com/a')).toBe('https://contoso.com/a');
    expect(hyperlinkUrlProblem('http://contoso.com')).toBe('http');
    expect(hyperlinkUrlProblem('https://user:pass@contoso.com/secret')).toBe('credentials');
    expect(hyperlinkUrlProblem('https://user@contoso.com')).toBe('credentials');
    expect(hyperlinkUrlProblem(scriptUrl('alert(1)'))).toBe('invalid');
    expect(hyperlinkUrlProblem('data:text/html,hi')).toBe('invalid');
    expect(hyperlinkUrlProblem('https://contoso.com@evil.example')).toBe('credentials');
    expect(hyperlinkUrlProblem('not a url')).toBe('invalid');
    expect(hyperlinkUrlProblem('https://')).toBe('invalid');
    expect(hyperlinkUrlProblem('ftp://contoso.com')).toBe('invalid');
    expect(hyperlinkUrlProblem('')).toBe('empty');
    expect(hyperlinkUrlProblem('https://contoso.com/' + 'a'.repeat(250))).toBe('tooLong');
    expect(validatedHttpsUrl('http://contoso.com')).toBeUndefined();
    expect(validatedHttpsUrl(scriptUrl('https://contoso.com'))).toBeUndefined();
  });

  it('uses friendly blocking messages', () => {
    expect(hyperlinkErrorMessage('http', true)).toBe('Please use an https:// link.');
    expect(hyperlinkErrorMessage('credentials', true)).toBe('Remove the username and password from the link.');
    expect(hyperlinkErrorMessage('invalid', false)).toBe('Please enter a valid https:// link.');
    expect(hyperlinkErrorMessage('empty', true)).toBe('Please fill this in.');
    expect(hyperlinkErrorMessage('empty', false)).toBeUndefined();
    expect(validateValue(receipt, { url: 'http://contoso.com', description: 'x' })).toBe('Please use an https:// link.');
    expect(validateValue(receipt, { url: scriptUrl('alert(1)'), description: '' })).toBe('Please enter a valid https:// link.');
    expect(validateValue(receipt, { url: 'https://contoso.com', description: '' })).toBeUndefined();
    expect(validateValue({ ...receipt, required: false }, { url: '', description: '' })).toBeUndefined();
  });
});

describe('item payload v1.4.1: currency and hyperlink', () => {
  it('saves currency as a number and a hyperlink as { Url, Description } without __metadata', () => {
    const body = buildItemPayload(
      [amount, receipt],
      { Amount: '1250.50', Receipt: { url: 'https://contoso.com/receipts/8841', description: 'Hotel receipt' } }
    );
    expect(body).toEqual({
      Amount: 1250.5,
      Receipt: { Url: 'https://contoso.com/receipts/8841', Description: 'Hotel receipt' }
    });
    expect(JSON.stringify(body)).not.toContain('__metadata');
    expect(toFieldUrlValue({ url: 'https://contoso.com', description: '  A & B  ' })).toEqual({ Url: 'https://contoso.com/', Description: 'A & B' });
  });

  it('leaves out an empty optional hyperlink, an invalid URL, and a bad currency value', () => {
    expect(buildItemPayload([amount, { ...receipt, required: false }], { Amount: '1e3', Receipt: { url: 'http://contoso.com', description: 'nope' } })).toEqual({});
    expect(buildItemPayload([{ ...receipt, required: false }], { Receipt: { url: '', description: 'Only a title' } })).toEqual({});
    expect(buildItemPayload([receipt], { Receipt: 'https://contoso.com/x' as unknown as { url: string; description: string } })).toEqual({
      Receipt: { Url: 'https://contoso.com/x', Description: '' }
    });
  });

  it('formats a hyperlink for review as description, or the URL when the description is empty, never as HTML', () => {
    expect(formatHyperlinkLabel({ url: 'https://contoso.com/x', description: '<b>Receipt</b>' })).toBe('<b>Receipt</b>');
    expect(formatAnswer(receipt, { url: 'https://contoso.com/x', description: 'Hotel receipt' })).toBe('Hotel receipt');
    expect(formatAnswer(receipt, { url: 'https://contoso.com/x', description: '' })).toBe('https://contoso.com/x');
    expect(formatAnswer(receipt, { url: scriptUrl('alert(1)'), description: 'Bad' })).toBe('');
  });
});

describe('prefill v1.4.1: currency and hyperlink', () => {
  it('accepts a number for currency and an https URL or Url/Description object for a hyperlink', () => {
    expect(coercePrefillValue(amount, 1250.5)).toBe('1250.5');
    expect(coercePrefillValue(amount, '12.50')).toBe('12.5');
    expect(coercePrefillValue(amount, '1e3')).toBeUndefined();
    expect(coerceHyperlinkPrefill('https://contoso.com/r')).toEqual({ url: 'https://contoso.com/r', description: '' });
    expect(coercePrefillValue(receipt, { Url: 'https://contoso.com/r', Description: 'Ticket' })).toEqual({
      url: 'https://contoso.com/r',
      description: 'Ticket'
    });
    expect(coercePrefillValue(receipt, { url: 'https://contoso.com/r', description: 'Ticket' })).toEqual({
      url: 'https://contoso.com/r',
      description: 'Ticket'
    });
    expect(coercePrefillValue(receipt, 'http://contoso.com')).toBeUndefined();
    expect(coercePrefillValue(receipt, { Url: scriptUrl('alert(1)'), Description: 'x' })).toBeUndefined();
    expect(coercePrefillValue(receipt, { Url: 'https://user:pass@contoso.com', Description: 'x' })).toBeUndefined();
  });
});
