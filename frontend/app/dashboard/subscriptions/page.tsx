'use client';

import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  type Subscription,
  type SubscriptionRequest,
} from '@/lib/api';
import { ConnectBankButton } from '@/components/plaid/ConnectBankButton';

// ── Icons ──────────────────────────────────────────────────────────────────

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconCreditCard() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function normalizeToMonthly(amount: number, cycle: string): number {
  if (cycle === 'YEARLY') return amount / 12;
  if (cycle === 'WEEKLY') return amount * 4.33;
  return amount;
}

function formatCycleLabel(cycle: string): string {
  if (cycle === 'MONTHLY') return 'month';
  if (cycle === 'YEARLY') return 'year';
  if (cycle === 'WEEKLY') return 'week';
  return cycle.toLowerCase();
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ── Form ──────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  amount: string;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'WEEKLY';
  nextBillingDate: string;
  category: string;
  description: string;
  isActive: boolean;
}

const defaultForm: FormState = {
  name: '',
  amount: '',
  billingCycle: 'MONTHLY',
  nextBillingDate: '',
  category: '',
  description: '',
  isActive: true,
};

function subscriptionToForm(s: Subscription): FormState {
  return {
    name: s.name,
    amount: String(s.amount),
    billingCycle: s.billingCycle,
    nextBillingDate: s.nextBillingDate,
    category: s.category ?? '',
    description: s.description ?? '',
    isActive: s.isActive,
  };
}

// ── Modal ──────────────────────────────────────────────────────────────────

interface ModalProps {
  editing: Subscription | null;
  onClose: () => void;
  onSave: (data: SubscriptionRequest) => Promise<void>;
}

function SubscriptionModal({ editing, onClose, onSave }: ModalProps) {
  const [form, setForm] = useState<FormState>(
    editing ? subscriptionToForm(editing) : defaultForm,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(key: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amountNum = parseFloat(form.amount);
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (isNaN(amountNum) || amountNum <= 0) { setError('Amount must be greater than 0.'); return; }
    if (!form.nextBillingDate) { setError('Next billing date is required.'); return; }

    const data: SubscriptionRequest = {
      name: form.name.trim(),
      amount: amountNum,
      billingCycle: form.billingCycle,
      nextBillingDate: form.nextBillingDate,
      category: form.category.trim() || undefined,
      description: form.description.trim() || undefined,
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      await onSave(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setSaving(false);
    }
  }

  const inputClass =
    'w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-shadow';
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1.5';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-semibold text-foreground text-base">
            {editing ? 'Edit Subscription' : 'Add Subscription'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <IconX />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="sub-name" className={labelClass}>
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="sub-name"
              type="text"
              className={inputClass}
              placeholder="Netflix, Spotify, iCloud..."
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sub-amount" className={labelClass}>
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                id="sub-amount"
                type="number"
                step="0.01"
                min="0.01"
                className={inputClass}
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setField('amount', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="sub-cycle" className={labelClass}>
                Billing Cycle <span className="text-red-500">*</span>
              </label>
              <select
                id="sub-cycle"
                className={inputClass}
                value={form.billingCycle}
                onChange={(e) =>
                  setField('billingCycle', e.target.value as 'MONTHLY' | 'YEARLY' | 'WEEKLY')
                }
              >
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="sub-date" className={labelClass}>
              Next Billing Date <span className="text-red-500">*</span>
            </label>
            <input
              id="sub-date"
              type="date"
              className={inputClass}
              value={form.nextBillingDate}
              onChange={(e) => setField('nextBillingDate', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="sub-category" className={labelClass}>
              Category
            </label>
            <input
              id="sub-category"
              type="text"
              className={inputClass}
              placeholder="Entertainment, Productivity, Storage..."
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="sub-desc" className={labelClass}>
              Description
            </label>
            <textarea
              id="sub-desc"
              className={`${inputClass} resize-none`}
              rows={2}
              placeholder="Optional notes about this subscription..."
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.isActive}
              onClick={() => setField('isActive', !form.isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                form.isActive ? 'bg-accent' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  form.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-foreground font-medium">Active subscription</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-accent text-accent-foreground hover:bg-amber-400 active:scale-[0.97] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Subscription'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    getSubscriptions()
      .then(setSubscriptions)
      .finally(() => setLoading(false));
  }, []);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(s: Subscription) {
    setEditing(s);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  async function handleSave(data: SubscriptionRequest) {
    if (editing) {
      const updated = await updateSubscription(editing.id, data);
      setSubscriptions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } else {
      const created = await createSubscription(data);
      setSubscriptions((prev) => [...prev, created]);
    }
    closeModal();
  }

  async function handleDelete(id: number) {
    setDeleting(id);
    try {
      await deleteSubscription(id);
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setDeleting(null);
      setDeleteConfirm(null);
    }
  }

  const activeCount = subscriptions.filter((s) => s.isActive).length;
  const monthlySpend = subscriptions
    .filter((s) => s.isActive)
    .reduce((sum, s) => sum + normalizeToMonthly(s.amount, s.billingCycle), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeCount} active subscription{activeCount !== 1 ? 's' : ''} &middot; $
            {monthlySpend.toFixed(2)} / month
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ConnectBankButton variant="secondary" />
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:bg-amber-400 active:scale-[0.97] transition-all shadow-sm"
          >
            <IconPlus />
            Add Subscription
          </button>
        </div>
      </div>

      {/* List */}
      {subscriptions.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl">
          <EmptyState
            icon={<IconCreditCard />}
            title="No subscriptions yet"
            description="Add your first subscription to start tracking your spending."
            action={
              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:bg-amber-400 transition-colors"
              >
                <IconPlus />
                Add Subscription
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {subscriptions.map((s) => (
            <div
              key={s.id}
              className="relative bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* Delete confirmation overlay */}
              {deleteConfirm === s.id && (
                <div className="absolute inset-0 bg-card/95 dark:bg-card/98 rounded-2xl flex flex-col items-center justify-center gap-3 p-5 z-10">
                  <p className="text-sm font-semibold text-foreground text-center">
                    Delete &ldquo;{s.name}&rdquo;?
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    This cannot be undone.
                  </p>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-4 py-2 text-sm rounded-xl bg-muted hover:bg-border text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deleting === s.id}
                      className="px-4 py-2 text-sm rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-60"
                    >
                      {deleting === s.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}

              {/* Top row: name + status */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-base truncate">{s.name}</p>
                  {s.category && (
                    <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                      {s.category}
                    </span>
                  )}
                </div>
                <span
                  className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded-full ${
                    s.isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Amount */}
              <p className="text-2xl font-bold text-foreground tabular-nums">
                ${typeof s.amount === 'number' ? s.amount.toFixed(2) : s.amount}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  / {formatCycleLabel(s.billingCycle)}
                </span>
              </p>

              {/* Next billing date */}
              <p className="text-xs text-muted-foreground mt-2">
                Next billing: {formatDate(s.nextBillingDate)}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => openEdit(s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <IconEdit />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(s.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto"
                >
                  <IconTrash />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <SubscriptionModal editing={editing} onClose={closeModal} onSave={handleSave} />
      )}
    </div>
  );
}
