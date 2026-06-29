// ============================================================================
// Account model
// ----------------------------------------------------------------------------
// Defines every account the user can track, grouped into categories.
// `contributionType` controls how contribution inputs behave:
//   - 'percent'  : entered as % of salary OR a dollar amount (salary-linked)
//   - 'dollar'   : dollar amount only
//   - 'none'     : balance only, no ongoing contributions (e.g. pension value)
// `limitKey` ties an account to its IRS limit bucket for warnings.
// ============================================================================

export const CATEGORIES = [
  {
    id: 'retirement',
    label: 'Tax-advantaged retirement',
    blurb: 'Accounts with tax benefits meant for long-term retirement saving.',
    accounts: [
      { id: 'traditional401k', label: 'Traditional 401(k)', contributionType: 'percent', limitKey: 'electiveDeferral', defaultGrowth: 7 },
      { id: 'roth401k', label: 'Roth 401(k)', contributionType: 'percent', limitKey: 'electiveDeferral', defaultGrowth: 7 },
      { id: 'traditional403b', label: 'Traditional 403(b)', contributionType: 'percent', limitKey: 'electiveDeferral', defaultGrowth: 7 },
      { id: 'traditionalIra', label: 'Traditional IRA', contributionType: 'dollar', limitKey: 'ira', defaultGrowth: 7 },
      { id: 'rothIra', label: 'Roth IRA', contributionType: 'dollar', limitKey: 'ira', defaultGrowth: 7 },
      { id: 'hsa', label: 'HSA', contributionType: 'dollar', limitKey: 'hsa', defaultGrowth: 6 },
    ],
  },
  {
    id: 'taxable',
    label: 'Taxable / brokerage',
    blurb: 'After-tax investment accounts with no contribution limits.',
    accounts: [
      { id: 'brokerage', label: 'Individual brokerage', contributionType: 'dollar', limitKey: null, defaultGrowth: 7 },
    ],
  },
  {
    id: 'cash',
    label: 'Cash & savings',
    blurb: 'Lower-growth, liquid funds.',
    accounts: [
      { id: 'emergency', label: 'Emergency fund', contributionType: 'dollar', limitKey: null, defaultGrowth: 3 },
      { id: 'hysa', label: 'High-yield savings', contributionType: 'dollar', limitKey: null, defaultGrowth: 4 },
    ],
  },
  {
    id: 'other',
    label: 'Other',
    blurb: 'Anything else: 457(b), pension, SEP/Solo 401(k), etc.',
    accounts: [
      { id: 'gov457b', label: '457(b)', contributionType: 'percent', limitKey: 'gov457b', defaultGrowth: 7 },
      { id: 'sepSolo', label: 'SEP / Solo 401(k)', contributionType: 'dollar', limitKey: null, defaultGrowth: 7 },
      { id: 'pension', label: 'Pension (current value)', contributionType: 'none', limitKey: null, defaultGrowth: 5 },
      { id: 'otherInvest', label: 'Other investment / savings', contributionType: 'dollar', limitKey: null, defaultGrowth: 6 },
    ],
  },
];

// Flat list of all accounts for convenience.
export const ALL_ACCOUNTS = CATEGORIES.flatMap((c) =>
  c.accounts.map((a) => ({ ...a, categoryId: c.id }))
);

export function getAccount(id) {
  return ALL_ACCOUNTS.find((a) => a.id === id);
}
