import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, Play, CheckCircle, X, Users, Briefcase, Hash, Plus, Calendar, Search, Filter, ArrowUpDown } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { useLanguage } from '../LanguageContext';

export default function Contracts({ auth }) {
  const { lang, t } = useLanguage();
  const [selectedContract, setSelectedContract] = useState(null);
  const [contractsList, setContractsList] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [sortField, setSortField] = useState('start_date');
  const [sortDirection, setSortDirection] = useState('desc');

  // Modal State for adding contract
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContractType, setNewContractType] = useState('Tedarik Zinciri');
  const [newContractParty1, setNewContractParty1] = useState('');
  const [newContractParty2, setNewContractParty2] = useState('');
  const [newContractValue, setNewContractValue] = useState('');
  const [newContractStartDate, setNewContractStartDate] = useState('');
  const [newContractCompletionDate, setNewContractCompletionDate] = useState('');

  const getContractDefaults = (type) => {
    const today = new Date().toISOString().split('T')[0];
    const getFuture = (months) => {
      const d = new Date();
      d.setMonth(d.getMonth() + months);
      return d.toISOString().split('T')[0];
    };
    
    switch (type) {
      case 'Tedarik Zinciri':
        return {
          party1: 'Fintegrity Corp',
          party2: 'Logistics Partner A.Ş.',
          value: '500,000 ₺',
          startDate: today,
          completionDate: getFuture(12)
        };
      case 'Personel Maaş':
        return {
          party1: 'Fintegrity Corp',
          party2: 'Ahmet Yılmaz',
          value: '45,000 ₺',
          startDate: today,
          completionDate: getFuture(12)
        };
      case 'Uluslararası B2B':
        return {
          party1: 'Fintegrity Corp',
          party2: 'Global Trade Inc.',
          value: '120,000 $',
          startDate: today,
          completionDate: getFuture(24)
        };
      case 'Araç Filo Sigortası':
        return {
          party1: 'Fintegrity Corp',
          party2: 'Allianz Sigorta',
          value: '150,000 ₺',
          startDate: today,
          completionDate: getFuture(12)
        };
      case 'Emlak Kira':
        return {
          party1: 'Fintegrity Corp',
          party2: 'Plaza Yönetim A.Ş.',
          value: '35,000 ₺',
          startDate: today,
          completionDate: getFuture(12)
        };
      default:
        return {
          party1: '',
          party2: '',
          value: '',
          startDate: today,
          completionDate: getFuture(12)
        };
    }
  };

  const handleContractTypeChange = (type) => {
    setNewContractType(type);
    const defaults = getContractDefaults(type);
    setNewContractParty1(defaults.party1);
    setNewContractParty2(defaults.party2);
    setNewContractValue(defaults.value);
    setNewContractStartDate(defaults.startDate);
    setNewContractCompletionDate(defaults.completionDate);
  };

  const handleOpenAddModal = () => {
    const defaults = getContractDefaults('Tedarik Zinciri');
    setNewContractType('Tedarik Zinciri');
    setNewContractParty1(defaults.party1);
    setNewContractParty2(defaults.party2);
    setNewContractValue(defaults.value);
    setNewContractStartDate(defaults.startDate);
    setNewContractCompletionDate(defaults.completionDate);
    setShowAddModal(true);
  };

  const getStatusLabel = (status) => {
    const s = status ? status.toLowerCase() : '';
    if (s === 'active' || s === 'approved') return t('active');
    if (s === 'pending') return t('pending');
    if (s === 'rejected') return t('rejected');
    return status;
  };

  const getContractTypeLabel = (type) => {
    if (type === 'Tedarik Zinciri') return t('supply_chain');
    if (type === 'Personel Maaş') return t('staff_salary');
    if (type === 'Uluslararası B2B') return t('intl_b2b');
    if (type === 'Araç Filo Sigortası') return t('fleet_insurance');
    if (type === 'Emlak Kira') return t('property_rental');
    return type;
  };

  const fetchContracts = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/contracts`);
      setContractsList(res.data);
    } catch (err) {
      console.error("Sözleşmeler yüklenemedi", err);
    }
  };

  useEffect(() => {
    fetchContracts();
    const interval = setInterval(fetchContracts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedContracts = useMemo(() => {
    let result = contractsList.filter(contract => {
      const partiesStr = contract.parties ? contract.parties.join(' ').toLowerCase() : '';
      const matchesSearch = contract.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            partiesStr.includes(searchTerm.toLowerCase()) ||
                            contract.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        const s = contract.status ? contract.status.toLowerCase() : '';
        if (statusFilter === 'active') {
          matchesStatus = s === 'active' || s === 'approved';
        } else if (statusFilter === 'pending') {
          matchesStatus = s === 'pending';
        } else if (statusFilter === 'rejected') {
          matchesStatus = s === 'rejected';
        } else if (statusFilter === 'closed') {
          matchesStatus = s === 'closed' || s === 'kapalı';
        }
      }

      let matchesStartDate = true;
      if (startDateFilter && contract.start_date) {
        matchesStartDate = contract.start_date >= startDateFilter;
      }

      let matchesEndDate = true;
      if (endDateFilter && contract.completion_date) {
        matchesEndDate = contract.completion_date <= endDateFilter;
      }

      return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
    });

    result = result.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'value') {
        const parseVal = (str) => {
          if (!str) return 0;
          return parseFloat(str.replace(/[^0-9.-]+/g, "")) || 0;
        };
        valA = parseVal(valA);
        valB = parseVal(valB);
      } else {
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [contractsList, searchTerm, statusFilter, startDateFilter, endDateFilter, sortField, sortDirection]);

  const handleStatusChange = async (id, newStatus) => {
    const msg = lang === 'TR' 
      ? "İşlemi gerçekleştirmek istediğinize emin misiniz?" 
      : "Are you sure you want to perform this operation?";
    if (!window.confirm(msg)) return;
    try {
      await axios.put(`${BACKEND_URL}/api/contracts/${id}/status`, { status: newStatus });
      setContractsList(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
      if (selectedContract && selectedContract.id === id) {
        setSelectedContract({ ...selectedContract, status: newStatus });
      }
    } catch {
      alert(t('contract_status_error'));
    }
  };

  const handleAddContract = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND_URL}/api/contracts`, {
        type: newContractType,
        parties: [newContractParty1, newContractParty2],
        value: newContractValue,
        start_date: newContractStartDate,
        completion_date: newContractCompletionDate,
        status: 'Pending'
      });
      setShowAddModal(false);
      setNewContractParty1('');
      setNewContractParty2('');
      setNewContractValue('');
      setNewContractStartDate('');
      setNewContractCompletionDate('');
      fetchContracts();
    } catch {
      alert(t('contract_add_error'));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <ShieldCheck className="text-emerald-400" size={32} />
            {t('contracts_panel_title')}
          </h1>
          <p className="text-slate-400 mt-2">{t('contracts_panel_desc')}</p>
        </div>
        {auth?.role !== 'admin' && (
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/20"
          >
            <Plus size={18} /> {t('create_new_contract')}
          </button>
        )}
      </div>

      {/* Filtreler ve Arama Çubuğu */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap gap-4 items-center">
        {/* Arama */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={lang === 'TR' ? 'Taraf ismi veya Sözleşme ID ara...' : 'Search parties or Contract ID...'} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-sm"
          />
        </div>

        {/* Durum Filtresi */}
        <div className="flex bg-slate-850 border border-slate-700 rounded-xl overflow-hidden min-w-[150px]">
          <div className="flex items-center pl-3 pr-2 border-r border-slate-700 text-slate-400">
            <Filter size={16} />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-slate-200 py-2 pl-2 pr-8 focus:outline-none cursor-pointer appearance-none text-sm w-full"
          >
            <option value="all" className="bg-slate-800">{lang === 'TR' ? 'Tüm Durumlar' : 'All Statuses'}</option>
            <option value="pending" className="bg-slate-800">{t('pending')}</option>
            <option value="active" className="bg-slate-800">{t('active')}</option>
            <option value="rejected" className="bg-slate-800">{t('rejected')}</option>
            <option value="closed" className="bg-slate-800">{lang === 'TR' ? 'Kapalı' : 'Closed'}</option>
          </select>
        </div>

        {/* Başlangıç Tarihi Filtresi */}
        <div className="flex items-center gap-2 bg-slate-850 border border-slate-700 rounded-xl px-3 py-1 text-sm text-slate-300">
          <Calendar size={14} className="text-slate-400" />
          <span className="text-xs text-slate-500">{t('start_date')}:</span>
          <input 
            type="date" 
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            className="bg-transparent text-white outline-none cursor-pointer text-xs"
          />
          {startDateFilter && <X size={12} className="text-slate-500 cursor-pointer hover:text-white" onClick={() => setStartDateFilter('')} />}
        </div>

        {/* Bitiş Tarihi Filtresi */}
        <div className="flex items-center gap-2 bg-slate-850 border border-slate-700 rounded-xl px-3 py-1 text-sm text-slate-300">
          <Calendar size={14} className="text-slate-400" />
          <span className="text-xs text-slate-500">{t('completion_date')}:</span>
          <input 
            type="date" 
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            className="bg-transparent text-white outline-none cursor-pointer text-xs"
          />
          {endDateFilter && <X size={12} className="text-slate-500 cursor-pointer hover:text-white" onClick={() => setEndDateFilter('')} />}
        </div>

        {/* Sıralama */}
        <div className="flex bg-slate-850 border border-slate-700 rounded-xl overflow-hidden min-w-[150px]">
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
            className="bg-transparent text-slate-200 py-2 pl-2 pr-8 focus:outline-none cursor-pointer appearance-none text-sm w-full"
          >
            <option value="start_date_desc" className="bg-slate-800">{lang === 'TR' ? 'En Yeni Başlangıç' : 'Newest Start'}</option>
            <option value="start_date_asc" className="bg-slate-800">{lang === 'TR' ? 'En Eski Başlangıç' : 'Oldest Start'}</option>
            <option value="completion_date_desc" className="bg-slate-800">{lang === 'TR' ? 'En Yeni Bitiş' : 'Newest End'}</option>
            <option value="completion_date_asc" className="bg-slate-800">{lang === 'TR' ? 'En Eski Bitiş' : 'Oldest End'}</option>
            <option value="value_desc" className="bg-slate-800">{lang === 'TR' ? 'Değer (Yüksek)' : 'Value (High)'}</option>
            <option value="value_asc" className="bg-slate-800">{lang === 'TR' ? 'Değer (Düşük)' : 'Value (Low)'}</option>
          </select>
        </div>
      </div>

      {/* Tablo Görünümü */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300 min-w-[800px]">
            <thead className="bg-slate-800/50 border-b border-slate-700 text-slate-400 text-sm">
              <tr>
                <th onClick={() => handleSort('id')} className="p-4 font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
                  Sözleşme ID {sortField === 'id' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('type')} className="p-4 font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
                  {lang === 'TR' ? 'Tür' : 'Type'} {sortField === 'type' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="p-4 font-semibold">
                  {t('parties')}
                </th>
                <th onClick={() => handleSort('value')} className="p-4 font-semibold text-right cursor-pointer hover:bg-slate-800 transition-colors">
                  {lang === 'TR' ? 'Değer' : 'Value'} {sortField === 'value' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('status')} className="p-4 font-semibold text-center cursor-pointer hover:bg-slate-800 transition-colors">
                  {t('status')} {sortField === 'status' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('start_date')} className="p-4 font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
                  {t('start_date')} {sortField === 'start_date' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('completion_date')} className="p-4 font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
                  {t('completion_date')} {sortField === 'completion_date' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredAndSortedContracts.map((contract) => (
                <tr 
                  key={contract.id} 
                  onClick={() => setSelectedContract(contract)} 
                  className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                >
                  <td className="p-4 font-mono font-medium text-white">{contract.id}</td>
                  <td className="p-4 font-semibold text-slate-200">{getContractTypeLabel(contract.type)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                      <span className="truncate max-w-[120px]" title={contract.parties[0]}>{contract.parties[0]}</span>
                      <ArrowRight size={12} className="text-slate-600 flex-shrink-0" />
                      <span className="truncate max-w-[120px]" title={contract.parties[1]}>{contract.parties[1]}</span>
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-right text-emerald-400">{contract.value}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                      contract.status === 'Active' || contract.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      contract.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      contract.status === 'Closed' || contract.status === 'Kapalı' ? 'bg-slate-500/10 text-slate-400 border-slate-500/25' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {getStatusLabel(contract.status)}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-400">{contract.start_date || '—'}</td>
                  <td className="p-4 text-sm text-slate-400">{contract.completion_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAndSortedContracts.length === 0 && (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500">
            <Search size={48} className="mb-4 opacity-20" />
            <p>{lang === 'TR' ? 'Sözleşme bulunamadı.' : 'No contracts found.'}</p>
            <button 
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); setStartDateFilter(''); setEndDateFilter(''); }}
              className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              {lang === 'TR' ? 'Filtreleri Temizle' : 'Clear Filters'}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedContract && (
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
              className="bg-[#1e293b] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-700/50 bg-slate-800/50 shrink-0">
                <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                  <Briefcase size={20} className="text-emerald-400"/> {selectedContract.id} {t('contract_details_title')}
                </h3>
                <button onClick={() => setSelectedContract(null)} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6 text-left overflow-y-auto custom-scrollbar flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-lg font-bold text-white block">{getContractTypeLabel(selectedContract.type)}</span>
                    <span className="text-emerald-400 font-semibold">{selectedContract.value}</span>
                  </div>
                  <span className={`flex items-center gap-1 text-sm font-bold px-4 py-2 rounded-full border ${
                    selectedContract.status === 'Active' || selectedContract.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    selectedContract.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    selectedContract.status === 'Closed' || selectedContract.status === 'Kapalı' ? 'bg-slate-500/10 text-slate-400 border-slate-500/25' :
                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {selectedContract.status === 'Active' || selectedContract.status === 'Approved' ? <Play size={16} /> : 
                     selectedContract.status === 'Pending' ? <div className="w-3 h-3 rounded-full bg-amber-400" /> : 
                     selectedContract.status === 'Closed' || selectedContract.status === 'Kapalı' ? <X size={16} className="text-slate-400" /> :
                     <CheckCircle size={16} />}
                    {getStatusLabel(selectedContract.status)}
                  </span>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-4"><Users size={14}/> {t('agreement_parties_title')}</p>
                  <div className="flex items-center justify-between text-base font-medium text-slate-200">
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 w-2/5 text-center truncate">
                      {selectedContract.parties[0]}
                    </div>
                    <ArrowRight size={20} className="text-emerald-500 flex-shrink-0" />
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 w-2/5 text-center truncate">
                      {selectedContract.parties[1]}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-2"><Calendar size={14}/> {t('start_date')}</p>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 mb-4">
                      <p className="text-sm text-slate-300">{selectedContract.start_date || '—'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-2"><Calendar size={14}/> {t('completion_date')}</p>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 mb-4">
                      <p className="text-sm text-slate-300">{selectedContract.completion_date || '—'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-2"><Hash size={14}/> Smart Contract Deploy Hash</p>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 break-all mb-4">
                    <p className="font-mono text-xs text-slate-300">{selectedContract.hash}8b7c6d5e4f3g2h1i0j</p>
                  </div>
                </div>
              </div>

              {auth?.role === 'admin' && selectedContract.status === 'Pending' && (
                <div className="flex gap-4 p-6 border-t border-slate-700/50 bg-slate-800/30 shrink-0">
                  <button 
                    onClick={() => handleStatusChange(selectedContract.id, 'Approved')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    {lang === 'TR' ? 'Onayla' : 'Approve'}
                  </button>
                  <button 
                    onClick={() => handleStatusChange(selectedContract.id, 'Rejected')}
                    className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-rose-500/20"
                  >
                    {lang === 'TR' ? 'Reddet' : 'Reject'}
                  </button>
                </div>
              )}
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
                  <Plus size={20} className="text-emerald-400"/> {t('create_new_contract')}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddContract} className="p-6 space-y-6">
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">{t('contract_type_label')}</label>
                  <select 
                    value={newContractType}
                    onChange={(e) => handleContractTypeChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="Tedarik Zinciri">{getContractTypeLabel('Tedarik Zinciri')}</option>
                    <option value="Personel Maaş">{getContractTypeLabel('Personel Maaş')}</option>
                    <option value="Uluslararası B2B">{getContractTypeLabel('Uluslararası B2B')}</option>
                    <option value="Araç Filo Sigortası">{getContractTypeLabel('Araç Filo Sigortası')}</option>
                    <option value="Emlak Kira">{getContractTypeLabel('Emlak Kira')}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">{t('party_1_label')}</label>
                  <input 
                    type="text" 
                    value={newContractParty1}
                    onChange={(e) => setNewContractParty1(e.target.value)}
                    required
                    placeholder={t('party_1_placeholder')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">{t('party_2_label')}</label>
                  <input 
                    type="text" 
                    value={newContractParty2}
                    onChange={(e) => setNewContractParty2(e.target.value)}
                    required
                    placeholder={t('party_2_placeholder')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">{t('value_amount_label')}</label>
                  <input 
                    type="text" 
                    value={newContractValue}
                    onChange={(e) => setNewContractValue(e.target.value)}
                    required
                    placeholder={t('value_amount_placeholder')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">{t('start_date') || (lang === 'TR' ? 'Başlangıç Tarihi' : 'Start Date')}</label>
                    <input 
                      type="date" 
                      value={newContractStartDate}
                      onChange={(e) => setNewContractStartDate(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">{t('completion_date') || (lang === 'TR' ? 'Bitiş Tarihi' : 'Completion Date')}</label>
                    <input 
                      type="date" 
                      value={newContractCompletionDate}
                      onChange={(e) => setNewContractCompletionDate(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
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
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    {t('create_pending_btn')}
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
