import { useMemo, useState } from 'react';
import { ALL_ACCOUNTS } from './lib/accounts';
import { runModel } from './lib/calculations';
import ProfileSection from './components/ProfileSection';
import AccountsSection from './components/AccountsSection';
import AssumptionsSection from './components/AssumptionsSection';
import ResultsPanel from './components/ResultsPanel';
import MethodologyPanel from './components/MethodologyPanel';
import AccumulationTable from './components/AccumulationTable';
import DrawdownTable from './components/DrawdownTable';

function initAccountState() {
  const s = {};
  ALL_ACCOUNTS.forEach((a) => {
    s[a.id] = {
      balance: 0,
      growthPct: a.defaultGrowth,
      contribution: {
        mode: a.contributionType === 'percent' ? 'percent' : 'dollar',
        value: 0,
      },
    };
  });
  s.traditional401k.balance = 45000;
  s.traditional401k.contribution = { mode: 'percent', value: 6 };
  s.rothIra.balance = 12000;
  s.rothIra.contribution = { mode: 'dollar', value: 250 };
  s.brokerage.balance = 8000;
  s.emergency.balance = 15000;
  return s;
}

export default function App() {
  const [profile, setProfile] = useState({
    salary: 85000,
    currentAge: 30,
    retirementAge: 65,
    paychecksPerYear: 26,
    monthlyWithdrawal: 7000,
  });

  const [assumptions, setAssumptions] = useState({
    useGlobalGrowth: false,
    globalGrowthPct: 7,
    inflationPct: 2.5,
    salaryGrowthPct: 2,
    hsaCoverage: 'selfOnly',
  });

  const [mode, setMode] = useState('detailed');
  const [accountState, setAccountState] = useState(initAccountState);
  const [simple, setSimple] = useState({ netWorth: 80000, perPaycheck: 400, growthPct: 7 });
  const [tab, setTab] = useState('results');

  const accounts = useMemo(() => {
    const g = assumptions.useGlobalGrowth ? assumptions.globalGrowthPct : null;
    if (mode === 'simple') {
      return [
        {
          id: 'brokerage',
          balance: simple.netWorth,
          growthPct: g ?? simple.growthPct,
          contribution: { mode: 'dollar', value: simple.perPaycheck },
        },
      ];
    }
    return ALL_ACCOUNTS.map((a) => {
      const s = accountState[a.id];
      return {
        id: a.id,
        balance: s.balance,
        growthPct: g ?? s.growthPct,
        contribution: a.contributionType === 'none' ? { mode: 'none', value: 0 } : s.contribution,
      };
    });
  }, [mode, accountState, simple, assumptions]);

  const model = useMemo(
    () =>
      runModel({
        currentAge: Number(profile.currentAge) || 0,
        retirementAge: Number(profile.retirementAge) || 0,
        salary: Number(profile.salary) || 0,
        paychecksPerYear: Number(profile.paychecksPerYear) || 1,
        salaryGrowthPct: Number(assumptions.salaryGrowthPct) || 0,
        inflationPct: Number(assumptions.inflationPct) || 0,
        monthlyWithdrawal: Number(profile.monthlyWithdrawal) || 0,
        accounts,
      }),
    [profile, assumptions, accounts]
  );

  return (
    <div className="app">
      <header className="masthead">
        <p className="eyebrow">Nest Egg</p>
        <h1>See your whole retirement, account by account.</h1>
        <p>
          Most calculators ask for one net-worth number and one contribution. This one goes deeper —
          set a balance, a per-paycheck contribution, and a growth assumption for every account, and
          watch them compound toward the day you stop working.
        </p>
      </header>

      <div className="layout">
        <div className="inputs-col">
          <ProfileSection profile={profile} setProfile={setProfile} />
          <AssumptionsSection assumptions={assumptions} setAssumptions={setAssumptions} />
          <AccountsSection
            mode={mode}
            setMode={setMode}
            accountState={accountState}
            setAccountState={setAccountState}
            simple={simple}
            setSimple={setSimple}
            profile={profile}
            assumptions={assumptions}
          />
        </div>

        <div className="results-col">
          <div className="tabs" role="tablist">
            <button role="tab" aria-pressed={tab === 'results'} onClick={() => setTab('results')}>Results</button>
            <button role="tab" aria-pressed={tab === 'method'} onClick={() => setTab('method')}>Methodology</button>
          </div>
          {tab === 'results' ? <ResultsPanel model={model} profile={profile} /> : <MethodologyPanel />}
        </div>
      </div>

      <section className="tables-section">
        <AccumulationTable model={model} />
        <DrawdownTable
          model={model}
          monthlyWithdrawal={profile.monthlyWithdrawal}
          retirementAge={profile.retirementAge}
          currentAge={profile.currentAge}
          inflationPct={assumptions.inflationPct}
        />
      </section>

      <footer className="foot">
        Educational planning tool — not financial advice. All calculations run in your browser; nothing is stored or sent anywhere.
      </footer>
    </div>
  );
}
