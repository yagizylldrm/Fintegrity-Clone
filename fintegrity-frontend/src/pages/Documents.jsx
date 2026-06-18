import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, Filter, ArrowUpDown, X, Hash, Calendar, DollarSign, User, ShieldCheck, Plus, Download } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { useLanguage } from '../LanguageContext';

const formatDocDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split(' ');
  const datePart = parts[0];
  const timePart = parts[1] || '';
  
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  
  if (datePart === todayStr && timePart) {
    return timePart;
  }
  return datePart;
};

const truncateHash = (hashStr) => {
  if (!hashStr) return '';
  if (hashStr.length <= 12) return hashStr;
  return `${hashStr.slice(0, 6)}...${hashStr.slice(-4)}`;
};

export default function Documents({ auth }) {
  const { lang, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [typeFilter, setTypeFilter] = useState('all'); // all, e-Fatura, e-İrsaliye, vs.
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [documentsList, setDocumentsList] = useState([]);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Modal State for adding document
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDocType, setNewDocType] = useState('e-Fatura');
  const [newDocSender, setNewDocSender] = useState('');
  const [newDocAmount, setNewDocAmount] = useState('');
  const [newDocStatus, setNewDocStatus] = useState('Beklemede');

  const getDocTypeLabel = (type) => {
    if (type === 'e-Fatura') return lang === 'TR' ? 'e-Fatura' : 'e-Invoice';
    if (type === 'e-İrsaliye') return lang === 'TR' ? 'e-İrsaliye' : 'e-Waybill';
    if (type === 'e-Sözleşme') return lang === 'TR' ? 'e-Sözleşme' : 'e-Contract';
    if (type === 'e-Makbuz') return lang === 'TR' ? 'e-Makbuz' : 'e-Receipt';
    return type;
  };

  const getStatusLabel = (status) => {
    if (status === 'Onaylandı') return t('approved');
    if (status === 'İmzalandı') return lang === 'TR' ? 'İmzalandı' : 'Signed';
    if (status === 'Reddedildi') return t('rejected');
    if (status === 'Beklemede') return t('pending');
    return status;
  };

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/documents`);
      setDocumentsList(res.data);
    } catch (err) {
      console.error("Belgeler yüklenemedi", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddDocument = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND_URL}/api/documents`, {
        type: newDocType,
        sender: newDocSender,
        amount: parseFloat(newDocAmount) || 0,
        status: newDocStatus
      });
      setShowAddModal(false);
      setNewDocSender('');
      setNewDocAmount('');
      setNewDocStatus('Beklemede');
      fetchDocuments();
    } catch (_) {
      alert(t('doc_add_error'));
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`${BACKEND_URL}/api/documents/${id}/status`, { status: newStatus });
      setDocumentsList(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
      if (selectedDoc && selectedDoc.id === id) {
        setSelectedDoc({ ...selectedDoc, status: newStatus });
      }
    } catch (_) {
      alert(t('doc_status_error'));
    }
  };

  const handleDeleteDocument = async (id) => {
    if (!window.confirm(t('doc_delete_confirm'))) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/documents/${id}`);
      setDocumentsList(prev => prev.filter(d => d.id !== id));
      setSelectedDoc(null);
    } catch (_) {
      alert(t('doc_delete_error'));
    }
  };

  const handleVerifyOnChain = async (docId) => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/documents/${docId}/verify-chain`);
      setVerifyResult(res.data);
    } catch (_) {
      setVerifyResult({ verified: false, status: 'ERROR', message: t('doc_verify_error') });
    } finally {
      setVerifying(false);
    }
  };

  const exportToCSV = () => {
    if (filteredAndSortedDocs.length === 0) return;
    const headers = lang === 'TR'
      ? ["Belge ID", "Gönderici", "Tür", "Tutar (TL)", "Durum", "Tarih", "Tx Hash"]
      : ["Document ID", "Sender", "Type", "Amount (TL)", "Status", "Date", "Tx Hash"];
    const rows = filteredAndSortedDocs.map(doc => [
      doc.id,
      doc.sender,
      getDocTypeLabel(doc.type),
      doc.amount,
      getStatusLabel(doc.status),
      doc.date,
      doc.hash
    ]);
    const csvContent = [headers.join(";"), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${lang === 'TR' ? 'belgeler' : 'documents'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dinamik olarak benzersiz belge türlerini al
  const documentTypes = ['all', ...new Set(documentsList.map(doc => doc.type))];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedDocs = useMemo(() => {
    // 1. Arama ve Tür Filtreleme
    let result = documentsList.filter(doc => {
      const matchesSearch = doc.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            doc.sender.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || doc.type === typeFilter;
      return matchesSearch && matchesType;
    });

    // 2. Sıralama
    result = result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle dates specifically if sortField is date
      if (sortField === 'date') {
        return sortDirection === 'asc' 
          ? new Date(valA) - new Date(valB)
          : new Date(valB) - new Date(valA);
      }

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [documentsList, searchTerm, sortField, sortDirection, typeFilter]);

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
            <FileText className="text-blue-400" size={32} />
            {t('doc_panel_title')}
          </h1>
          <p className="text-slate-400 mt-2">{t('doc_panel_desc')}</p>
        </div>

        {/* Filtreleme ve Arama Çubuğu */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={t('search_doc_placeholder')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-blue-500 w-64 transition-colors"
            />
          </div>

          <div className="flex bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="flex items-center pl-3 pr-2 border-r border-slate-700 text-slate-400">
              <Filter size={16} />
            </div>
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-slate-200 py-2 pl-2 pr-8 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="all" className="bg-slate-800">{t('all_types')}</option>
              {documentTypes.filter(t => t !== 'all').map(type => (
                <option key={type} value={type} className="bg-slate-800">{getDocTypeLabel(type)}</option>
              ))}
            </select>
          </div>

          <div className="flex bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="flex items-center pl-3 pr-2 border-r border-slate-700 text-slate-400">
              <ArrowUpDown size={16} />
            </div>
            <select 
              value={sortField + '_' + sortDirection}
              onChange={(e) => {
                const [field, dir] = e.target.value.split('_');
                setSortField(field);
                setSortDirection(dir);
              }}
              className="bg-transparent text-slate-200 py-2 pl-2 pr-8 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="date_desc" className="bg-slate-800">{t('sort_newest')}</option>
              <option value="date_asc" className="bg-slate-800">{t('sort_oldest')}</option>
              <option value="amount_desc" className="bg-slate-800">{t('sort_amount_high')}</option>
              <option value="amount_asc" className="bg-slate-800">{t('sort_amount_low')}</option>
            </select>
          </div>

          <button 
            onClick={exportToCSV}
            disabled={filteredAndSortedDocs.length === 0}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl border border-slate-700 transition-all shadow-md text-sm"
          >
            <Download size={16} /> {t('export')}
          </button>

          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-500/20 text-sm"
          >
            <Plus size={18} /> {lang === 'TR' ? 'Yeni Belge Girişi' : 'New Document Entry'}
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300 min-w-[800px]">
            <thead className="bg-slate-800/50 border-b border-slate-700 text-slate-400 text-sm">
              <tr>
                <th onClick={() => handleSort('id')} className="p-4 font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
                  {lang === 'TR' ? 'Belge ID' : 'Document ID'} {sortField === 'id' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('sender')} className="p-4 font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
                  {t('sender')} {sortField === 'sender' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('type')} className="p-4 font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
                  {lang === 'TR' ? 'Tür' : 'Type'} {sortField === 'type' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('amount')} className="p-4 font-semibold text-right cursor-pointer hover:bg-slate-800 transition-colors">
                  {t('amount')} (₺) {sortField === 'amount' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('status')} className="p-4 font-semibold text-center cursor-pointer hover:bg-slate-800 transition-colors">
                  {t('status')} {sortField === 'status' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('date')} className="p-4 font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
                  {t('date')} {sortField === 'date' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('hash')} className="p-4 font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
                  Tx Hash {sortField === 'hash' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredAndSortedDocs.map((doc) => (
                <tr key={doc.id} onClick={() => setSelectedDoc(doc)} className="hover:bg-slate-800/30 transition-colors cursor-pointer group">
                  <td className="p-4 font-mono font-medium text-white">{doc.id}</td>
                  <td className="p-4 truncate max-w-[200px]" title={doc.sender}>{doc.sender}</td>
                  <td className="p-4">
                    <span className="bg-slate-800 px-3 py-1 rounded-full text-xs font-medium border border-slate-700">{getDocTypeLabel(doc.type)}</span>
                  </td>
                  <td className="p-4 font-semibold text-right">{doc.amount.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      doc.status === 'Onaylandı' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      doc.status === 'İmzalandı' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      doc.status === 'Reddedildi' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {getStatusLabel(doc.status)}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-400">{formatDocDate(doc.date)}</td>
                  <td className="p-4 font-mono text-xs text-blue-400 group-hover:underline" title={doc.hash}>{truncateHash(doc.hash)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAndSortedDocs.length === 0 && (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500">
            <Search size={48} className="mb-4 opacity-20" />
            <p>{t('no_docs_found')}</p>
            <button 
              onClick={() => { setSearchTerm(''); setTypeFilter('all'); setSortField('date'); setSortDirection('desc'); }}
              className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              {t('clear_filters')}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedDoc && (
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
                  <FileText size={20} className="text-blue-400"/> {selectedDoc.id} {t('details')}
                </h3>
                <button onClick={() => { setSelectedDoc(null); setVerifyResult(null); setVerifying(false); }} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6 text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-slate-800 px-3 py-1 rounded-full text-sm font-medium border border-slate-700 text-white">{getDocTypeLabel(selectedDoc.type)}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    selectedDoc.status === 'Onaylandı' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    selectedDoc.status === 'İmzalandı' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    selectedDoc.status === 'Reddedildi' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {getStatusLabel(selectedDoc.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-1"><User size={14}/> {t('sender')}</p>
                    <p className="font-semibold text-white">{selectedDoc.sender}</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-1"><DollarSign size={14}/> {t('amount')}</p>
                    <p className="font-bold text-emerald-400 text-lg">{selectedDoc.amount.toLocaleString()} ₺</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-1"><Calendar size={14}/> {t('date')}</p>
                    <p className="font-medium text-white">{selectedDoc.date}</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-1"><ShieldCheck size={14}/> {t('verify')}</p>
                    <p className="font-medium text-blue-400">{t('blockchain_approved')}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-2"><Hash size={14}/> Transaction Hash</p>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 break-all">
                    <p className="font-mono text-xs text-slate-300">{selectedDoc.hash || t('not_available')}</p>
                  </div>
                </div>

                {/* Blockchain Doğrulama */}
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <button
                    onClick={() => handleVerifyOnChain(selectedDoc.id)}
                    disabled={verifying}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-300 hover:from-blue-500/30 hover:to-cyan-500/30 transition-all duration-300 disabled:opacity-50 font-bold"
                  >
                    {verifying ? (
                      <><div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> {t('verifying')}</>
                    ) : (
                      <><ShieldCheck size={18} /> {lang === 'TR' ? 'Zincirde Doğrula' : 'Verify on Chain'}</>
                    )}
                  </button>
                  
                  {verifyResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-3 p-4 rounded-xl border ${
                        verifyResult.verified
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : verifyResult.status === 'NOT_FOUND'
                            ? 'bg-yellow-500/10 border-yellow-500/30'
                            : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {verifyResult.verified ? (
                          <><span className="text-emerald-400 font-semibold flex items-center gap-1">✅ {lang === 'TR' ? 'Doğrulandı' : 'Verified'}</span></>
                        ) : verifyResult.status === 'NOT_FOUND' ? (
                          <><span className="text-yellow-400 font-semibold flex items-center gap-1">⚠️ {lang === 'TR' ? 'Zincirde Kayıt Yok' : 'No Record on Chain'}</span></>
                        ) : (
                          <><span className="text-red-400 font-semibold flex items-center gap-1">❌ {lang === 'TR' ? 'Uyuşmazlık' : 'Mismatch'}</span></>
                        )}
                      </div>
                      <p className="text-sm text-slate-300">{verifyResult.message}</p>
                      {verifyResult.chain_hash && (
                        <div className="mt-2 text-xs space-y-1 border-t border-slate-700/30 pt-2">
                          <p className="text-slate-500 break-all">DB Hash: <span className="text-slate-400 font-mono">{verifyResult.db_hash}</span></p>
                          <p className="text-slate-500 break-all">Chain Hash: <span className="text-slate-400 font-mono">{verifyResult.chain_hash}</span></p>
                          {verifyResult.chain_timestamp && (
                            <p className="text-slate-500">{t('block_time')}: <span className="text-slate-400">{new Date(verifyResult.chain_timestamp * 1000).toLocaleString(lang === 'TR' ? 'tr-TR' : 'en-US')}</span></p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {auth?.role === 'admin' && (
                  <div className="flex flex-col gap-3 pt-4 border-t border-slate-700/50">
                    {selectedDoc.status === 'Beklemede' && (
                      <div className="flex gap-4">
                        <button 
                          onClick={() => handleStatusChange(selectedDoc.id, 'Onaylandı')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                        >
                          {lang === 'TR' ? 'Onayla' : 'Approve'}
                        </button>
                        <button 
                          onClick={() => handleStatusChange(selectedDoc.id, 'Reddedildi')}
                          className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-rose-500/20"
                        >
                          {lang === 'TR' ? 'Reddet' : 'Reject'}
                        </button>
                      </div>
                    )}
                    <button 
                      onClick={() => handleDeleteDocument(selectedDoc.id)}
                      className="w-full bg-slate-800 hover:bg-rose-900/40 hover:text-rose-400 text-slate-300 font-bold py-3 rounded-xl transition-colors border border-slate-700 hover:border-rose-500/30"
                    >
                      {t('delete_document_btn')}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
        {showAddModal && (
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
              className="bg-[#1e293b] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-left"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-700/50 bg-slate-800/50">
                <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                  <Plus size={20} className="text-blue-400"/> {lang === 'TR' ? 'Yeni Belge Girişi' : 'New Document Entry'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddDocument} className="p-6 space-y-6">
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">{t('document_type_label')}</label>
                  <select 
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="e-Fatura">{getDocTypeLabel('e-Fatura')}</option>
                    <option value="e-İrsaliye">{getDocTypeLabel('e-İrsaliye')}</option>
                    <option value="e-Sözleşme">{getDocTypeLabel('e-Sözleşme')}</option>
                    <option value="e-Makbuz">{getDocTypeLabel('e-Makbuz')}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">{t('sender')} / {t('company_label')}</label>
                  <input 
                    type="text" 
                    value={newDocSender}
                    onChange={(e) => setNewDocSender(e.target.value)}
                    required
                    placeholder={t('company_placeholder')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">{t('amount')} (₺)</label>
                  <input 
                    type="number" 
                    value={newDocAmount}
                    onChange={(e) => setNewDocAmount(e.target.value)}
                    required
                    min="0"
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">{t('status')}</label>
                  <select 
                    value={newDocStatus}
                    onChange={(e) => setNewDocStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="Onaylandı">{getStatusLabel('Onaylandı')}</option>
                    <option value="Beklemede">{getStatusLabel('Beklemede')}</option>
                    <option value="Reddedildi">{getStatusLabel('Reddedildi')}</option>
                    <option value="İmzalandı">{getStatusLabel('İmzalandı')}</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-700/50">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors border border-slate-700"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                  >
                    {t('save_and_submit')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
