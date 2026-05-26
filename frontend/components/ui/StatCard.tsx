import type { ReactNode } from 'react';

interface TrendIndicator {
  direction: 'up' | 'down' | 'neutral';
  text: string;
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: TrendIndicator;
}

export function StatCard({ icon, label, value, trend }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-xl bg-accent/10 text-accent group-hover:bg-accent/15 transition-colors duration-200">
          {icon}
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              trend.direction === 'up'
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : trend.direction === 'down'
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '—'}{' '}
            {trend.text}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{value}</p>
      </div>
    </div>
  );
}
