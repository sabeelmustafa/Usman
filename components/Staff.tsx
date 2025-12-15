
import React, { useState, useEffect, useContext } from 'react';
import { api } from '../services/apiService';
import { AuthContext } from '../AuthContext';
import { Staff, SalarySlip, SchoolSettings, SalaryAdjustment, ClassLevel, Course } from '../types';
import { UserPlus, Edit2, User, DollarSign, Printer, PlayCircle, Eye, PlusCircle, History, Search, RefreshCw, XCircle, Calendar, Trash2, Key, CheckSquare, Square, Wallet, Briefcase, Phone, BookOpen, CreditCard, MapPin, X, Clock } from 'lucide-react';
import ImageUploader from './ImageUploader';
import { useNavigate } from 'react-router-dom';
import { SalarySlipTemplate } from './PrintView';

const StaffComp: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'directory' | 'payroll' | 'history' | 'fines' | 'bonuses' | 'advance'>('directory');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  
  // Staff Edit/Add Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Transaction Modal State
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [txnEditingId, setTxnEditingId] = useState<string | null>(null);
  const [txnData, setTxnData] = useState({
    staffId: '',
    type: 'Bonus',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Login Creation State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginData, setLoginData] = useState({ staffId: '', username: '', password: '', role: 'Staff', assignedClassIds: [] as string[] });

  // Shift Date Modal
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftData, setShiftData] = useState<{id: string, current: string}>({ id: '', current: '' });
  const [newShiftMonth, setNewShiftMonth] = useState('');

  // Payroll State
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7));
  const [generatedSlips, setGeneratedSlips] = useState<any[]>([]);
  const [currency, setCurrency] = useState('$');
  const [processing, setProcessing] = useState(false);
  const [payStatusFilter, setPayStatusFilter] = useState<'All' | 'Pending' | 'Paid'>('All');
  
  // Payslip Preview Modal State
  const [previewSlipData, setPreviewSlipData] = useState<{ slip: SalarySlip, staff: Staff } | null>(null);

  // History State
  const [historyData, setHistoryData] = useState<SalaryAdjustment[]>([]);
  const [historySearch, setHistorySearch] = useState('');

  // Edit Slip State
  const [showSlipEdit, setShowSlipEdit] = useState(false);
  const [editingSlip, setEditingSlip] = useState<any>(null);

  // Staff Form
  const initialFormState: Partial<Staff> = {
    name: '', designation: 'Therapist', contact: '', cnic: '', address: '', salary: 0, 
    status: 'Active', profilePhotoBase64: null, assignedCourseIds: []
  };
  const [formData, setFormData] = useState<Partial<Staff>>(initialFormState);

  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
      if (activeTab === 'payroll') {
          fetchPayrollData();
      } else if (['history', 'fines', 'bonuses', 'advance'].includes(activeTab)) {
          fetchHistoryData();
      }
  }, [activeTab, payrollMonth]);

  const fetchData = async () => {
    const [s, c, set, crs] = await Promise.all([
        api.getStaff(),
        api.getClasses(),
        api.request<SchoolSettings>('getSchoolSettings'),
        api.request<Course[]>('getAllCourses')
    ]);
    setStaff(s);
    setClasses(c);
    setSchoolSettings(set);
    setCurrency(set.currency);
    setCourses(crs);
  };

  const fetchPayrollData = async () => {
      const slips = await api.request<any[]>('getSlipsByMonth', { monthYear: payrollMonth });
      setGeneratedSlips(slips);
  };
  
  const fetchHistoryData = async () => {
      const adjs = await api.request<SalaryAdjustment[]>('getAdjustments');
      // Fix sort to handle strings or numbers for date
      setHistoryData(adjs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const payload = { ...formData, id: editingId || undefined };
      if (!editingId) payload.joiningDate = new Date().toISOString().split('T')[0];
      await api.saveStaff(payload, user);
      setShowModal(false);
      setEditingId(null);
      setFormData(initialFormState);
      fetchData();
    } catch (e) {
      alert("Error saving staff");
    }
  };

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 13);
    let formatted = val;
    if (val.length > 5) formatted = val.slice(0, 5) + '-' + val.slice(5);
    if (val.length > 12) formatted = formatted.slice(0, 13) + '-' + formatted.slice(13);
    setFormData({ ...formData, cnic: formatted });
  };

  const handleToggleCourse = (courseId: string) => {
      const current = formData.assignedCourseIds || [];
      if (current.includes(courseId)) {
          setFormData({ ...formData, assignedCourseIds: current.filter(id => id !== courseId) });
      } else {
          setFormData({ ...formData, assignedCourseIds: [...current, courseId] });
      }
  };

  const handleTxnSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!txnData.staffId) return alert("Please select a staff member");
      try {
          await api.request('addAdjustment', {
              ...txnData,
              amount: Number(txnData.amount),
              id: txnEditingId
          });
          alert(txnEditingId ? "Transaction updated" : "Transaction added successfully");
          setShowTxnModal(false);
          setTxnEditingId(null);
          setTxnData({ ...txnData, amount: '', description: '', staffId: '', type: 'Bonus' });
          if (['history', 'fines', 'bonuses', 'advance'].includes(activeTab)) fetchHistoryData();
      } catch (e) {
          alert("Error adding transaction");
      }
  };

  // --- Handlers for Login Creation ---
  const openLoginModal = (s: Staff) => {
      setLoginData({
          staffId: s.id,
          username: s.name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random()*100),
          password: 'password123',
          role: s.designation.toLowerCase().includes('teacher') ? 'Teacher' : 'Staff',
          assignedClassIds: []
      });
      setShowLoginModal(true);
  };

  const handleLoginCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      const staffMember = staff.find(s => s.id === loginData.staffId);
      if(!staffMember) return;

      try {
          await api.request('registerUser', {
              username: loginData.username,
              password: loginData.password,
              name: staffMember.name,
              role: loginData.role,
              linkedEntityId: staffMember.id,
              assignedClassIds: loginData.role === 'Teacher' ? loginData.assignedClassIds : [],
              assignedSubjects: [] 
          });
          alert("Login account created successfully!");
          setShowLoginModal(false);
      } catch (e: any) {
          alert(e.message || "Error creating account");
      }
  };

  const toggleLoginClass = (classId: string) => {
      setLoginData(prev => {
          const current = prev.assignedClassIds;
          if(current.includes(classId)) return { ...prev, assignedClassIds: current.filter(id => id !== classId) };
          return { ...prev, assignedClassIds: [...current, classId] };
      });
  };

  const handleEditTxn = (adj: SalaryAdjustment) => {
      setTxnEditingId(adj.id);
      setTxnData({
          staffId: adj.staffId,
          type: adj.type,
          amount: adj.amount.toString(),
          description: adj.description,
          date: new Date(adj.date).toISOString().split('T')[0]
      });
      setShowTxnModal(true);
  };

  const handleCancelTxn = async (id: string) => {
      if(!window.confirm("Are you sure you want to cancel this transaction?")) return;
      await api.request('deleteAdjustment', { id });
      fetchHistoryData();
  };

  const handleShiftTxn = (id: string, date: number) => {
      setShiftData({ id, current: new Date(date).toISOString().split('T')[0] });
      setNewShiftMonth('');
      setShowShiftModal(true);
  };

  const confirmShift = async () => {
      if(!newShiftMonth) return;
      const newDateStr = `${newShiftMonth}-01`;
      await api.request('updateAdjustmentDate', { id: shiftData.id, newDate: newDateStr });
      setShowShiftModal(false);
      fetchHistoryData();
  };

  const handleEdit = (s: Staff) => {
    setEditingId(s.id);
    setFormData(s);
    setShowModal(true);
  };
  
  const handleBulkGenerate = async () => {
      if (!payrollMonth) return;
      setProcessing(true);
      try {
          const res: any = await api.request('generatePayroll', { monthYear: payrollMonth });
          alert(`Payroll processed! ${res.generatedCount} slips generated.`);
          fetchPayrollData();
      } catch (e) {
          alert("Error processing payroll");
      } finally {
          setProcessing(false);
      }
  };

  const handleRefreshSlip = async (slipId: string) => {
      setProcessing(true);
      try {
          const updatedSlip = await api.request('refreshSalarySlip', { slipId });
          fetchPayrollData();
          if(showSlipEdit) setEditingSlip(updatedSlip);
      } catch (e) {
          alert("Error refreshing slip. Check if adjustments were removed.");
      } finally {
          setProcessing(false);
      }
  };

  const handleMarkPaid = async (slipId: string) => {
      if(!window.confirm("Mark this salary slip as PAID? This will record the expense.")) return;
      try {
          await api.request('paySalarySlip', { id: slipId });
          await fetchPayrollData(); 
      } catch (e) {
          alert("Error updating payment status");
      }
  };

  const handleDeleteSlip = async (slipId: string) => {
      if(!window.confirm("Delete this salary slip? Any applied bonuses/fines will be released back to the employee queue.")) return;
      try {
          await api.request('deleteSalarySlip', { id: slipId });
          fetchPayrollData(); 
      } catch (e) {
          alert("Error deleting slip");
      }
  };

  const openSlipEdit = async (slip: any) => {
      const details: any = await api.request('getSlipById', { id: slip.id });
      setEditingSlip(details);
      setShowSlipEdit(true);
  };

  const handleRemoveDeductionFromSlip = async (adj: SalaryAdjustment) => {
      const choice = window.confirm(
          `Remove '${adj.description}'?\n\nOK = Cancel Fine Permanently\nCancel = Postpone to Next Month`
      );
      try {
          if (choice) {
              await api.request('deleteAdjustment', { id: adj.id });
          } else {
              await api.request('postponeAdjustment', { id: adj.id });
          }
          await handleRefreshSlip(editingSlip.id);
      } catch (e) { console.error(e); }
  };

  const handleRemoveBonusFromSlip = async (adj: SalaryAdjustment) => {
      if(!window.confirm(`Remove bonus '${adj.description}'? It will be set to pending for future.`)) return;
      try {
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          nextMonth.setDate(1);
          await api.request('updateAdjustmentDate', { id: adj.id, newDate: nextMonth.toISOString().split('T')[0] }); 
          await handleRefreshSlip(editingSlip.id);
      } catch (e) { console.error(e); }
  };

  // Preview Logic
  const openSlipPreview = (slip: any) => {
      const employee = staff.find(s => s.id === slip.staffId);
      if (employee) {
          setPreviewSlipData({ slip, staff: employee });
      }
  };

  const closePreview = () => {
      setPreviewSlipData(null);
  };

  // Helper to get staff name from ID
  const getStaffName = (id: string) => {
      const s = staff.find(st => st.id === id);
      return s ? { name: s.name, role: s.designation } : { name: 'Unknown', role: '' };
  };

  const getFilteredData = () => {
      let data = historyData;
      if (activeTab === 'fines') data = data.filter(d => d.type === 'Fine');
      if (activeTab === 'bonuses') data = data.filter(d => d.type === 'Bonus');
      if (activeTab === 'advance') data = data.filter(d => d.type === 'Advance');
      
      return data.filter(h => {
          const s = getStaffName(h.staffId);
          return s.name.toLowerCase().includes(historySearch.toLowerCase());
      });
  };

  const filteredSlips = generatedSlips.filter(s => {
      if (payStatusFilter === 'All') return true;
      return (s.status || 'Pending') === payStatusFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Staff & Payroll</h1>
           <p className="text-slate-500">Manage employees and monthly salary processing.</p>
        </div>
        {user?.role === 'Admin' && activeTab === 'directory' && (
          <button onClick={() => { setEditingId(null); setFormData(initialFormState); setShowModal(true); }} className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm font-bold hover:bg-primary-700 transition-colors">
            <UserPlus size={20} /> Add Staff
          </button>
        )}
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto">
        {[
            { id: 'directory', label: 'Employee Directory', icon: User },
            { id: 'payroll', label: 'Payroll Processing', icon: DollarSign },
            { id: 'history', label: 'All History', icon: History },
            { id: 'bonuses', label: 'Bonuses', icon: PlusCircle },
            { id: 'fines', label: 'Fines', icon: XCircle },
            { id: 'advance', label: 'Advances', icon: Wallet }
        ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
        ))}
      </div>

      {activeTab === 'directory' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                <th className="px-6 py-4 text-slate-700 font-bold">Name</th>
                <th className="px-6 py-4 text-slate-700 font-bold">Designation</th>
                <th className="px-6 py-4 text-slate-700 font-bold">Status</th>
                <th className="px-6 py-4 text-slate-700 font-bold">Contact</th>
                <th className="px-6 py-4 text-right text-slate-700 font-bold">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {staff.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/staff/${s.id}`)}>
                    <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-200">
                        {s.profilePhotoBase64 ? <img src={s.profilePhotoBase64} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center"><User size={20} className="text-slate-400"/></div>}
                    </div>
                    <div>
                        <div className="font-bold text-slate-900">{s.name}</div>
                        <div className="text-xs text-slate-500 font-mono">ID: {s.id.substring(0,6)}</div>
                        {s.cnic && <div className="text-xs text-slate-400 font-mono mt-0.5">{s.cnic}</div>}
                    </div>
                    </td>
                    <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200">
                        {s.designation}
                    </span>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {s.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{s.contact}</td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => navigate(`/staff/${s.id}`)} className="p-1.5 text-slate-500 hover:text-blue-600 border border-slate-200 hover:bg-slate-100 rounded-md transition-colors" title="View Profile">
                                <Eye size={16}/>
                            </button>
                            {user?.role === 'Admin' && (
                                <>
                                    <button onClick={() => handleEdit(s)} className="p-1.5 text-slate-500 hover:text-primary-600 border border-slate-200 hover:bg-slate-100 rounded-md transition-colors" title="Edit Details">
                                        <Edit2 size={16}/>
                                    </button>
                                    <button onClick={() => openLoginModal(s)} className="p-1.5 text-slate-500 hover:text-purple-600 border border-slate-200 hover:bg-slate-100 rounded-md transition-colors" title="Create/Manage Login">
                                        <Key size={16}/>
                                    </button>
                                </>
                            )}
                        </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      )}

      {activeTab === 'payroll' && (
          <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-6 items-end">
                  <div className="w-full md:w-48">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Month</label>
                      <input 
                         type="month" 
                         className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                         value={payrollMonth}
                         onChange={e => setPayrollMonth(e.target.value)}
                      />
                  </div>
                  
                  <div className="w-full md:w-32">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                      <select 
                        className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                        value={payStatusFilter}
                        onChange={(e) => setPayStatusFilter(e.target.value as any)}
                      >
                          <option value="All">All</option>
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                      </select>
                  </div>
                  
                  <div className="flex gap-3 flex-wrap">
                      <button
                          onClick={() => { setTxnEditingId(null); setTxnData({...txnData, staffId: '', type: 'Bonus', amount: '', description: ''}); setShowTxnModal(true); }}
                          className="bg-white text-slate-700 border border-slate-300 px-4 py-2.5 rounded-lg hover:bg-slate-50 shadow-sm flex items-center gap-2 font-bold transition-colors"
                      >
                          <PlusCircle size={20} className="text-emerald-600"/> Add Transaction
                      </button>

                      <button 
                         onClick={handleBulkGenerate}
                         disabled={processing}
                         className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 shadow-sm flex items-center gap-2 font-bold disabled:opacity-50 transition-colors"
                      >
                          {processing ? 'Processing...' : <><PlayCircle size={20} /> Generate All</>}
                      </button>

                      <button 
                         onClick={() => window.open(`#/print/batch-salary-slip/${payrollMonth}`, '_blank')}
                         disabled={generatedSlips.length === 0}
                         className="bg-slate-800 text-white px-6 py-2.5 rounded-lg hover:bg-slate-900 shadow-sm flex items-center gap-2 font-bold disabled:opacity-50 transition-colors"
                      >
                          <Printer size={20} /> Print Batch
                      </button>
                  </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-700">Generated Slips ({filteredSlips.length})</h3>
                      <span className="text-xs text-slate-500">For {payrollMonth}</span>
                  </div>
                  {filteredSlips.length === 0 ? (
                      <div className="p-10 text-center text-slate-500">
                          No salary slips found matching criteria.
                      </div>
                  ) : (
                      <table className="w-full text-left text-sm">
                          <thead className="bg-white border-b border-slate-100">
                              <tr>
                                  <th className="px-6 py-3 text-slate-600 font-bold">Employee</th>
                                  <th className="px-6 py-3 text-slate-600 font-bold">Base Salary</th>
                                  <th className="px-6 py-3 text-slate-600 font-bold">Additions</th>
                                  <th className="px-6 py-3 text-slate-600 font-bold">Deductions</th>
                                  <th className="px-6 py-3 text-slate-600 font-bold">Net Pay</th>
                                  <th className="px-6 py-3 text-slate-600 font-bold">Status</th>
                                  <th className="px-6 py-3 text-right text-slate-600 font-bold">Action</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {filteredSlips.map(slip => (
                                  <tr key={slip.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-6 py-4">
                                          <div className="font-bold text-slate-800">{slip.staff_name}</div>
                                          <div className="text-xs text-slate-500">{slip.staff_designation}</div>
                                      </td>
                                      <td className="px-6 py-4 text-slate-600">{currency}{slip.baseSalary.toLocaleString()}</td>
                                      <td className="px-6 py-4 text-emerald-600 font-bold">+{currency}{slip.totalBonuses.toLocaleString()}</td>
                                      <td className="px-6 py-4 text-red-600 font-bold">-{currency}{slip.totalDeductions.toLocaleString()}</td>
                                      <td className="px-6 py-4 font-bold text-slate-800 text-lg">{currency}{slip.netSalary.toLocaleString()}</td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-1 rounded text-xs font-bold border ${
                                              slip.status === 'Paid' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'
                                          }`}>
                                              {slip.status || 'Pending'}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <div className="flex justify-end gap-2">
                                              {(!slip.status || slip.status === 'Pending') && (
                                                  <>
                                                      <button 
                                                          onClick={() => handleMarkPaid(slip.id)}
                                                          className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 font-bold shadow-sm transition-colors"
                                                      >
                                                          Pay
                                                      </button>
                                                      <button 
                                                          onClick={() => handleRefreshSlip(slip.id)}
                                                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded border border-slate-200"
                                                          title="Refresh Slip (Recalculate)"
                                                      >
                                                          <RefreshCw size={16} />
                                                      </button>
                                                      <button 
                                                          onClick={() => openSlipEdit(slip)}
                                                          className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded border border-slate-200"
                                                          title="Edit Slip"
                                                      >
                                                          <Edit2 size={16} />
                                                      </button>
                                                      <button 
                                                          onClick={() => handleDeleteSlip(slip.id)}
                                                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded border border-slate-200"
                                                          title="Delete Slip"
                                                      >
                                                          <Trash2 size={16} />
                                                      </button>
                                                  </>
                                              )}
                                              <button 
                                                  onClick={() => openSlipPreview(slip)}
                                                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded border border-slate-200"
                                                  title="View Payslip"
                                              >
                                                  <Eye size={16} />
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  )}
              </div>
          </div>
      )}

      {/* History Tabs View */}
      {['history', 'fines', 'bonuses', 'advance'].includes(activeTab) && (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                    <input 
                        type="text" 
                        placeholder="Search employee name..." 
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                        value={historySearch}
                        onChange={e => setHistorySearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                     <button
                          onClick={() => { setTxnEditingId(null); setTxnData({...txnData, staffId: '', type: 'Bonus', amount: '', description: ''}); setShowTxnModal(true); }}
                          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 font-bold shadow-sm transition-colors"
                      >
                          <PlusCircle size={20} /> Add New
                      </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-slate-700 font-bold">Date</th>
                            <th className="px-6 py-4 text-slate-700 font-bold">Employee</th>
                            <th className="px-6 py-4 text-slate-700 font-bold">Type</th>
                            <th className="px-6 py-4 text-slate-700 font-bold">Description</th>
                            <th className="px-6 py-4 text-slate-700 font-bold text-right">Amount</th>
                            <th className="px-6 py-4 text-slate-700 font-bold text-center">Status</th>
                            <th className="px-6 py-4 text-slate-700 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {getFilteredData().length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-slate-500">No records found.</td></tr>
                        ) : (
                            getFilteredData().map(adj => {
                                const employee = staff.find(s => s.id === adj.staffId);
                                return (
                                    <tr key={adj.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-slate-600">{new Date(adj.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            {employee?.name || 'Unknown'}
                                            <div className="text-xs text-slate-400">{employee?.designation}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold border ${
                                                adj.type === 'Bonus' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                adj.type === 'Fine' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                                {adj.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{adj.description}</td>
                                        <td className={`px-6 py-4 text-right font-mono font-bold ${
                                            adj.type === 'Bonus' ? 'text-emerald-600' : 'text-red-600'
                                        }`}>
                                            {adj.type === 'Bonus' ? '+' : '-'}{currency}{adj.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {adj.isApplied ? (
                                                <span className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
                                                    <CheckSquare size={14}/> Applied
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold text-orange-500 flex items-center justify-center gap-1">
                                                    <Clock size={14}/> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {!adj.isApplied && (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEditTxn(adj)} className="p-1.5 text-slate-400 hover:text-blue-600 border border-slate-200 rounded hover:bg-white transition-colors"><Edit2 size={16}/></button>
                                                    <button onClick={() => handleCancelTxn(adj.id)} className="p-1.5 text-slate-400 hover:text-red-600 border border-slate-200 rounded hover:bg-white transition-colors"><Trash2 size={16}/></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* Staff Modal (Add/Edit) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* ... Modal content ... */}
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        {editingId ? <Edit2 size={24}/> : <UserPlus size={24}/>}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Staff Profile' : 'Add New Staff'}</h3>
                        <p className="text-sm text-slate-500">Personal details and system access.</p>
                    </div>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl transition-colors">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                <div className="flex flex-col md:flex-row h-full">
                    {/* Sidebar: Photo */}
                    <div className="w-full md:w-1/3 bg-slate-50 p-8 border-r border-slate-100 flex flex-col items-center">
                         <ImageUploader currentImage={formData.profilePhotoBase64 || null} onImageChange={b64 => setFormData({...formData, profilePhotoBase64: b64})} />
                         <p className="text-xs text-slate-400 mt-2 text-center">Recommended: 400x400px</p>
                         
                         <div className="w-full mt-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Account Status</label>
                             <select className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 font-medium" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                             </select>
                         </div>
                    </div>
                    
                    {/* Main Content */}
                    <div className="flex-1 p-8 space-y-8">
                        {/* Identity Section */}
                        <section>
                            <h4 className="text-sm font-bold text-primary-700 uppercase tracking-wider mb-4 border-b border-primary-100 pb-2 flex items-center gap-2">
                                <User size={16}/> Identity & Role
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                    <input required type="text" placeholder="e.g. Sarah Smith" className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">CNIC Number</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder="xxxxx-xxxxxxx-x" 
                                            className="w-full pl-10 pr-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 font-mono tracking-wide" 
                                            value={formData.cnic || ''} 
                                            onChange={handleCnicChange}
                                            maxLength={15}
                                        />
                                        <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Format: XXXXX-XXXXXXX-X (Auto-formatted)</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
                                    <input required type="text" placeholder="e.g. Senior Therapist" className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Base Salary</label>
                                    <input required type="number" className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 font-mono" value={formData.salary} onChange={e => setFormData({...formData, salary: Number(e.target.value)})} />
                                </div>
                            </div>
                        </section>

                        {/* Contact Section */}
                        <section>
                            <h4 className="text-sm font-bold text-primary-700 uppercase tracking-wider mb-4 border-b border-primary-100 pb-2 flex items-center gap-2">
                                <Phone size={16}/> Contact Information
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone / Mobile</label>
                                    <input required type="text" className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Home Address</label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                                        <textarea 
                                            rows={2}
                                            placeholder="Street, City, Area..."
                                            className="w-full pl-10 pr-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 resize-none" 
                                            value={formData.address || ''} 
                                            onChange={e => setFormData({...formData, address: e.target.value})} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Therapy Assignment Section */}
                        <section>
                            <h4 className="text-sm font-bold text-primary-700 uppercase tracking-wider mb-4 border-b border-primary-100 pb-2 flex items-center gap-2">
                                <BookOpen size={16}/> Therapy Specializations
                            </h4>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <p className="text-xs text-slate-500 mb-3">Select the therapies this staff member is qualified to conduct.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                    {courses.length === 0 && <p className="text-sm text-slate-400 italic">No therapies defined in system.</p>}
                                    {courses.map(c => (
                                        <div 
                                            key={c.id} 
                                            onClick={() => handleToggleCourse(c.id)}
                                            className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${formData.assignedCourseIds?.includes(c.id) ? 'bg-white border-primary-500 shadow-sm ring-1 ring-primary-500' : 'bg-slate-100 border-transparent hover:bg-white hover:border-slate-300'}`}
                                        >
                                            {formData.assignedCourseIds?.includes(c.id) ? (
                                                <CheckSquare size={18} className="text-primary-600"/>
                                            ) : (
                                                <Square size={18} className="text-slate-400"/>
                                            )}
                                            <span className={`text-sm font-medium ${formData.assignedCourseIds?.includes(c.id) ? 'text-primary-800' : 'text-slate-600'}`}>
                                                {c.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
                
                <div className="px-8 py-4 bg-white border-t border-slate-100 flex justify-end gap-3">
                    <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                    <button type="submit" className="px-8 py-2.5 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 shadow-md transition-colors">Save Details</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Login Creation Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              {/* ... Modal content ... */}
              <h3 className="text-lg font-bold text-slate-800 mb-4">Create System Login</h3>
              <form onSubmit={handleLoginCreate} className="space-y-4">
                  {/* ... inputs ... */}
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                      <input required type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2" value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                      <input required type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                      <select className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2" value={loginData.role} onChange={e => setLoginData({...loginData, role: e.target.value})}>
                          <option value="Staff">Staff</option>
                          <option value="Teacher">Teacher</option>
                          <option value="Accountant">Accountant</option>
                          <option value="Admin">Admin</option>
                      </select>
                  </div>
                  {loginData.role === 'Teacher' && (
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Assigned Classes</label>
                          <div className="max-h-32 overflow-y-auto border border-slate-300 rounded-lg p-2">
                              {classes.map(c => (
                                  <div key={c.id} onClick={() => toggleLoginClass(c.id)} className="flex items-center gap-2 p-1 hover:bg-slate-50 cursor-pointer">
                                      {loginData.assignedClassIds.includes(c.id) ? <CheckSquare size={16} className="text-primary-600"/> : <Square size={16} className="text-slate-400"/>}
                                      <span className="text-sm">{c.name}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
                  <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setShowLoginModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Create Account</button>
                  </div>
              </form>
          </div>
        </div>
      )}

      {/* Shift Date Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
               {/* ... Modal content ... */}
               <h3 className="text-lg font-bold text-slate-800 mb-4">Shift Transaction Month</h3>
               <p className="text-sm text-slate-600 mb-4">Current Date: {shiftData.current}</p>
               <div className="mb-4">
                   <label className="block text-sm font-medium text-slate-700 mb-1">New Month</label>
                   <input type="month" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2" value={newShiftMonth} onChange={e => setNewShiftMonth(e.target.value)} />
               </div>
               <div className="flex justify-end gap-2">
                   <button onClick={() => setShowShiftModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                   <button onClick={confirmShift} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Shift</button>
               </div>
           </div>
        </div>
      )}

      {/* Slip Edit Modal */}
      {showSlipEdit && editingSlip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                  {/* ... Modal content ... */}
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
                      <h3 className="font-bold text-slate-800">Edit Salary Slip</h3>
                      <button onClick={() => { setShowSlipEdit(false); setEditingSlip(null); }}><XCircle className="text-slate-400 hover:text-slate-600" size={24}/></button>
                  </div>
                  <div className="p-6 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                              <span className="text-xs font-bold text-slate-500 uppercase">Employee</span>
                              <p className="font-bold">{editingSlip.staff_name}</p>
                          </div>
                          <div>
                              <span className="text-xs font-bold text-slate-500 uppercase">Month</span>
                              <p>{editingSlip.monthYear}</p>
                          </div>
                      </div>
                      
                      <div className="space-y-4">
                          <div>
                              <h4 className="font-bold text-sm text-slate-700 border-b pb-1 mb-2">Adjustments Included</h4>
                              {editingSlip.adjustments && editingSlip.adjustments.length > 0 ? (
                                  <div className="space-y-2">
                                      {editingSlip.adjustments.map((adj: any) => (
                                          <div key={adj.id} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200">
                                              <div>
                                                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded mr-2 ${adj.type === 'Bonus' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{adj.type}</span>
                                                  <span className="text-sm text-slate-700">{adj.description}</span>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                  <span className="font-mono text-sm font-bold">{adj.amount}</span>
                                                  <button 
                                                      onClick={() => adj.type === 'Bonus' ? handleRemoveBonusFromSlip(adj) : handleRemoveDeductionFromSlip(adj)}
                                                      className="text-red-500 hover:text-red-700 p-1"
                                                      title="Remove/Postpone"
                                                  >
                                                      <XCircle size={16}/>
                                                  </button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              ) : (
                                  <p className="text-sm text-slate-400 italic">No adjustments applied.</p>
                              )}
                          </div>
                      </div>
                  </div>
                  <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-2">
                      <button onClick={() => { setShowSlipEdit(false); setEditingSlip(null); }} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">Close</button>
                  </div>
              </div>
          </div>
      )}

      {/* Payslip Preview Modal (New) */}
      {previewSlipData && schoolSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                  <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <Eye size={20} className="text-slate-500"/> Payslip Preview
                      </h3>
                      <button onClick={closePreview} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto bg-slate-100 p-6 flex justify-center">
                      <div className="bg-white shadow-lg w-full max-w-[210mm] min-h-[297mm] p-8 origin-top transform scale-90 sm:scale-100">
                          <SalarySlipTemplate slip={previewSlipData.slip} staff={previewSlipData.staff} settings={schoolSettings} />
                      </div>
                  </div>

                  <div className="p-4 border-t border-slate-200 bg-white rounded-b-xl flex justify-end gap-3">
                      <button onClick={closePreview} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Close</button>
                      <button 
                          onClick={() => window.open(`#/print/salary-slip/${previewSlipData.slip.id}`, '_blank')}
                          className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 flex items-center gap-2"
                      >
                          <Printer size={18}/> Print
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Adjustment Modal */}
      {showTxnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            {/* ... Modal content ... */}
            <h3 className="text-lg font-bold text-slate-800 mb-4">Add Salary Adjustment</h3>
            <form onSubmit={handleTxnSubmit} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Staff Member</label>
                  <select 
                      required
                      disabled={!!txnEditingId}
                      className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                      value={txnData.staffId}
                      onChange={e => setTxnData({...txnData, staffId: e.target.value})}
                  >
                      <option value="">Select Employee...</option>
                      {staff.filter(s => s.status === 'Active').map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.designation})</option>
                      ))}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <div className="grid grid-cols-3 gap-2">
                     {['Bonus', 'Advance', 'Fine'].map(t => (
                        <button 
                           key={t} type="button" 
                           onClick={() => setTxnData({...txnData, type: t})}
                           className={`py-2 text-sm font-bold rounded border ${txnData.type === t ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300'}`}
                        >
                           {t}
                        </button>
                     ))}
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                  <input required type="number" className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={txnData.amount} onChange={e => setTxnData({...txnData, amount: e.target.value})} />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <input required type="text" className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={txnData.description} onChange={e => setTxnData({...txnData, description: e.target.value})} />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Effective Date</label>
                  <input required type="date" className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={txnData.date} onChange={e => setTxnData({...txnData, date: e.target.value})} />
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

export default StaffComp;
