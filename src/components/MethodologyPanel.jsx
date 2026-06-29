import { TAX_YEAR } from '../config/irsLimits';

export default function MethodologyPanel() {
  return (
    <div className="card method">
      <h3>How the projection works</h3>
      <p>
        Every account is projected on its own, year by year, then summed. Within each year, growth and
        contributions compound on your pay schedule (so if you&apos;re paid bi-weekly, money is added and
        grows 26 times a year). Contributions continue until your retirement age; after that, balances
        keep growing but no new money goes in.
      </p>

      <h3>Growth of money you already have</h3>
      <p>Each current balance grows as a lump sum:</p>
      <div className="formula">FV = PV × (1 + r)^n</div>
      <p>PV = current balance, r = that account&apos;s annual growth rate, n = years until retirement.</p>

      <h3>Growth of ongoing contributions</h3>
      <p>
        Contributions are entered <strong>per paycheck</strong> and form a stream that grows over time —
        the future value of a series:
      </p>
      <div className="formula">FV = PMT × [ ((1 + r_period)^N − 1) / r_period ]</div>
      <p>
        PMT = contribution per pay period, r_period = growth rate per pay period, N = total number of pay
        periods. Percentage-based contributions are taken as a share of salary, and salary itself is grown
        each year by your salary-growth assumption.
      </p>

      <h3>Today&apos;s dollars vs. nominal</h3>
      <p>Future balances are also shown in today&apos;s purchasing power, discounted by your inflation assumption:</p>
      <div className="formula">Real FV = Nominal FV / (1 + inflation)^n</div>

      <h3>Withdrawals in retirement</h3>
      <p>
        Starting from your projected balance, monthly withdrawals are simulated against a blended portfolio
        return (the balance-weighted average of your account growth rates), with each year&apos;s withdrawal
        nudged up for inflation so your spending power stays constant. We report how long the money lasts and
        compare your target withdrawal to the 4% rule — a common benchmark for a rate sustainable over roughly
        a 30-year retirement.
      </p>

      <h3>IRS contribution limits ({TAX_YEAR})</h3>
      <p>
        Contributions are checked against {TAX_YEAR} IRS limits and flagged if they exceed them — a warning only,
        never a block. The 401(k) and 403(b) elective-deferral limits are shared and checked together; a
        governmental 457(b) is checked separately; Traditional and Roth IRA contributions share one combined
        limit; and the HSA limit depends on whether you selected self-only or family coverage. Age-based
        catch-up amounts are applied automatically based on your current age.
      </p>

      <p className="disclaimer">
        This tool is for educational planning only and is not financial advice. Projections are estimates based
        on assumptions you provide; real returns, taxes, and contribution rules vary. Consider speaking with a
        licensed financial professional for advice specific to your situation.
      </p>
    </div>
  );
}
