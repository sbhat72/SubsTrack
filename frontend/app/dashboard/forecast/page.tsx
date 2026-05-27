'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getForecast, type ForecastResponse, type ForecastLineItem } from '@/lib/api';

// ── Icons ──────────────────────────────────────────────────────────────────

function IconTrendingUp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconBarChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconEmptyForecast() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
  });
}

function formatCycleLabel(cycle: string): string {
  if (cycle === 'MONTHLY') return 'mo';
  if (cycle === 'YEARLY') return 'yr';
  if (cycle === 'WEEKLY') return 'wk';
  return cycle.toLowerCase();
}

// Group weekly line items by subscription to avoid duplicate rows
interface GroupedLineItem {
  subscriptionId: number;
  subscriptionName: string;
  amount: number;
  count: number;
  total: number;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'WEEKLY';
}

function groupLineItems(items: ForecastLineItem[]): GroupedLineItem[] {
  const map = new Map<number, GroupedLineItem>();
  for (const item of items) {
    const existing = map.get(item.subscriptionId);
    if (existing) {
      existing.count += 1;
      existing.total = parseFloat((existing.total + item.amount).toFixed(2));
    } else {
      map.set(item.subscriptionId, {
        subscriptionId: item.subscriptionId,
        subscriptionName: item.subscriptionName,
        amount: item.amount,
        count: 1,
        total: item.amount,
        billingCycle: item.billingCycle,
      });
    }
  }
  return Array.from(map.values());
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function ForecastPage() {
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());

  useEffect(() => {
    getForecast()
      .then(setForecast)
      .finally(() => setLoading(false));
  }, []);

  function toggleMonth(monthNumber: number) {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthNumber)) {
        next.delete(monthNumber);
      } else {
        next.add(monthNumber);
      }
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="bg-card border border-border rounded-2xl">
        <EmptyState
          icon={<IconEmptyForecast />}
          title="Forecast unavailable"
          description="We could not load your spending forecast. Please try again later."
        />
      </div>
    );
  }

  const hasSubscriptions = forecast.entries.some((e) => e.subscriptions.length > 0);
  const maxMonthTotal = Math.max(...forecast.entries.map((e) => e.totalAmount), 0.01);
  const mostExpensiveEntry = forecast.entries.reduce(
    (best, e) => (e.totalAmount > best.totalAmount ? e : best),
    forecast.entries[0],
  );

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Forecast</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Projected subscription spending for the next 12 months.
        </p>
      </div>

      {!hasSubscriptions ? (
        <div className="bg-card border border-border rounded-2xl">
          <EmptyState
            icon={<IconEmptyForecast />}
            title="No active subscriptions"
            description="Add subscriptions on the Subscriptions page to see your 12-month spending forecast."
          />
        </div>
      ) : (
        <>
          {/* Summary stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={<IconTrendingUp />}
              label="Total 12-Month Spend"
              value={formatAmount(forecast.totalTwelveMonths)}
            />
            <StatCard
              icon={<IconBarChart />}
              label="Average Monthly"
              value={formatAmount(forecast.averageMonthly)}
            />
            <StatCard
              icon={<IconCalendar />}
              label="Most Expensive Month"
              value={
                mostExpensiveEntry
                  ? `${mostExpensiveEntry.month.split(' ')[0]} (${formatAmount(mostExpensiveEntry.totalAmount)})`
                  : 'None'
              }
            />
          </div>

          {/* Month-by-month breakdown */}
          <div className="space-y-3">
            {forecast.entries.map((entry) => {
              const barWidth =
                entry.totalAmount > 0
                  ? Math.round((entry.totalAmount / maxMonthTotal) * 100)
                  : 0;
              const isExpanded = expandedMonths.has(entry.monthNumber);
              const grouped = groupLineItems(entry.subscriptions);

              return (
                <div
                  key={`${entry.year}-${entry.monthNumber}`}
                  className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
                >
                  {/* Month row - clickable if it has items */}
                  <button
                    onClick={() => grouped.length > 0 && toggleMonth(entry.monthNumber)}
                    className={`w-full px-5 py-4 flex items-center gap-4 text-left transition-colors duration-150 ${
                      grouped.length > 0 ? 'hover:bg-muted/50 cursor-pointer' : 'cursor-default'
                    }`}
                    aria-expanded={isExpanded}
                    disabled={grouped.length === 0}
                  >
                    {/* Month name */}
                    <div className="w-28 flex-shrink-0">
                      <p className="text-sm font-semibold text-foreground">{entry.month}</p>
                    </div>

                    {/* Progress bar */}
                    <div className="flex-1 min-w-0">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>

                    {/* Total + chevron */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-foreground tabular-nums w-20 text-right">
                        {formatAmount(entry.totalAmount)}
                      </span>
                      {grouped.length > 0 && (
                        <span
                          className={`text-muted-foreground transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        >
                          <IconChevronDown />
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Expanded subscription list */}
                  {isExpanded && grouped.length > 0 && (
                    <div className="border-t border-border px-5 py-3 space-y-2">
                      {grouped.map((g) => (
                        <div
                          key={g.subscriptionId}
                          className="flex items-center justify-between gap-4 py-1.5"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-sm text-foreground font-medium truncate">
                              {g.subscriptionName}
                            </p>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatCycleLabel(g.billingCycle)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground tabular-nums flex-shrink-0">
                            {g.count > 1 ? (
                              <span className="text-muted-foreground text-xs mr-1">
                                {formatAmount(g.amount)} x {g.count} =
                              </span>
                            ) : null}
                            <span className="font-medium">{formatAmount(g.total)}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
