import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, Play, CheckCircle, X, Users, Briefcase, Hash, Plus } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { useLanguage } from '../LanguageContext';

export default function Contracts({ auth }) {
  const { lang, t } = useLanguage();
  const [selectedContract, setSelectedContract] = useState(null);
  const [contractsList, setContractsList] = useState([]);

  // Modal State for adding contract
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContractType, setNewContractType] = useState('Tedarik Zinciri');
  const [newContractParty1, setNewContractParty1] = useState('');
  const [newContractParty2, setNewContractParty2] = useState('');
  const [newContractValue, setNewContractValue] = useState('');

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

  const handleStatusChange = async (id, newStatus) => {
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
        status: 'Pending'
      });
      setShowAddModal(false);
      setNewContractParty1('');
      setNewContractParty2('');
      setNewContractValue('');
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
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/20"
        >
          <Plus size={18} /> {t('create_new_contract')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contractsList.map((contract) => (
          <motion.div 
            key={contract.id}
            whileHover={{ scale: 1.02, y: -5 }}
            className="glass-panel p-6 rounded-2xl relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="bg-slate-800 text-slate-300 font-mono text-xs px-3 py-1 rounded-full border border-slate-700">
                {contract.id}
              </span>
              <span className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${
                contract.status === 'Active' || contract.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                contract.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>
                {contract.status === 'Active' || contract.status === 'Approved' ? <Play size={12} /> : contract.status === 'Pending' ? <div className="w-2 h-2 rounded-full bg-amber-400" /> : <CheckCircle size={12} />}
                {getStatusLabel(contract.status)}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-1">{getContractTypeLabel(contract.type)}</h3>
            <p className="text-sm text-slate-400 mb-6">{t('contract_value_label')}: <span className="text-emerald-400 font-semibold">{contract.value}</span></p>

            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 mb-4">
              <p className="text-xs text-slate-500 uppercase mb-2">{t('parties')}</p>
              <div className="flex items-center justify-between text-sm font-medium text-slate-200">
                <span className="truncate w-2/5">{contract.parties[0]}</span>
                <ArrowRight size={14} className="text-slate-500 flex-shrink-0" />
                <span className="truncate w-2/5 text-right">{contract.parties[1]}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-auto">
              <div>
                <p className="text-xs text-slate-500">Tx Hash</p>
                <p className="font-mono text-xs text-blue-400 truncate w-32">{contract.hash}</p>
              </div>
              <button 
                onClick={() => setSelectedContract(contract)}
                className="text-sm bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors border border-slate-700"
              >
                {t('detail')}
              </button>
            </div>
          </motion.div>
        ))}
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
              className="bg-[#1e293b] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-700/50 bg-slate-800/50">
                <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                  <Briefcase size={20} className="text-emerald-400"/> {selectedContract.id} {t('contract_details_title')}
                </h3>
                <button onClick={() => setSelectedContract(null)} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6 text-left">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-lg font-bold text-white block">{getContractTypeLabel(selectedContract.type)}</span>
                    <span className="text-emerald-400 font-semibold">{selectedContract.value}</span>
                  </div>
                  <span className={`flex items-center gap-1 text-sm font-bold px-4 py-2 rounded-full border ${
                    selectedContract.status === 'Active' || selectedContract.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    selectedContract.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {selectedContract.status === 'Active' || selectedContract.status === 'Approved' ? <Play size={16} /> : selectedContract.status === 'Pending' ? <div className="w-3 h-3 rounded-full bg-amber-400" /> : <CheckCircle size={16} />}
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

                <div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-2"><Hash size={14}/> Smart Contract Deploy Hash</p>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 break-all mb-4">
                    <p className="font-mono text-xs text-slate-300">{selectedContract.hash}8b7c6d5e4f3g2h1i0j</p>
                  </div>
                </div>

                {auth?.role === 'admin' && selectedContract.status === 'Pending' && (
                  <div className="flex gap-4 pt-4 border-t border-slate-700/50">
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
                    onChange={(e) => setNewContractType(e.target.value)}
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
