import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CreditCard, Send, Activity, FileText, CheckCircle, Clock, Settings as SettingsIcon, Sun, Moon, Palette } from 'lucide-react';
import axios from 'axios';
import Settings from './Settings';
import Contracts from './Contracts';
import Documents from './Documents';
import { BACKEND_URL } from '../config';
import { useLanguage } from '../LanguageContext';

export default function UserPortal({ username, onLogout, auth, setAuth }) {
  const { lang, changeLang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('payment');
  const toggleTheme = async () => {
    const nextThemes = {
      'current': 'light',
      'light': 'dark',
      'dark': 'current'
    };
    const nextTheme = nextThemes[auth?.theme || 'current'] || 'current';
    try {
      await axios.put(`${BACKEND_URL}/api/auth/theme`, {
        username: auth.username,
        theme: nextTheme
      });
      setAuth({ ...auth, theme: nextTheme });
    } catch (err) {
      console.error("Tema güncellenemedi", err);
    }
  };
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePayment = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccess(true);
      setAmount('');
      setRecipient('');
      setTimeout(() => setSuccess(false), 3000);
    }, 2000);
  };

  return (
    <div className={`theme-${auth?.theme || 'current'} min-h-screen font-sans flex flex-col ${
      auth?.theme === "light" ? "bg-slate-50 text-slate-800" :
      auth?.theme === "dark" ? "bg-black text-slate-300" :
      "bg-[#0f172a] text-slate-200"
    }`}>
      {/* Header */}
      <header className="glass-panel sticky top-0 z-10 px-8 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-2 rounded-xl">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">{t('individual_portal')}</h1>
            <p className="text-xs text-slate-400 font-medium">{t('secure_network')}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* Language Switcher */}
          <div className="flex bg-slate-800/40 border border-slate-700/50 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => changeLang('TR')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                lang === 'TR'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              TR
            </button>
            <button
              type="button"
              onClick={() => changeLang('EN')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                lang === 'EN'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>

          <button 
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/50 transition-all cursor-pointer"
            title={t('theme_change')}
          >
            {auth?.theme === 'light' ? <Moon size={18} /> : auth?.theme === 'dark' ? <Palette size={18} /> : <Sun size={18} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold uppercase">
              {username.charAt(0)}
            </div>
            <span className="font-medium text-slate-300">{username}</span>
          </div>
          <button onClick={onLogout} className="text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors bg-rose-500/10 px-4 py-2 rounded-lg">
            {t('logout')}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Sidebar Nav */}
        <div className="md:col-span-1 space-y-4">
          <button 
            onClick={() => setActiveTab('payment')}
            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${activeTab === 'payment' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}
          >
            <Send size={20} /> {t('new_transfer')}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}
          >
            <Clock size={20} /> {t('my_transactions')}
          </button>
          
          <button 
            onClick={() => setActiveTab('contracts')}
            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${activeTab === 'contracts' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}
          >
            <ShieldCheck size={20} /> {t('smart_contracts')}
          </button>
          <button 
            onClick={() => setActiveTab('documents')}
            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${activeTab === 'documents' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}
          >
            <FileText size={20} /> {t('my_documents')}
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}
          >
            <SettingsIcon size={20} /> {t('settings')}
          </button>
          
          <div className="mt-8 p-6 glass-panel rounded-2xl border border-slate-700/50 bg-slate-800/20">
            <h3 className="text-sm font-bold text-slate-300 mb-2">{t('wallet_balance')}</h3>
            <p className="text-3xl font-black text-white">42,500 <span className="text-lg text-slate-500">₺</span></p>
          </div>
        </div>

        {/* Dynamic Panel */}
        <div className="md:col-span-2">
          {activeTab === 'payment' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-8 rounded-3xl border border-slate-700/50">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-800">
                <div className="p-3 bg-blue-500/20 rounded-xl"><CreditCard size={24} className="text-blue-400" /></div>
                <div>
                  <h2 className="text-2xl font-black text-white">{t('transfer_title')}</h2>
                  <p className="text-sm text-slate-400">{t('transfer_subtitle')}</p>
                </div>
              </div>

              {success ? (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle size={40} className="text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{t('tx_success')}</h3>
                  <p className="text-slate-400 max-w-sm mb-8">{t('tx_success_desc')}</p>
                  <button onClick={() => setSuccess(false)} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors">
                    {t('new_tx_btn')}
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handlePayment} className="space-y-6">
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">{t('receiver_address')}</label>
                    <input 
                      type="text" 
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      required
                      placeholder={lang === 'TR' ? "TR09 0006 1000 0000 0123 4567 89 veya 0x71C...3B2" : "TR09 0006 1000 0000 0123 4567 89 or 0x71C...3B2"}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-blue-500 transition-colors font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">{t('amount_placeholder')}</label>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      placeholder="0.00"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-blue-500 transition-colors text-2xl font-bold"
                    />
                  </div>
                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white shadow-lg shadow-blue-500/25 disabled:opacity-50"
                    >
                      {isProcessing ? <><Activity className="animate-spin" /> {t('processing_security')}</> : t('start_transfer')}
                    </button>
                  </div>
                  <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1 mt-4">
                    <ShieldCheck size={14} /> {t('security_active')}
                  </p>
                </form>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-8 rounded-3xl border border-slate-700/50">
              <h2 className="text-2xl font-black text-white mb-6 border-b border-slate-800 pb-4">{t('last_transactions')}</h2>
              <div className="space-y-4">
                {[
                  { id: '1', to: 'TR12 3456...', amount: 1500, date: `${t('today')}, 14:30`, status: 'Onaylandı' },
                  { id: '2', to: 'TR98 7654...', amount: 450, date: `${t('yesterday')}, 09:15`, status: 'Onaylandı' },
                  { id: '3', to: 'E-Ticaret A.Ş.', amount: 12500, date: `12 ${lang === 'TR' ? 'Haziran' : 'June'}`, status: 'Onaylandı' },
                ].map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 text-left">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-500/10 rounded-lg"><FileText size={20} className="text-blue-400" /></div>
                      <div>
                        <p className="font-medium text-white">{tx.to}</p>
                        <p className="text-xs text-slate-500">{tx.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">-{tx.amount.toLocaleString()} ₺</p>
                      <p className="text-xs text-emerald-400">{tx.status === 'Onaylandı' ? t('approved') : tx.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {activeTab === 'contracts' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Contracts auth={auth} />
            </motion.div>
          )}
          {activeTab === 'documents' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Documents auth={auth} />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Settings auth={auth} setAuth={setAuth} />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
