import React, { useState } from 'react';
import { useAuth } from './FirebaseProvider';
import { db, doc, updateDoc, serverTimestamp } from '../lib/firebase';
import { Shield, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export const KycForm: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || '',
    dateOfBirth: '',
    documentType: 'Passport',
    documentNumber: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        isKycVerified: true,
        updatedAt: serverTimestamp(),
      });
      await refreshProfile();
      setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (profile?.isKycVerified || success) {
    return (
      <div className="max-w-md mx-auto p-8 md:p-12 border border-emerald-500/20 bg-emerald-500/5 rounded-[2.5rem] text-center space-y-6 shadow-[0_0_50px_rgba(16,185,129,0.05)]">
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-none">Identity Secured</h2>
          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.2em] pt-2">Full Platform Access Enabled</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[#121212] border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="bg-indigo-600 p-6 md:p-10 space-y-4">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
            <Shield className="w-5 h-5" /> Protocol Verification
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white leading-none">KYC Enrollment</h2>
          <p className="text-sm text-indigo-100/70 font-medium">Please provide legal documentation to unlock institutional limits.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8 md:space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Legal Name</label>
              <input 
                required
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="w-full p-4 border border-gray-700 rounded-2xl focus:border-indigo-500 transition-all outline-none bg-[#1F1F1F] text-gray-200 font-bold placeholder:text-gray-700"
                placeholder="FIRST LAST"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">DOB</label>
              <input 
                required
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                className="w-full p-4 border border-gray-700 rounded-2xl focus:border-indigo-500 transition-all outline-none bg-[#1F1F1F] text-gray-200 font-bold appearance-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Method</label>
              <select 
                value={formData.documentType}
                onChange={(e) => setFormData({...formData, documentType: e.target.value})}
                className="w-full p-4 border border-gray-700 rounded-2xl focus:border-indigo-500 transition-all outline-none bg-[#1F1F1F] text-gray-200 font-bold appearance-none cursor-pointer"
              >
                <option value="Passport">PASSPORT</option>
                <option value="ID Card">ID CARD</option>
                <option value="DL">DRIVERS LICENSE</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Document #</label>
              <input 
                required
                type="text"
                value={formData.documentNumber}
                onChange={(e) => setFormData({...formData, documentNumber: e.target.value})}
                className="w-full p-4 border border-gray-700 rounded-2xl focus:border-indigo-500 transition-all outline-none bg-[#1F1F1F] text-gray-200 font-bold uppercase placeholder:text-gray-700"
                placeholder="XXXXX..."
              />
            </div>
          </div>

          <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-4">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-[10px] font-bold text-amber-500/70 uppercase leading-relaxed tracking-widest">
              Digital identity signature is legally binding. Assets may be frozen if documentation is found to be fraudulent.
            </p>
          </div>

          <button 
            disabled={loading}
            type="submit"
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.3em] hover:bg-indigo-500 transition-all active:scale-95 shadow-[0_15px_30px_rgba(79,70,229,0.3)] flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Attest & Verify"}
          </button>
        </form>
      </div>
    </div>
  );
};
