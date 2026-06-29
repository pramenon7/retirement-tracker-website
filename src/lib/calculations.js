// ============================================================================
// Calculation engine
// ----------------------------------------------------------------------------
// All math is pure (no React, no side effects). Methodology mirrors what's
// documented in the app's Methodology tab and PROJECT_RULES.md.
//
// Contribution model: PER-PAYCHECK is the source of truth.
//   - mode 'percent' : value = % of salary  -> annual = salary * value/100
//                      (grows each year with salaryGrowthPct)
//   - mode 'dollar'  : value = $ per paycheck -> annual = value * paychecks
//                      (flat; salary growth does NOT apply)
//   - mode 'none'    : no contributions (balance grows only)
//
// Within each year, growth + contributions compound per paycheck so the
// future-value-of-an-annuity behavior matches the user's pay frequency.
// ============================================================================

import { CATEGORIES, ALL_ACCOUNTS } from './accounts';

const CATEGORY_OF = Object.fromEntries(ALL_ACCOUNTS.map((a) => [a.id, a.categoryId]));

// Annual contribution dollars for a given account in a given year.
function annualContribution(acct, salaryThisYear, paychecksPerYear) {
  const c = acct.contribution || { mode: 'none', value: 0 };
  if (c.mode === 'percent') return salaryThisYear * (Number(c.value) || 0) / 100;
  if (c.mode === 'dollar') return (Number(c.value) || 0) * paychecksPerYear;
  return 0;
}

// Advance one account's balance by one year, compounding per paycheck.
function growOneYear(balance, annualContrib, growthPct, paychecksPerYear, contribute) {
  const rate = (growthPct / 100) / paychecksPerYear;
  const perPaycheck = contribute ? annualContrib / paychecksPerYear : 0;
  let b = balance;
  for (let p = 0; p < paychecksPerYear; p++) {
    b = b * (1 + rate) + perPaycheck;
  }
  return b;
}

/**
 * Build a year-by-year timeline from today to the later of retirement or +20y.
 * Contributions continue until retirement age, then stop (balances still grow).
 * No withdrawals are applied here — drawdown is analyzed separately.
 *
 * @returns Array of snapshots, one per year offset (0 = today).
 *   { yearOffset, age, nominalTotal, realTotal, byAccount, byCategory }
 */
export function simulateTimeline(inputs) {
  const {
    currentAge,
    retirementAge,
    salary,
    paychecksPerYear,
    salaryGrowthPct,
    inflationPct,
    accounts, // [{ id, balance, growthPct, contribution }]
  } = inputs;

  const yearsToRetire = Math.max(0, retirementAge - currentAge);
  const horizon = Math.max(20, yearsToRetire);

  // Running balances keyed by account id.
  const balances = {};
  accounts.forEach((a) => { balances[a.id] = Number(a.balance) || 0; });

  const snapshots = [];

  const snapshot = (yearOffset) => {
    const byAccount = { ...balances };
    const byCategory = {};
    CATEGORIES.forEach((c) => { byCategory[c.id] = 0; });
    let nominalTotal = 0;
    for (const id in balances) {
      nominalTotal += balances[id];
      const cat = CATEGORY_OF[id] || 'other';
      byCategory[cat] += balances[id];
    }
    const realFactor = Math.pow(1 + inflationPct / 100, yearOffset);
    return {
      yearOffset,
      age: currentAge + yearOffset,
      nominalTotal,
      realTotal: nominalTotal / realFactor,
      byAccount,
      byCategory,
    };
  };

  snapshots.push(snapshot(0)); // today

  for (let y = 1; y <= horizon; y++) {
    const salaryThisYear = salary * Math.pow(1 + salaryGrowthPct / 100, y - 1);
    const stillContributing = currentAge + (y - 1) < retirementAge;
    accounts.forEach((a) => {
      const annual = annualContribution(a, salaryThisYear, paychecksPerYear);
      balances[a.id] = growOneYear(
        balances[a.id],
        annual,
        Number(a.growthPct) || 0,
        paychecksPerYear,
        stillContributing
      );
    });
    snapshots.push(snapshot(y));
  }

  return snapshots;
}

// Pull the snapshot at a specific year offset (clamped to available range).
export function snapshotAt(timeline, yearOffset) {
  const idx = Math.min(Math.max(0, yearOffset), timeline.length - 1);
  return timeline[idx];
}

// Weighted-average growth rate across accounts (used as the retirement return).
export function blendedGrowth(accounts) {
  let totalWeight = 0;
  let weighted = 0;
  accounts.forEach((a) => {
    const bal = Number(a.balance) || 0;
    totalWeight += bal;
    weighted += bal * (Number(a.growthPct) || 0);
  });
  return totalWeight > 0 ? weighted / totalWeight : 5;
}

/**
 * Drawdown analysis. Simulates monthly withdrawals (inflation-adjusted)
 * against a portfolio growing at `retirementReturnPct` until depletion.
 *
 * @returns {
 *   lastsYears: number | Infinity-ish (capped),
 *   depletes: boolean,
 *   safeMonthly: number,      // 4%-rule monthly figure for comparison
 *   verdict: 'sustainable' | 'tight' | 'depletes'
 * }
 */
export function analyzeDrawdown({ startingBalance, monthlyWithdrawal, retirementReturnPct, inflationPct }) {
  const monthlyRate = (retirementReturnPct / 100) / 12;
  const monthlyInflation = Math.pow(1 + inflationPct / 100, 1 / 12) - 1;
  const CAP_MONTHS = 60 * 12; // 60 years

  let balance = startingBalance;
  let withdrawal = monthlyWithdrawal;
  let months = 0;
  while (balance > 0 && months < CAP_MONTHS) {
    balance = balance * (1 + monthlyRate) - withdrawal;
    withdrawal *= 1 + monthlyInflation; // keep purchasing power constant
    months++;
  }

  const depletes = months < CAP_MONTHS;
  const lastsYears = months / 12;
  const safeMonthly = (startingBalance * 0.04) / 12; // 4% rule, year-one

  let verdict;
  if (!depletes || lastsYears >= 35) verdict = 'sustainable';
  else if (lastsYears >= 25) verdict = 'tight';
  else verdict = 'depletes';

  return { lastsYears, depletes, safeMonthly, verdict };
}

// Convenience: run the whole model and return the pieces the UI needs.
export function runModel(inputs) {
  const timeline = simulateTimeline(inputs);
  const yearsToRetire = Math.max(0, inputs.retirementAge - inputs.currentAge);
  const atRetirement = snapshotAt(timeline, yearsToRetire);

  const milestones = [5, 10, 15, 20].map((y) => ({
    years: y,
    snapshot: snapshotAt(timeline, y),
  }));

  const retirementReturnPct = blendedGrowth(inputs.accounts);
  const drawdown = analyzeDrawdown({
    startingBalance: atRetirement.nominalTotal,
    monthlyWithdrawal: inputs.monthlyWithdrawal,
    retirementReturnPct,
    inflationPct: inputs.inflationPct,
  });

  return { timeline, atRetirement, milestones, drawdown, retirementReturnPct, yearsToRetire };
}
