// ============================================================================
// IRS Contribution Limits — 2026
// ----------------------------------------------------------------------------
// Single source of truth for annual contribution limits. To update for a new
// tax year, change the values here (and the YEAR constant) — nothing else.
//
// Limit-sharing rules (handled in getLimitWarnings):
//   - 401(k) + 403(b) share ONE combined employee-deferral limit.
//   - Governmental 457(b) has its OWN separate limit.
//   - Traditional IRA + Roth IRA share ONE combined limit.
//   - HSA depends on coverage type (self-only vs family).
//   - Catch-ups are age-driven (50+, 60–63 super catch-up, 55+ for HSA).
// ============================================================================

export const TAX_YEAR = 2026;

export const IRS_LIMITS = {
  // Elective deferral limit shared by 401(k), 403(b), and (separately) 457(b)
  electiveDeferral: {
    base: 24500,
    catchUp50: 8000, // age 50+
    superCatchUp: 11250, // ages 60–63 (replaces catchUp50)
  },
  // Traditional + Roth IRA share this combined limit
  ira: {
    base: 7500,
    catchUp50: 1100, // age 50+
  },
  // HSA depends on coverage type
  hsa: {
    selfOnly: 4400,
    family: 8750,
    catchUp55: 1000, // age 55+
  },
};

// --- Helpers ----------------------------------------------------------------

// Elective-deferral limit (401k/403b/457b) adjusted for the user's age.
export function electiveDeferralLimit(age) {
  const { base, catchUp50, superCatchUp } = IRS_LIMITS.electiveDeferral;
  if (age >= 60 && age <= 63) return base + superCatchUp;
  if (age >= 50) return base + catchUp50;
  return base;
}

// Combined Traditional + Roth IRA limit adjusted for age.
export function iraLimit(age) {
  const { base, catchUp50 } = IRS_LIMITS.ira;
  return age >= 50 ? base + catchUp50 : base;
}

// HSA limit for the selected coverage type, adjusted for age.
export function hsaLimit(coverage, age) {
  const base =
    coverage === 'family' ? IRS_LIMITS.hsa.family : IRS_LIMITS.hsa.selfOnly;
  return age >= 55 ? base + IRS_LIMITS.hsa.catchUp55 : base;
}
