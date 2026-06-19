import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Key, UserPlus, CheckCircle, AlertTriangle, Palette } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { useLanguage } from '../LanguageContext';

export default function Settings({ auth, setAuth }) {
  const { lang, t } = useLanguage();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState({ text: '', type: '' });

  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [regMsg, setRegMsg] = useState({ text: '', type: '' });

  const [themeMsg, setThemeMsg] = useState({ text: '', type: '' });

  const [userWalletAddress, setUserWalletAddress] = useState(auth.wallet_address || '');
  const [walletMsg, setWalletMsg] = useState({ text: '', type: '' });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassMsg({ text: t('processing'), type: 'info' });
    try {
      await axios.post(`${BACKEND_URL}/api/auth/change-password`, {
        username: auth.username,
        old_password: oldPassword,
        new_password: newPassword
      });
      setPassMsg({ text: t('password_change_success'), type: 'success' });
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPassMsg({ 
        text: err.response?.data?.detail || t('password_change_error'), 
        type: 'error' 
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegMsg({ text: t('user_registering'), type: 'info' });
    try {
      await axios.post(`${BACKEND_URL}/api/auth/register`, {
        admin_username: auth.username,
        admin_password: adminPassword,
        new_username: newUsername,
        new_password: newUserPassword,
        role: newUserRole,
        wallet_address: newWalletAddress
      });
      setRegMsg({ text: t('user_register_success'), type: 'success' });
      setNewUsername('');
      setNewUserPassword('');
      setAdminPassword('');
      setNewWalletAddress('');
    } catch (err) {
      setRegMsg({ 
        text: err.response?.data?.detail || t('user_register_error'), 
        type: 'error' 
      });
    }
  };

  const handleThemeChange = async (selectedTheme) => {
    try {
      setThemeMsg({ text: t('theme_updating'), type: 'info' });
      await axios.put(`${BACKEND_URL}/api/auth/theme`, {
        username: auth.username,
        theme: selectedTheme
      });
      // Update local auth state to reflect theme immediately
      if(setAuth) {
        setAuth({ ...auth, theme: selectedTheme });
      }
      setThemeMsg({ text: t('theme_success'), type: 'success' });
      setTimeout(() => setThemeMsg({ text: '', type: '' }), 3000);
    } catch (_) {
      setThemeMsg({ text: t('theme_error'), type: 'error' });
    }
  };

  const handleWalletUpdate = async (e) => {
    e.preventDefault();
    setWalletMsg({ text: lang === 'TR' ? 'Güncelleniyor...' : 'Updating...', type: 'info' });
    try {
      const res = await axios.put(`${BACKEND_URL}/api/auth/wallet-address`, {
        username: auth.username,
        wallet_address: userWalletAddress
      });
      setWalletMsg({ text: lang === 'TR' ? 'Cüzdan adresi başarıyla güncellendi' : 'Wallet address updated successfully', type: 'success' });
      setAuth({ ...auth, wallet_address: res.data.wallet_address });
    } catch (err) {
      setWalletMsg({ 
        text: err.response?.data?.detail || (lang === 'TR' ? 'Cüzdan adresi güncellenirken hata oluştu' : 'Failed to update wallet address'), 
        type: 'error' 
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
          <SettingsIcon className="text-blue-400" size={32} />
          {t('settings')}
        </h1>
        <p className="text-slate-400">{t('settings_panel_desc')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Şifre Değiştirme */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Key size={20} className="text-blue-400" /> {lang === 'TR' ? 'Şifre Değiştir' : 'Change Password'}
          </h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passMsg.text && (
              <div className={`p-3 rounded-xl text-sm ${passMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : passMsg.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                {passMsg.type === 'success' ? <CheckCircle size={16} className="inline mr-2" /> : passMsg.type === 'error' ? <AlertTriangle size={16} className="inline mr-2" /> : null}
                {passMsg.text}
              </div>
            )}
            <div>
              <label className="text-xs text-slate-400 font-bold uppercase mb-2 block">{t('current_password')}</label>
              <input 
                type="password" 
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-2 rounded-xl focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold uppercase mb-2 block">{t('new_password_label')}</label>
              <input 
                type="password" 
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-2 rounded-xl focus:border-blue-500 outline-none"
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors">
              {t('update_password_btn')}
            </button>
          </form>
        </div>

        {/* Cüzdan Hash Değiştir */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <SettingsIcon size={20} className="text-emerald-400" /> {lang === 'TR' ? 'Cüzdan Hash Değiştir' : 'Change Wallet Address'}
          </h2>
          <form onSubmit={handleWalletUpdate} className="space-y-4">
            {walletMsg.text && (
              <div className={`p-3 rounded-xl text-sm ${walletMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : walletMsg.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                {walletMsg.text}
              </div>
            )}
            <div>
              <label className="text-xs text-slate-400 font-bold uppercase mb-2 block">{lang === 'TR' ? 'Mevcut Cüzdan Adresi' : 'Current Wallet Address'}</label>
              <input 
                type="text" 
                disabled
                value={auth.wallet_address || '—'}
                className="w-full bg-slate-800/20 border border-slate-700/50 text-slate-500 px-4 py-2 rounded-xl outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold uppercase mb-2 block">{lang === 'TR' ? 'Yeni Cüzdan Adresi' : 'New Wallet Address'}</label>
              <input 
                type="text" 
                required
                value={userWalletAddress}
                onChange={(e) => setUserWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-2 rounded-xl focus:border-emerald-500 outline-none font-mono"
              />
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors">
              {lang === 'TR' ? 'Cüzdan Adresini Güncelle' : 'Update Wallet Address'}
            </button>
          </form>
        </div>

        {/* Tema Seçimi */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Palette size={20} className="text-purple-400" /> {t('appearance_settings')}
          </h2>
          {themeMsg.text && (
            <div className={`p-3 mb-4 rounded-xl text-sm ${themeMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : themeMsg.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
              {themeMsg.text}
            </div>
          )}
          <div className="space-y-4">
            <button 
              onClick={() => handleThemeChange('current')}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${auth.theme === 'current' ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex flex-col items-start">
                <span className="font-bold text-white">{t('theme_current')}</span>
                <span className="text-xs opacity-70">{t('theme_default_desc')}</span>
              </div>
              {auth.theme === 'current' && <CheckCircle size={20} />}
            </button>
            <button 
              onClick={() => handleThemeChange('dark')}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${auth.theme === 'dark' ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex flex-col items-start">
                <span className="font-bold text-white">{t('theme_dark')}</span>
                <span className="text-xs opacity-70">{t('theme_dark_desc')}</span>
              </div>
              {auth.theme === 'dark' && <CheckCircle size={20} />}
            </button>
            <button 
              onClick={() => handleThemeChange('light')}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${auth.theme === 'light' ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'}`}
            >
              <div className="flex flex-col items-start">
                <span className="font-bold text-white">{t('theme_light')}</span>
                <span className="text-xs opacity-70">{t('theme_light_desc')}</span>
              </div>
              {auth.theme === 'light' && <CheckCircle size={20} />}
            </button>
          </div>
        </div>

        {/* Kullanıcı Ekleme (Sadece Admin) */}
        {auth.role === 'admin' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-700/50">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <UserPlus size={20} className="text-emerald-400" /> {t('add_new_user')}
            </h2>
            <form onSubmit={handleRegister} className="space-y-4">
              {regMsg.text && (
                <div className={`p-3 rounded-xl text-sm ${regMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : regMsg.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                  {regMsg.type === 'success' ? <CheckCircle size={16} className="inline mr-2" /> : regMsg.type === 'error' ? <AlertTriangle size={16} className="inline mr-2" /> : null}
                  {regMsg.text}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase mb-2 block">{t('username')}</label>
                  <input 
                    type="text" 
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-2 rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase mb-2 block">{t('wallet_address')}</label>
                  <input 
                    type="text" 
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-2 rounded-xl focus:border-emerald-500 outline-none font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase mb-2 block">{t('user_role')}</label>
                  <select 
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-2 rounded-xl focus:border-emerald-500 outline-none"
                  >
                    <option value="user">{t('standard_user')}</option>
                    <option value="admin">{t('admin_user')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase mb-2 block">{t('user_password')}</label>
                  <input 
                    type="password" 
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-2 rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-700/50 mt-4">
                <label className="text-xs text-emerald-400 font-bold uppercase mb-2 block">{t('admin_confirm_password_label')}</label>
                <input 
                  type="password" 
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder={t('admin_password_placeholder')}
                  className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-2 rounded-xl focus:border-emerald-500 outline-none mb-4"
                />
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors">
                  {t('add_user_btn')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </motion.div>
  );
}
