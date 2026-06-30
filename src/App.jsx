import { useMemo, useState, useCallback } from 'react';
import { ALL_ACCOUNTS } from './lib/accounts';
import { runModel } from './lib/calculations';
import { loadSavedState, buildShareUrl } from './lib/urlState';
import ProfileSection from './components/ProfileSection';
import AccountsSection from './components/AccountsSection';
import AssumptionsSection from './components/AssumptionsSection';
import ResultsPanel from './components/ResultsPanel';
import MethodologyPanel from './components/MethodologyPanel';
import AccumulationTable from './components/AccumulationTable';
import DrawdownTable from './components/DrawdownTable';
import SnapshotCard from './components/SnapshotCard';

// These accounts keep their individual growth rates even when "One rate" is on.
const CASH_IDS = new Set(['emergency', 'hysa']);

const _saved = loadSavedState();

const DEFAULT_PROFILE = {
  salary: 85000,
  currentAge: 30,
  retirementAge: 65,
  paychecksPerYear: 26,
  monthlyWithdrawal: 7000,
};

const DEFAULT_ASSUMPTIONS = {
  useGlobalGrowth: false,
  globalGrowthPct: 7,
  inflationPct: 2.5,
  salaryGrowthPct: 2,
  hsaCoverage: 'selfOnly',
};

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

function ContactPanel() {
  return (
    <div className="contact-panel">
      <h3>Get in touch</h3>
      <p>Have a question, found a bug, or want to suggest a feature? Send an email and I'll get back to you.</p>
      <a className="contact-link" href="mailto:pranavmenonaz@gmail.com">
        pranavmenonaz@gmail.com
      </a>
    </div>
  );
}

export default function App() {
  const [profile, setProfile] = useState(() => _saved?.profile ?? DEFAULT_PROFILE);
  const [assumptions, setAssumptions] = useState(() => _saved?.assumptions ?? DEFAULT_ASSUMPTIONS);
  const [mode, setMode] = useState(() => _saved?.mode ?? 'detailed');
  const [accountState, setAccountState] = useState(() => _saved?.accountState ?? initAccountState());
  const [simple, setSimple] = useState(() => _saved?.simple ?? { netWorth: 80000, perPaycheck: 400, growthPct: 7 });
  const [tab, setTab] = useState('results');
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(() => {
    const url = buildShareUrl({ profile, assumptions, accountState, mode, simple });
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [profile, assumptions, accountState, mode, simple]);

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
      const useGlobal = g !== null && !CASH_IDS.has(a.id);
      return {
        id: a.id,
        balance: s.balance,
        growthPct: useGlobal ? g : s.growthPct,
        contribution: a.contributionType === 'none' ? { mode: 'none', value: 0 } : s.contribution,
      };
    });
  }, [mode, accountState, simple, assumptions]);

  const snapshot = useMemo(() => {
    const salary = Number(profile.salary) || 0;
    const paychecks = Number(profile.paychecksPerYear) || 1;
    const netWorth = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
    const annualContribs = accounts.reduce((sum, a) => {
      const c = a.contribution;
      if (!c || c.mode === 'none') return sum;
      const v = Number(c.value) || 0;
      if (c.mode === 'percent') return sum + salary * v / 100;
      return sum + v * paychecks;
    }, 0);
    return { netWorth, annualContribs, monthlyContribs: annualContribs / 12 };
  }, [accounts, profile.salary, profile.paychecksPerYear]);

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
        <div className="masthead-top">
          <p className="eyebrow">Nest Egg</p>
          <button className="share-btn" onClick={handleShare}>
            {copied ? '✓ Copied!' : 'Copy link'}
          </button>
        </div>
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
          <SnapshotCard
            netWorth={snapshot.netWorth}
            monthlyContribs={snapshot.monthlyContribs}
            annualContribs={snapshot.annualContribs}
          />
          <div className="tabs" role="tablist">
            <button role="tab" aria-pressed={tab === 'results'} onClick={() => setTab('results')}>Results</button>
            <button role="tab" aria-pressed={tab === 'method'} onClick={() => setTab('method')}>Methodology</button>
            <button role="tab" aria-pressed={tab === 'contact'} onClick={() => setTab('contact')}>Contact</button>
          </div>
          {tab === 'results' && <ResultsPanel model={model} profile={profile} />}
          {tab === 'method' && <MethodologyPanel />}
          {tab === 'contact' && <ContactPanel />}
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
