/** CurrencyLocaleId (SharePoint LCID) to ISO 4217. Common list-column locales only. */
const CURRENCY_BY_LCID: Record<number, string> = {
  1025: 'SAR',
  1026: 'BGN',
  1028: 'TWD',
  1029: 'CZK',
  1030: 'DKK',
  1031: 'EUR',
  1032: 'EUR',
  1033: 'USD',
  1034: 'EUR',
  1035: 'EUR',
  1036: 'EUR',
  1038: 'HUF',
  1039: 'ISK',
  1040: 'EUR',
  1041: 'JPY',
  1042: 'KRW',
  1043: 'EUR',
  1044: 'NOK',
  1045: 'PLN',
  1046: 'BRL',
  1048: 'RON',
  1049: 'RUB',
  1050: 'EUR',
  1051: 'EUR',
  1053: 'SEK',
  1054: 'THB',
  1055: 'TRY',
  1056: 'PKR',
  1057: 'IDR',
  1058: 'UAH',
  1060: 'EUR',
  1061: 'EUR',
  1062: 'EUR',
  1063: 'EUR',
  1065: 'IRR',
  1066: 'VND',
  1069: 'EUR',
  1078: 'ZAR',
  1079: 'GEL',
  1081: 'INR',
  1086: 'MYR',
  1110: 'EUR',
  2052: 'CNY',
  2057: 'GBP',
  2058: 'MXN',
  2060: 'EUR',
  2067: 'EUR',
  2070: 'EUR',
  2074: 'RSD',
  2077: 'EUR',
  3073: 'EGP',
  3081: 'AUD',
  3084: 'CAD',
  4100: 'SGD',
  4105: 'CAD',
  5129: 'NZD',
  6153: 'EUR',
  7177: 'ZAR',
  8193: 'BHD',
  8201: 'JMD',
  9225: 'CAD',
  9226: 'COP',
  11265: 'JOD',
  11274: 'ARS',
  13313: 'KWD',
  13322: 'CLP',
  14337: 'AED',
  15361: 'QAR',
  16385: 'QAR',
  16393: 'INR',
  16394: 'PEN',
  17417: 'MYR',
  18441: 'SGD'
};

/** SharePoint FieldTypeKind for a Currency column. */
export const CURRENCY_FIELD_TYPE_KIND = 10;

export function currencyCodeForLocaleId(localeId: number | undefined): string {
  return localeId !== undefined && CURRENCY_BY_LCID[localeId] ? CURRENCY_BY_LCID[localeId] : '';
}

/** Common input symbols. An unmapped code (and an unknown LCID) shows no symbol. */
const CURRENCY_SYMBOL: Record<string, string> = {
  USD: '$',
  GBP: '£',
  EUR: '€',
  JPY: '¥',
  CNY: '¥',
  KRW: '₩',
  INR: '₹',
  BRL: 'R$',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  TRY: '₺',
  RUB: '₽',
  THB: '฿',
  TWD: 'NT$',
  AUD: '$',
  CAD: '$',
  NZD: '$',
  SGD: '$',
  MXN: '$',
  ZAR: 'R',
  CHF: 'CHF',
  AED: 'AED',
  SAR: 'SAR',
  IDR: 'Rp',
  MYR: 'RM',
  UAH: '₴',
  RON: 'lei',
  BGN: 'лв',
  ISK: 'kr',
  PKR: 'Rs',
  VND: '₫',
  GEL: '₾',
  IRR: 'IRR',
  RSD: 'din',
  EGP: '£',
  BHD: 'BD',
  JOD: 'JD',
  KWD: 'KD',
  QAR: 'QR',
  PEN: 'S/',
  COP: '$',
  CLP: '$',
  ARS: '$',
  JMD: '$'
};

/** Symbol shown beside the amount input, or '' when the LCID is unknown. */
export function currencySymbolForLocaleId(localeId: number | undefined): string {
  const code = currencyCodeForLocaleId(localeId);
  return code && CURRENCY_SYMBOL[code] ? CURRENCY_SYMBOL[code] : '';
}

function readLocaleId(raw: unknown): number | undefined {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() ? Number(raw) : NaN;
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export function currencyLocaleIdOf(raw: unknown): number | undefined {
  return readLocaleId(raw);
}

/** Review / finish text: the locale's currency format, or a plain number when the LCID is unknown. */
export function formatCurrencyValue(value: number, localeId: number | undefined, locale?: string): string {
  const code = currencyCodeForLocaleId(localeId);
  try {
    if (code) {
      return new Intl.NumberFormat(locale || undefined, { style: 'currency', currency: code }).format(value);
    }
    return new Intl.NumberFormat(locale || undefined, { maximumFractionDigits: 10 }).format(value);
  } catch {
    return String(value);
  }
}
