
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CreditCard, Briefcase, Activity, ShieldCheck, Zap, ArrowRight, BookOpen } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Student Management",
      description: "Complete student directory with detailed profiles, parent contacts, and enrollment history."
    },
    {
      icon: CreditCard,
      title: "Fee Automation",
      description: "Generate monthly challans, track pending dues, and record payments with a single click."
    },
    {
      icon: Briefcase,
      title: "Staff & Payroll",
      description: "Manage employee profiles, promotions, and generate automated salary slips with deductions."
    },
    {
      icon: Activity,
      title: "Attendance Tracking",
      description: "Daily attendance for students and staff with detailed monthly history reports."
    },
    {
      icon: BookOpen,
      title: "Academics & Exams",
      description: "Schedule exams, record marks, and generate automated result cards and grades."
    },
    {
      icon: ShieldCheck,
      title: "Secure & Offline",
      description: "Your data is stored locally. No internet connection required for day-to-day operations."
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      {/* Navbar */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white">
              <Zap size={20} />
            </div>
            <span className="text-xl font-bold text-slate-800">SchoolFlow</span>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-bold mb-6 border border-blue-100">
            Internal Management System v1.0
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
            Manage your school with <span className="text-primary-600">efficiency</span> and <span className="text-primary-600">clarity</span>.
          </h1>
          <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            SchoolFlow streamlines everything from student enrollments to financial auditing, all in one fast, secure, and beautiful interface.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-primary-600 text-white rounded-xl font-bold text-lg hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Access Dashboard <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all duration-300 group">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 mb-6 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                <f.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{f.title}</h3>
              <p className="text-slate-500 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} SchoolFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
