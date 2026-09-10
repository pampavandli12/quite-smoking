import type { AppSymbolName } from '@/components/AppSymbol';

export const SUPPORTED_CURRENCIES = ['INR', 'USD', 'CAD', 'GBP'] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

const REGION_TO_CURRENCY: Record<string, CurrencyCode> = {
  IN: 'INR',
  US: 'USD',
  CA: 'CAD',
  GB: 'GBP',
};

const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  CAD: 'en-CA',
  GBP: 'en-GB',
};

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  INR: 'Indian Rupee (₹)',
  USD: 'US Dollar ($)',
  CAD: 'Canadian Dollar (CA$)',
  GBP: 'British Pound (£)',
};

const CURRENCY_SYMBOL_NAMES: Record<CurrencyCode, AppSymbolName> = {
  INR: 'currency-inr',
  USD: 'currency-usd',
  CAD: 'currency-cad',
  GBP: 'currency-gbp',
};

export function isCurrencyCode(value: string): value is CurrencyCode {
  return SUPPORTED_CURRENCIES.includes(value as CurrencyCode);
}

export function currencyForRegion(
  regionCode: string | undefined | null,
): CurrencyCode {
  if (!regionCode) return 'USD';
  return REGION_TO_CURRENCY[regionCode.toUpperCase()] ?? 'USD';
}

export function detectDeviceLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return 'en-US';
  }
}

export function detectCurrencyFromDevice(): CurrencyCode {
  try {
    const locale = detectDeviceLocale();
    const region = locale.split('-').pop();
    return currencyForRegion(region);
  } catch {
    return 'USD';
  }
}

export function getCurrencySymbolName(currencyCode: CurrencyCode): AppSymbolName {
  return CURRENCY_SYMBOL_NAMES[currencyCode];
}

type FormatMoneyOptions = {
  compact?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export function formatMoney(
  amount: number,
  currencyCode: CurrencyCode,
  options: FormatMoneyOptions = {},
): string {
  const {
    compact = false,
    minimumFractionDigits,
    maximumFractionDigits,
  } = options;

  return new Intl.NumberFormat(CURRENCY_LOCALES[currencyCode], {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits:
      minimumFractionDigits ?? (compact ? 0 : undefined),
    maximumFractionDigits:
      maximumFractionDigits ?? (compact ? 0 : undefined),
  }).format(amount);
}

export function formatMoneyFromCents(
  cents: number,
  currencyCode: CurrencyCode,
  options: FormatMoneyOptions = {},
): string {
  return formatMoney(cents / 100, currencyCode, options);
}
