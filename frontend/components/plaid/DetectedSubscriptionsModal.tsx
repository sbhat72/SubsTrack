'use client';

import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  createSubscription,
  type DetectedSubscription,
  type Subscription,
} from '@/lib/api';

// ── Icons ──────────────────────────────────────────────────────────────────

function IconX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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

// ── Helpers ────────────────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCycleLabel(cycle: string): string {
  if (cycle === 'MONTHLY') return 'month';
  if (cycle === 'YEARLY') return 'year';
  if (cycle === 'WEEKLY') return 'week';
  if (cycle === 'BIWEEKLY') return '2 weeks';
  return cycle.toLowerCase();
}

// ── Component ──────────────────────────────────────────────────────────────

interface DetectedSubscriptionsModalProps {
  loading: boolean;
  detections: DetectedSubscription[];
  error?: string | null;
  onClose: () => void;
  onSubscriptionAdded?: (sub: Subscription) => void;
}

export function DetectedSubscriptionsModal({
  loading,
  detections,
  error,
  onClose,
  onSubscriptionAdded,
}: DetectedSubscriptionsModalProps) {
  const [items, setItems] = useState<DetectedSubscription[]>([]);
  const [addingNames, setAddingNames] = useState<Set<string>>(new Set());
  const [addedNames, setAddedNames] = useState<Set<string>>(new Set());
  const [addErrors, setAddErrors] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!loading) {
      setItems(detections);
    }
  }, [loading, detections]);

  const hadDetections = detections.length > 0;
  const allProcessed = !loading && hadDetections && items.length === 0;

  async function handleAdd(item: DetectedSubscription) {
    setAddingNames((prev) => new Set(prev).add(item.name));
    setAddErrors((prev) => {
      const next = new Map(prev);
      next.delete(item.name);
      return next;
    });

    try {
      const cycle =
        item.billingCycle === 'BIWEEKLY' ? 'MONTHLY' : item.billingCycle;
      const sub = await createSubscription({
        name: item.name,
        amount: item.amount,
        billingCycle: cycle,
        nextBillingDate: item.nextbillingDate,
        isActive: true,
      });
      setAddedNames((prev) => new Set(prev).add(item.name));
      onSubscriptionAdded?.(sub);
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.name !== item.name));
        setAddedNames((prev) => {
          const next = new Set(prev);
          next.delete(item.name);
          return next;
        });
      }, 900);
    } catch (err) {
      setAddErrors((prev) => {
        const next = new Map(prev);
        next.set(item.name, err instanceof Error ? err.message : 'Failed to add. Try again.');
        return next;
      });
    } finally {
      setAddingNames((prev) => {
        const next = new Set(prev);
        next.delete(item.name);
        return next;
      });
    }
  }

  function handleDismiss(name: string) {
    setItems((prev) => prev.filter((item) => item.name !== name));
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-semibold text-foreground text-base">
              Detected Subscriptions
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {loading
                ? 'Scanning your transactions...'
                : error
                ? 'Could not complete scan'
                : allProcessed
                ? 'All done - your subscriptions have been updated'
                : items.length > 0
                ? `${detections.length} recurring charge${detections.length !== 1 ? 's' : ''} found from your transactions`
                : 'No recurring charges detected in your recent transactions'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0 ml-4 mt-0.5"
            aria-label="Close"
          >
            <IconX />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-muted-foreground">
                Scanning your transactions...
              </p>
            </div>
          ) : error ? (
            <div className="py-4">
              <EmptyState
                icon={<IconInbox />}
                title="Could not scan transactions"
                description={error}
              />
            </div>
          ) : items.length === 0 ? (
            <div className="py-4">
              <EmptyState
                icon={<IconInbox />}
                title={allProcessed ? 'All caught up' : 'No subscriptions detected'}
                description={
                  allProcessed
                    ? 'Your new subscriptions have been added to SubsTrack.'
                    : 'We could not find any recurring charges in your recent transactions. Charges may appear after a few billing cycles.'
                }
              />
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const isAdding = addingNames.has(item.name);
                const isAdded = addedNames.has(item.name);
                const addError = addErrors.get(item.name);

                return (
                  <div
                    key={item.name}
                    className="bg-background border border-border rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      {/* Left: subscription info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">
                          {item.name}
                        </p>
                        <p className="text-base font-bold text-foreground tabular-nums mt-0.5">
                          {formatAmount(item.amount)}
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            / {formatCycleLabel(item.billingCycle)}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Next: {formatDate(item.nextbillingDate)}
                        </p>
                        {addError && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {addError}
                          </p>
                        )}
                      </div>

                      {/* Right: action buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                        <button
                          onClick={() => handleDismiss(item.name)}
                          disabled={isAdding || isAdded}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleAdd(item)}
                          disabled={isAdding || isAdded}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all active:scale-[0.97] disabled:cursor-not-allowed ${
                            isAdded
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-accent text-accent-foreground hover:bg-amber-400 disabled:opacity-60'
                          }`}
                        >
                          {isAdding ? (
                            <LoadingSpinner size="sm" />
                          ) : isAdded ? (
                            <IconCheck />
                          ) : (
                            <IconPlus />
                          )}
                          {isAdding ? 'Adding...' : isAdded ? 'Added' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-border flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium rounded-xl bg-accent text-accent-foreground hover:bg-amber-400 active:scale-[0.97] transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
