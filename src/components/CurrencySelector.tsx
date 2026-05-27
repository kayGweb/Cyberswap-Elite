import React, { useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { ChangellyCurrency } from '../services/changellyService';
import { useIsMobile } from '../hooks/useIsMobile';
import { motion, AnimatePresence } from 'motion/react';

interface CurrencySelectorProps {
  currencies: ChangellyCurrency[];
  selectedTicker: string;
  onSelect: (ticker: string) => void;
  label: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ currencies, selectedTicker, onSelect, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const isMobile = useIsMobile();

  const selected = currencies.find(c => c.ticker === selectedTicker);
  
  const filtered = currencies
    .filter(c => c.enabled)
    .filter(c => 
      c.ticker.toLowerCase().includes(search.toLowerCase()) || 
      c.fullName.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 50);

  return (
    <div className="relative">
      <label className="text-[10px] uppercase tracking-[0.3em] font-black text-gray-500 mb-2 block ml-2">
        {label}
      </label>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[#1F1F1F] border border-gray-700 rounded-2xl hover:border-indigo-500 transition-all font-bold text-white group"
      >
        <div className="flex items-center gap-4">
          {selected?.image ? (
            <img src={selected.image} alt={selected.ticker} className="w-8 h-8 rounded-full border border-gray-700 shadow-lg" />
          ) : (
            <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-[10px] border border-gray-700">?</div>
          )}
          <div className="text-left">
            <div className="text-sm font-black uppercase tracking-tight">{selectedTicker}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest leading-none mt-0.5">{selected?.fullName}</div>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-600 group-hover:text-indigo-400 transition-all ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Desktop dropdown (unchanged) */}
      {isOpen && !isMobile && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-[#161616] border border-gray-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[100] max-h-96 overflow-hidden flex flex-col backdrop-blur-xl bg-opacity-95">
          <div className="p-4 bg-[#1F1F1F]/50 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input 
                autoFocus
                type="text"
                placeholder="FIND ASSET..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-5 py-3 text-[10px] font-black text-white bg-[#0A0A0A] rounded-xl outline-none border border-gray-800 focus:border-indigo-500 transition-all placeholder:text-gray-800"
              />
            </div>
          </div>
          <div className="overflow-y-auto custom-scrollbar flex-1">
            {filtered.map(c => (
              <button 
                key={c.ticker}
                onClick={() => {
                  onSelect(c.ticker);
                  setIsOpen(false);
                  setSearch('');
                }}
                className="w-full flex items-center gap-4 p-4 hover:bg-indigo-600/10 transition-all border-b border-gray-800/20 group active:bg-indigo-600/20"
              >
                <img src={c.image} alt={c.ticker} className="w-6 h-6 rounded-full border border-gray-800 group-hover:border-indigo-500/50 transition-all" />
                <div className="text-left">
                  <div className="text-xs font-black uppercase text-gray-300 group-hover:text-white transition-colors">{c.ticker}</div>
                  <div className="text-[9px] text-gray-600 uppercase tracking-widest font-bold group-hover:text-gray-400 transition-colors uppercase truncate max-w-[120px]">{c.fullName}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile full-screen modal (full takeover for excellent 414px experience) */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <div className="fixed inset-0 z-[200] flex flex-col bg-[#0A0A0A]">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-gray-800 bg-[#0E0E0E]">
              <div className="text-sm font-bold uppercase tracking-widest text-gray-400">Select Asset</div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSearch('');
                }}
                className="p-2 -mr-2 text-gray-400 active:text-white transition-colors"
                aria-label="Close selector"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-800 bg-[#0E0E0E]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  autoFocus
                  type="text"
                  placeholder="FIND ASSET..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-5 py-3.5 text-sm font-bold text-white bg-[#161616] rounded-2xl outline-none border border-gray-700 focus:border-indigo-500 transition-all placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Scrollable list - larger tap targets */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-6">
              {filtered.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm">No matching assets</div>
              )}
              {filtered.map(c => (
                <button
                  key={c.ticker}
                  onClick={() => {
                    onSelect(c.ticker);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className="w-full flex items-center gap-4 px-5 py-4 active:bg-indigo-600/10 border-b border-gray-800/40 transition-all"
                >
                  <img src={c.image} alt={c.ticker} className="w-8 h-8 rounded-full border border-gray-700 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="text-base font-black uppercase text-white tracking-tight">{c.ticker}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest font-bold truncate">{c.fullName}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
