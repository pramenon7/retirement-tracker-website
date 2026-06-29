import { CATEGORIES } from '../lib/accounts';
import { electiveDeferralLimit, iraLimit, hsaLimit, TAX_YEAR } from '../config/irsLimits';
import { NumberField, MoneyField } from './fields';
import { money } from '../lib/format';

// Annualize one account's contribution given mode/value.
function annualOf(contribution, salary, paychecks) {
  if (!contribution) return 0;
  const v = Number(contribution.value) || 0;
  if (contribution.mode === 'percent') return (salary || 0) * v / 100;
  if (contribution.mode === 'dollar') return v * (paychecks || 0);
  return 0;
}

// Build a map of limitKey -> { total, limit, accountIds } for over-limit groups.
export function computeWarnings(accountState, salary, paychecks, age, hsaCoverage) {
  const groups = {
    electiveDeferral: { ids: ['traditional401k', 'roth401k', 'traditional403b'], limit: electiveDeferralLimit(age), label: '401(k) + 403(b) combined' },
    ira: { ids: ['traditionalIra', 'rothIra'], limit: iraLimit(age), label: 'Traditional + Roth IRA combined' },
    hsa: { ids: ['hsa'], limit: hsaLimit(hsaCoverage, age), label: 'HSA' },
    gov457b: { ids: ['gov457b'], limit: electiveDeferralLimit(age), label: '457(b)' },
  };
  const warnings = {};
  for (const key in groups) {
    const g = groups[key];
    const total = g.ids.reduce((sum, id) => sum + annualOf(accountState[id]?.contribution, salary, paychecks), 0);
    if (total > g.limit) {
      warnings[key] = { total, limit: g.limit, label: g.label, ids: g.ids };
    }
  }
  return warnings;
}

function WarnIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function AccountRow({ acct, state, onChange, useGlobalGrowth, warning }) {
  const s = state || { balance: 0, growthPct: acct.defaultGrowth, contribution: { mode: acct.contributionType === 'percent' ? 'percent' : 'dollar', value: 0 } };
  const setField = (patch) => onChange({ ...s, ...patch });
  const setContribution = (patch) => onChange({ ...s, contribution: { ...s.contribution, ...patch } });
  const hasContrib = acct.contributionType !== 'none';

  return (
    <>
      <div className="acct-row">
        <div className="acct-name">{acct.label}</div>

        <div>
          <div className="mini-label">Balance</div>
          <div className="input-money">
            <input type="number" min={0} step="any" value={s.balance}
              onChange={(e) => setField({ balance: e.target.value === '' ? '' : Number(e.target.value) })} />
          </div>
        </div>

        {hasContrib ? (
          <div>
            <div className="mini-label">Per paycheck</div>
            <div className="contrib-cell">
              <div className="mode" role="group" aria-label="Contribution type">
                <button aria-pressed={s.contribution.mode === 'dollar'} title="Dollars per paycheck"
                  onClick={() => setContribution({ mode: 'dollar' })}>$</button>
                <button aria-pressed={s.contribution.mode === 'percent'} title="Percent of salary"
                  onClick={() => setContribution({ mode: 'percent' })}>%</button>
              </div>
              <input type="number" min={0} step="any" value={s.contribution.value}
                onChange={(e) => setContribution({ value: e.target.value === '' ? '' : Number(e.target.value) })} />
            </div>
          </div>
        ) : (
          <div style={{ alignSelf: 'center', color: 'var(--ink-faint)', fontSize: 12 }}>balance only</div>
        )}

        <div>
          <div className="mini-label">Growth</div>
          <div style={{ position: 'relative' }}>
            <input type="number" min={0} max={12} step={0.5}
              value={s.growthPct}
              disabled={useGlobalGrowth}
              style={{ opacity: useGlobalGrowth ? 0.5 : 1, paddingRight: 24 }}
              onChange={(e) => setField({ growthPct: e.target.value === '' ? '' : Number(e.target.value) })} />
            <span style={{ position: 'absolute', right: 9, top: 9, color: 'var(--ink-faint)', fontFamily: 'var(--mono)', fontSize: 13 }}>%</span>
          </div>
        </div>

        {warning && (
          <div className="warn-chip">
            <WarnIcon />
            <span>
              {warning.label}: {money(warning.total)}/yr exceeds the {TAX_YEAR} limit of {money(warning.limit)}.
            </span>
          </div>
        )}
      </div>
    </>
  );
}

export default function AccountsSection({
  mode, setMode, accountState, setAccountState,
  simple, setSimple, profile, assumptions,
}) {
  const warnings =
    mode === 'detailed'
      ? computeWarnings(accountState, profile.salary, profile.paychecksPerYear, profile.currentAge, assumptions.hsaCoverage)
      : {};
  // Map account id -> warning (show the chip on the first account of each over-limit group).
  const firstOfGroup = {};
  Object.values(warnings).forEach((w) => { firstOfGroup[w.ids[0]] = w; });

  const updateAccount = (id) => (val) => setAccountState({ ...accountState, [id]: val });

  return (
    <section className="section">
      <div className="toggle-row" style={{ marginBottom: 4 }}>
        <h2 style={{ margin: 0 }}>Accounts &amp; contributions</h2>
        <div className="seg">
          <button aria-pressed={mode === 'detailed'} onClick={() => setMode('detailed')}>Detailed</button>
          <button aria-pressed={mode === 'simple'} onClick={() => setMode('simple')}>Simple</button>
        </div>
      </div>
      <p className="hint">
        {mode === 'detailed'
          ? 'Enter a balance, per-paycheck contribution, and growth rate for each account. This account-by-account detail is the whole point.'
          : 'One total net-worth number and a single contribution — quick, but loses the per-account detail.'}
      </p>

      {mode === 'simple' ? (
        <div className="card">
          <div className="field-grid">
            <MoneyField label="Total net worth" value={simple.netWorth} onChange={(v) => setSimple({ ...simple, netWorth: v })} />
            <MoneyField label="Contribution" sub="$ per paycheck" value={simple.perPaycheck} onChange={(v) => setSimple({ ...simple, perPaycheck: v })} />
            {!assumptions.useGlobalGrowth && (
              <NumberField label="Growth rate" value={simple.growthPct} onChange={(v) => setSimple({ ...simple, growthPct: v })} min={1} max={12} step={0.5} suffix="%" />
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          {CATEGORIES.map((cat) => (
            <div className="cat-group" key={cat.id}>
              <div className="cat-head">
                <h3>{cat.label}</h3>
                <span className="blurb">{cat.blurb}</span>
              </div>
              {cat.accounts.map((acct) => (
                <AccountRow
                  key={acct.id}
                  acct={acct}
                  state={accountState[acct.id]}
                  onChange={updateAccount(acct.id)}
                  useGlobalGrowth={assumptions.useGlobalGrowth}
                  warning={firstOfGroup[acct.id]}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
