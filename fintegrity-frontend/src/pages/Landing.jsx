import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, FileText, Activity, Zap, ArrowRight, Database, Users, HelpCircle } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { useLanguage } from '../LanguageContext';

export default function Landing({ onNavigateToLogin }) {
  const { lang, changeLang, t } = useLanguage();
  const [stats, setStats] = useState({ documents: 0, contracts: 0, anomalies: 0, tps: 0 });
  const [chainConnected, setChainConnected] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/stats`);
        setStats(res.data);
        
        try {
          const chainRes = await axios.get(`${BACKEND_URL}/api/stats/chain-info`);
          setChainConnected(chainRes.data.connected);
        } catch (_) {
          setChainConnected(false);
        }
      } catch (err) {
        // Fallback mock stats if backend is offline
        setStats({ documents: 184, contracts: 24, anomalies: 3, tps: 4.8 });
        setChainConnected(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans relative overflow-x-hidden selection:bg-blue-500/30">
      
      {/* Background glowing decorations */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-500/10 blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[450px] h-[450px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header / Navbar */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-emerald-500 p-2.5 rounded-2xl shadow-lg shadow-blue-500/10">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">FINTEGRITY</span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Blockchain Network Status */}
          <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl px-4 py-2 text-xs text-slate-300 font-medium">
            <div className={`w-2 h-2 rounded-full ${chainConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className="hidden sm:inline">
              {lang === 'TR' ? 'Blockchain Ağ Durumu:' : 'Blockchain Network Status:'}
            </span>
            <span className={chainConnected ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {chainConnected ? (lang === 'TR' ? 'Aktif' : 'Active') : (lang === 'TR' ? 'Bağlantı Yok' : 'Offline')}
            </span>
          </div>

          {/* Language Switcher */}
          <div className="flex bg-slate-800/40 border border-slate-700/50 rounded-2xl p-1 text-xs">
            <button
              onClick={() => changeLang('TR')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                lang === 'TR'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              TR
            </button>
            <button
              onClick={() => changeLang('EN')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                lang === 'EN'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>

          <button
            onClick={onNavigateToLogin}
            className="hidden sm:inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-2.5 rounded-xl border border-slate-700/60 shadow-md transition-all text-sm cursor-pointer"
          >
            {t('landing_get_started')}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight max-w-4xl mx-auto">
            {t('landing_hero_title')}
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto font-normal">
            {t('landing_hero_subtitle')}
          </p>

          <div className="pt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={onNavigateToLogin}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-extrabold px-8 py-4 rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-3 text-lg cursor-pointer transform hover:-translate-y-0.5"
            >
              {t('landing_get_started')}
              <ArrowRight size={20} />
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white font-bold px-8 py-4 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 text-lg"
            >
              {t('landing_explore_features')}
            </a>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-800/60 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Feature 1 */}
          <motion.div
            whileHover={{ scale: 1.02, y: -6 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="glass-panel p-8 rounded-3xl border border-slate-700/40 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-xl rounded-full group-hover:bg-blue-500/20 transition-all" />
            <div className="p-4 bg-blue-500/20 rounded-2xl w-max text-blue-400 mb-6">
              <Database size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{t('landing_feature_1_title')}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{t('landing_feature_1_desc')}</p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            whileHover={{ scale: 1.02, y: -6 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="glass-panel p-8 rounded-3xl border border-slate-700/40 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-xl rounded-full group-hover:bg-purple-500/20 transition-all" />
            <div className="p-4 bg-purple-500/20 rounded-2xl w-max text-purple-400 mb-6">
              <Activity size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{t('landing_feature_2_title')}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{t('landing_feature_2_desc')}</p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            whileHover={{ scale: 1.02, y: -6 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="glass-panel p-8 rounded-3xl border border-slate-700/40 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-xl rounded-full group-hover:bg-emerald-500/20 transition-all" />
            <div className="p-4 bg-emerald-500/20 rounded-2xl w-max text-emerald-400 mb-6">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{t('landing_feature_3_title')}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{t('landing_feature_3_desc')}</p>
          </motion.div>

        </div>
      </section>

      {/* Network Stats Counter Section */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-slate-800/60 relative z-10 text-center space-y-10">
        <div>
          <h2 className="text-3xl font-black text-white">{t('landing_stats_title')}</h2>
          <p className="text-slate-400 mt-2">{t('landing_stats_desc')}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700/30">
            <p className="text-3xl font-black text-white font-mono">{stats.documents}</p>
            <p className="text-xs text-slate-500 uppercase mt-2">{t('total_docs')}</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-slate-700/30">
            <p className="text-3xl font-black text-white font-mono">{stats.contracts}</p>
            <p className="text-xs text-slate-500 uppercase mt-2">{t('total_contracts')}</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-slate-700/30">
            <p className="text-3xl font-black text-white font-mono">{stats.anomalies}</p>
            <p className="text-xs text-slate-500 uppercase mt-2">{t('anomalies_detected')}</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-slate-700/30">
            <p className="text-3xl font-black text-white font-mono">{stats.tps} TPS</p>
            <p className="text-xs text-slate-500 uppercase mt-2">{t('live_tps')}</p>
          </div>
        </div>


      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-800/60 relative z-10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
        <div>
          © {new Date().getFullYear()} FINTEGRITY. {lang === 'TR' ? 'Tüm Hakları Saklıdır.' : 'All Rights Reserved.'}
        </div>
        <div className="flex gap-6">
          <a href="#features" className="hover:text-slate-400 transition-colors">{lang === 'TR' ? 'Özellikler' : 'Features'}</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToLogin(); }} className="hover:text-slate-400 transition-colors">{t('landing_get_started')}</a>
          <span className="flex items-center gap-1"><HelpCircle size={12}/> {t('landing_contact_support')}</span>
        </div>
      </footer>

    </div>
  );
}
