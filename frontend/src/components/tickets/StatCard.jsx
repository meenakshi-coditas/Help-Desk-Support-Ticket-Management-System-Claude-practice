export default function StatCard({ label, value, icon: Icon, tone = 'neutral', to, testId }) {
  return (
    <div className={`stat-card tone-${tone}`} data-testid={testId}>
      <span className="stat-icon"><Icon size={20} /></span>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
