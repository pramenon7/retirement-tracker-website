import { getAccount } from '../lib/accounts';
import { money } from '../lib/format';

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

export default function AccumulationTable({ model }) {
  const { timeline, yearsToRetire } = model;

  // Rows: year 0 (today) through retirement year, inclusive.
  const rows = timeline.slice(0, yearsToRetire + 1);

  // Only show accounts that have a non-zero balance at any point in these rows.
  const allIds = Object.keys(timeline[0]?.byAccount ?? {});
  const activeIds = allIds.filter((id) => rows.some((r) => (r.byAccount[id] ?? 0) > 0));

  const retirementAge = rows[rows.length - 1]?.age ?? '—';

  const csvHeaders = [
    'Age',
    ...activeIds.map((id) => getAccount(id)?.label ?? id),
    'Total (Nominal)',
    "Total (Today's $)",
  ];
  const csvRows = rows.map((r) => [
    r.age,
    ...activeIds.map((id) => Math.round(r.byAccount[id] ?? 0)),
    Math.round(r.nominalTotal),
    Math.round(r.realTotal),
  ]);

  return (
    <div className="table-block">
      <div className="table-block-head">
        <div>
          <h2>Year-by-year accumulation</h2>
          <p className="table-hint">
            Projected balance per account from today through retirement at age {retirementAge}.
          </p>
        </div>
        <button className="dl-btn" onClick={() => downloadCsv('accumulation.csv', csvHeaders, csvRows)}>
          Download CSV
        </button>
      </div>

      <div className="card table-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th className="col-left">Age</th>
                {activeIds.map((id) => (
                  <th key={id}>{getAccount(id)?.label ?? id}</th>
                ))}
                <th className="col-total">Total</th>
                <th className="col-real">Today's&nbsp;$</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.yearOffset}>
                  <td className="col-left col-age">{r.age}</td>
                  {activeIds.map((id) => (
                    <td key={id}>{money(r.byAccount[id] ?? 0)}</td>
                  ))}
                  <td className="col-total">{money(r.nominalTotal)}</td>
                  <td className="col-real">{money(r.realTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
