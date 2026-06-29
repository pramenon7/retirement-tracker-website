import { NumberField, SelectField } from './fields';

export default function AssumptionsSection({ assumptions, setAssumptions }) {
  const set = (key) => (val) => setAssumptions({ ...assumptions, [key]: val });

  return (
    <section className="section">
      <h2>Assumptions</h2>
      <p className="hint">Defaults are reasonable long-run estimates — adjust to your own outlook.</p>
      <div className="card">
        <div className="toggle-row" style={{ marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Growth rate</div>
            <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
              Use one rate for every account, or set them per account below.
            </div>
          </div>
          <div className="seg">
            <button aria-pressed={assumptions.useGlobalGrowth} onClick={() => set('useGlobalGrowth')(true)}>
              One rate
            </button>
            <button aria-pressed={!assumptions.useGlobalGrowth} onClick={() => set('useGlobalGrowth')(false)}>
              Per account
            </button>
          </div>
        </div>

        <div className="field-grid">
          {assumptions.useGlobalGrowth && (
            <NumberField
              label="Global growth rate"
              value={assumptions.globalGrowthPct}
              onChange={set('globalGrowthPct')}
              min={1} max={12} step={0.5} suffix="%"
            />
          )}
          <NumberField label="Inflation rate" value={assumptions.inflationPct} onChange={set('inflationPct')} min={0} max={8} step={0.1} suffix="%" />
          <NumberField label="Salary growth" sub="per year" value={assumptions.salaryGrowthPct} onChange={set('salaryGrowthPct')} min={0} max={8} step={0.1} suffix="%" />
          <SelectField
            label="HSA coverage"
            sub="sets the HSA limit"
            value={assumptions.hsaCoverage}
            onChange={set('hsaCoverage')}
            options={[
              { value: 'selfOnly', label: 'Self-only' },
              { value: 'family', label: 'Family' },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
