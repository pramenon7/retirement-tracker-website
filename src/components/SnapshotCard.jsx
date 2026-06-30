import { money } from '../lib/format';

export default function SnapshotCard({ netWorth, monthlyContribs, annualContribs }) {
  return (
    <div className="snapshot-card">
      <div className="snapshot-item snapshot-nw">
        <div className="snapshot-label">Current net worth</div>
        <div className="snapshot-value">{money(netWorth)}</div>
      </div>
      <div className="snapshot-divider" />
      <div className="snapshot-item">
        <div className="snapshot-label">Monthly contributions</div>
        <div className="snapshot-value snapshot-value--secondary">{money(monthlyContribs)}</div>
      </div>
      <div className="snapshot-divider" />
      <div className="snapshot-item">
        <div className="snapshot-label">Annual contributions</div>
        <div className="snapshot-value snapshot-value--secondary">{money(annualContribs)}</div>
      </div>
    </div>
  );
}
