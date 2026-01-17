
import React, { useContext, useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { api } from '../services/apiService';
import { SchoolSettings } from '../types';
import { 
  LayoutDashboard, Users, CreditCard, Briefcase, LogOut, Menu, X, 
  GraduationCap, Settings, CalendarCheck, UserCog, User as UserIcon, Activity, ChevronRight
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
          `group flex items-center justify-between px-3 py-2.5 mx-3 rounded-lg transition-all duration-300 mb-1 ${
            isActive 
              ? 'bg-white text-primary-700 font-bold shadow-sm ring-1 ring-slate-200' 
              : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className="flex items-center gap-3">
              <Icon size={18} className={`transition-colors ${isActive ? 'text-primary-600' : 'text-slate-500 group-hover:text-slate-700'}`} />
              <span className="text-sm font-semibold tracking-wide">{label}</span>
            </div>
            {isActive && <ChevronRight size={16} className="text-primary-500" />}
          </>
        )}
      </NavLink>
    );
  };

  const SectionLabel = ({ label }: { label: string }) => (
      <div className="px-6 mt-5 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-80">
          {label}
      </div>
  );

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Mobile Backdrop */}
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/20 z-30 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar - COMPACT WIDTH */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#eff4f9] border-r border-slate-200/80 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shadow-xl md:shadow-none flex flex-col h-full`}>
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center p-4 border-b border-slate-200/60 min-h-[80px] relative shrink-0">
          {schoolSettings?.logo_url ? (
             <img src={schoolSettings.logo_url} className="w-full h-auto max-h-12 object-contain" alt="School Logo"/>
          ) : (
             <div className="flex items-center space-x-2 text-slate-800">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/30 text-white">
                    <GraduationCap size={20} />
                </div>
                <span className="text-lg font-bold tracking-tight text-slate-900">{schoolSettings?.name || 'SchoolFlow'}</span>
             </div>
          )}
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-4 right-4 text-slate-500 hover:text-slate-700"><X size={20} /></button>
        </div>

        {/* Navigation - min-h-0 ensures it scrolls correctly in flex container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-3 space-y-0.5 min-h-0">
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
              </>
            )}
          </nav>
        </div>
        
        {/* DEVELOPER FOOTER - MODIFIED FOR DYNAMIC LOGO */}
        <div className="bg-slate-100 border-t border-slate-200 p-3 flex flex-col items-center justify-center shrink-0 gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Developed by</span>
            
            <a 
                href="https://www.fiverr.com/sabeelmustafa/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="transition-transform hover:scale-105 active:scale-95 w-full flex justify-center"
                title="Visit Developer Website"
            >
                {/* 
                    UPDATED IMAGE STYLING:
                    - w-auto max-w-full: Allows full width usage if needed
                    - max-h-11: ~30% smaller than previous max-h-16 (16->11 is ~31% reduction)
                    - object-contain: Preserves aspect ratio
                */}
                <img 
                    src="https://admin.diversory.center/vvlogo.png" 
                    alt="Developer Logo" 
                    className="w-auto h-auto max-w-full max-h-11 object-contain hover:opacity-80 transition-opacity" 
                />
            </a>
        </div>
        {/* DEVELOPER FOOTER - END */}

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
                        {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                     </p>
                </div>
            </div>

            <div className="flex items-center gap-4 relative z-10">
                {/* User Profile moved to Header */}
                <div className="flex items-center gap-3 pl-4 md:pl-6 md:border-l border-slate-200">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-slate-800 leading-tight">{user?.name}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{user?.role}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center text-primary-700 font-bold text-sm shadow-sm cursor-default">
                        {user?.name.charAt(0)}
                    </div>
                    <button 
                        onClick={handleLogout} 
                        className="ml-2 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" 
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>

        {/* Scrollable Main Content */}
        {/* UPDATE: Removed pb-4/pb-8 bottom padding to ensure full height usage as requested */}
        <main className="flex-1 overflow-y-auto px-4 pt-4 md:px-8 md:pt-8 pb-0 relative custom-scrollbar">
          <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 slide-in-from-bottom-2">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
