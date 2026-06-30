import { useMemo } from 'react';
import { simulateDrawdownTimeline } from '../lib/calculations';
import { money, percent } from '../lib/format';

function downloadCsv(filename, headers, rows) {
  const esc = (v) => {
    const s = String(v);
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers, ...rows].map((r) => r.map(esc).join(','));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DrawdownTable({ model, monthlyWithdrawal, retirementAge, currentAge, inflationPct }) {
  const { atRetirement, retirementReturnPct } = model;

  const rows = useMemo(
    () =>
      simulateDrawdownTimeline({
        startingBalance: atRetirement.nominalTotal,
        monthlyWithdrawal: Number(monthlyWithdrawal) || 0,
        retirementReturnPct,
        inflationPct: Number(inflationPct) || 0,
        retirementAge: Number(retirementAge) || 0,
        currentAge: Number(currentAge) || 0,
      }),
    [atRetirement.nominalTotal, monthlyWithdrawal, retirementReturnPct, inflationPct, retirementAge, currentAge]
  );

  const csvHeaders = ['Age', 'Start Balance', 'Withdrawn', 'Growth', 'End Balance', "End Balance (Today's $)"];
  const csvRows = rows.map((r) => [
    r.age,
    Math.round(r.startBalance),
    Math.round(r.annualWithdrawal),
    Math.round(r.growthEarned),
    Math.round(r.endBalance),
    Math.round(r.realEndBalance),
  ]);

  const annualWithdrawal = (Number(monthlyWithdrawal) || 0) * 12;

  if (rows.length === 0) {
    return (
      <div className="table-block">
        <div className="table-block-head">
          <div>
            <h2>Post-retirement drawdown</h2>
            <p className="table-hint">No projection available — check your retirement age and balances.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="table-block">
      <div className="table-block-head">
        <div>
          <h2>Post-retirement drawdown</h2>
          <p className="table-hint">
            Starting at age {retirementAge}, withdrawing {money(annualWithdrawal)}/yr
            (inflation-adjusted to hold purchasing power). Blended return:{' '}
            {percent(retirementReturnPct)}.
          </p>
        </div>
        <button className="dl-btn" onClick={() => downloadCsv('drawdown.csv', csvHeaders, csvRows)}>
          Download CSV
        </button>
      </div>

      <div className="card table-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th className="col-left">Age</th>
                <th>Start Balance</th>
                <th>Withdrawn</th>
                <th>Growth</th>
                <th className="col-total">End Balance</th>
                <th className="col-real">Today's&nbsp;$</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.year} className={r.endBalance <= 0 ? 'row-depleted' : ''}>
                  <td className="col-left col-age">{r.age}</td>
                  <td>{money(r.startBalance)}</td>
                  <td className="col-withdrawn">{money(r.annualWithdrawal)}</td>
                  <td className="col-growth">{money(r.growthEarned)}</td>
                  <td className="col-total">{money(r.endBalance)}</td>
                  <td className="col-real">{money(r.realEndBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
