import { CurrencyRateInfo } from '../types';

export interface CurrencyMeta {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  country: string;
  countryCode: string;
}

export const SUPPORTED_CURRENCIES: CurrencyMeta[] = [
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', flag: '🇸🇦', country: 'Saudi Arabia', countryCode: 'SA' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', country: 'United States', countryCode: 'US' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', country: 'Europe (Eurozone)', countryCode: 'EU' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', country: 'United Kingdom', countryCode: 'GB' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: 'BDT', flag: '🇧🇩', country: 'Bangladesh', countryCode: 'BD' },
  { code: 'INR', name: 'Indian Rupee', symbol: 'INR', flag: '🇮🇳', country: 'India', countryCode: 'IN' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'PKR', flag: '🇵🇰', country: 'Pakistan', countryCode: 'PK' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', flag: '🇦🇪', country: 'United Arab Emirates', countryCode: 'AE' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QAR', flag: '🇶🇦', country: 'Qatar', countryCode: 'QA' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KWD', flag: '🇰🇼', country: 'Kuwait', countryCode: 'KW' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦', country: 'Canada', countryCode: 'CA' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', country: 'Australia', countryCode: 'AU' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', country: 'Japan', countryCode: 'JP' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', country: 'Switzerland', countryCode: 'CH' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', country: 'China', countryCode: 'CN' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', country: 'Singapore', countryCode: 'SG' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', country: 'Malaysia', countryCode: 'MY' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', country: 'Turkey', countryCode: 'TR' },
];

export function getCurrencyMeta(code: string): CurrencyMeta | undefined {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code);
}

export function getCurrencyFlag(code: string): string {
  const meta = SUPPORTED_CURRENCIES.find((c) => c.code === code);
  return meta?.flag || '🌐';
}

export function getCurrencySymbol(code: string): string {
  const meta = SUPPORTED_CURRENCIES.find((c) => c.code === code);
  return meta?.symbol || code;
}

export function getCurrencyDisplayRow(code: string): string {
  const meta = SUPPORTED_CURRENCIES.find((c) => c.code === code);
  if (!meta) return code;
  return `${meta.flag} ${meta.code} — ${meta.name} — ${meta.country}`;
}

// Baseline fallback rates relative to 1 USD in case of complete network outage
const FALLBACK_USD_RATES: Record<string, number> = {
  USD: 1.0,
  SAR: 3.75,
  BDT: 122.8,
  INR: 86.8,
  PKR: 278.5,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  QAR: 3.64,
  KWD: 0.31,
  CAD: 1.41,
  AUD: 1.55,
  JPY: 154.2,
  CHF: 0.88,
  CNY: 7.24,
  SGD: 1.34,
  MYR: 4.45,
  TRY: 35.8,
};

const CACHE_KEY = 'capitalflow_currency_rates_v1';

export async function fetchExchangeRates(): Promise<CurrencyRateInfo> {
  const cachedStr = localStorage.getItem(CACHE_KEY);
  if (cachedStr) {
    try {
      const cached = JSON.parse(cachedStr) as CurrencyRateInfo;
      // If cached within 4 hours, return cached
      if (Date.now() - cached.lastFetched < 4 * 60 * 60 * 1000) {
        return cached;
      }
    } catch {
      // ignore
    }
  }

  // 1. Try Frankfurter API first for ECB official rates
  try {
    const frankfurterRes = await fetch('https://api.frankfurter.dev/v1/latest?from=USD');
    if (frankfurterRes.ok) {
      const data = await frankfurterRes.json();
      const frankfurterRates: Record<string, number> = { USD: 1.0, ...data.rates };
      
      // Combine with extended rates for SAR, BDT, PKR, AED, etc. from open.er-api
      try {
        const erRes = await fetch('https://open.er-api.com/v6/latest/USD');
        if (erRes.ok) {
          const erData = await erRes.json();
          const combinedRates = {
            ...FALLBACK_USD_RATES,
            ...erData.rates,
            ...frankfurterRates, // preserve ECB accuracy
          };
          const rateInfo: CurrencyRateInfo = {
            base: 'USD',
            date: data.date || new Date().toISOString().split('T')[0],
            source: 'Frankfurter API (ECB) + Open Exchange Rates',
            rates: combinedRates,
            lastFetched: Date.now(),
            isFallback: false,
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(rateInfo));
          return rateInfo;
        }
      } catch (erErr) {
        console.warn('Extended rates fetch failed, combining Frankfurter with fallback:', erErr);
      }

      const rateInfo: CurrencyRateInfo = {
        base: 'USD',
        date: data.date || new Date().toISOString().split('T')[0],
        source: 'Frankfurter API (European Central Bank)',
        rates: { ...FALLBACK_USD_RATES, ...frankfurterRates },
        lastFetched: Date.now(),
        isFallback: false,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(rateInfo));
      return rateInfo;
    }
  } catch (fErr) {
    console.warn('Frankfurter API fetch failed, trying Open ER API:', fErr);
  }

  // 2. Fallback to Open ER API
  try {
    const openRes = await fetch('https://open.er-api.com/v6/latest/USD');
    if (openRes.ok) {
      const data = await openRes.json();
      const rateInfo: CurrencyRateInfo = {
        base: 'USD',
        date: new Date(data.time_last_update_utc || Date.now()).toISOString().split('T')[0],
        source: 'Open Exchange Rates (Reliable Open Feed)',
        rates: { ...FALLBACK_USD_RATES, ...data.rates },
        lastFetched: Date.now(),
        isFallback: false,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(rateInfo));
      return rateInfo;
    }
  } catch (openErr) {
    console.warn('Open ER API failed:', openErr);
  }

  // 3. Fallback to cached or hardcoded baseline rates
  if (cachedStr) {
    try {
      const cached = JSON.parse(cachedStr) as CurrencyRateInfo;
      return {
        ...cached,
        isFallback: true,
      };
    } catch {
      // ignore
    }
  }

  const fallbackInfo: CurrencyRateInfo = {
    base: 'USD',
    date: new Date().toISOString().split('T')[0],
    source: 'Cached Baseline Rates (Offline Mode)',
    rates: FALLBACK_USD_RATES,
    lastFetched: Date.now(),
    isFallback: true,
  };
  return fallbackInfo;
}

/**
 * Calculates conversion rate between any two currencies.
 * Returns how many 'to' units 1 'from' unit is worth.
 */
export function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> = FALLBACK_USD_RATES
): number {
  if (fromCurrency === toCurrency) return 1.0;
  const fromRate = rates[fromCurrency] || FALLBACK_USD_RATES[fromCurrency] || 1.0;
  const toRate = rates[toCurrency] || FALLBACK_USD_RATES[toCurrency] || 1.0;
  return toRate / fromRate;
}

/**
 * Converts an amount from one currency to another using provided rates.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> = FALLBACK_USD_RATES
): number {
  if (fromCurrency === toCurrency) return amount;
  const rate = getExchangeRate(fromCurrency, toCurrency, rates);
  return amount * rate;
}

/**
 * Formats a currency amount with symbol and thousand separators.
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'SAR',
  options: { showSymbol?: boolean; showCode?: boolean; decimals?: number } = {}
): string {
  const safeCurrency = currencyCode || 'SAR';
  const { showSymbol = true, showCode = false, decimals = 2 } = options;
  const meta = SUPPORTED_CURRENCIES.find((c) => c.code === safeCurrency);
  const symbol = meta?.symbol || safeCurrency;

  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? '-' : '';

  if (showCode) {
    return `${sign}${formattedNumber} ${safeCurrency}`;
  }

  if (showSymbol) {
    // If symbol is letters like SAR, AED, BDT, INR, format with space
    if (symbol.length > 1) {
      return `${sign}${symbol} ${formattedNumber}`;
    }
    return `${sign}${symbol}${formattedNumber}`;
  }

  return `${sign}${formattedNumber}`;
}

export function formatCompactCurrency(
  amount: number,
  currencyCode: string = 'SAR'
): string {
  const safeCurrency = currencyCode || 'SAR';
  const meta = SUPPORTED_CURRENCIES.find((c) => c.code === safeCurrency);
  const symbol = meta?.symbol || safeCurrency;
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);

  let formatted = '';
  if (abs >= 1_000_000_000) {
    formatted = (abs / 1_000_000_000).toFixed(1) + 'B';
  } else if (abs >= 1_000_000) {
    formatted = (abs / 1_000_000).toFixed(1) + 'M';
  } else if (abs >= 100_000) {
    formatted = (abs / 1_000).toFixed(0) + 'k';
  } else {
    formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(abs);
  }

  if (symbol.length > 1) {
    return `${sign}${symbol} ${formatted}`;
  }
  return `${sign}${symbol}${formatted}`;
}
