import { CATEGORIES } from '../lib/accounts';
import { money, moneyCompact, years, percent } from '../lib/format';

const CAT_COLORS = {
  retirement: '#0f6e5c',
  taxable: '#3b7ea1',
  cash: '#b08524',
  other: '#7a6f9b',
};
const CAT_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));

export default function ResultsPanel({ model, profile }) {
  const { atRetirement, milestones, drawdown, retirementReturnPct, yearsToRetire, inflationPct } = model;
  const inflationFactor = Math.pow(1 + (inflationPct || 0) / 100, yearsToRetire);
  const safeMontlyTodayDollars = drawdown.safeMonthly / inflationFactor;

  const total = atRetirement.nominalTotal;
  const cats = Object.entries(atRetirement.byCategory).filter(([, v]) => v > 0);

  const verdictText = {
    sustainable: 'On track',
    tight: 'Cutting it close',
    depletes: 'Runs short',
  }[drawdown.verdict];

  return (
    <div>
      <div className="headline">
        <p className="label">Projected at age {profile.retirementAge} · {yearsToRetire} yrs out</p>
        <div className="big">{moneyCompact(total)}</div>
        <div className="real">
          {money(total)} nominal · {money(atRetirement.realTotal)} in today&apos;s dollars
        </div>
        <div className="meta">
          Assumes contributions continue until retirement, then balances keep growing at a blended {percent(retirementReturnPct)}.
        </div>
      </div>

      {cats.length > 0 && (
        <div className="card" style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>By category at retirement</div>
          <div className="bar">
            {cats.map(([id, v]) => (
              <span key={id} style={{ width: `${(v / total) * 100}%`, background: CAT_COLORS[id] }} />
            ))}
          </div>
          <div className="cat-legend">
            {cats.map(([id, v]) => (
              <div className="row" key={id}>
                <span className="dot" style={{ background: CAT_COLORS[id] }} />
                <span>{CAT_LABEL[id]}</span>
                <span className="amt">{money(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Milestones from today</div>
        <ul className="stat-list">
          {milestones.map((m) => (
            <li key={m.years}>
              <span className="k">In {m.years} years <span style={{ color: 'var(--ink-faint)' }}>· age {m.snapshot.age}</span></span>
              <span style={{ textAlign: 'right' }}>
                <div className="v">{money(m.snapshot.nominalTotal)}</div>
                <div className="v real">{money(m.snapshot.realTotal)} today&apos;s $</div>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Withdrawals in retirement</div>
          <span className={`verdict ${drawdown.verdict}`}>{verdictText}</span>
        </div>
        <ul className="stat-list">
          <li>
            <span className="k">At {money(profile.monthlyWithdrawal)}/mo, savings last</span>
            <span className="v">{years(drawdown.lastsYears)}</span>
          </li>
          <li>
            <span className="k">4%-rule guide (today's dollars)</span>
            <span className="v">{money(safeMontlyTodayDollars)}/mo</span>
          </li>
        </ul>
        <p style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '10px 0 0' }}>
          The 4% figure is a common rule-of-thumb for a withdrawal rate a portfolio can sustain for ~30 years. Above it = more aggressive.
        </p>
      </div>
    </div>
  );
}
