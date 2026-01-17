
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../AuthContext';
import { api } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, AlertCircle, Info, HelpCircle } from 'lucide-react';
import { SchoolSettings } from '../types';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSettings = async () => {
        try {
            const s = await api.request<SchoolSettings>('getSchoolSettings');
            setSchoolSettings(s);
        } catch (e) {
            console.error("Failed to load settings", e);
        }
    };
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const user = await api.login(username, password);
      login(user, rememberMe);
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          {schoolSettings?.logo_url ? (
             <div className="w-full max-w-[300px] mx-auto mb-4 relative">
                 <img src={schoolSettings.logo_url} alt="School Logo" className="w-full h-auto object-contain" />
             </div>
          ) : (
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 text-primary-600 mb-4">
                <GraduationCap size={40} />
             </div>
          )}
          
          {!schoolSettings?.logo_url && (
             <h2 className="text-3xl font-bold text-slate-800">{schoolSettings?.name || 'SchoolFlow'}</h2>
          )}
          
          <p className="text-slate-500 mt-2">Internal Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
            </div>
          )}
          
          <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-lg flex items-start gap-2 border border-blue-100">
                <Info size={18} className="mt-0.5 flex-shrink-0" />
                <span><strong>Demo Access:</strong><br/>Username: <code>admin</code><br/>Password: <code>admin</code></span>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none placeholder-slate-400"
              placeholder="User Name"
              required
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
             <input 
               type="password" 
               value={password} 
               onChange={(e) => setPassword(e.target.value)}
               className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none placeholder-slate-400"
               placeholder="Password"
               required
             />
          </div>

          <div className="flex items-center gap-2">
              <input 
                  type="checkbox" 
                  id="remember" 
                  checked={rememberMe} 
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer user-select-none">Keep me logged in</label>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white font-semibold py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? 'Verifying...' : 'Login'}
          </button>
          
          <button 
            type="button"
            onClick={() => navigate('/landing')}
            className="w-full bg-white text-slate-600 border border-slate-200 font-semibold py-3 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <HelpCircle size={18} /> What Does This App Do?
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Developed By</span>
            <a 
                href="https://www.fiverr.com/sabeelmustafa/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:opacity-80 transition-opacity"
            >
                <img 
                    src="https://admin.diversory.center/vvlogo.png" 
                    alt="Developer Logo" 
                    className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" 
                />
            </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
