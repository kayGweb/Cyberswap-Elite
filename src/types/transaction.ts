export const TERMINAL_STATUSES = ['finished', 'failed', 'refunded', 'expired', 'overdue'] as const;

export const PROCESSING_STATUSES = [
  'pending',
  'new',
  'waiting',
  'confirming',
  'exchanging',
  'sending',
  'hold',
] as const;

export type TransactionStatus = string;

export interface Transaction {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  amountFrom: string;
  amountTo: string;
  status: TransactionStatus;
  createdAt: any;
  changellyId: string;
  payoutHashLink?: string;
  payinAddress?: string;
  payoutAddress?: string;
}

export function isTerminalStatus(status: string): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status);
}

export function isProcessingStatus(status: string): boolean {
  return (PROCESSING_STATUSES as readonly string[]).includes(status);
}

export function getTransactionExplorerLink(tx: Transaction): string | null {
  if (tx.status === 'finished' && tx.payoutHashLink) {
    return tx.payoutHashLink;
  }
  return null;
}
