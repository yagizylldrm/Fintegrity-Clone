import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, User, ArrowRight, Loader, PlusCircle } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { useLanguage } from '../LanguageContext';

export default function Login({ onLogin, onBackToLanding }) {
  const { lang, changeLang, t } = useLanguage();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Remember Me: Load username on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('remembered_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        username,
        password
      });

      if (response.data.success) {
        // Save JWT access token to localStorage and set default Axios header
        if (response.data.access_token) {
          localStorage.setItem('auth_token', response.data.access_token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
        }

        // Remember Me: Save or delete username based on checkbox
        if (rememberMe) {
          localStorage.setItem('remembered_username', username);
        } else {
          localStorage.removeItem('remembered_username');
        }

        onLogin({ 
          username, 
          role: response.data.role, 
          theme: response.data.theme 
        });
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError(t('error_connection'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setError(t('password_mismatch'));
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/register-public`, {
        username,
        password
      });

      if (response.data.success) {
        setSuccessMessage(t('register_success_msg'));
        setIsRegisterMode(false);
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError(t('register_failed_msg'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating Language Switcher */}
      <div className="absolute top-6 right-6 z-20 flex bg-slate-800/40 border border-slate-700/50 rounded-xl p-1">
        <button
          type="button"
          onClick={() => changeLang('TR')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            lang === 'EN'
              ? 'bg-blue-500 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          EN
        </button>
      </div>

      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel p-10 rounded-3xl border border-slate-700/50 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex bg-gradient-to-br from-blue-500 to-emerald-500 p-3 rounded-2xl mb-4">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">FINTEGRITY</h1>
            <p className="text-slate-400 text-sm mt-2">
              {isRegisterMode ? t('login_network_register') : t('login_network_active')}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!isRegisterMode ? (
              <motion.form 
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLoginSubmit} 
                className="space-y-6"
              >
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-3 rounded-xl text-center">
                    {error}
                  </motion.div>
                )}

                {successMessage && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm p-3 rounded-xl text-center">
                    {successMessage}
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">{t('username')}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        placeholder={t('username_placeholder')}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">{t('password')}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-slate-400 text-sm cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 bg-slate-900 border border-slate-700 rounded text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900" 
                      />
                      {t('remember_me')}
                    </label>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {isLoading ? <Loader className="animate-spin" size={20} /> : (
                    <>{t('login_action_btn')} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>

                <div className="text-center pt-2 flex flex-col gap-2 items-center">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsRegisterMode(true);
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {t('create_new_account')}
                  </button>
                  {onBackToLanding && (
                    <button 
                      type="button" 
                      onClick={onBackToLanding}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors mt-1"
                    >
                      ← {t('back_to_home')}
                    </button>
                  )}
                </div>
              </motion.form>
            ) : (
              <motion.form 
                key="register-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRegisterSubmit} 
                className="space-y-6"
              >
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-3 rounded-xl text-center">
                    {error}
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">{t('username')}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        placeholder={t('username_new_placeholder')}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">{t('password')}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder={t('password_placeholder')}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">{t('confirm_password')}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder={t('confirm_password_placeholder')}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {isLoading ? <Loader className="animate-spin" size={20} /> : (
                    <>{t('register_btn')} <PlusCircle size={18} className="group-hover:scale-105 transition-transform" /></>
                  )}
                </button>

                <div className="text-center pt-2 flex flex-col gap-2 items-center">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsRegisterMode(false);
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="text-sm font-semibold text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {t('login_prompt')}
                  </button>
                  {onBackToLanding && (
                    <button 
                      type="button" 
                      onClick={onBackToLanding}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors mt-1"
                    >
                      ← {t('back_to_home')}
                    </button>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-500">{t('demo_accounts_title')}</p>
            <p className="text-xs font-mono text-slate-400 bg-slate-900 py-1 px-2 rounded inline-block mx-1">admin / admin123</p>
            <p className="text-xs font-mono text-slate-400 bg-slate-900 py-1 px-2 rounded inline-block mx-1">user / user123</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
