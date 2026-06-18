import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Search, X, Activity, DollarSign, Calendar, Hash, Download, Filter, ArrowUpDown } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

export default function Anomalies() {
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [anomaliesList, setAnomaliesList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('id'); // 'id', 'account', 'amount', 'score', 'risk', 'status'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  const fetchAnomalies = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/anomalies`);
      setAnomaliesList(res.data);
    } catch (err) {
      console.error("Anomaliler yüklenemedi", err);
    }
  };

  useEffect(() => {
    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id, type) => {
    try {
      const newStatus = type === 'safe' ? 'Güvenli' : 'Donduruldu';
      await axios.put(`${BACKEND_URL}/api/anomalies/${id}/resolve`, {
        status: newStatus
      });
      setAnomaliesList(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      setSelectedAnomaly(null);
    } catch {
      alert("İşlem sırasında bir hata oluştu.");
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedAnomalies = useMemo(() => {
    let result = anomaliesList.filter(anm => {
      const matchesSearch = anm.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            anm.account.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRisk = riskFilter === 'all' || anm.risk === riskFilter;
      const matchesStatus = statusFilter === 'all' || anm.status === statusFilter;
      return matchesSearch && matchesRisk && matchesStatus;
    });

    result = result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [anomaliesList, searchTerm, riskFilter, statusFilter, sortField, sortDirection]);

  const exportToCSV = () => {
    if (filteredAndSortedAnomalies.length === 0) return;
    const headers = ["ID", "Hesap/Kurum", "Tutar (TL)", "Risk Skoru", "Risk Seviyesi", "Durum", "Tarih", "TxHash"];
    const rows = filteredAndSortedAnomalies.map(anm => [
      anm.id,
      anm.account,
      anm.amount,
      anm.score,
      anm.risk,
      anm.status,
      anm.date || '',
      anm.txHash || ''
    ]);
    const csvContent = [headers.join(";"), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `anomaliler_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 pb-10"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <AlertTriangle className="text-rose-400" size={32} />
            Yapay Zeka Anomali Tespiti
          </h1>
          <p className="text-slate-400 mt-2">Derin Öğrenme modelleri tarafından tespit edilen şüpheli finansal işlemler.</p>
        </div>

        {/* Filtreleme ve Arama Çubuğu */}
        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="ID veya Kurum ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-rose-500 w-full md:w-60 transition-colors text-sm"
            />
          </div>

          <div className="flex bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="flex items-center pl-3 pr-2 border-r border-slate-700 text-slate-400">
              <Filter size={16} />
            </div>
            <select 
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-transparent text-slate-200 py-2 pl-2 pr-8 focus:outline-none cursor-pointer appearance-none text-sm animate-none"
            >
              <option value="all" className="bg-slate-800">Tüm Seviyeler</option>
              <option value="Kritik" className="bg-slate-800">Kritik</option>
              <option value="Yüksek" className="bg-slate-800">Yüksek</option>
              <option value="Orta" className="bg-slate-800">Orta</option>
              <option value="Düşük" className="bg-slate-800">Düşük</option>
            </select>
          </div>

          <div className="flex bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="flex items-center pl-3 pr-2 border-r border-slate-700 text-slate-400">
              <Activity size={16} />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 py-2 pl-2 pr-8 focus:outline-none cursor-pointer appearance-none text-sm animate-none"
            >
              <option value="all" className="bg-slate-800">Tüm Durumlar</option>
              <option value="Beklemede" className="bg-slate-800">Beklemede</option>
              <option value="Güvenli" className="bg-slate-800">Güvenli</option>
              <option value="Donduruldu" className="bg-slate-800">Donduruldu</option>
            </select>
          </div>

          <button 
            onClick={exportToCSV}
            disabled={filteredAndSortedAnomalies.length === 0}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl border border-slate-700 transition-all shadow-md text-sm"
          >
            <Download size={16} /> Dışa Aktar
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300 min-w-[800px]">
            <thead className="bg-slate-800/50 border-b border-slate-700 text-slate-400 text-sm">
              <tr>
                <th onClick={() => handleSort('id')} className="p-4 font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-1">
                    Anomali ID <ArrowUpDown size={14} className="opacity-50" />
                  </div>
                </th>
                <th onClick={() => handleSort('account')} className="p-4 font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-1">
                    Hesap / Kurum <ArrowUpDown size={14} className="opacity-50" />
                  </div>
                </th>
                <th onClick={() => handleSort('amount')} className="p-4 font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-1">
                    Tutar (₺) <ArrowUpDown size={14} className="opacity-50" />
                  </div>
                </th>
                <th onClick={() => handleSort('score')} className="p-4 font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-1">
                    Risk Skoru <ArrowUpDown size={14} className="opacity-50" />
                  </div>
                </th>
                <th onClick={() => handleSort('risk')} className="p-4 font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-1">
                    Seviye <ArrowUpDown size={14} className="opacity-50" />
                  </div>
                </th>
                <th onClick={() => handleSort('status')} className="p-4 font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-1">
                    Durum <ArrowUpDown size={14} className="opacity-50" />
                  </div>
                </th>
                <th className="p-4 font-semibold">Eylem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredAndSortedAnomalies.map((anm) => (
                <tr key={anm.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="p-4 font-mono font-medium text-white">{anm.id}</td>
                  <td className="p-4 font-mono text-sm">{anm.account}</td>
                  <td className="p-4 font-semibold text-white">{anm.amount.toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${anm.score > 0.9 ? 'bg-rose-500' : anm.score > 0.8 ? 'bg-orange-500' : 'bg-amber-500'}`} 
                          style={{ width: `${anm.score * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs">{(anm.score * 100).toFixed(0)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      anm.risk === 'Kritik' ? 'bg-red-500 text-white' :
                      anm.risk === 'Yüksek' ? 'bg-rose-500/20 text-rose-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {anm.risk}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${anm.status === 'Beklemede' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : anm.status === 'Güvenli' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                      {anm.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => setSelectedAnomaly(anm)}
                      className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded transition-colors"
                    >
                      İncele
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAndSortedAnomalies.length === 0 && (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500">
            <Search size={48} className="mb-4 opacity-20" />
            <p>Seçilen filtrelere uygun anomali bulunamadı.</p>
            <button 
              onClick={() => { setSearchTerm(''); setRiskFilter('all'); setStatusFilter('all'); setSortField('id'); setSortDirection('asc'); }}
              className="mt-4 text-rose-400 hover:text-rose-300 text-sm font-medium"
            >
              Filtreleri Temizle
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedAnomaly && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#1e293b] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-700/50 bg-slate-800/50">
                <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                  <Activity size={20} className="text-rose-400"/> {selectedAnomaly.id} İncelemesi
                </h3>
                <button onClick={() => setSelectedAnomaly(null)} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">Risk Seviyesi</p>
                    <span className={`px-3 py-1 rounded text-sm font-bold inline-block ${
                      selectedAnomaly.risk === 'Kritik' ? 'bg-red-500 text-white' :
                      selectedAnomaly.risk === 'Yüksek' ? 'bg-rose-500/20 text-rose-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {selectedAnomaly.risk}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase mb-1">Yapay Zeka Güven Skoru</p>
                    <p className="text-2xl font-mono font-bold text-white">{(selectedAnomaly.score * 100).toFixed(1)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-1"><DollarSign size={14}/> Tutar</p>
                    <p className="font-bold text-emerald-400 text-lg">{selectedAnomaly.amount.toLocaleString()} ₺</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-1"><Calendar size={14}/> Tarih</p>
                    <p className="font-medium text-white">{selectedAnomaly.date}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-2"><Hash size={14}/> İlgili İşlem (TxHash)</p>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 break-all">
                    <p className="font-mono text-xs text-blue-400">{selectedAnomaly.txHash}9a8b7c6d5e4f3g</p>
                  </div>
                </div>

                {selectedAnomaly.status === 'Beklemede' ? (
                  <div className="flex gap-4 pt-4 border-t border-slate-700/50">
                    <button 
                      onClick={() => handleAction(selectedAnomaly.id, 'safe')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      Güvenli İşaretle
                    </button>
                    <button 
                      onClick={() => handleAction(selectedAnomaly.id, 'freeze')}
                      className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-rose-500/20"
                    >
                      İşlemi Dondur
                    </button>
                  </div>
                ) : (
                  <div className={`p-4 rounded-xl text-center font-bold border ${selectedAnomaly.status === 'Güvenli' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                    Bu anomali daha önce '{selectedAnomaly.status}' olarak işaretlenmiş.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
