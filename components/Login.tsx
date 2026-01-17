
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../AuthContext';
import { api } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, AlertCircle, Info, HelpCircle, User, Lock, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen flex bg-slate-50 font-sans">
      
      {/* Left Column: Branding (Desktop) */}
      <div className="hidden lg:flex lg:w-5/12 bg-slate-900 relative overflow-hidden items-center justify-center p-12 xl:p-16">
         {/* Background Effects */}
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-slate-950"></div>
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] -mr-20 -mt-20 mix-blend-screen"></div>
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] -ml-20 -mb-20 mix-blend-screen"></div>
         
         {/* Content */}
         <div className="relative z-10 text-white max-w-lg">
            <div className="w-20 h-20 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-10 border border-white/10 shadow-2xl ring-1 ring-white/5">
               <GraduationCap size={48} className="text-indigo-300" />
            </div>
            
            <h1 className="text-4xl xl:text-5xl font-extrabold mb-6 leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-100 to-indigo-300">
               Simplify your school management.
            </h1>
            
            <p className="text-lg text-slate-300 mb-10 leading-relaxed font-light">
               Experience the future of educational administration with a platform designed for efficiency, security, and ease of use.
            </p>

            <div className="space-y-5">
                {[
                    'Smart Fee Automation', 
                    'Seamless Payroll Processing', 
                    'Comprehensive Student Records',
                    'Offline-First Security'
                ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all">
                            <CheckCircle2 size={20} className="text-indigo-400 group-hover:text-indigo-300" />
                        </div>
                        <span className="font-medium text-slate-200 group-hover:text-white transition-colors">{feature}</span>
                    </div>
                ))}
            </div>
         </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-7/12 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-20 relative">
         <div className="w-full max-w-[440px] space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
                {schoolSettings?.logo_url ? (
                    <img src={schoolSettings.logo_url} alt="Logo" className="h-16 mx-auto object-contain mb-4 drop-shadow-md" />
                ) : (
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white mb-4 shadow-xl shadow-indigo-200">
                        <GraduationCap size={36} />
                    </div>
                )}
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{schoolSettings?.name || 'SchoolFlow'}</h2>
            </div>

            <div className="text-center lg:text-left">
               <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
               <p className="text-slate-500 mt-2 text-base">Please enter your details to access your account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl flex items-start gap-3 border border-red-100 animate-in fade-in zoom-in-95 duration-200">
                    <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                    <span className="font-medium">{error}</span>
                </div>
              )}
              
              <div className="p-4 bg-blue-50/50 text-blue-800 text-sm rounded-xl flex items-start gap-3 border border-blue-100/50">
                    <Info size={20} className="mt-0.5 flex-shrink-0 text-blue-600" />
                    <div>
                        <p className="font-bold mb-1 text-blue-700">Demo Access</p>
                        <div className="flex gap-4 font-mono text-xs bg-blue-100/50 px-2 py-1 rounded border border-blue-100">
                            <span>User: <strong>admin</strong></span>
                            <span>Pass: <strong>admin</strong></span>
                        </div>
                    </div>
              </div>
              
              <div className="space-y-5">
                  <div className="group">
                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Username</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User size={20} className="text-slate-400 group-focus-within:text-indigo-600 transition-colors"/>
                        </div>
                        <input 
                          type="text" 
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-white text-slate-900 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none placeholder-slate-400 transition-all font-medium shadow-sm group-hover:border-slate-300"
                          placeholder="Enter your username"
                          required
                        />
                    </div>
                  </div>

                  <div className="group">
                     <div className="flex justify-between items-center mb-2 ml-1">
                        <label className="block text-sm font-bold text-slate-700">Password</label>
                     </div>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock size={20} className="text-slate-400 group-focus-within:text-indigo-600 transition-colors"/>
                        </div>
                        <input 
                           type="password" 
                           value={password} 
                           onChange={(e) => setPassword(e.target.value)}
                           className="w-full pl-12 pr-4 py-4 bg-white text-slate-900 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none placeholder-slate-400 transition-all font-medium shadow-sm group-hover:border-slate-300"
                           placeholder="Enter your password"
                           required
                        />
                     </div>
                  </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2.5">
                      <div className="relative flex items-center">
                        <input 
                            type="checkbox" 
                            id="remember" 
                            checked={rememberMe} 
                            onChange={e => setRememberMe(e.target.checked)}
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                        <CheckCircle2 size={12} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <label htmlFor="remember" className="text-sm font-medium text-slate-600 cursor-pointer select-none hover:text-slate-900">Keep me logged in</label>
                  </div>
              </div>

              <div className="space-y-4 pt-2">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-[15px]"
                  >
                    {loading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" /> Verifying...
                        </>
                    ) : (
                        <>Login Dashboard <ArrowRight size={20} strokeWidth={2.5} /></>
                    )}
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => navigate('/landing')}
                    className="w-full bg-white text-slate-600 border border-slate-200 font-bold py-4 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2.5 hover:border-slate-300 hover:shadow-md hover:text-slate-800 text-[15px] group"
                  >
                    <HelpCircle size={20} className="text-slate-400 group-hover:text-indigo-500 transition-colors" /> What Does This App Do?
                  </button>
              </div>
            </form>

            <div className="pt-10 flex flex-col items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Developed By</span>
                <a 
                    href="https://www.fiverr.com/sabeelmustafa/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="group relative"
                >
                    <div className="absolute -inset-2 bg-indigo-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <img 
                        src="https://admin.diversory.center/vvlogo.png" 
                        alt="Developer Logo" 
                        className="h-8 w-auto object-contain opacity-60 group-hover:opacity-100 transition-all relative z-10 grayscale group-hover:grayscale-0" 
                    />
                </a>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Login;
