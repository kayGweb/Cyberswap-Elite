import React, { useEffect } from 'react';
import { LogIn, LogOut, History, Wallet, ShieldCheck, Star, X } from 'lucide-react';
import { useAuth } from './FirebaseProvider';
import { signInWithGoogle, signOut } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

interface NavigationProps {
  activeTab: 'swap' | 'history' | 'kyc' | 'favorites';
  setActiveTab: (tab: 'swap' | 'history' | 'kyc' | 'favorites') => void;
  // Mobile drawer support (optional, no breaking change for desktop)
  isMobile?: boolean;
  mobileNavOpen?: boolean;
  onMobileNavClose?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  isMobile = false,
  mobileNavOpen = false,
  onMobileNavClose,
}) => {
  const { user, profile } = useAuth();

  // Body scroll lock while mobile drawer is open
  useEffect(() => {
    if (!isMobile) return;
    if (mobileNavOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobile, mobileNavOpen]);

  const handleTabClick = (tab: 'swap' | 'history' | 'kyc' | 'favorites') => {
    setActiveTab(tab);
    if (isMobile && onMobileNavClose) {
      onMobileNavClose();
    }
  };

  // Shared inner content for both desktop sidebar and mobile drawer
  const NavContent = (
    <>
      <div className="p-8">
        <div className="flex items-center space-x-3 mb-12">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white italic">C</div>
          <span className="text-xl font-bold tracking-tight uppercase text-white">CryptoSwap</span>
        </div>

        <div className="space-y-4">
          <NavButton
            active={activeTab === 'swap'}
            onClick={() => handleTabClick('swap')}
            icon={<Wallet className="w-5 h-5" />}
            label="Exchange"
          />
          <NavButton
            active={activeTab === 'history'}
            onClick={() => handleTabClick('history')}
            icon={<History className="w-5 h-5" />}
            label="History"
          />
          <NavButton
            active={activeTab === 'kyc'}
            onClick={() => handleTabClick('kyc')}
            icon={<ShieldCheck className="w-5 h-5" />}
            label="Verification"
          />
          <NavButton
            active={activeTab === 'favorites'}
            onClick={() => handleTabClick('favorites')}
            icon={<Star className="w-5 h-5" />}
            label="Favorites"
          />
        </div>
      </div>

      <div className="mt-auto p-8 border-t border-gray-800">
        {user ? (
          <div className="space-y-4">
            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4">
              <p className="text-[10px] text-indigo-300 uppercase font-bold mb-1">Account</p>
              <p className="text-xs text-gray-100 font-semibold truncate">{user.email}</p>
              <div className="w-full bg-gray-800 h-1 mt-2 rounded-full overflow-hidden">
                <div className={`bg-indigo-500 h-1 rounded-full ${profile?.isKycVerified ? 'w-full' : 'w-1/3'}`}></div>
              </div>
              <p className="text-[8px] text-gray-500 mt-1 uppercase font-bold">
                {profile?.isKycVerified ? "Fully Verified" : "Basic Access"}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-2 py-3 border border-gray-800 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-400 hover:border-red-400/30 transition-all"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95"
          >
            <LogIn className="w-4 h-4" /> Sign In
          </button>
        )}
      </div>
    </>
  );

  // Desktop: original fixed sidebar (unchanged behavior)
  if (!isMobile) {
    return (
      <nav className="w-64 bg-[#121212] border-r border-gray-800 flex flex-col h-screen sticky top-0">
        {NavContent}
      </nav>
    );
  }

  // Mobile: slide-in drawer + backdrop
  return (
    <AnimatePresence>
      {mobileNavOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 z-[150]"
            onClick={onMobileNavClose}
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="fixed inset-y-0 left-0 z-[160] w-72 bg-[#121212] border-r border-gray-800 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white italic text-sm">C</div>
                <span className="font-bold tracking-tight uppercase text-white">Menu</span>
              </div>
              <button
                onClick={onMobileNavClose}
                className="p-2 -mr-2 text-gray-400 hover:text-white active:text-indigo-400 transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {NavContent}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
      active 
        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
    }`}
  >
    <span className={`${active ? 'text-indigo-400' : 'text-gray-600 group-hover:text-gray-400'}`}>
      {icon}
    </span>
    {label}
  </button>
);
