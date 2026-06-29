import { NumberField, MoneyField, SelectField } from './fields';

const PAYCHECK_OPTIONS = [
  { value: '12', label: 'Monthly (12)' },
  { value: '24', label: 'Semi-monthly (24)' },
  { value: '26', label: 'Bi-weekly (26)' },
  { value: '52', label: 'Weekly (52)' },
];

export default function ProfileSection({ profile, setProfile }) {
  const set = (key) => (val) => setProfile({ ...profile, [key]: val });

  return (
    <section className="section">
      <h2>Your profile</h2>
      <p className="hint">The basics we build everything else on.</p>
      <div className="card">
        <div className="field-grid">
          <MoneyField label="Current salary" sub="annual" value={profile.salary} onChange={set('salary')} />
          <NumberField label="Current age" value={profile.currentAge} onChange={set('currentAge')} min={16} max={100} />
          <NumberField label="Retirement age" value={profile.retirementAge} onChange={set('retirementAge')} min={30} max={100} />
          <SelectField
            label="Paychecks per year"
            value={String(profile.paychecksPerYear)}
            onChange={(v) => set('paychecksPerYear')(Number(v))}
            options={PAYCHECK_OPTIONS}
          />
          <MoneyField label="Monthly withdrawal" sub="in retirement" value={profile.monthlyWithdrawal} onChange={set('monthlyWithdrawal')} />
        </div>
      </div>
    </section>
  );
}
