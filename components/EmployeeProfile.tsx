
import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/apiService';
import { AuthContext } from '../AuthContext';
import { Employee, SalarySlip, EmployeeHistory, SalaryAdjustment, SchoolSettings, Course } from '../types';
import { ArrowLeft, User, Phone, Briefcase, Calendar, TrendingUp, Printer, Power, DollarSign, PlusCircle, Trash2, Camera, Activity, CreditCard, MapPin } from 'lucide-react';

interface EmployeeDetail extends Employee {
  history: EmployeeHistory[];
  salaries: SalarySlip[];
}

const EmployeeProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [adjustments, setAdjustments] = useState<SalaryAdjustment[]>([]);
  const [currency, setCurrency] = useState('$');
  const [loading, setLoading] = useState(true);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([]);
  
  // Photo Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Promotion State
  const [promoData, setPromoData] = useState({ designation_to: '', date: '', reason: '', new_salary: '' });
  
  // Adjustment State
  const [adjData, setAdjData] = useState({ type: 'Bonus', amount: '', description: '', date: new Date().toISOString().split('T')[0] });

  // Generate Slip State
  const [genMonth, setGenMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [generating, setGenerating] = useState(false);

  // Determine if user has edit rights
  const canEdit = user?.role === 'Admin' || user?.role === 'Accountant';

  useEffect(() => {
    // If viewing via /my-profile route (id is undefined), use linked entity ID
    if (!id) {
       if (user?.linkedEntityId) {
         fetchDetails(user.linkedEntityId);
       } else {
         // User has no linked employee record
         setLoading(false);
       }
    } else if (id) {
       fetchDetails(id);
    }
  }, [id, user]);

  const fetchDetails = async (empId: string) => {
    setLoading(true);
    try {
      const [empData, adjData, settings, allCourses] = await Promise.all([
          api.request<EmployeeDetail>('getEmployeeDetails', { id: empId }),
          api.request<SalaryAdjustment[]>('getAdjustments', { staffId: empId }),
          api.request<SchoolSettings>('getSchoolSettings'),
          api.request<Course[]>('getAllCourses')
      ]);
      setEmployee(empData);
      setAdjustments(adjData);
      setCurrency(settings.currency);
      
      if (empData.assignedCourseIds && empData.assignedCourseIds.length > 0) {
          setAssignedCourses(allCourses.filter(c => empData.assignedCourseIds?.includes(c.id)));
      } else {
          setAssignedCourses([]);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!employee || !canEdit) return;
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          if (file.size > 1024 * 1024) return alert("File too large (Max 1MB)");
          
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64 = reader.result as string;
              // Save only the updated photo field
              await api.saveStaff({ ...employee, profilePhotoBase64: base64 }, user!);
              fetchDetails(employee.id);
          };
          reader.readAsDataURL(file);
      }
  };

  const openPromoModal = () => {
      if(!employee) return;
      setPromoData({
          designation_to: employee.designation,
          date: new Date().toISOString().split('T')[0],
          reason: '',
          new_salary: employee.salary.toString()
      });
      setShowPromoModal(true);
  };

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    try {
      await api.request('logEmployeePromotion', { 
          ...promoData, 
          employee_id: employee.id,
          new_salary: Number(promoData.new_salary) 
      });
      setShowPromoModal(false);
      fetchDetails(employee.id);
      alert("Employee role and details updated successfully.");
    } catch (err) {
      alert("Error logging update");
    }
  };

  const handleAddAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    try {
      await api.request('addAdjustment', { 
        ...adjData, 
        amount: Number(adjData.amount),
        staffId: employee.id 
      });
      setShowTxnModal(false);
      setAdjData({ type: 'Bonus', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchDetails(employee.id);
    } catch (e) {
      alert("Error adding adjustment");
    }
  };
  
  const handleDeleteAdjustment = async (adjId: string) => {
      if(!window.confirm("Remove this unapplied adjustment?")) return;
      try {
          await api.request('deleteAdjustment', { id: adjId });
          if(employee) fetchDetails(employee.id);
      } catch (e: any) {
          alert(e.message);
      }
  };

  const handleGenerateSlip = async () => {
    if (!employee || !genMonth) return;
    setGenerating(true);
    try {
      await api.request('generatePayroll', { monthYear: genMonth, staffIds: [employee.id] });
      fetchDetails(employee.id);
      alert("Salary slip generated!");
    } catch (e: any) {
      alert(e.message || "Error generating slip");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleStatus = async () => {
      if(!employee) return;
      const newStatus = employee.status === 'Active' ? 'Inactive' : 'Active';
      const confirmMsg = newStatus === 'Inactive' 
          ? "Are you sure you want to mark this employee as Inactive? They will be hidden from the default directory list."
          : "Re-activate this employee?";
      
      if(!window.confirm(confirmMsg)) return;

      try {
          await api.request('updateEmployee', { id: employee.id, status: newStatus });
          fetchDetails(employee.id.toString());
      } catch (e) {
          alert("Error updating status");
      }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading profile...</div>;
  
  if (!id && !user?.linkedEntityId) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
               <User size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Profile Not Linked</h2>
            <p className="text-slate-500 max-w-md">
                Your user account is not currently linked to an employee record in the system. 
                Please contact the administrator to resolve this.
            </p>
        </div>
      );
  }

  if (!employee) return <div className="p-8 text-center text-red-500">Employee not found. Please contact admin.</div>;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      
      {/* HERO HEADER SECTION */}
      <div className="bg-slate-800 rounded-2xl shadow-xl p-6 md:p-8 text-white mb-8 relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 p-40 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 p-24 bg-primary-500 opacity-10 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
              {/* Back Button */}
              {id && (
                  <button onClick={() => navigate('/staff')} className="absolute top-0 left-0 md:-left-2 md:-top-2 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm text-white border border-white/10">
                      <ArrowLeft size={20} />
                  </button>
              )}

              {/* Photo Area */}
              <div className="relative group mt-6 md:mt-0">
                  <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full p-1.5 shadow-2xl flex-shrink-0">
                      <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 flex items-center justify-center relative">
                          {employee.profilePhotoBase64 ? (
                              <img src={employee.profilePhotoBase64} className="w-full h-full object-cover" />
                          ) : (
                              <User size={64} className="text-slate-300" />
                          )}
                          {/* Photo Edit Overlay */}
                          {canEdit && (
                              <button 
                                  onClick={() => fileInputRef.current?.click()}
                                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                              >
                                  <Camera size={28} />
                              </button>
                          )}
                      </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpdate} />
              </div>

              {/* Text Info Area */}
              <div className="flex-1 text-center md:text-left pt-2">
                  <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
                      <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">{employee.name}</h1>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${employee.status === 'Active' ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300' : 'bg-red-500/20 border-red-400/30 text-red-300'}`}>
                          {employee.status}
                      </span>
                  </div>
                  
                  <div className="text-slate-300 text-lg font-medium mb-6 flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-0">
                      <span>{employee.designation}</span>
                      <span className="hidden md:inline mx-3 text-slate-600">|</span>
                      <span className="font-mono text-sm bg-slate-700/50 px-3 py-1 rounded-md text-slate-400 border border-slate-600/50">ID: {employee.id.substring(0,8)}</span>
                  </div>

                  {/* Header Actions */}
                  {canEdit && (
                      <div className="flex flex-wrap justify-center md:justify-start gap-3">
                          <button 
                              onClick={openPromoModal} 
                              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-primary-900/20 transition-all transform hover:-translate-y-0.5"
                              disabled={employee.status !== 'Active'}
                          >
                              <TrendingUp size={18} /> Promotion / Update
                          </button>
                          
                          <button 
                              onClick={handleToggleStatus} 
                              className={`px-5 py-2.5 text-sm font-bold rounded-xl flex items-center gap-2 backdrop-blur-md transition-all border transform hover:-translate-y-0.5 ${employee.status === 'Active' ? 'bg-red-500/10 hover:bg-red-500/20 text-red-200 border-red-500/20' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 border-emerald-500/20'}`}
                          >
                              <Power size={18} /> {employee.status === 'Active' ? 'Deactivate Account' : 'Re-activate Account'}
                          </button>
                      </div>
                  )}
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Personal Details & History */}
        <div className="space-y-8">
            
            {/* Contact Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700">
                    Personal Details
                </div>
                <div className="p-6 space-y-5">
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg"><Phone size={20} /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Contact Number</p>
                            <p className="text-slate-800 font-medium">{employee.contact}</p>
                        </div>
                    </div>
                    {employee.address && (
                        <div className="flex items-start gap-4">
                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg"><MapPin size={20} /></div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Address</p>
                                <p className="text-slate-800 font-medium leading-tight">{employee.address}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg"><CreditCard size={20} /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">CNIC Number</p>
                            <p className="text-slate-800 font-medium font-mono">{employee.cnic || 'Not Provided'}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg"><Calendar size={20} /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Joining Date</p>
                            <p className="text-slate-800 font-medium">{employee.joiningDate}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg"><Briefcase size={20} /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Current Base Salary</p>
                            <p className="text-emerald-700 font-bold text-lg">{currency}{employee.salary.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assigned Therapies */}
            {assignedCourses.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Activity size={20} className="text-primary-600" /> Therapy Specializations
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {assignedCourses.map(c => (
                            <span key={c.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200">
                                <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                                {c.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-6">Career Timeline</h3>
                <div className="space-y-8 relative pl-2 ml-2 border-l-2 border-slate-100">
                    {/* Current */}
                    <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary-600 ring-4 ring-white"></div>
                        <p className="font-bold text-slate-800 text-lg">{employee.designation}</p>
                        <p className="text-xs font-bold text-primary-600 uppercase mt-1">Current Role</p>
                    </div>
                    
                    {employee.history.map(h => (
                        <div key={h.id} className="relative pl-6">
                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-300 ring-4 ring-white"></div>
                            <p className="font-bold text-slate-700">{h.designation_to}</p>
                            <p className="text-sm text-slate-500">Promoted from {h.designation_from}</p>
                            <div className="mt-2 text-xs text-slate-400 flex flex-col gap-1">
                                <span>Date: {h.date}</span>
                                <span>Note: {h.reason}</span>
                            </div>
                        </div>
                    ))}

                    {/* Joined */}
                    <div className="relative pl-6">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-200 ring-4 ring-white"></div>
                        <p className="font-bold text-slate-600">Joined Organization</p>
                        <p className="text-xs text-slate-400 mt-1">{employee.joiningDate}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: Finance & Payroll */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Payroll Manager */}
            {canEdit && (
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl shadow-lg p-6 md:p-8 text-white">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <DollarSign size={24} className="text-emerald-400"/> Payroll Manager
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">Generate salary slips and manage monthly payments.</p>
                        </div>
                        <div className="flex bg-white/10 p-1.5 rounded-xl backdrop-blur-sm border border-white/10 w-full md:w-auto">
                            <input 
                                type="month" 
                                className="bg-transparent border-none text-white placeholder-white/50 focus:ring-0 text-sm px-3 py-1 outline-none w-full md:w-auto"
                                value={genMonth}
                                onChange={e => setGenMonth(e.target.value)}
                            />
                            <button 
                                onClick={handleGenerateSlip}
                                disabled={generating || employee.status !== 'Active'}
                                className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {generating ? 'Processing...' : 'Generate Slip'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pending Adjustments */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-700">Pending Adjustments (Next Salary)</h3>
                    {canEdit && (
                        <button onClick={() => setShowTxnModal(true)} className="text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold shadow-sm transition-colors">
                            <PlusCircle size={14} className="text-primary-600"/> Add New
                        </button>
                    )}
                </div>
                <div className="p-6">
                    {adjustments.filter(t => !t.isApplied).length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
                            <p className="text-slate-400 text-sm font-medium">No pending bonuses or deductions.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {adjustments.filter(t => !t.isApplied).map(t => (
                                <div key={t.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-shadow group">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg mt-1 ${t.type === 'Bonus' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                            {t.type === 'Bonus' ? <PlusCircle size={18}/> : <Trash2 size={18}/>} 
                                            {/* Trash icon just visual metaphor for deduction, actual delete button is distinct */}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{t.type}</div>
                                            <p className="text-sm text-slate-500">{t.description}</p>
                                            <p className="text-xs text-slate-400 mt-1">Effective: {new Date(t.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 mt-3 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                                        <span className={`text-lg font-bold font-mono ${t.type === 'Bonus' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {t.type === 'Bonus' ? '+' : '-'}{currency}{t.amount.toLocaleString()}
                                        </span>
                                        {canEdit && (
                                            <button onClick={() => handleDeleteAdjustment(t.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Salary History */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">
                    Salary Slip History
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-slate-500 font-bold uppercase text-xs">Period</th>
                                <th className="px-6 py-4 text-slate-500 font-bold uppercase text-xs">Generated On</th>
                                <th className="px-6 py-4 text-slate-500 font-bold uppercase text-xs text-right">Base</th>
                                <th className="px-6 py-4 text-slate-500 font-bold uppercase text-xs text-right">Net Pay</th>
                                <th className="px-6 py-4 text-slate-500 font-bold uppercase text-xs text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {employee.salaries.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium italic">No salary history available.</td></tr>
                            ) : (
                                employee.salaries.slice().reverse().map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800">{s.monthYear}</td>
                                        <td className="px-6 py-4 text-slate-500">{new Date(s.generationDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right text-slate-600 font-mono">{currency}{s.baseSalary.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-600 font-mono text-base">{currency}{s.netSalary.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => window.open(`#/print/salary-slip/${s.id}`, '_blank')}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1"
                                                title="Print Slip"
                                            >
                                                <Printer size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
      </div>

      {/* Promotion / Update Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Update Employee Role & Salary</h3>
            <form onSubmit={handlePromote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
                <input required type="text" className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg px-3 py-2" value={promoData.designation_to} onChange={e => setPromoData({...promoData, designation_to: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Base Salary ({currency})</label>
                <input required type="number" className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg px-3 py-2" value={promoData.new_salary} onChange={e => setPromoData({...promoData, new_salary: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Effective Date</label>
                <input required type="date" className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg px-3 py-2" value={promoData.date} onChange={e => setPromoData({...promoData, date: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason / Comments</label>
                <textarea required rows={3} className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg px-3 py-2" value={promoData.reason} onChange={e => setPromoData({...promoData, reason: e.target.value})} />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowPromoModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900">Confirm Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {showTxnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Add Salary Adjustment</h3>
            <form onSubmit={handleAddAdjustment} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <div className="grid grid-cols-3 gap-2">
                     {['Bonus', 'Advance', 'Fine'].map(t => (
                        <button 
                           key={t} type="button" 
                           onClick={() => setAdjData({...adjData, type: t})}
                           className={`py-2 text-sm font-bold rounded border ${adjData.type === t ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300'}`}
                        >
                           {t}
                        </button>
                     ))}
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                  <input required type="number" className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg px-3 py-2" value={adjData.amount} onChange={e => setAdjData({...adjData, amount: e.target.value})} />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <input required type="text" className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg px-3 py-2" value={adjData.description} onChange={e => setAdjData({...adjData, description: e.target.value})} />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Effective Date</label>
                  <input required type="date" className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg px-3 py-2" value={adjData.date} onChange={e => setAdjData({...adjData, date: e.target.value})} />
                  <p className="text-xs text-slate-400 mt-1">This determines which month's payroll will include this adjustment.</p>
               </div>
               <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowTxnModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Add Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile;
