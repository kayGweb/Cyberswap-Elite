import { useCallback, useEffect, useRef, useState } from 'react';
import { changellyService } from '../services/changellyService';
import {
  db,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from '../lib/firebase';
import { useAuth } from '../components/FirebaseProvider';
import { isTerminalStatus, Transaction } from '../types/transaction';

const POLL_INTERVAL_MS = 15_000;

export interface TransactionNotification {
  id: string;
  type: 'success' | 'error';
  title: string;
  message: string;
  explorerLink?: string;
}

export function useTransactionStatusPoller() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<TransactionNotification[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const knownStatusesRef = useRef<Map<string, string>>(new Map());
  const pollingRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setPendingTransactions([]);
      knownStatusesRef.current.clear();
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Transaction[];

      txs.forEach((tx) => {
        if (!knownStatusesRef.current.has(tx.id)) {
          knownStatusesRef.current.set(tx.id, tx.status);
        }
      });

      setPendingTransactions(txs.filter((tx) => !isTerminalStatus(tx.status)));
    });

    return unsubscribe;
  }, [user]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id));
  }, []);

  const pollTransactions = useCallback(async () => {
    if (!user || pendingTransactions.length === 0 || pollingRef.current) return;

    pollingRef.current = true;
    try {
      for (const tx of pendingTransactions) {
        try {
          const [changellyTx] = await changellyService.getTransactions({ id: tx.changellyId });
          if (!changellyTx) continue;

          const previousStatus = knownStatusesRef.current.get(tx.id) ?? tx.status;
          const nextStatus = changellyTx.status;
          const updates: Partial<Transaction> = {};

          if (nextStatus !== tx.status) {
            updates.status = nextStatus;
          }
          if (changellyTx.amountTo && changellyTx.amountTo !== tx.amountTo) {
            updates.amountTo = changellyTx.amountTo;
          }
          if (changellyTx.payinAddress && changellyTx.payinAddress !== tx.payinAddress) {
            updates.payinAddress = changellyTx.payinAddress;
          }
          if (changellyTx.payoutHashLink && changellyTx.payoutHashLink !== tx.payoutHashLink) {
            updates.payoutHashLink = changellyTx.payoutHashLink;
          }

          if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, 'users', user.uid, 'transactions', tx.id), updates);
          }

          knownStatusesRef.current.set(tx.id, nextStatus);

          if (nextStatus !== previousStatus && isTerminalStatus(nextStatus)) {
            if (nextStatus === 'finished') {
              setNotifications((current) => [
                ...current,
                {
                  id: `${tx.id}-${Date.now()}`,
                  type: 'success',
                  title: 'Exchange complete',
                  message: `${tx.amountFrom} ${tx.fromCurrency.toUpperCase()} → ${changellyTx.amountTo || tx.amountTo} ${tx.toCurrency.toUpperCase()}`,
                  explorerLink: changellyTx.payoutHashLink ?? undefined,
                },
              ]);
            } else {
              setNotifications((current) => [
                ...current,
                {
                  id: `${tx.id}-${Date.now()}`,
                  type: 'error',
                  title: 'Exchange failed',
                  message: `Your ${tx.fromCurrency.toUpperCase()} → ${tx.toCurrency.toUpperCase()} swap could not be completed.`,
                },
              ]);
            }
          }
        } catch (err) {
          console.error(`Failed to poll transaction ${tx.changellyId}:`, err);
        }
      }
    } finally {
      pollingRef.current = false;
    }
  }, [pendingTransactions, user]);

  useEffect(() => {
    if (!user || pendingTransactions.length === 0) return;

    pollTransactions();
    const intervalId = window.setInterval(pollTransactions, POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [pollTransactions, pendingTransactions.length, user]);

  return { notifications, dismissNotification };
}
