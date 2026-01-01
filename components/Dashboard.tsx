import React, { useEffect, useState } from 'react';
import { api } from '../services/apiService';
import { DashboardStats, SchoolSettings } from '../types';
import { Users, DollarSign, Briefcase, CalendarCheck, TrendingUp, ArrowRight, Activity, Bell, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [currency, setCurrency] = useState('$');
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [data, settings] = await Promise.all([
         api.getDashboardStats(),
         api.getSettings()
      ]);
      setStats(data);
      setCurrency(settings.currency);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadReport = () => {
      // Trigger browser print dialog for a daily snapshot
      window.print();
  };

  if (!stats) return <div className="p-8 text-slate-500">Loading Analytics...</div>;

  const StatCard = ({ title, value, icon: Icon, colorClass, trend, link }: any) => (
    <div 
        onClick={() => link && navigate(link)}
        className="group relative bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-slate-100 cursor-pointer overflow-hidden print:break-inside-avoid print:shadow-none print:border-slate-300"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorClass} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 print:hidden`}></div>
      
      <div className="flex items-start justify-between relative z-10">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1 tracking-wide">{title}</p>
            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClass} text-white shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform print:text-black print:shadow-none`}>
            <Icon size={22} />
          </div>
      </div>
      
      <div className="mt-4 flex items-center text-xs font-medium text-slate-400">
         <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full print:bg-transparent print:p-0">
            <TrendingUp size={12} /> {trend}
         </span>
         <span className="ml-2">vs last month</span>
      </div>
    </div>
  );

  // Simple CSS Chart Calculation
  const maxVal = Math.max(stats.collectedFees, stats.pendingFees) || 1;
  const collectedHeight = (stats.collectedFees / maxVal) * 100;
  const pendingHeight = (stats.pendingFees / maxVal) * 100;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
           <p className="text-slate-500 mt-1">Here's what's happening in your school today.</p>
        </div>
        <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 bg-white text-slate-600 px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 text-sm font-semibold">
                <CalendarCheck size={16} /> {new Date().toLocaleDateString('en-GB')}
             </button>
             <button 
                onClick={handleDownloadReport}
                className="bg-primary-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-primary-500/30 hover:bg-primary-700 text-sm font-semibold transition-transform active:scale-95 flex items-center gap-2"
             >
                <FileText size={16}/> Download Report
             </button>
        </div>
      </div>

      {/* Print Only Header */}
      <div className="hidden print:block text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Daily School Report</h1>
          <p className="text-slate-500">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={stats.totalStudents} icon={Users} colorClass="from-blue-500 to-blue-600" trend="+12%" link="/students" />
        <StatCard title="Total Staff" value={stats.totalStaff} icon={Briefcase} colorClass="from-purple-500 to-purple-600" trend="+2%" link="/staff" />
        <StatCard title="Revenue Collected" value={`${currency}${stats.collectedFees.toLocaleString()}`} icon={DollarSign} colorClass="from-emerald-500 to-emerald-600" trend="+8%" link="/fees" />
        <StatCard title="Daily Attendance" value={`${stats.attendanceToday}%`} icon={Activity} colorClass="from-orange-500 to-orange-600" trend="Stable" link="/attendance" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
        {/* Financial Chart Section */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-card relative overflow-hidden print:border-slate-300 print:shadow-none print:mb-6">
          <div className="flex justify-between items-center mb-8">
             <div>
                <h3 className="text-lg font-bold text-slate-800">Financial Performance</h3>
                <p className="text-sm text-slate-500">Revenue collection vs Pending dues</p>
             </div>
             <div className="flex gap-2 text-xs font-bold">
                 <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Collected</span>
                 <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Pending</span>
             </div>
          </div>

          <div className="h-64 w-full flex items-end justify-center gap-16 md:gap-32 p-4 relative">
             {/* Chart Bars */}
             <div className="flex flex-col items-center gap-3 group w-24">
                 <div className="text-sm font-bold text-slate-700 bg-white shadow-sm border px-3 py-1 rounded-lg mb-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 print:opacity-100 print:translate-y-0">{currency}{stats.collectedFees.toLocaleString()}</div>
                 <div className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all duration-700 group-hover:scale-105 print:bg-emerald-500" style={{ height: `${collectedHeight}%`, minHeight: '8px' }}></div>
                 <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collected</div>
             </div>
             
             <div className="flex flex-col items-center gap-3 group w-24">
                 <div className="text-sm font-bold text-slate-700 bg-white shadow-sm border px-3 py-1 rounded-lg mb-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 print:opacity-100 print:translate-y-0">{currency}{stats.pendingFees.toLocaleString()}</div>
                 <div className="w-full bg-gradient-to-t from-slate-300 to-slate-400 rounded-2xl transition-all duration-700 group-hover:scale-105 print:bg-slate-300" style={{ height: `${pendingHeight}%`, minHeight: '8px' }}></div>
                 <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending</div>
             </div>
             
             {/* Background Grid Lines */}
             <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 z-0">
                 <div className="border-b border-dashed border-slate-300 w-full"></div>
                 <div className="border-b border-dashed border-slate-300 w-full"></div>
                 <div className="border-b border-dashed border-slate-300 w-full"></div>
                 <div className="border-b border-dashed border-slate-300 w-full"></div>
                 <div className="border-b border-slate-300 w-full"></div>
             </div>
          </div>
        </div>

        {/* Quick Actions & Notices */}
        <div className="space-y-6 print:hidden">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-16 bg-white opacity-5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                <h3 className="text-lg font-bold mb-1 relative z-10">Quick Actions</h3>
                <p className="text-indigo-200 text-sm mb-6 relative z-10">Manage daily tasks efficiently.</p>
                
                <div className="space-y-3 relative z-10">
                    <button onClick={() => navigate('/students', { state: { openAdd: true } })} className="w-full text-left px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/5 backdrop-blur-sm text-sm font-semibold transition-colors flex items-center justify-between group">
                        <span>Register Student</span>
                        <ArrowRight size={16} className="opacity-50 group-hover:opacity-100 transition-opacity"/>
                    </button>
                    <button onClick={() => navigate('/fees')} className="w-full text-left px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/5 backdrop-blur-sm text-sm font-semibold transition-colors flex items-center justify-between group">
                        <span>Generate Invoice</span>
                        <ArrowRight size={16} className="opacity-50 group-hover:opacity-100 transition-opacity"/>
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card">
               <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <Bell size={18} className="text-primary-500"/> System Updates
               </h3>
               <div className="space-y-4">
                   <div className="flex gap-3 items-start">
                       <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0"></div>
                       <div>
                           <p className="text-sm font-semibold text-slate-700">Fee Submission Due</p>
                           <p className="text-xs text-slate-500 mt-0.5">Monthly invoices generated for Oct.</p>
                       </div>
                   </div>
                   <div className="flex gap-3 items-start">
                       <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0"></div>
                       <div>
                           <p className="text-sm font-semibold text-slate-700">Staff Meeting</p>
                           <p className="text-xs text-slate-500 mt-0.5">Scheduled for Friday, 3 PM.</p>
                       </div>
                   </div>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;