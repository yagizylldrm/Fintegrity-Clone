import { useState, useEffect } from "react";
import { BACKEND_URL } from './config';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  AlertTriangle,
  LogOut,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Palette
} from "lucide-react";
import axios from "axios";
import Dashboard from "./components/Dashboard";
import Documents from "./pages/Documents";
import Contracts from "./pages/Contracts";
import Anomalies from "./pages/Anomalies";
import Login from "./pages/Login";
import UserPortal from "./pages/UserPortal";
import Settings from "./pages/Settings";

function App() {
  const [auth, setAuth] = useState(null);
  const [isNetworkUp, setIsNetworkUp] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

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

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        await axios.get(`${BACKEND_URL}/`, { timeout: 2000 });
        setIsNetworkUp(true);
      } catch {
        setIsNetworkUp(false);
      }
    };
    checkNetwork();
    const interval = setInterval(checkNetwork, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (userData) => {
    setAuth(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    delete axios.defaults.headers.common['Authorization'];
    setAuth(null);
  };

  // Eğer giriş yapılmamışsa Login sayfasını göster
  if (!auth) {
    return <Login onLogin={handleLogin} />;
  }

  // Eğer giriş yapan kişi standart bir kullanıcı ise sadece User Portal'ı göster
  if (auth.role === "user") {
    return (
      <UserPortal
        username={auth.username}
        onLogout={handleLogout}
        auth={auth}
        setAuth={setAuth}
      />
    );
  }

  // Eğer giriş yapan kişi admin ise ana sistemi göster
  return (
    <Router>
      <div
        className={`theme-${auth?.theme || "current"} flex h-screen font-sans overflow-hidden ${
          auth?.theme === "light" ? "bg-slate-50 text-slate-800" :
          auth?.theme === "dark" ? "bg-black text-slate-300" :
          "bg-[#0f172a] text-slate-200"
        }`}
      >
        {/* Sidebar */}
        <aside className="w-64 glass-panel border-r border-slate-700/50 flex flex-col relative z-20">
          <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-linear-to-br from-blue-500 to-emerald-500 p-2 rounded-xl">
                <ShieldCheck size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-emerald-400">
                  FINTEGRITY
                </h1>
              </div>
            </div>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/50 transition-all cursor-pointer"
              title="Tema Değiştir"
            >
              {auth?.theme === 'light' ? <Moon size={18} /> : auth?.theme === 'dark' ? <Palette size={18} /> : <Sun size={18} />}
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`
              }
            >
              <LayoutDashboard size={20} />
              Gösterge Paneli
            </NavLink>

            <NavLink
              to="/documents"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`
              }
            >
              <FileText size={20} />
              Tüm Belgeler
            </NavLink>

            <NavLink
              to="/contracts"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`
              }
            >
              <ShieldCheck size={20} />
              Akıllı Sözleşmeler
            </NavLink>

            <NavLink
              to="/anomalies"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`
              }
            >
              <AlertTriangle size={20} />
              AI Anomalileri
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`
              }
            >
              <SettingsIcon size={20} />
              Ayarlar
            </NavLink>
          </nav>

          <div className="p-4 border-t border-slate-700/50 space-y-4">
            <div
              className={`p-4 rounded-xl border text-center ${isNetworkUp ? "bg-slate-800/50 border-slate-700" : "bg-rose-900/20 border-rose-800/50"}`}
            >
              <p className="text-xs text-slate-400 mb-2">Ağ Durumu</p>
              <div
                className={`flex items-center justify-center gap-2 text-sm font-bold ${isNetworkUp ? "text-emerald-400" : "text-rose-500"}`}
              >
                <span className="relative flex h-3 w-3">
                  {isNetworkUp && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${isNetworkUp ? "bg-emerald-500" : "bg-rose-600"}`}
                  ></span>
                </span>
                {isNetworkUp ? "SİSTEM AKTİF" : "SİSTEM KAPALI"}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 py-3 rounded-xl transition-colors font-semibold"
            >
              <LogOut size={18} /> Çıkış Yap
            </button>
          </div>
        </aside>

        {/* Ana İçerik Alanı */}
        <main className="flex-1 overflow-y-auto relative z-10 p-8 custom-scrollbar">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/documents" element={<Documents auth={auth} />} />
            <Route path="/contracts" element={<Contracts auth={auth} />} />
            <Route path="/anomalies" element={<Anomalies />} />
            <Route
              path="/settings"
              element={<Settings auth={auth} setAuth={setAuth} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
