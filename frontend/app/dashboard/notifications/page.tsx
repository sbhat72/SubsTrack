'use client';

import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  getNotifications,
  markNotificationRead,
  type Notification,
} from '@/lib/api';

// ── Icons ──────────────────────────────────────────────────────────────────

function IconBell() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconBellSmall() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconTrendingUp() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconCalendarAlert() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="12" y1="14" x2="12" y2="17" />
      <circle cx="12" cy="19" r="0.5" fill="currentColor" />
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

function IconCheckAll() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
      <polyline points="15 6 9 17" />
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

function NotificationIcon({ type }: { type: Notification['type'] }) {
  if (type === 'PRICE_INCREASE') return <IconTrendingUp />;
  if (type === 'CANCELLATION_REMINDER') return <IconCalendarAlert />;
  return <IconBellSmall />;
}

function notificationIconBg(type: Notification['type']): string {
  if (type === 'PRICE_INCREASE') return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
  if (type === 'CANCELLATION_REMINDER') return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-accent/10 text-accent';
}

// ── Filter types ──────────────────────────────────────────────────────────

type Filter = 'all' | 'unread';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
];

// ── Page ──────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [markingAll, setMarkingAll] = useState(false);
  const [markingIds, setMarkingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  async function handleMarkRead(id: number) {
    setMarkingIds((prev) => new Set(prev).add(id));
    try {
      const updated = await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n)),
      );
    } finally {
      setMarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleMarkAllRead() {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;
    setMarkingAll(true);
    try {
      await Promise.all(unread.map((n) => markNotificationRead(n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filtered =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-2xl">
        <EmptyState
          icon={<IconInbox />}
          title="Could not load notifications"
          description="Make sure the backend server is running and try refreshing the page."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Price change alerts and billing reminders.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-60"
          >
            <IconCheckAll />
            {markingAll ? 'Marking...' : 'Mark all read'}
          </button>
        )}
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
            {key === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 text-xs font-semibold text-accent">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {notifications.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl">
          <EmptyState
            icon={<IconInbox />}
            title="All caught up"
            description="You have no notifications. We will alert you when a subscription raises its price or a deadline approaches."
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl">
          <EmptyState
            icon={<IconInbox />}
            title="No unread notifications"
            description="All your notifications have been read."
          />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleMarkRead(n.id)}
              className={`relative bg-card border rounded-2xl px-5 py-4 transition-all duration-200 ${
                !n.isRead
                  ? 'border-accent/40 cursor-pointer hover:shadow-md hover:border-accent/60'
                  : 'border-border'
              }`}
            >
              {/* Unread amber left border accent */}
              {!n.isRead && (
                <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-accent rounded-full" />
              )}

              <div className="flex items-start gap-3">
                {/* Type icon */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${notificationIconBg(n.type)}`}
                >
                  <NotificationIcon type={n.type} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-relaxed ${n.isRead ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                    {n.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                    {n.subscriptionName && (
                      <>
                        <span className="text-xs text-muted-foreground">&middot;</span>
                        <span className="text-xs text-accent font-medium">{n.subscriptionName}</span>
                      </>
                    )}
                    {!n.isRead && (
                      <>
                        <span className="text-xs text-muted-foreground">&middot;</span>
                        <span className="text-xs text-muted-foreground italic">
                          {markingIds.has(n.id) ? 'Marking read...' : 'Click to mark read'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
