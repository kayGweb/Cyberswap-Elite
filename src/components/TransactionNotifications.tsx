import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, ExternalLink, X, XCircle } from 'lucide-react';
import { TransactionNotification } from '../hooks/useTransactionStatusPoller';

interface TransactionNotificationsProps {
  notifications: TransactionNotification[];
  onDismiss: (id: string) => void;
}

export const TransactionNotifications: React.FC<TransactionNotificationsProps> = ({
  notifications,
  onDismiss,
}) => {
  return (
    <div className="fixed bottom-4 left-4 right-4 md:bottom-8 md:right-8 md:left-auto z-50 flex flex-col gap-3 max-w-sm pointer-events-none md:max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className={`pointer-events-auto p-4 md:p-5 rounded-2xl border shadow-2xl backdrop-blur-sm ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/20 text-emerald-100'
                : 'bg-rose-950/90 border-rose-500/20 text-rose-100'
            }`}
          >
            <div className="flex items-start gap-3">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
              )}
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">{notification.title}</p>
                  <p className="text-[11px] font-bold text-white/80 mt-1">{notification.message}</p>
                </div>
                {notification.explorerLink && (
                  <a
                    href={notification.explorerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-300 hover:text-emerald-200 transition-colors"
                  >
                    View transaction
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <button
                onClick={() => onDismiss(notification.id)}
                className="text-white/40 hover:text-white/70 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
