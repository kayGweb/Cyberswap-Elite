import React, { useState, useEffect } from 'react';
import { ArrowUpDown, Loader2, AlertCircle, CheckCircle2, ExternalLink, Clock } from 'lucide-react';
import { changellyService, ChangellyCurrency } from '../services/changellyService';
import { CurrencySelector } from './CurrencySelector';
import { useAuth } from './FirebaseProvider';
import { db, collection, addDoc, serverTimestamp, doc, updateDoc } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { isProcessingStatus, isTerminalStatus } from '../types/transaction';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Processing',
  new: 'Awaiting deposit',
  waiting: 'Awaiting deposit',
  confirming: 'Confirming payment',
  exchanging: 'Exchanging',
  sending: 'Sending to wallet',
  finished: 'Complete',
  failed: 'Failed',
  refunded: 'Refunded',
  expired: 'Expired',
  overdue: 'Overdue',
};

export const SwapInterface: React.FC = () => {
  const { user, profile } = useAuth();
  const [currencies, setCurrencies] = useState<ChangellyCurrency[]>([]);
  const [fromCoin, setFromCoin] = useState('btc');
  const [toCoin, setToCoin] = useState('eth');
  const [amount, setAmount] = useState('0.1');
  const [estimate, setEstimate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [txResult, setTxResult] = useState<any | null>(null);
  const [firestoreTxId, setFirestoreTxId] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string>('waiting');
  const [txAmountTo, setTxAmountTo] = useState<string | null>(null);
  const [explorerLink, setExplorerLink] = useState<string | null>(null);

  useEffect(() => {
    changellyService.getCurrencies()
      .then(setCurrencies)
      .catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    if (!fromCoin || !toCoin || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setEstimate(null);
      return;
    }

    const timer = setTimeout(() => {
      setEstimating(true);
      changellyService.getExchangeAmount(fromCoin, toCoin, amount)
        .then(result => {
          setEstimate(result[0].amountTo);
          setError(null);
        })
        .catch(err => {
          setEstimate(null);
          setError(err.message);
        })
        .finally(() => setEstimating(false));
    }, 500);

    return () => clearTimeout(timer);
  }, [fromCoin, toCoin, amount]);

  useEffect(() => {
    if (!txResult?.id || !user || !firestoreTxId) return;
    if (isTerminalStatus(txStatus)) return;

    let cancelled = false;

    const syncStatus = async () => {
      try {
        const [changellyTx] = await changellyService.getTransactions({ id: txResult.id });
        if (!changellyTx || cancelled) return;

        setTxStatus(changellyTx.status);
        if (changellyTx.amountTo) {
          setTxAmountTo(changellyTx.amountTo);
        }
        if (changellyTx.payoutHashLink) {
          setExplorerLink(changellyTx.payoutHashLink);
        }

        const updates: Record<string, string> = {};
        if (changellyTx.status !== txStatus) updates.status = changellyTx.status;
        if (changellyTx.amountTo) updates.amountTo = changellyTx.amountTo;
        if (changellyTx.payinAddress) updates.payinAddress = changellyTx.payinAddress;
        if (changellyTx.payoutHashLink) updates.payoutHashLink = changellyTx.payoutHashLink;

        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, 'users', user.uid, 'transactions', firestoreTxId), updates);
        }
      } catch (err) {
        console.error('Failed to sync transaction status:', err);
      }
    };

    syncStatus();
    const intervalId = window.setInterval(syncStatus, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [txResult?.id, user, firestoreTxId, txStatus]);

  const handleSwap = async () => {
    if (!user) return;
    if (!profile?.isKycVerified) {
      setError("Please complete KYC verification before swapping.");
      return;
    }
    if (!address) {
      setError("Please enter a valid payout address.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await changellyService.createTransaction(fromCoin, toCoin, amount, address);
      
      const docRef = await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        userId: user.uid,
        fromCurrency: fromCoin,
        toCurrency: toCoin,
        amountFrom: amount,
        amountTo: estimate,
        status: 'waiting',
        changellyId: result.id,
        payoutAddress: address,
        payinAddress: result.payinAddress,
        createdAt: serverTimestamp(),
      });

      setFirestoreTxId(docRef.id);
      setTxStatus(result.status === 'new' ? 'waiting' : result.status);
      setTxAmountTo(estimate);
      setExplorerLink(null);
      setTxResult(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetSwap = () => {
    setTxResult(null);
    setFirestoreTxId(null);
    setTxStatus('waiting');
    setTxAmountTo(null);
    setExplorerLink(null);
  };

  const flipCoins = () => {
    const temp = fromCoin;
    setFromCoin(toCoin);
    setToCoin(temp);
  };

  if (txResult) {
    const isComplete = txStatus === 'finished';
    const isFailed = txStatus === 'failed';
    const statusLabel = STATUS_LABELS[txStatus] ?? txStatus;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto p-6 md:p-10 border border-gray-800 rounded-3xl bg-[#161616] shadow-2xl space-y-6 md:space-y-8"
      >
        <div className="flex justify-center">
          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border ${
            isComplete
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              : isFailed
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
          }`}>
            {isComplete ? (
              <CheckCircle2 className="w-9 h-9 md:w-12 md:h-12" />
            ) : isFailed ? (
              <AlertCircle className="w-9 h-9 md:w-12 md:h-12" />
            ) : (
              <Loader2 className="w-9 h-9 md:w-12 md:h-12 animate-spin" />
            )}
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
            {isComplete ? 'Exchange Complete' : isFailed ? 'Exchange Failed' : 'Transaction Created'}
          </h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            {isComplete
              ? 'Funds sent to your wallet'
              : isFailed
                ? 'Please contact support with your reference ID'
                : statusLabel}
          </p>
        </div>

        {!isComplete && !isFailed && (
          <div className="p-6 bg-[#0E0E0E] border border-gray-800 rounded-2xl space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">Pay-in Address ({fromCoin.toUpperCase()})</label>
              <div className="font-mono text-xs break-all bg-[#1F1F1F] p-4 border border-gray-700 rounded-xl font-bold text-indigo-400">
                {txResult.payinAddress}
              </div>
            </div>
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
              <span className="text-gray-500">Amount To Send</span>
              <span className="text-white">{amount} {fromCoin.toUpperCase()}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              {statusLabel}
            </div>
          </div>
        )}

        {(isComplete || isProcessingStatus(txStatus)) && (
          <div className="p-6 bg-[#0E0E0E] border border-gray-800 rounded-2xl space-y-4">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
              <span className="text-gray-500">You Sent</span>
              <span className="text-white">{amount} {fromCoin.toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
              <span className="text-gray-500">You Received</span>
              <span className="text-emerald-400">{txAmountTo || estimate || '...'} {toCoin.toUpperCase()}</span>
            </div>
            {explorerLink && (
              <a
                href={explorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                View completed transaction
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        <button 
          onClick={resetSwap}
          className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
        >
          New Exchange
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-[#161616] border border-gray-800 rounded-[2.5rem] p-6 md:p-10 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] space-y-6 md:space-y-8 relative overflow-hidden">
        <div className="space-y-6">
          <div className="space-y-3">
            <CurrencySelector 
              label="You Send"
              currencies={currencies}
              selectedTicker={fromCoin}
              onSelect={setFromCoin}
            />
            <div className="relative group">
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-5 md:p-6 text-3xl md:text-4xl font-medium bg-[#1F1F1F] border border-gray-700 rounded-2xl focus:border-indigo-500 transition-all outline-none text-white"
                placeholder="0.00"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-gray-500 uppercase tracking-widest bg-[#161616] px-3 py-1 rounded-full border border-gray-700">
                {fromCoin}
              </div>
            </div>
          </div>

          <div className="flex justify-center -my-6 relative z-10">
            <button 
              onClick={flipCoins}
              className="p-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 transition-all duration-300 active:scale-90 shadow-[0_0_20px_rgba(79,70,229,0.4)] border-8 border-[#161616]"
            >
              <ArrowUpDown className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-3">
            <CurrencySelector 
              label="You Receive"
              currencies={currencies}
              selectedTicker={toCoin}
              onSelect={setToCoin}
            />
            <div className="relative">
              <div className="w-full p-5 md:p-6 text-3xl md:text-4xl font-medium bg-[#1F1F1F] border border-gray-700 rounded-2xl min-h-[80px] md:min-h-[96px] flex items-center text-gray-400">
                {estimating ? (
                  <Loader2 className="w-7 h-7 md:w-8 h-8 animate-spin text-gray-600" />
                ) : (
                  estimate || "0.00"
                )}
              </div>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-500 uppercase tracking-widest bg-[#161616] px-3 py-1 rounded-full border border-gray-700">
                {toCoin}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">
              Destination {toCoin.toUpperCase()} Address
            </label>
            <input 
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-5 text-sm font-mono border border-gray-700 rounded-2xl focus:border-indigo-500 transition-all outline-none bg-[#1F1F1F] text-gray-200 placeholder:text-gray-600 shadow-inner"
              placeholder={`0x... (Recipient Address)`}
            />
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-3 p-4 bg-red-900/10 text-red-500 rounded-xl text-[10px] font-bold border border-red-500/20"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          disabled={loading || !estimate || !user}
          onClick={handleSwap}
          className="w-full py-5 md:py-6 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.3em] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-500 transition-all active:scale-95 shadow-[0_15px_30px_rgba(79,70,229,0.3)]"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-white/50" />
          ) : !user ? (
            "Login to Swap"
          ) : (
            "Exchange Assets"
          )}
        </button>

        {!profile?.isKycVerified && user && (
          <div className="text-[9px] text-center text-amber-500 uppercase tracking-widest font-black py-2 bg-amber-500/5 rounded-full border border-amber-500/10">
            KYC Verification Required For This Pair
          </div>
        )}
      </div>
    </div>
  );
};
