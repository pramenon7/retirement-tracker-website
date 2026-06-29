# Retirement Tracker Website — Project Rules & Spec

> **Purpose of this file:** the single source of truth for what we're building and how.
> Living document — edit it as decisions get made. Anything marked **[TO CONFIRM]** is an
> open question still to resolve. **[DECIDED]** marks settled choices.

---

## 1. The Goal (what makes this different)

Most retirement calculators online ask only for: age, total net worth, target retirement
age, and a single "total monthly contribution" number. They're shallow.

**This tool goes one level deeper:** the user enters contributions *per individual account*
(401k, 403b, Roth IRA, HSA, brokerage, etc.) and sets *per-account growth assumptions*.
That granularity is the whole point — it should never collapse back into a single blended number
unless the user explicitly chooses to.

---

## 2. Project Locations

| What | Path |
|------|------|
| Parent folder (Excel files, scratch, data) | `/Users/pgpsc/Documents/coding/claude_projects/retirement_tracker_website` |
| Website + GitHub repo (all rules, code, etc.) | `/Users/pgpsc/Documents/coding/claude_projects/retirement_tracker_website/claude_retirement_tracker_website` |

This file lives in the sub-folder above.

---

## 3. Tech Stack & Deployment

- **Hosting:** Netlify
- **Source control:** GitHub
- **App type:** static single-page web app (all math runs client-side; no backend, no data leaves the browser).
- **[DECIDED] Framework: React.** (Vite-based build recommended for clean Netlify deploys.)

---

## 4. User Inputs

### 4.1 Basic profile
- Current salary (annual)
- Current age
- Number of paychecks per year (user-selected — e.g. 12 / 24 / 26 / 52)
- Desired retirement age
- Desired monthly withdrawal in retirement

### 4.2 Net worth / current balances
Two modes the user can toggle between:
- **Simple:** one total net-worth number.
- **Detailed:** break balances out by individual account, grouped into the categories below.

**Account categories** (grouping chosen for clarity + tax treatment):

| Category | Accounts |
|----------|----------|
| **Tax-advantaged retirement** | 401(k), 403(b), Traditional IRA, Roth IRA, HSA |
| **Taxable / brokerage** | Individual brokerage account |
| **Cash & savings** | Emergency fund, high-yield savings |
| **Other** | 457(b), pension, SEP/Solo 401(k), or any user-added account |

> **[DECIDED]** HSA stays in the tax-advantaged retirement category by default (treated as a
> long-term, triple-tax-advantaged retirement vehicle). User can still move it if they want.

### 4.3 Contributions
- Entered **per account** (same accounts as 4.2 detailed mode).
- Each contribution can be entered as a **dollar amount** or a **percentage**.
  - Percentage = % of salary (most relevant for 401k/403b).
  - Dollar = flat amount.
- **[DECIDED] Per-paycheck is the source of truth.** Contributions are entered per paycheck and
  annualized as `per-paycheck × paychecks-per-year`. A monthly equivalent may be *displayed* for
  convenience but isn't the stored value.

#### IRS contribution-limit warnings — **[DECIDED: warn, don't block]**
Soft warning when an account's annualized contribution exceeds its 2026 IRS limit. Warn only;
never prevent the user from entering a number.

**2026 limits to encode:**

| Account | 2026 employee limit | Catch-up (age 50+) | Super catch-up (age 60–63) |
|---------|--------------------|--------------------|----------------------------|
| 401(k) | $24,500 | +$8,000 → $32,500 | +$11,250 → $35,750 |
| 403(b) | $24,500 | +$8,000 → $32,500 | +$11,250 → $35,750 |
| 457(b) | $24,500 | +$8,000 → $32,500 | +$11,250 → $35,750 |
| IRA (Trad + Roth combined) | $7,500 | +$1,100 → $8,600 | (same as 50+) |
| HSA — self-only | $4,400 | +$1,000 (age 55+) → $5,400 | — |
| HSA — family | $8,750 | +$1,000 (age 55+) → $9,750 | — |

**Limit-sharing rules the logic must respect:**
- **401(k) + 403(b) share ONE combined employee-deferral limit** ($24,500). Check the *sum* of
  contributions to both against the single limit, not each separately.
- **Governmental 457(b) has its OWN separate limit** ($24,500) — do not combine it with 401k/403b.
- **Traditional IRA + Roth IRA share ONE combined limit** ($7,500). Check the sum.
- **HSA** limit depends on coverage type — **[DECIDED]** provide a self-only / family selector
  ($4,400 vs $8,750), with the 55+ catch-up added on top of whichever is selected.
- **Catch-ups are age-driven:** auto-apply the 50+ catch-up when current age ≥ 50, and the
  60–63 super catch-up when age is 60–63 (HSA uses 55+ for its $1,000 catch-up).
- **[TO CONFIRM / v2]** Roth IRA income phase-outs (2026: $153k–$168k single, $242k–$252k MFJ).
  Could add a warning that contribution eligibility phases out at high income. Nice-to-have, not v1.

> Limits change annually. Store them in one config object (e.g. `irsLimits2026`) so next year's
> update is a one-line change.

### 4.4 Growth & economic assumptions
- **[DECIDED]** Per-account expected annual return, selectable ~**1%–10%** (allow finer steps, e.g. 0.5%).
- **[DECIDED]** A **"use one rate for everything"** toggle that applies a single global rate to all accounts.
- **[DECIDED] Inflation rate input.** Used to show results in today's dollars. Default ~2.5–3%.
- **[DECIDED] Salary growth rate input.** Drives growth of percentage-based contributions over
  time. Default ~2–3%, with the option to set 0%.

---

## 5. Outputs

1. **Headline result:** projected total at the user's desired retirement age, broken down by
   account/category (not just one blended number).
2. **Milestone projections:** balance at **5, 10, 15, and 20 years** from *today* (the date the
   user runs the tool), independent of retirement age.
3. **Retirement drawdown:** given the desired monthly withdrawal, show whether the nest egg is
   sustainable and roughly how long it lasts (sanity-check against a ~4% safe-withdrawal rate).
4. **Nominal vs. today's dollars:** show both (or a toggle), so the future number isn't misleading.
5. **Methodology tab:** plain-language explanation of every formula and assumption used (see §6).

---

## 6. Methodology (lean on established best practices)

The Methodology tab should document, in the user's-eye view, the math below.

**Growth of current balances** — future value of a lump sum:
```
FV = PV × (1 + r)^n
```
`PV` = current balance, `r` = annual return, `n` = years to retirement. Applied per account.

**Growth of ongoing contributions** — future value of a series (annuity):
```
FV = PMT × [ ((1 + r_period)^N − 1) / r_period ]
```
`PMT` = contribution per period, `r_period` = per-period rate, `N` = total periods. Compounding
period matches the paycheck frequency the user selected.

**Growing contributions** — when salary growth > 0 and contributions are % of salary, the
contribution stream is a *growing* annuity; the per-year contribution increases by the salary
growth rate. (Implement as a year-by-year loop for clarity.)

**Total at retirement** = sum across all accounts of (FV of balance + FV of contributions).

**Inflation adjustment** — convert nominal future value to today's purchasing power:
```
Real FV = Nominal FV / (1 + inflation)^n
```

**Safe withdrawal sanity check** — the 4% rule as a reference: a portfolio can historically
support ~4% annual withdrawal (inflation-adjusted) for ~30 years. Used to flag whether the
desired monthly withdrawal is aggressive or conservative.

---

## 7. Open Questions Summary

Resolved:
1. ~~Framework~~ → **React** ✅
2. ~~Inflation input~~ → **yes** ✅
3. ~~Salary growth input~~ → **yes** ✅
4. ~~Warn on IRS limits~~ → **yes, warn (don't block)** ✅
5. ~~HSA category~~ → **retirement** ✅

Still open:
- Roth IRA income phase-out warnings — v1 or later? (currently slated for v2)

Resolved this round:
6. ~~Contribution source of truth~~ → **per-paycheck** ✅
7. ~~HSA coverage type~~ → **self-only / family selector** ✅

---

## 8. Design Principles

- Keep the granular per-account detail front and center — that's the differentiator.
- Sensible defaults everywhere so a user can get a result fast, then refine.
- Be transparent: every number on the results screen should be traceable to the Methodology tab.
- Mobile-friendly; all calculation runs client-side (no data leaves the browser).
- IRS limits and default rates live in a single config object for easy annual updates.

---

*Last updated: 2026-06-29 · v3 (per-paycheck + HSA coverage selector confirmed; skeleton scaffolded)*
