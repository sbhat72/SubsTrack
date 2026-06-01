'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConnectBankButton } from '@/components/plaid/ConnectBankButton';
import {
  getSubscriptions,
  getCancellationDeadlines,
  getUnreadCount,
  getNotifications,
  type CancellationDeadline,
  type Notification,
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

function IconTrendingUp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconCalendarSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconBellSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconBankLarge() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="22" x2="21" y2="22" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 2 7 22 7 12 2" />
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function normalizeToMonthly(amount: number, cycle: string): number {
  if (cycle === 'YEARLY') return amount / 12;
  if (cycle === 'WEEKLY') return amount * 4.33;
  if (cycle === 'BIWEEKLY') return amount * 2.167;
  return amount;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
  });
}

function timeAgo(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function daysBadgeClass(days: number, passed: boolean): string {
  if (passed || days <= 3) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (days <= 7) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
}

function daysBadgeText(days: number, passed: boolean): string {
  if (passed) return 'Overdue';
  if (days === 0) return 'Today';
  return days === 1 ? '1d' : `${days}d`;
}

function notifIconBg(type: Notification['type']): string {
  if (type === 'PRICE_INCREASE') return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
  if (type === 'CANCELLATION_REMINDER') return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-accent/10 text-accent';
}

function NotifIcon({ type }: { type: Notification['type'] }) {
  if (type === 'PRICE_INCREASE') return <IconTrendingUp />;
  if (type === 'CANCELLATION_REMINDER') return <IconCalendarSmall />;
  return <IconBellSmall />;
}

// ── Dashboard ──────────────────────────────────────────────────────────────

interface DashboardData {
  totalSubscriptions: number;
  monthlySpend: number;
  nextCancellation: string | null;
  nextCancellationUrgent: boolean;
  unreadNotifications: number;
  topCancellations: CancellationDeadline[];
  recentNotifications: Notification[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [subsResult, cancellationsResult, unreadResult, notifResult] = await Promise.allSettled([
        getSubscriptions(),
        getCancellationDeadlines(),
        getUnreadCount(),
        getNotifications(),
      ]);

      const subs = subsResult.status === 'fulfilled' ? subsResult.value : [];
      const cancellations = cancellationsResult.status === 'fulfilled' ? cancellationsResult.value : [];
      const unreadData = unreadResult.status === 'fulfilled' ? unreadResult.value : { count: 0 };
      const notifs = notifResult.status === 'fulfilled' ? notifResult.value : [];

      const activeSubs = subs.filter((s) => s.isActive);
      const monthlySpend = activeSubs.reduce(
        (sum, s) => sum + normalizeToMonthly(s.amount, s.billingCycle),
        0,
      );

      const sortedCancellations = [...cancellations].sort((a, b) => {
        if (a.isDeadlinePassed && !b.isDeadlinePassed) return -1;
        if (!a.isDeadlinePassed && b.isDeadlinePassed) return 1;
        return a.daysUntilDeadline - b.daysUntilDeadline;
      });

      const mostUrgent = sortedCancellations[0] ?? null;
      const topCancellations = sortedCancellations.slice(0, 3);
      const recentNotifications = notifs.slice(0, 3);

      setData({
        totalSubscriptions: activeSubs.length,
        monthlySpend,
        nextCancellation: mostUrgent
          ? `${mostUrgent.subscriptionName} - ${
              mostUrgent.daysUntilDeadline === 0
                ? 'today'
                : mostUrgent.daysUntilDeadline === 1
                  ? 'in 1 day'
                  : `in ${mostUrgent.daysUntilDeadline} days`
            }`
          : null,
        nextCancellationUrgent: mostUrgent ? mostUrgent.isDeadlinePassed || mostUrgent.daysUntilDeadline <= 3 : false,
        unreadNotifications: unreadData.count,
        topCancellations,
        recentNotifications,
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
          value={data?.totalSubscriptions ?? 0}
        />
        <StatCard
          icon={<IconWallet />}
          label="Monthly Spend"
          value={`$${(data?.monthlySpend ?? 0).toFixed(2)}`}
        />
        <StatCard
          icon={<IconCalendarAlert />}
          label="Next Cancellation"
          value={data?.nextCancellation ?? 'None upcoming'}
          trend={
            data?.nextCancellationUrgent
              ? { direction: 'up', text: 'Urgent' }
              : undefined
          }
        />
        <StatCard
          icon={<IconBell />}
          label="Unread Alerts"
          value={data?.unreadNotifications ?? 0}
          trend={
            (data?.unreadNotifications ?? 0) > 0
              ? { direction: 'neutral', text: 'New' }
              : undefined
          }
        />
      </div>

      {/* Detail sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming cancellations */}
        <section className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-foreground">Upcoming Cancellations</h2>
            <Link
              href="/dashboard/cancellations"
              className="text-xs text-accent hover:underline font-medium"
            >
              View all
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            Deadlines to cancel before the next charge.
          </p>

          {!data?.topCancellations?.length ? (
            <EmptyState
              icon={<IconClockAlert />}
              title="No urgent deadlines"
              description="All your subscriptions have comfortable cancellation windows."
            />
          ) : (
            <div className="space-y-2">
              {data.topCancellations.map((d) => (
                <div
                  key={d.subscriptionId}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {d.subscriptionName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Cancel by {formatDate(d.cancellationDeadline)}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${daysBadgeClass(d.daysUntilDeadline, d.isDeadlinePassed)}`}
                  >
                    {daysBadgeText(d.daysUntilDeadline, d.isDeadlinePassed)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent notifications */}
        <section className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-foreground">Recent Notifications</h2>
            <Link
              href="/dashboard/notifications"
              className="text-xs text-accent hover:underline font-medium"
            >
              View all
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            Price change alerts and billing reminders.
          </p>

          {!data?.recentNotifications?.length ? (
            <EmptyState
              icon={<IconInbox />}
              title="All caught up"
              description="No recent notifications. We will alert you when a subscription raises its price."
            />
          ) : (
            <div className="space-y-2">
              {data.recentNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 py-2.5 px-3 rounded-xl transition-colors ${
                    !n.isRead ? 'bg-accent/5' : 'hover:bg-muted/50'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center mt-0.5 ${notifIconBg(n.type)}`}
                  >
                    <NotifIcon type={n.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug truncate ${n.isRead ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-accent" />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Bank Connection */}
      <section className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <IconBankLarge />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground">Bank Connection</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Connect your bank to automatically detect subscriptions and track spending in real time.
            </p>
            <ConnectBankButton />
          </div>
        </div>
      </section>
    </div>
  );
}
