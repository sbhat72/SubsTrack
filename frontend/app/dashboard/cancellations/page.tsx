'use client';

import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getCancellationDeadlines, type CancellationDeadline } from '@/lib/api';

// ── Icons ──────────────────────────────────────────────────────────────────

function IconCalendarX() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="10" y1="14" x2="14" y2="18" />
      <line x1="14" y1="14" x2="10" y2="18" />
    </svg>
  );
}

function IconAlertTriangle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface BadgeStyle {
  text: string;
  className: string;
}

function getDaysBadge(days: number, passed: boolean): BadgeStyle {
  if (passed) {
    return {
      text: 'Overdue',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
  }
  if (days === 0) {
    return {
      text: 'Today',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
  }
  const label = days === 1 ? '1 day left' : `${days} days left`;
  if (days <= 3) {
    return {
      text: label,
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
  }
  if (days <= 7) {
    return {
      text: label,
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };
  }
  return {
    text: label,
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };
}

function formatCycleLabel(cycle: string): string {
  if (cycle === 'MONTHLY') return 'Monthly';
  if (cycle === 'YEARLY') return 'Yearly';
  if (cycle === 'WEEKLY') return 'Weekly';
  return cycle;
}

// ── Filter types ──────────────────────────────────────────────────────────

type Filter = 'all' | 'urgent' | 'week';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'urgent', label: 'Urgent (3 days)' },
  { key: 'week', label: 'This Week' },
];

function applyFilter(deadlines: CancellationDeadline[], filter: Filter): CancellationDeadline[] {
  if (filter === 'urgent') {
    return deadlines.filter((d) => d.isDeadlinePassed || d.daysUntilDeadline <= 3);
  }
  if (filter === 'week') {
    return deadlines.filter((d) => d.isDeadlinePassed || d.daysUntilDeadline <= 7);
  }
  return deadlines;
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function CancellationsPage() {
  const [deadlines, setDeadlines] = useState<CancellationDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    getCancellationDeadlines()
      .then((data) => {
        const sorted = [...data].sort((a, b) => {
          if (a.isDeadlinePassed && !b.isDeadlinePassed) return -1;
          if (!a.isDeadlinePassed && b.isDeadlinePassed) return 1;
          return a.daysUntilDeadline - b.daysUntilDeadline;
        });
        setDeadlines(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = applyFilter(deadlines, filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cancellations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          The last safe day to cancel each subscription before the next charge.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-muted p-1 rounded-xl w-fit">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 ${
              filter === key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {deadlines.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl">
          <EmptyState
            icon={<IconCalendarX />}
            title="No active subscriptions"
            description="Add subscriptions on the Subscriptions page to see their cancellation deadlines here."
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl">
          <EmptyState
            icon={<IconCalendarX />}
            title="No deadlines in this range"
            description="All your subscriptions have comfortable cancellation windows right now."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const badge = getDaysBadge(d.daysUntilDeadline, d.isDeadlinePassed);
            return (
              <div
                key={d.subscriptionId}
                className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left: name + cycle + amount */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground text-base">{d.subscriptionName}</p>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                        {formatCycleLabel(d.billingCycle)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      ${typeof d.amount === 'number' ? d.amount.toFixed(2) : d.amount} / billing cycle
                    </p>
                  </div>

                  {/* Right: days badge */}
                  <span className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full ${badge.className}`}>
                    {badge.text}
                  </span>
                </div>

                {/* Deadline date - large and prominent */}
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
                    Cancel by
                  </p>
                  <p className="text-xl font-bold text-foreground tabular-nums">
                    {formatDate(d.cancellationDeadline)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Next billing: {formatDate(d.nextBillingDate)}
                  </p>
                </div>

                {/* Overdue warning */}
                {d.isDeadlinePassed && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
                    <IconAlertTriangle />
                    The cancellation deadline has passed. You will be charged on the next billing date.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
