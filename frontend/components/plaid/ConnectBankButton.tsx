'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import {
  getLinkToken,
  exchangePublicToken,
  getDetectedSubscriptions,
  type DetectedSubscription,
  type Subscription,
} from '@/lib/api';
import { DetectedSubscriptionsModal } from './DetectedSubscriptionsModal';

// ── Icons ──────────────────────────────────────────────────────────────────

function IconBank() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="22" x2="21" y2="22" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 2 7 22 7 12 2" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

interface ConnectBankButtonProps {
  variant?: 'primary' | 'secondary';
  onSubscriptionAdded?: (sub: Subscription) => void;
}

export function ConnectBankButton({
  variant = 'primary',
  onSubscriptionAdded,
}: ConnectBankButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [fetchingToken, setFetchingToken] = useState(false);
  const [shouldOpen, setShouldOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Detection modal state
  const [showModal, setShowModal] = useState(false);
  const [detectionsLoading, setDetectionsLoading] = useState(false);
  const [detections, setDetections] = useState<DetectedSubscription[]>([]);
  const [detectionError, setDetectionError] = useState<string | null>(null);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken, metadata) => {
      console.log('[Plaid] public_token:', publicToken);
      console.log('[Plaid] metadata:', metadata);

      setShouldOpen(false);
      setLinkToken(null);
      setConnected(true);
      setShowModal(true);
      setDetectionsLoading(true);
      setDetectionError(null);

      void (async () => {
        try {
          const res = await exchangePublicToken(publicToken);
          console.log('[Plaid] access_token:', res.accessToken);
        } catch (err) {
          console.error('[Plaid] token exchange failed:', err);
        }

        try {
          const data = await getDetectedSubscriptions();
          setDetections(data);
        } catch (err) {
          setDetectionError(
            err instanceof Error ? err.message : 'Could not scan transactions.',
          );
        } finally {
          setDetectionsLoading(false);
        }
      })();
    },
    onExit: (err) => {
      setShouldOpen(false);
      setLinkToken(null);
      if (err) {
        setFetchError('Bank connection was not completed. Please try again.');
      }
    },
  });

  useEffect(() => {
    if (shouldOpen && ready) {
      open();
    }
  }, [shouldOpen, ready, open]);

  const handleClick = useCallback(async () => {
    setFetchError(null);
    setFetchingToken(true);
    try {
      const res = await getLinkToken();
      setLinkToken(res.linkToken);
      setShouldOpen(true);
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : 'Failed to connect. Please try again.',
      );
    } finally {
      setFetchingToken(false);
    }
  }, []);

  const isLoading = fetchingToken || (shouldOpen && !ready);

  const buttonClass =
    variant === 'primary'
      ? 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:bg-amber-400 active:scale-[0.97] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed'
      : 'flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted active:scale-[0.97] transition-all text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed';

  return (
    <>
      {showModal && (
        <DetectedSubscriptionsModal
          loading={detectionsLoading}
          detections={detections}
          error={detectionError}
          onClose={() => setShowModal(false)}
          onSubscriptionAdded={onSubscriptionAdded}
        />
      )}
      <div className="flex flex-col items-start gap-1.5">
        {connected ? (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
            <IconCheck />
            Bank connected
          </div>
        ) : (
          <button onClick={handleClick} disabled={isLoading} className={buttonClass}>
            <IconBank />
            {isLoading ? 'Connecting...' : 'Connect Bank Account'}
          </button>
        )}
        {fetchError && (
          <p className="text-xs text-red-600 dark:text-red-400">{fetchError}</p>
        )}
      </div>
    </>
  );
}
