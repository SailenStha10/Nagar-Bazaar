const colorMap = {
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent-light text-accent-dark',
  local: 'bg-local-light text-local',
};

export default function DashboardStatCard({ title, value, icon: Icon, trend, color = 'primary' }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-5">
      <div className="flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color] || colorMap.primary}`}>
          {Icon && <Icon size={18} />}
        </span>
        {trend !== undefined && trend !== null && (
          <span className={`text-xs font-semibold ${trend >= 0 ? 'text-local' : 'text-accent-dark'}`}>
            {trend >= 0 ? '+' : ''}
            {trend}%
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink-muted">{title}</p>
    </div>
  );
}
