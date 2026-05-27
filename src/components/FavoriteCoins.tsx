import React, { useState, useEffect } from 'react';
import { useAuth } from './FirebaseProvider';
import { db, doc, updateDoc } from '../lib/firebase';
import { changellyService, ChangellyCurrency } from '../services/changellyService';
import { Star, StarOff, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const FavoriteCoins: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [currencies, setCurrencies] = useState<ChangellyCurrency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    changellyService.getCurrencies()
      .then(setCurrencies)
      .finally(() => setLoading(false));
  }, []);

  const toggleFavorite = async (ticker: string) => {
    if (!user || !profile) return;
    
    const currentFavorites = profile.favoriteCoins || [];
    const newFavorites = currentFavorites.includes(ticker)
      ? currentFavorites.filter(t => t !== ticker)
      : [...currentFavorites, ticker];

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        favoriteCoins: newFavorites
      });
      await refreshProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = currencies
    .filter(c => c.enabled)
    .filter(c => 
      c.ticker.toLowerCase().includes(search.toLowerCase()) || 
      c.fullName.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 50);

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-none">Watchlist</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1">Priority Assets</p>
        </div>
        <div className="relative w-full max-w-xs md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text"
            placeholder="FILTER ASSETS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-4 text-[10px] font-black uppercase tracking-widest bg-[#121212] border border-gray-800 rounded-2xl focus:border-indigo-500 transition-all outline-none text-white placeholder:text-gray-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {filtered.map(c => {
            const isFavorite = profile?.favoriteCoins?.includes(c.ticker);
            return (
              <motion.button 
                key={c.ticker}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => toggleFavorite(c.ticker)}
                className={`flex items-center justify-between p-5 border rounded-[1.5rem] transition-all group ${
                  isFavorite 
                    ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_10px_30px_rgba(79,70,229,0.1)]' 
                    : 'border-gray-800 bg-[#121212] hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={c.image} alt={c.ticker} className="w-10 h-10 rounded-full border-2 border-gray-800" />
                    {isFavorite && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-[#121212]">
                        <Star className="w-2 h-2 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black uppercase text-white leading-none">{c.ticker}</div>
                    <div className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.1em] mt-1">{c.fullName}</div>
                  </div>
                </div>
                
                <div className={`p-2 rounded-lg transition-colors ${isFavorite ? 'text-indigo-400 bg-indigo-400/10' : 'text-gray-700 group-hover:text-gray-500'}`}>
                  {isFavorite ? <Star className="w-4 h-4 fill-indigo-400" /> : <StarOff className="w-4 h-4" />}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {loading && (
        <div className="flex justify-center p-24">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500/20" />
        </div>
      )}
    </div>
  );
};
