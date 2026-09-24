import {
  currencyForRegion,
  detectCurrencyFromDevice,
  formatMoney,
  formatMoneyFromCents,
  getCurrencySymbolName,
  isCurrencyCode,
} from '../currency';

describe('currency utilities', () => {
  test.each([
    ['IN', 'INR'],
    ['US', 'USD'],
    ['CA', 'CAD'],
    ['GB', 'GBP'],
    ['FR', 'USD'],
    [null, 'USD'],
  ] as const)('maps region %s to %s', (region, expected) => {
    expect(currencyForRegion(region)).toBe(expected);
  });

  it('validates supported currency codes', () => {
    expect(isCurrencyCode('INR')).toBe(true);
    expect(isCurrencyCode('EUR')).toBe(false);
  });

  it('maps currency codes to symbol names', () => {
    expect(getCurrencySymbolName('INR')).toBe('currency-inr');
    expect(getCurrencySymbolName('USD')).toBe('currency-usd');
    expect(getCurrencySymbolName('CAD')).toBe('currency-cad');
    expect(getCurrencySymbolName('GBP')).toBe('currency-gbp');
  });

  it('formats money for each supported region', () => {
    expect(formatMoney(12, 'INR', { compact: true })).toContain('12');
    expect(formatMoney(12, 'USD', { compact: true })).toContain('12');
    expect(formatMoney(12, 'CAD', { compact: true })).toContain('12');
    expect(formatMoney(12, 'GBP', { compact: true })).toContain('12');
    expect(formatMoneyFromCents(250, 'USD')).toContain('2.50');
  });

  it('detects a supported currency from the device locale', () => {
    const detected = detectCurrencyFromDevice();
    expect(['INR', 'USD', 'CAD', 'GBP']).toContain(detected);
  });

  it('formats negative savings with the currency symbol', () => {
    expect(formatMoney(-12, 'USD', { compact: true })).toContain('12');
    expect(formatMoney(-12, 'USD', { compact: true })).toMatch(/^-/);
  });
});
