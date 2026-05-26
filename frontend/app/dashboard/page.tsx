'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  getSubscriptions,
  getCancellationDeadlines,
  getUnreadCount,
  type CancellationDeadline,
} from '@/lib/api';

// ── Icons ──────────────────────────────────────────────────────────────────

function IconLayers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function IconWallet() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      <path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z" />
      <circle cx="17" cy="13" r="1" fill="currentColor" />
    </svg>
  );
}

function IconCalendarAlert() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="12" y1="14" x2="12" y2="17" />
      <circle cx="12" cy="19" r="0.5" fill="currentColor" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconClockAlert() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
      <line x1="12" y1="17" x2="12" y2="19" strokeWidth="2" />
    </svg>
  );
}

function IconInbox() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────

interface DashboardStats {
  totalSubscriptions: number;
  monthlySpend: number;
  nextCancellation: string | null;
  nextCancellationUrgent: boolean;
  unreadNotifications: number;
}

function normalizeToMonthly(amount: number, cycle: string): number {
  if (cycle === 'YEARLY') return amount / 12;
  if (cycle === 'WEEKLY') return amount * 4.33;
  return amount;
}

function formatCancellationLabel(deadline: CancellationDeadline): string {
  const d = deadline.daysRemaining;
  const suffix = d === 0 ? 'today' : d === 1 ? 'in 1 day' : `in ${d} days`;
  return `${deadline.subscriptionName} — ${suffix}`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [subsResult, cancellationsResult, unreadResult] = await Promise.allSettled([
        getSubscriptions(),
        getCancellationDeadlines(),
        getUnreadCount(),
      ]);

      const subs = subsResult.status === 'fulfilled' ? subsResult.value : [];
      const cancellations = cancellationsResult.status === 'fulfilled' ? cancellationsResult.value : [];
      const unread = unreadResult.status === 'fulfilled' ? unreadResult.value : 0;

      const activeSubs = subs.filter((s) => s.active);
      const monthlySpend = activeSubs.reduce(
        (sum, s) => sum + normalizeToMonthly(s.amount, s.billingCycle),
        0,
      );

      const sorted = [...cancellations].sort((a, b) => a.daysRemaining - b.daysRemaining);
      const mostUrgent = sorted[0] ?? null;

      setStats({
        totalSubscriptions: activeSubs.length,
        monthlySpend,
        nextCancellation: mostUrgent ? formatCancellationLabel(mostUrgent) : null,
        nextCancellationUrgent: mostUrgent ? mostUrgent.daysRemaining <= 3 : false,
        unreadNotifications: unread,
      });
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your subscription overview at a glance.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<IconLayers />}
          label="Active Subscriptions"
          value={stats?.totalSubscriptions ?? 0}
        />
        <StatCard
          icon={<IconWallet />}
          label="Monthly Spend"
          value={`$${(stats?.monthlySpend ?? 0).toFixed(2)}`}
        />
        <StatCard
          icon={<IconCalendarAlert />}
          label="Next Cancellation"
          value={stats?.nextCancellation ?? 'None upcoming'}
          trend={
            stats?.nextCancellationUrgent
              ? { direction: 'up', text: 'Urgent' }
              : undefined
          }
        />
        <StatCard
          icon={<IconBell />}
          label="Unread Alerts"
          value={stats?.unreadNotifications ?? 0}
          trend={
            (stats?.unreadNotifications ?? 0) > 0
              ? { direction: 'neutral', text: 'New' }
              : undefined
          }
        />
      </div>

      {/* Detail sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming cancellations */}
        <section className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-semibold text-foreground mb-1">Upcoming Cancellations</h2>
          <p className="text-xs text-muted-foreground mb-5">
            Deadlines to cancel before the next charge.
          </p>
          <EmptyState
            icon={<IconClockAlert />}
            title="No urgent deadlines"
            description="All your subscriptions have comfortable cancellation windows. Check back here as billing dates approach."
          />
        </section>

        {/* Recent notifications */}
        <section className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-semibold text-foreground mb-1">Recent Notifications</h2>
          <p className="text-xs text-muted-foreground mb-5">
            Price change alerts and billing reminders.
          </p>
          <EmptyState
            icon={<IconInbox />}
            title="All caught up"
            description="You have no recent notifications. We'll alert you when a subscription raises its price or a deadline approaches."
          />
        </section>
      </div>
    </div>
  );
}
