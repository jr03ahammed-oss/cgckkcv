import {
  Investment,
  MonthlyRecord,
  ComputedMonthlyRecord,
  InvestmentFinancials,
  PortfolioSummary,
  CapitalRecoveryStatus,
  InvestmentFinancialStatus,
  CurrencyRateInfo,
} from '../types';
import { getExchangeRate, convertCurrency } from './currency';

/**
 * Computes spreadsheet-style running monthly values for an investment.
 */
export function computeMonthlyRecords(
  investment: Investment,
  records: MonthlyRecord[]
): ComputedMonthlyRecord[] {
  // Sort records chronologically by date
  const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let cumulativeCapital = investment.initialCapital;
  let cumulativeRecovered = 0;

  return sorted.map((rec) => {
    const netProfit = (rec.income || 0) - (rec.expense || 0);
    cumulativeCapital += (rec.additionalCapital || 0) - (rec.withdrawal || 0);
    cumulativeRecovered += (rec.income || 0);

    const remainingCapitalAfter = Math.max(0, cumulativeCapital - cumulativeRecovered);
    const monthlyRoi = cumulativeCapital > 0 ? (netProfit / cumulativeCapital) * 100 : 0;

    return {
      ...rec,
      netProfit,
      remainingCapitalAfter,
      monthlyRoi,
    };
  });
}

/**
 * Calculates comprehensive dynamic financials for a single investment.
 * First in its native currency, then converted to master currency.
 */
export function calculateInvestmentFinancials(
  investment: Investment,
  records: MonthlyRecord[],
  masterCurrency: string,
  rateInfo: CurrencyRateInfo
): InvestmentFinancials {
  const initialCapital = Number(investment.initialCapital) || 0;
  
  let additionalCapital = 0;
  let withdrawals = 0;
  let totalReturn = 0;
  let totalExpense = 0;

  records.forEach((rec) => {
    additionalCapital += Number(rec.additionalCapital) || 0;
    withdrawals += Number(rec.withdrawal) || 0;
    totalReturn += Number(rec.income) || 0;
    totalExpense += Number(rec.expense) || 0;
  });

  const totalInvestedCapital = initialCapital + additionalCapital - withdrawals;
  const netProfit = totalReturn - totalExpense;
  const roi = totalInvestedCapital > 0 ? (netProfit / totalInvestedCapital) * 100 : 0;

  // Capital Recovered is the total returns received back
  const capitalRecovered = totalReturn;
  const remainingCapital = Math.max(0, totalInvestedCapital - capitalRecovered);
  
  const recoveryPercentage = totalInvestedCapital > 0 
    ? Math.min(100, Math.max(0, (capitalRecovered / totalInvestedCapital) * 100))
    : 0;

  // Capital Recovery Status
  let recoveryStatus: CapitalRecoveryStatus = 'Capital Recovery in Progress';
  if (totalInvestedCapital > 0 && capitalRecovered >= totalInvestedCapital) {
    if (netProfit > 0) {
      recoveryStatus = 'Profit Phase';
    } else {
      recoveryStatus = 'Capital Recovered';
    }
  }

  // Investment Financial Status
  let status: InvestmentFinancialStatus = 'No Activity';
  if (totalInvestedCapital === 0 && records.length === 0) {
    status = 'Awaiting Capital';
  } else if (records.length === 0) {
    status = 'No Activity';
  } else if (netProfit > 0) {
    status = 'Profit Generated';
  } else if (netProfit < 0) {
    status = 'Operating at Loss';
  } else if (netProfit === 0 && (totalReturn > 0 || totalExpense > 0)) {
    status = 'Break-even';
  }

  // Check Target Period if provided
  if (investment.targetPeriod && investment.startDate) {
    const start = new Date(investment.startDate).getTime();
    const now = Date.now();
    const monthsMatch = investment.targetPeriod.match(/(\d+)\s*(month|year)/i);
    if (monthsMatch) {
      const num = parseInt(monthsMatch[1], 10);
      const isYear = monthsMatch[2].toLowerCase().startsWith('year');
      const targetMonths = isYear ? num * 12 : num;
      const targetEndDate = start + targetMonths * 30.4375 * 24 * 60 * 60 * 1000;
      const daysLeft = (targetEndDate - now) / (1000 * 60 * 60 * 24);

      if (daysLeft < 0 && recoveryStatus !== 'Capital Recovered' && recoveryStatus !== 'Profit Phase') {
        status = 'Target Period Missed';
      } else if (daysLeft >= 0 && daysLeft <= 60 && recoveryStatus === 'Capital Recovery in Progress') {
        status = 'Target Period Approaching';
      }
    }
  }

  // Currency Conversion to Master Currency
  const rateToMaster = getExchangeRate(investment.currency, masterCurrency, rateInfo.rates);
  const convertedTotalInvested = convertCurrency(totalInvestedCapital, investment.currency, masterCurrency, rateInfo.rates);
  const convertedTotalReturn = convertCurrency(totalReturn, investment.currency, masterCurrency, rateInfo.rates);
  const convertedTotalExpense = convertCurrency(totalExpense, investment.currency, masterCurrency, rateInfo.rates);
  const convertedNetProfit = convertCurrency(netProfit, investment.currency, masterCurrency, rateInfo.rates);
  const convertedCapitalRecovered = convertCurrency(capitalRecovered, investment.currency, masterCurrency, rateInfo.rates);
  const convertedRemainingCapital = convertCurrency(remainingCapital, investment.currency, masterCurrency, rateInfo.rates);

  return {
    initialCapital,
    additionalCapital,
    withdrawals,
    totalInvestedCapital,
    totalReturn,
    totalExpense,
    netProfit,
    roi,
    capitalRecovered,
    remainingCapital,
    recoveryPercentage,
    recoveryStatus,
    status,
    rateToMaster,
    rateDate: rateInfo.date,
    rateSource: rateInfo.source,
    isCachedRate: !!rateInfo.isFallback,
    convertedTotalInvested,
    convertedTotalReturn,
    convertedTotalExpense,
    convertedNetProfit,
    convertedCapitalRecovered,
    convertedRemainingCapital,
  };
}

/**
 * Consolidates all investments in the portfolio into the user's Master Currency.
 */
export function calculatePortfolioSummary(
  investments: Investment[],
  recordsByInvestment: Record<string, MonthlyRecord[]>,
  masterCurrency: string,
  rateInfo: CurrencyRateInfo
): PortfolioSummary {
  let totalInvestedCapital = 0;
  let totalReturn = 0;
  let totalExpense = 0;
  let netProfit = 0;
  let capitalRecovered = 0;
  let remainingCapital = 0;

  investments.forEach((inv) => {
    const records = recordsByInvestment[inv.id] || [];
    const financials = calculateInvestmentFinancials(inv, records, masterCurrency, rateInfo);
    
    totalInvestedCapital += financials.convertedTotalInvested;
    totalReturn += financials.convertedTotalReturn;
    totalExpense += financials.convertedTotalExpense;
    netProfit += financials.convertedNetProfit;
    capitalRecovered += financials.convertedCapitalRecovered;
    remainingCapital += financials.convertedRemainingCapital;
  });

  const roi = totalInvestedCapital > 0 ? (netProfit / totalInvestedCapital) * 100 : 0;
  const recoveryPercentage = totalInvestedCapital > 0 
    ? Math.min(100, Math.max(0, (capitalRecovered / totalInvestedCapital) * 100))
    : 0;

  let recoveryStatus: CapitalRecoveryStatus = 'Capital Recovery in Progress';
  if (totalInvestedCapital > 0 && capitalRecovered >= totalInvestedCapital) {
    if (netProfit > 0) {
      recoveryStatus = 'Profit Phase';
    } else {
      recoveryStatus = 'Capital Recovered';
    }
  }

  return {
    masterCurrency,
    totalInvestedCapital,
    totalReturn,
    totalExpense,
    netProfit,
    roi,
    capitalRecovered,
    remainingCapital,
    recoveryPercentage,
    recoveryStatus,
    activeInvestmentsCount: investments.length,
  };
}
