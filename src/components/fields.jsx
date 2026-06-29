// Small reusable form primitives.

export function NumberField({ label, sub, value, onChange, min, max, step, suffix }) {
  return (
    <div className="field">
      <label>
        {label} {sub && <span className="sub">{sub}</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step ?? 'any'}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          style={suffix ? { paddingRight: 30 } : undefined}
        />
        {suffix && (
          <span style={{ position: 'absolute', right: 10, top: 9, color: 'var(--ink-faint)', fontFamily: 'var(--mono)', fontSize: 14 }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function MoneyField({ label, sub, value, onChange }) {
  return (
    <div className="field">
      <label>
        {label} {sub && <span className="sub">{sub}</span>}
      </label>
      <div className="input-money">
        <input
          type="number"
          value={value}
          min={0}
          step="any"
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
      </div>
    </div>
  );
}

export function SelectField({ label, sub, value, onChange, options }) {
  return (
    <div className="field">
      <label>
        {label} {sub && <span className="sub">{sub}</span>}
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
