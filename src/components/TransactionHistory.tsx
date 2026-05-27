import React, { useState, useEffect } from 'react';
import { db, collection, query, orderBy, onSnapshot } from '../lib/firebase';
import { useAuth } from './FirebaseProvider';
import { Clock, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  Transaction,
  getTransactionExplorerLink,
  isProcessingStatus,
} from '../types/transaction';

export const TransactionHistory: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(txs);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  if (!user) {
    return (
      <div className="text-center p-12 border border-black/10 rounded-lg dashed">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Please sign in to view your history</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 md:mb-10">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-none">History</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1">Immutable Ledger</p>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 px-4 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-full">
          {transactions.length} Total
        </div>
      </div>

      <div className="bg-[#121212] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Desktop table header */}
        {!isMobile && (
          <div className="grid grid-cols-4 px-8 py-5 bg-[#161616] text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 border-b border-gray-800">
            <span>Asset Pair</span>
            <span>Status</span>
            <span>Timestamp</span>
            <span className="text-right">Reference</span>
          </div>
        )}

        {/* Content: mobile cards vs desktop rows */}
        <div className={isMobile ? 'divide-y divide-gray-800/50' : 'divide-y divide-gray-800/50'}>
          <AnimatePresence>
            {transactions.map((tx, idx) => {
              const explorerLink = getTransactionExplorerLink(tx);

              if (isMobile) {
                // Mobile stacked card row
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="px-5 py-5 active:bg-[#1A1A1A] transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[15px] font-black text-white leading-none">
                          {tx.amountFrom} {tx.fromCurrency.toUpperCase()}
                        </div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1.5 flex items-center gap-1">
                          <span className="text-indigo-400">→</span> {tx.amountTo || '...'} {tx.toCurrency.toUpperCase()}
                        </div>
                      </div>
                      <StatusBadge status={tx.status} />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="font-mono text-gray-500">
                        {tx.createdAt?.toDate().toLocaleDateString() || '—'}
                      </span>

                      {explorerLink ? (
                        <a
                          href={explorerLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-black uppercase tracking-widest text-indigo-400 active:text-indigo-300"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="font-mono text-gray-600 text-[10px] tracking-widest">
                          {tx.changellyId.substring(0, 8)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              }

              // Desktop row (original)
              return (
                <motion.div 
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="grid grid-cols-4 px-8 py-6 items-center hover:bg-[#1A1A1A] transition-all group"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-black text-white">
                      {tx.amountFrom} {tx.fromCurrency.toUpperCase()}
                    </div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                      <span className="text-indigo-400">→</span> {tx.amountTo || '...'} {tx.toCurrency.toUpperCase()}
                    </div>
                  </div>

                  <div>
                    <StatusBadge status={tx.status} />
                  </div>

                  <div className="text-[10px] font-mono text-gray-500 uppercase">
                    {tx.createdAt?.toDate().toLocaleString() || 'Verifying...'}
                  </div>

                  <div className="text-right">
                    {explorerLink ? (
                      <a 
                        href={explorerLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-indigo-400 transition-colors"
                      >
                        View tx
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600">
                        {tx.changellyId.substring(0, 8)}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {transactions.length === 0 && !loading && (
          <div className="p-16 md:p-24 text-center space-y-4">
            <Clock className="w-10 h-10 mx-auto text-gray-800" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">No Activity Detected</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const config = isProcessingStatus(status)
    ? { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/10', label: 'Processing' }
    : {
        finished: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10', label: 'Complete' },
        failed: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/5', border: 'border-rose-500/10', label: 'Failed' },
        refunded: { icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-400/5', border: 'border-gray-400/10', label: 'Refunded' },
        expired: { icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-400/5', border: 'border-gray-400/10', label: 'Expired' },
        overdue: { icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-400/5', border: 'border-gray-400/10', label: 'Overdue' },
      }[status] || { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-400/5', border: 'border-gray-400/10', label: status };

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.border} ${config.bg} ${config.color}`}>
      <Icon className="w-3 h-3" />
      <span className="text-[9px] font-black uppercase tracking-widest">{config.label}</span>
    </div>
  );
};
