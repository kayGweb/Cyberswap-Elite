/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FirebaseProvider, useAuth } from './components/FirebaseProvider';
import { Navigation } from './components/Navigation';
import { SwapInterface } from './components/SwapInterface';
import { TransactionHistory } from './components/TransactionHistory';
import { TransactionNotifications } from './components/TransactionNotifications';
import { KycForm } from './components/KycForm';
import { FavoriteCoins } from './components/FavoriteCoins';
import { useTransactionStatusPoller } from './hooks/useTransactionStatusPoller';
import { useIsMobile } from './hooks/useIsMobile';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Menu } from 'lucide-react';
import { signInWithGoogle, isMockActive } from './lib/firebase';

function MainContent() {
  const [activeTab, setActiveTab] = useState<'swap' | 'history' | 'kyc' | 'favorites'>('swap');
  const { user, loading, profile, signInMock } = useAuth();
  const { notifications, dismissNotification } = useTransactionStatusPoller();

  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 text-center space-y-10">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-indigo-600 text-white flex items-center justify-center rounded-[2rem] text-5xl font-black shadow-[0_0_50px_rgba(79,70,229,0.3)] italic"
        >
          C
        </motion.div>
        <div className="space-y-4 max-w-xl">
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight text-white leading-none">Elegant<br /><span className="text-indigo-500">Exchanges.</span></h1>
          <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px]">Institutional Grade Infrastructure</p>
        </div>
        
        <div className="flex flex-col items-center gap-4 translate-y-4">
          <button 
            onClick={signInWithGoogle}
            className="flex items-center gap-3 bg-white text-black px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-gray-200 transition-all text-sm active:scale-95"
          >
            Get Started (Google)
          </button>
          
          <button 
            onClick={signInMock}
            className="flex items-center gap-3 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600/20 px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all text-xs active:scale-95"
          >
            Use Mock Login (Sandbox)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-16 pt-16 sm:pt-32 opacity-20 filter grayscale">
          <Feature icon={<ShieldAlert />} label="Secured" />
          <Feature icon={<ShieldAlert />} label="Liquid" />
          <Feature icon={<ShieldAlert />} label="Instant" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      {/* Desktop sidebar only */}
      {!isMobile && (
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* Mobile drawer (rendered inside Navigation when isMobile) */}
      {isMobile && (
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobile={isMobile}
          mobileNavOpen={mobileNavOpen}
          onMobileNavClose={() => setMobileNavOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Responsive header */}
        {isMobile ? (
          <header className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-[#0E0E0E]">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-2 -ml-2 text-gray-400 hover:text-white active:text-indigo-400 transition-colors"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold capitalize text-gray-100">{activeTab}</span>
              {isMockActive() && (
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 px-2 py-0.5 bg-indigo-500/5 border border-indigo-500/10 rounded-full">
                  Sandbox
                </span>
              )}
            </div>

            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 text-[10px] font-bold text-gray-400">
              {user.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
            </div>
          </header>
        ) : (
          <header className="h-20 border-b border-gray-800 flex items-center justify-between px-10 bg-[#0E0E0E]">
            <div>
              <h1 className="text-lg font-semibold capitalize text-gray-100">{activeTab} Interface</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Powered by Changelly API v2.1</p>
            </div>
            <div className="flex items-center space-x-6">
              {isMockActive() && (
                <div className="text-[9px] font-black uppercase tracking-widest text-indigo-400 px-3 py-1.5 bg-indigo-500/5 border border-indigo-500/10 rounded-full">
                  Sandbox Mode
                </div>
              )}
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">Identity Status</p>
                <p className={`text-xs font-mono font-bold ${profile?.isKycVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {profile?.isKycVerified ? 'VERIFIED' : 'PENDING'}
                </p>
              </div>
              <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center border border-gray-700 text-xs font-bold text-gray-400">
                {user.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
              </div>
            </div>
          </header>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full"
            >
              {activeTab === 'swap' && <SwapInterface />}
              {activeTab === 'history' && <TransactionHistory />}
              {activeTab === 'kyc' && <KycForm />}
              {activeTab === 'favorites' && <FavoriteCoins />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <TransactionNotifications
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}

const Feature = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="text-black/20">{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
  </div>
);

export default function App() {
  return (
    <FirebaseProvider>
      <MainContent />
    </FirebaseProvider>
  );
}
