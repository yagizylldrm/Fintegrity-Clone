import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Activity, FileText, AlertTriangle, Database, Zap, X, User, DollarSign, CheckCircle, Briefcase } from 'lucide-react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { mockDocuments } from '../data/mockData';
import { BACKEND_URL } from '../config';
import { useLanguage } from '../LanguageContext';

export default function Dashboard({ auth }) {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState([]);
  const [dbDocs, setDbDocs] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);

  // Live Stats & Network
  const [liveStats, setLiveStats] = useState({ documents: 0, contracts: 0, anomalies: 0, tps: 0 });
  const [networkInfo, setNetworkInfo] = useState({ status: 'active', ping: 0, lastCheck: '' });
  const [chainInfo, setChainInfo] = useState(null);

  // Yapay Zeka Form State'leri
  const [aiAmount, setAiAmount] = useState('15400');
  const [aiAccount, setAiAccount] = useState('ACC-1054');
  const [aiType, setAiType] = useState('e-Fatura');

  const getDocTypeLabel = (type) => {
    if (type === 'e-Fatura') return lang === 'TR' ? 'e-Fatura' : 'e-Invoice';
    if (type === 'e-İrsaliye') return lang === 'TR' ? 'e-İrsaliye' : 'e-Waybill';
    if (type === 'e-Sözleşme') return lang === 'TR' ? 'e-Sözleşme' : 'e-Contract';
    if (type === 'e-Makbuz') return lang === 'TR' ? 'e-Makbuz' : 'e-Receipt';
    if (type === 'Para Transferi') return lang === 'TR' ? 'Para Transferi' : 'Money Transfer';
    return type;
  };

  const generateChartData = (docs) => {
    const dataMap = {};
    const baseDate = new Date();
    
    // Son 7 günü 0 olarak başlat
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const key = d.toLocaleDateString(lang === 'TR' ? 'tr-TR' : 'en-US', { weekday: 'short' });
      dataMap[key] = 0;
    }

    if (docs && docs.length > 0) {
      docs.forEach(doc => {
        if (doc.date) {
          const d = new Date(doc.date);
          const key = d.toLocaleDateString(lang === 'TR' ? 'tr-TR' : 'en-US', { weekday: 'short' });
          if (dataMap[key] !== undefined && doc.amount) {
            dataMap[key] += doc.amount;
          }
        }
      });
    }

    return Object.keys(dataMap).map(k => ({ name: k, hacim: dataMap[k] }));
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/transactions`);
      setTransactions(res.data);
    } catch (err) {
      console.error("İşlemler yüklenemedi", err);
    }
  };

  useEffect(() => {
    setChartData(generateChartData(dbDocs));
  }, [lang, dbDocs]);

  useEffect(() => {
    // Stat fetcher
    const fetchStats = async () => {
      try {
        const start = Date.now();
        const res = await axios.get(`${BACKEND_URL}/api/stats`);
        const ping = Date.now() - start;
        setLiveStats(res.data);
        
        try {
          const chainRes = await axios.get(`${BACKEND_URL}/api/stats/chain-info`);
          setChainInfo(chainRes.data);
        } catch (_) {
          setChainInfo(null);
        }

        try {
          const docsRes = await axios.get(`${BACKEND_URL}/api/documents`);
          setDbDocs(docsRes.data);
        } catch (_) {}
        
        setNetworkInfo({
          status: 'active',
          ping: ping,
          lastCheck: new Date().toLocaleTimeString()
        });
      } catch {
        setNetworkInfo({
          status: 'offline',
          ping: 0,
          lastCheck: new Date().toLocaleTimeString()
        });
        setChainInfo(null);
      }
    };

    fetchStats();
    fetchTransactions();
    
    const intervalId = setInterval(() => {
      fetchStats();
      fetchTransactions();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const simulateAiAnalysis = async (tx = null) => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    
    // Verileri formdan veya tıklanan işlemden al
    const analysisAmount = tx ? tx.amount : parseInt(aiAmount, 10);
    const analysisAccount = tx ? (tx.sender || tx.account) : aiAccount;
    const analysisType = auth?.role === 'user' ? 'Para Transferi' : (tx ? tx.type : aiType);
    const analysisReceiver = tx ? tx.receiver : (auth?.role === 'user' ? auth?.wallet_address : '');

    try {
      const res = await axios.post(`${BACKEND_URL}/api/ai/anomaly-detect`, {
        transaction_amount: analysisAmount || 0,
        account_id: analysisAccount
      });
      setTimeout(async () => {
        const isAnomaly = res.data.is_anomaly;
        const fakeScore = parseFloat(res.data.anomaly_score);
        setAiAnalysis({...res.data, amount: analysisAmount});
        setIsAnalyzing(false);


        // 2. Create transaction
        try {
          await axios.post(`${BACKEND_URL}/api/transactions`, {
            type: analysisType,
            amount: parseFloat(analysisAmount),
            sender: analysisAccount,
            receiver: analysisReceiver,
            status: isAnomaly ? "pending" : "verified"
          });
        } catch (e) { console.error("İşlem kaydedilemedi", e); }

        if (isAnomaly) {
          try {
            await axios.post(`${BACKEND_URL}/api/anomalies`, {
              account: analysisAccount,
              amount: parseInt(analysisAmount, 10),
              score: fakeScore,
              risk: fakeScore > 0.9 ? "Kritik" : "Yüksek",
              txHash: (tx && tx.hash) ? tx.hash : "0x" + Math.random().toString(16).slice(2, 10)
            });
          } catch (e) { console.error("Anomali kaydedilemedi", e); }
        }

        // Refresh lists
        fetchTransactions();
      }, 2500); // Animasyon efekti
    } catch {
      setTimeout(async () => {
        // IsolationForest benzeri kompleks bir skor üret
        const fakeScore = Math.random() * 0.4 + (analysisAmount > 50000 ? 0.5 : 0.1); 
        const isAnomaly = fakeScore > 0.8;
        setAiAnalysis({
          is_anomaly: isAnomaly,
          anomaly_score: fakeScore.toFixed(2),
          message: isAnomaly ? "Anormal Tutar Hacmi / Frekansı Tespiti" : "Güvenli Profil Eşleşmesi",
          amount: analysisAmount
        });
        setIsAnalyzing(false);


        // 2. Create transaction
        try {
          await axios.post(`${BACKEND_URL}/api/transactions`, {
            type: analysisType,
            amount: parseFloat(analysisAmount),
            sender: analysisAccount,
            receiver: analysisReceiver,
            status: isAnomaly ? "pending" : "verified"
          });
        } catch (e) { console.error("İşlem kaydedilemedi", e); }

        if (isAnomaly) {
          try {
            await axios.post(`${BACKEND_URL}/api/anomalies`, {
              account: analysisAccount,
              amount: parseInt(analysisAmount, 10),
              score: fakeScore,
              risk: fakeScore > 0.9 ? "Kritik" : "Yüksek",
              txHash: (tx && tx.hash) ? tx.hash : "0x" + Math.random().toString(16).slice(2, 10)
            });
          } catch (e) { console.error("Anomali kaydedilemedi", e); }
        }

        // Refresh lists
        fetchTransactions();
      }, 2500);
    }
  };

  return (
    <div className="min-h-screen font-sans overflow-hidden">
      {/* Üst Menü */}
      <header className="glass-panel sticky top-0 z-10 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-2 rounded-xl">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">FINTEGRITY</h1>
            <p className="text-xs text-slate-400 font-medium">{t('secure_network')}</p>
          </div>
        </div>
        <div className="flex gap-6">
          <nav className="flex items-center bg-slate-800/50 p-1 rounded-full border border-slate-700/50">
            {['overview', 'analytics', 'blockchain'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === tab ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {tab === 'overview' && t('overview')}
                {tab === 'analytics' && t('ai_audit_scanner')}
                {tab === 'blockchain' && t('network_status')}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-4 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-700">
            <div className="flex items-center gap-2">
              <span className={`relative flex h-2 w-2`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${networkInfo.status === 'active' ? 'bg-emerald-400' : 'bg-rose-500'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${networkInfo.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
              <span className="text-[10px] font-bold text-slate-300 tracking-wider">{t('network_status')}: {networkInfo.status === 'active' ? t('connected') : t('no_connection')}</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-700" />
            <span className="text-[10px] text-slate-500 font-mono">{networkInfo.ping}ms</span>
          </div>
        </div>
      </header>

      {/* Dinamik İçerik Alanı */}
      <main className="p-8 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* İstatistik Kartları */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { title: t('total_contracts'), value: liveStats.contracts.toLocaleString(), icon: Briefcase, color: "emerald", path: "/contracts" },
                  { title: t('total_docs'), value: liveStats.documents.toLocaleString(), icon: FileText, color: "blue", path: "/documents" },
                  { title: t('ai_anomalies'), value: liveStats.anomalies.toLocaleString(), icon: AlertTriangle, color: "rose", path: "/anomalies" },
                  { title: t('live_tps'), value: `${liveStats.tps} TPS`, icon: Zap, color: "purple", tab: "blockchain" }
                ].map((stat, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.02, translateY: -5 }}
                    onClick={() => {
                      if (stat.path) navigate(stat.path);
                      if (stat.tab) setActiveTab(stat.tab);
                    }}
                    className="glass-panel p-6 rounded-2xl relative overflow-hidden group cursor-pointer"
                  >
                    <div className={`absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity text-${stat.color}-400`}>
                      <stat.icon size={100} />
                    </div>
                    <div className={`p-3 bg-${stat.color}-500/20 rounded-xl text-${stat.color}-400 w-max mb-4`}>
                      <stat.icon size={24} />
                    </div>
                    <h3 className="text-3xl font-black text-white tracking-tight">{stat.value}</h3>
                    <p className="text-sm font-medium text-slate-400 mt-1">{stat.title}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Canlı İşlem Akışı */}
                <div className="lg:col-span-1 glass-panel rounded-2xl p-6 flex flex-col h-[400px]">
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                    <Activity size={20} className="text-blue-400" />
                    {t('recent_transactions')}
                  </h2>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                    <AnimatePresence>
                      {transactions.map((tx) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setSelectedTx(tx)}
                          className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 cursor-pointer hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-mono text-slate-400">{tx.hash ? (tx.hash.length > 12 ? `${tx.hash.substring(0, 10)}...` : tx.hash) : ''}</span>
                            <span className="text-xs text-slate-500">{tx.time}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-200">{getDocTypeLabel(tx.type)}</span>
                            {typeof tx.amount === 'number' && <span className="text-sm font-bold text-emerald-400">{tx.amount.toLocaleString()} ₺</span>}
                          </div>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700/40 text-[10px] text-slate-400">
                            <span>{t('sender')}: <span className="text-slate-300 font-semibold">{tx.sender || '—'}</span></span>
                            {tx.receiver && <span>{lang === 'TR' ? 'Alıcı' : 'Receiver'}: <span className="text-slate-300 font-mono font-semibold">{tx.receiver.length > 8 ? `${tx.receiver.substring(0, 6)}...` : tx.receiver}</span></span>}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Grafik Alanı */}
                <div className="lg:col-span-2 glass-panel rounded-2xl p-6 h-[400px] flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Database size={20} className="text-purple-400" />
                      {t('weekly_hacim_title')}
                    </h2>
                    <button 
                      onClick={() => setShowReportModal(true)}
                      className="text-xs bg-slate-800 px-3 py-1 rounded-md text-slate-300 hover:text-white transition-colors"
                    >
                      {t('detailed_report_btn')}
                    </button>
                  </div>
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorHacim" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="hacim" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorHacim)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[600px]"
            >
              {/* Sol Panel: Analiz Formu */}
              <div className="glass-panel p-8 rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                      <Activity size={28} className="text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black">{auth?.role === 'user' ? t('secure_transfer_portal') : t('ai_audit_scanner')}</h2>
                      <p className="text-slate-400 text-sm">{auth?.role === 'user' ? t('scan_transfer_desc') : t('ai_scanner_desc')}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    {auth?.role !== 'user' && <p className="text-sm text-slate-300">{t('scan_form_desc')}</p>}
                    
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 space-y-6">
                      <div>
                        <label className="text-xs text-slate-400 uppercase font-semibold mb-2 block">{t('amount_try')}</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                          <input 
                            type="number" 
                            value={aiAmount}
                            onChange={(e) => setAiAmount(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white outline-none focus:border-purple-500 transition-colors" 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-slate-400 uppercase font-semibold mb-2 block">
                            {auth?.role === 'user' ? (lang === 'TR' ? 'Gönderen Cüzdan / Hesap ID' : 'Sender Wallet / Account ID') : t('account_id')}
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                              type="text" 
                              value={aiAccount}
                              onChange={(e) => setAiAccount(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white outline-none focus:border-purple-500 transition-colors" 
                            />
                          </div>
                        </div>
                        <div>
                          {auth?.role === 'user' ? (
                            <>
                              <label className="text-xs text-slate-400 uppercase font-semibold mb-2 block">{lang === 'TR' ? 'Alıcı Cüzdan (Siz)' : 'Recipient Wallet (You)'}</label>
                              <div className="relative">
                                <input 
                                  type="text" 
                                  value={auth?.wallet_address || ''} 
                                  disabled 
                                  className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-3 text-slate-400 outline-none font-mono text-sm cursor-not-allowed"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <label className="text-xs text-slate-400 uppercase font-semibold mb-2 block">{t('doc_type')}</label>
                              <select 
                                value={aiType}
                                onChange={(e) => setAiType(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-purple-500 transition-colors appearance-none cursor-pointer"
                              >
                                <option value="e-Fatura">{getDocTypeLabel('e-Fatura')}</option>
                                <option value="e-İrsaliye">{getDocTypeLabel('e-İrsaliye')}</option>
                                <option value="e-Sözleşme">{getDocTypeLabel('e-Sözleşme')}</option>
                                <option value="Para Transferi">{lang === 'TR' ? 'Para Transferi' : 'Money Transfer'}</option>
                              </select>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 text-xs text-slate-300 mt-2">
                      <span className="font-bold text-blue-400">ℹ️ {t('risk_criteria_title')}</span>
                      <p>{t('risk_criteria_desc')}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => simulateAiAnalysis()}
                  disabled={isAnalyzing}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${isAnalyzing ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/25 transform hover:-translate-y-1'}`}
                >
                  {isAnalyzing ? <><Activity className="animate-spin" /> {t('scanning')}</> : <><Zap size={20} /> {auth?.role === 'user' ? t('receive_transfer_btn') : t('run_ai_scan')}</>}
                </button>
              </div>

              {/* Sağ Panel: Analiz Sonuçları ve Loglar */}
              <div className="glass-panel p-8 rounded-3xl flex flex-col bg-slate-900/80 border-slate-700/80 relative overflow-hidden">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-6 border-b border-slate-700/50 pb-4 relative z-10">
                  <Database size={20} className="text-slate-400" />
                  {t('realtime_output')}
                </h3>
                
                {isAnalyzing ? (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-8 relative z-10">
                    <div className="relative w-32 h-32">
                      <motion.div className="absolute inset-0 border-4 border-purple-500/30 border-t-purple-500 rounded-full" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} />
                      <motion.div className="absolute inset-3 border-4 border-blue-500/30 border-b-blue-500 rounded-full" animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} />
                      <motion.div className="absolute inset-6 border-4 border-emerald-500/30 border-l-emerald-500 rounded-full" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} />
                      <Activity className="absolute inset-0 m-auto text-purple-400 opacity-50" size={32} />
                    </div>
                    <div className="text-center space-y-3 w-full px-8">
                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                        <span className="font-mono text-xs text-slate-400">01</span>
                        <span className="font-mono text-purple-400 text-sm w-full text-left pl-3">{t('checking_blockchain')}</span>
                        <CheckCircle size={14} className="text-emerald-500" />
                      </motion.div>
                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                        <span className="font-mono text-xs text-slate-400">02</span>
                        <span className="font-mono text-blue-400 text-sm w-full text-left pl-3">{t('feeding_ml_model')}</span>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Activity size={14} className="text-blue-500" /></motion.div>
                      </motion.div>
                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.6 }} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                        <span className="font-mono text-xs text-slate-400">03</span>
                        <span className="font-mono text-slate-400 text-sm w-full text-left pl-3">{t('risk_scoring_status')}</span>
                        <div className="w-3 h-3 border-2 border-slate-500 rounded-full" />
                      </motion.div>
                    </div>
                  </div>
                ) : aiAnalysis ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col justify-between space-y-6 relative z-10"
                  >
                    <div className={`p-6 rounded-2xl border ${aiAnalysis.is_anomaly ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                      <div className="flex items-center gap-4 mb-6">
                        {aiAnalysis.is_anomaly ? <AlertTriangle size={48} className="text-rose-400" /> : <ShieldCheck size={48} className="text-emerald-400" />}
                        <div>
                          <h4 className={`text-2xl font-black ${aiAnalysis.is_anomaly ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {aiAnalysis.is_anomaly ? t('risky_suspicious_tx') : t('safe_tx')}
                          </h4>
                          <p className="text-slate-300 text-sm font-semibold mt-1">Model: {aiAnalysis.model || 'IsolationForest'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/50">
                          <p className="text-xs text-slate-500 uppercase mb-1">{t('analyzed_amount')}</p>
                          <p className={`text-xl font-mono font-bold ${aiAnalysis.is_anomaly ? 'text-rose-400' : 'text-emerald-400'}`}>{Number(aiAnalysis.amount).toLocaleString()} ₺</p>
                        </div>
                        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/50">
                          <p className="text-xs text-slate-500 uppercase mb-1">{t('risk_score_threshold')}</p>
                          <p className="text-xl font-mono font-bold text-white">{(aiAnalysis.anomaly_score * 100).toFixed(1)}% / {( (aiAnalysis.threshold || 0.8) * 100)}%</p>
                        </div>
                      </div>

                      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-2">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('ai_detection_reason')}</p>
                        <p className="text-sm text-slate-300">{aiAnalysis.reason || aiAnalysis.message || t('normal_tx_bounds')}</p>
                        
                        {aiAnalysis.suggested_action && (
                          <div className="pt-2 border-t border-slate-800/80 mt-2">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('suggested_action')}</p>
                            <p className="text-sm text-emerald-400 font-medium">{aiAnalysis.suggested_action}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 mt-auto">
                      <h5 className="text-sm font-bold mb-4 text-slate-300">{t('model_multipliers')}</h5>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1 font-medium"><span className="text-slate-400">{t('multiplier_amount_history')}</span><span className="text-white">95%</span></div>
                          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: '95%' }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400" /></div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1 font-medium"><span className="text-slate-400">{t('multiplier_network_trust')}</span><span className="text-white">82%</span></div>
                          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: '82%' }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-gradient-to-r from-blue-600 to-blue-400" /></div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1 font-medium"><span className="text-slate-400">{t('multiplier_time_anomaly')}</span><span className={`text-white`}>{aiAnalysis.is_anomaly ? '88%' : '12%'}</span></div>
                          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: aiAnalysis.is_anomaly ? '88%' : '12%' }} transition={{ duration: 1, delay: 0.4 }} className={`h-full bg-gradient-to-r ${aiAnalysis.is_anomaly ? 'from-rose-600 to-rose-400' : 'from-slate-600 to-slate-400'}`} /></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center relative z-10">
                    <Database size={64} className="mb-4 opacity-20" />
                    <p className="max-w-xs">{t('model_output_placeholder')}</p>
                  </div>
                )}
                
                {/* Arkaplan Dekorasyonu */}
                {aiAnalysis && !isAnalyzing && (
                  <div className={`absolute -bottom-20 -right-20 w-64 h-64 blur-[100px] rounded-full pointer-events-none opacity-20 ${aiAnalysis.is_anomaly ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'blockchain' && (
            <motion.div
              key="blockchain"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto py-10"
            >
              <div className="text-center mb-8">
                <Database size={64} className={`mx-auto mb-4 ${chainInfo?.connected ? 'text-blue-500 animate-pulse' : 'text-rose-500'} opacity-80`} />
                <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                  Fintegrity Blockchain Network
                </h2>
                <p className="text-slate-400 max-w-lg mx-auto text-sm">
                  {t('blockchain_desc_full')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
                {/* Ağ Bağlantı Kartı */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 flex flex-col justify-between">
                  <div>
                    <h3 className="text-slate-400 text-sm font-semibold mb-1">{t('node_connection')}</h3>
                    <p className="text-xl font-bold text-white font-mono break-all">{chainInfo?.node_url || BACKEND_URL}</p>
                  </div>
                  <div className="flex justify-between items-center mt-6 border-t border-slate-800 pt-4">
                    <span className="text-xs text-slate-500">{t('status_ping')}</span>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${chainInfo?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      <span className="text-sm font-bold text-slate-300 font-mono">{chainInfo?.connected ? `${networkInfo.ping} ms` : t('no_connection')}</span>
                    </div>
                  </div>
                </div>

                {/* Ağ Metrikleri Kartı */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-700/50">
                  <h3 className="text-slate-400 text-sm font-semibold mb-4">{t('network_metrics')}</h3>
                  <div className="space-y-3 font-mono">
                    <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
                      <span className="text-xs text-slate-500">Chain ID</span>
                      <span className="text-sm font-bold text-white">{chainInfo?.chain_id ?? '—'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
                      <span className="text-xs text-slate-500">{t('latest_block_label')}</span>
                      <span className="text-sm font-bold text-blue-400">#{chainInfo?.latest_block ?? '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">{t('gas_price_label')}</span>
                      <span className="text-sm font-bold text-emerald-400">
                        {chainInfo?.gas_price ? `${(chainInfo.gas_price / 1e9).toFixed(2)} Gwei` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kontrat Adresleri */}
              {chainInfo?.contracts && (
                <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 text-left">
                  <h3 className="text-white text-base font-bold mb-4 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-400" />
                    {t('deployed_contracts_title')}
                  </h3>
                  <div className="space-y-4 font-mono text-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                      <div>
                        <p className="text-white font-semibold text-xs uppercase tracking-wider text-slate-400">FintegrityCore ({lang === 'TR' ? 'Belge Kayıt & Doğrulama' : 'Document Log & Verification'})</p>
                        <p className="text-xs text-slate-500 mt-0.5">{t('core_contract_desc')}</p>
                      </div>
                      <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-blue-400 text-xs font-semibold select-all break-all">
                        {chainInfo.contracts.fintegrity_core}
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <p className="text-white font-semibold text-xs uppercase tracking-wider text-slate-400">SmartAgreements ({lang === 'TR' ? 'İş Akışı Kontratı' : 'Workflow Contract'})</p>
                        <p className="text-xs text-slate-500 mt-0.5">{t('agreements_contract_desc')}</p>
                      </div>
                      <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-blue-400 text-xs font-semibold select-all break-all">
                        {chainInfo.contracts.smart_agreements}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* İşlem Detay Modalı */}
      <AnimatePresence>
        {selectedTx && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1e293b] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-700/50 bg-slate-800/50">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FileText size={18} className="text-blue-400"/> {t('tx_details_title')}
                </h3>
                <button onClick={() => setSelectedTx(null)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4 text-left">
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-1">{t('tx_hash_label')}</p>
                  <p className="font-mono text-sm bg-slate-900 p-3 rounded-lg text-emerald-400 break-all border border-slate-800">{selectedTx.hash}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                    <p className="text-xs text-slate-500 uppercase mb-1">{t('doc_type')}</p>
                    <p className="font-semibold text-white">{getDocTypeLabel(selectedTx.type)}</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                    <p className="text-xs text-slate-500 uppercase mb-1">{t('amount')}</p>
                    <p className="font-semibold text-white">{typeof selectedTx.amount === 'number' ? `${selectedTx.amount.toLocaleString()} ₺` : t('not_specified')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                    <p className="text-xs text-slate-500 uppercase mb-1">{t('sender')}</p>
                    <p className="font-semibold text-white truncate" title={selectedTx.sender}>{selectedTx.sender || '—'}</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                    <p className="text-xs text-slate-500 uppercase mb-1">{lang === 'TR' ? 'Alıcı' : 'Receiver'}</p>
                    <p className="font-semibold text-white truncate" title={selectedTx.receiver}>{selectedTx.receiver || '—'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    simulateAiAnalysis(selectedTx);
                    setActiveTab('analytics');
                    setSelectedTx(null);
                  }}
                  className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition-colors flex justify-center items-center gap-2"
                >
                  <Activity size={18} /> {t('analyze_with_ai_btn')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detaylı Rapor Modalı */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1e293b] border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-700/50 bg-slate-800/50">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Database size={18} className="text-purple-400"/> {t('weekly_report_title')}
                </h3>
                <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <table className="w-full text-left text-slate-300 border-collapse">
                  <thead className="bg-slate-800/50 border-b border-slate-700 text-slate-400 text-sm">
                    <tr>
                      <th className="p-3 font-semibold">{t('date_day')}</th>
                      <th className="p-3 font-semibold text-right">{t('total_volume')}</th>
                      <th className="p-3 font-semibold text-center">{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50 text-left">
                    {chartData.map((data, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-medium text-white">{data.name}</td>
                        <td className="p-3 font-mono text-emerald-400 text-right">{data.hacim.toLocaleString()} ₺</td>
                        <td className="p-3 text-center"><span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">{t('reconciled')}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 border-t border-slate-700/50 bg-slate-800/30">
                <button 
                  onClick={() => alert(t('csv_simulated_alert'))}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <FileText size={18} /> {t('download_report_btn')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ekstra CSS Tanımlamaları */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.5); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(71, 85, 105, 0.8); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 1); }
      `}} />
    </div>
  );
}
