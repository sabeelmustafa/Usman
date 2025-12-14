
import React, { useContext, useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { api } from '../services/apiService';
import { SchoolSettings } from '../types';
import { 
  LayoutDashboard, Users, CreditCard, Briefcase, LogOut, Menu, X, 
  GraduationCap, Settings, ShieldAlert, CalendarCheck, UserCog, User as UserIcon, Activity, ChevronRight
} from 'lucide-react';

const Layout: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);

  useEffect(() => {
    api.getSettings().then(setSchoolSettings);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    return (
      <NavLink
        to={to}
        onClick={() => setIsSidebarOpen(false)}
        className={({ isActive }) =>
          `group flex items-center justify-between px-4 py-3.5 mx-3 rounded-xl transition-all duration-300 mb-1.5 ${
            isActive 
              ? 'bg-white text-primary-700 font-bold shadow-sm ring-1 ring-slate-200' 
              : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className="flex items-center gap-3">
              <Icon size={22} className={`transition-colors ${isActive ? 'text-primary-600' : 'text-slate-500 group-hover:text-slate-700'}`} />
              <span className="text-[15px] font-semibold tracking-wide">{label}</span>
            </div>
            {isActive && <ChevronRight size={18} className="text-primary-500" />}
          </>
        )}
      </NavLink>
    );
  };

  const SectionLabel = ({ label }: { label: string }) => (
      <div className="px-7 mt-6 mb-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest opacity-80">
          {label}
      </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Mobile Backdrop */}
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/20 z-30 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar - UPDATED COLOR */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-[#eff4f9] border-r border-slate-200/80 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shadow-xl md:shadow-none flex flex-col`}>
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center p-6 border-b border-slate-200/60 min-h-[100px] relative">
          {schoolSettings?.logo_url ? (
             <img src={schoolSettings.logo_url} className="w-full h-auto max-h-16 object-contain" alt="School Logo"/>
          ) : (
             <div className="flex items-center space-x-3 text-slate-800">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 text-white">
                    <GraduationCap size={24} />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">{schoolSettings?.name || 'SchoolFlow'}</span>
             </div>
          )}
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-4 right-4 text-slate-500 hover:text-slate-700"><X size={24} /></button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-1">
          <nav>
            {user?.role === 'Admin' && <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />}
            
            {(user?.role === 'Staff' || user?.role === 'Teacher' || user?.role === 'Accountant') && (
               <NavItem to="/my-profile" icon={UserIcon} label="My Profile" />
            )}

            {user?.role !== 'Staff' && <NavItem to="/students" icon={Users} label="Student Directory" />}
            
            {(user?.role === 'Admin' || user?.role === 'Teacher') && (
                 <NavItem to="/attendance" icon={CalendarCheck} label="Attendance" />
            )}
            
            {user?.role === 'Staff' && (
                 <NavItem to="/attendance" icon={CalendarCheck} label="My Attendance" />
            )}

            {(user?.role === 'Admin' || user?.role === 'Accountant') && (
              <>
                 <SectionLabel label="Finance & HR" />
                 <NavItem to="/fees" icon={CreditCard} label="Invoices" />
                 <NavItem to="/staff" icon={Briefcase} label="Staff & Payroll" />
              </>
            )}
            
            {user?.role === 'Admin' && (
              <>
                <SectionLabel label="Administration" />
                <NavItem to="/users" icon={UserCog} label="User Access" />
                <NavItem to="/classes" icon={Activity} label="Therapies" />
                <NavItem to="/settings" icon={Settings} label="Settings" />
                <NavItem to="/logs" icon={ShieldAlert} label="Audit Logs" />
              </>
            )}
          </nav>
        </div>
        
        {/* User Footer in Sidebar */}
        <div className="p-4 bg-[#eef3f8] border-t border-slate-200/80">
            <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary-600 font-bold text-sm shadow-sm">
                    {user?.name.charAt(0)}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.role}</p>
                </div>
                <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-600 hover:bg-white rounded-lg transition-colors shadow-sm">
                    <LogOut size={18} />
                </button>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative h-full">
        {/* Glass Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 z-20 sticky top-0 transition-all duration-300">
            <div className="absolute inset-0 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm z-0"></div>
            
            <div className="flex items-center relative z-10">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-600 mr-4 p-2 rounded-lg hover:bg-slate-100"><Menu size={24} /></button>
                <div className="hidden md:flex flex-col">
                     <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                        {location.pathname === '/' ? 'Home' : location.pathname.split('/')[1].replace('-', ' ')}
                     </h2>
                     <p className="text-[10px] text-slate-500 font-medium">
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                     </p>
                </div>
            </div>

            <div className="flex items-center gap-4 relative z-10">
                <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-semibold text-slate-600">System Online</span>
                </div>
            </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative custom-scrollbar">
          <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 slide-in-from-bottom-2">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
