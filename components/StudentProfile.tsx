import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/apiService';
import { Student, Invoice, InvoiceStatus, SchoolSettings, StudentFeeAdjustment, Course, StudentCourse, TherapyRecordFile } from '../types';
import { AuthContext } from '../AuthContext';
import { ArrowLeft, User as UserIcon, Phone, MapPin, Calendar, CreditCard, FileText, Printer, PlusCircle, AlertCircle, Trash2, FolderOpen, Upload, Download, Activity, CheckSquare, Camera, X, Eye, Check, Zap } from 'lucide-react';
import { InvoiceTemplate } from './PrintView';

interface StudentProfileData extends Student {
  parent_name: string;
  contact_no: string;
  address: string;
  invoices: Invoice[];
  pending_adjustments?: StudentFeeAdjustment[];
  courses: (StudentCourse & { courseName: string })[];
  files: TherapyRecordFile[];
}

const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [student, setStudent] = useState<StudentProfileData | null>(null);
  const [currency, setCurrency] = useState('$');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'finance' | 'therapy'>('finance');
  
  // Photo Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Course Management
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({ courseId: '', feeBasis: 'Monthly', agreedFee: 0 });

  // Therapy File Upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [fileDesc, setFileDesc] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Adjustment Modal
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [adjData, setAdjData] = useState({ type: 'Fine', amount: '', description: '' });

  // Print Preview
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);

  useEffect(() => {
    if (id) fetchStudentDetails(id);
    api.request<Course[]>('getAllCourses').then(setAvailableCourses);
  }, [id]);

  const fetchStudentDetails = async (studentId: string) => {
    setLoading(true);
    try {
      const [data, settings] = await Promise.all([
          api.request<StudentProfileData>('getStudentDetails', { id: studentId }),
          api.request<SchoolSettings>('getSchoolSettings')
      ]);
      setStudent(data);
      setSchoolSettings(settings);
      setCurrency(settings.currency);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!student || !user) return;
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          if (file.size > 1024 * 1024) return alert("File too large (Max 1MB)");
          
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64 = reader.result as string;
              // Update student object with new photo
              const updatedStudent = { ...student, profilePhotoBase64: base64 };
              // Separate initialCourses to avoid type issues if reusing saveStudent
              await api.saveStudent(updatedStudent, user);
              fetchStudentDetails(student.id);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleMarkPaid = async (invId: string) => {
    if (!window.confirm("Confirm payment received? This will record a transaction.")) return;
    try {
      await api.request('markInvoicePaid', { id: invId });
      if (id) fetchStudentDetails(id); 
    } catch (e) {
      alert("Error updating payment status");
    }
  };

  const handleDeleteInvoice = async (invId: string) => {
      if (!window.confirm("Delete this invoice?")) return;
      try {
          await api.request('deleteInvoice', { id: invId });
          if (id) fetchStudentDetails(id);
      } catch (e) {
          alert("Error deleting invoice");
      }
  };

  const handleGenerateInvoice = async () => {
      if (!id) return;
      const today = new Date();
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      
      if (!window.confirm(`Generate invoice for current month (${currentMonth})?`)) return;

      try {
          const res: any = await api.request('generateInvoice', { 
              month_year: currentMonth, 
              studentId: id 
          });
          if(res.generated > 0) {
              alert("Invoice generated successfully!");
          } else {
              alert("No new items to bill for this month. (Check if invoice already exists)");
          }
          fetchStudentDetails(id);
      } catch(e) {
          alert("Error generating invoice");
      }
  };

  const openPreview = async (invId: string) => {
      const details = await api.request<any>('getInvoiceDetails', { id: invId });
      setPreviewData(details);
      setPreviewInvoiceId(invId);
  };

  const closePreview = () => {
      setPreviewInvoiceId(null);
      setPreviewData(null);
  };

  const handleCourseEnroll = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!student) return;
      try {
          await api.request('enrollStudentCourse', { studentId: student.id, ...courseForm });
          setShowCourseModal(false);
          fetchStudentDetails(student.id);
      } catch (e: any) {
          alert(e.message || "Error enrolling student");
      }
  };

  const handleRemoveCourse = async (courseId: string) => {
      if(!window.confirm("Remove student from this therapy course?")) return;
      try {
          // 'courseId' passed here is actually the enrollment record ID (StudentCourse.id)
          await api.request('removeStudentCourse', { id: courseId });
          // Force refresh
          if (id) await fetchStudentDetails(id);
      } catch (e) { 
          console.error(e);
          alert("Error removing course"); 
      }
  };

  const handleCourseSelection = (cId: string) => {
      const course = availableCourses.find(c => c.id === cId);
      setCourseForm({ 
          courseId: cId, 
          feeBasis: 'Monthly', 
          agreedFee: course ? course.defaultMonthlyFee : 0 
      });
  };

  const handleFileUpload = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!uploadFile || !student) return;
      setIsUploading(true);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
          try {
              await api.request('uploadTherapyFile', {
                  studentId: student.id,
                  fileName: uploadFile.name,
                  fileType: uploadFile.type,
                  fileBase64: reader.result,
                  description: fileDesc
              });
              setUploadFile(null);
              setFileDesc('');
              fetchStudentDetails(student.id);
          } catch(e) {
              alert("Upload failed");
          } finally {
              setIsUploading(false);
          }
      };
      reader.readAsDataURL(uploadFile);
  };

  const handleDeleteFile = async (fileId: string) => {
      if(!window.confirm("Delete this file?")) return;
      await api.request('deleteTherapyFile', { id: fileId });
      if (id) fetchStudentDetails(id);
  };

  const downloadFile = (file: TherapyRecordFile) => {
      const link = document.createElement('a');
      link.href = file.fileBase64;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleAddAdjustment = async (action: 'instant' | 'queue' | 'invoice') => {
      if(!id || !user) return;
      if(!adjData.amount) return alert("Please enter amount");
      
      try {
          if (action === 'instant') {
              await api.request('createCustomInvoice', {
                  studentId: id, 
                  type: adjData.type, 
                  amount: Number(adjData.amount),
                  description: adjData.description,
                  dueDate: new Date().toISOString().split('T')[0],
                  status: 'Paid'
              });
              alert("Cash payment recorded & Invoice generated.");

          } else if (action === 'invoice') {
              await api.request('createCustomInvoice', {
                  studentId: id, 
                  type: adjData.type, 
                  amount: Number(adjData.amount),
                  description: adjData.description,
                  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  status: 'Pending'
              });
              alert("Separate invoice generated.");

          } else {
              const result: any = await api.request('addStudentAdjustment', {
                  studentId: id, 
                  type: adjData.type, 
                  amount: Number(adjData.amount),
                  description: adjData.description, 
                  date: new Date().toISOString().split('T')[0]
              });
              
              if(result.addedToInvoice) {
                  alert("Added charge to existing Pending invoice.");
              } else {
                  alert("Charge queued for next month's invoice.");
              }
          }
          setShowAdjModal(false);
          setAdjData({ type: 'Fine', amount: '', description: '' });
          fetchStudentDetails(id);
      } catch (e) {
          console.error(e);
          alert("Error processing request");
      }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading profile...</div>;
  if (!student) return <div className="p-8 text-center text-red-500">Student not found</div>;

  const totalDue = student.invoices.filter(i => i.status === InvoiceStatus.PENDING).reduce((sum, i) => sum + i.amount_due, 0);
  const totalPaid = student.invoices.filter(i => i.status === InvoiceStatus.PAID).reduce((sum, i) => sum + i.amount_due, 0);

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Hero Header */}
      <div className="bg-primary-600 rounded-2xl shadow-lg p-6 md:p-8 text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
              <button onClick={() => navigate('/students')} className="absolute top-0 left-0 md:-left-2 md:-top-2 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm">
                  <ArrowLeft size={20} className="text-white"/>
              </button>

              <div className="relative group">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full p-1 shadow-xl flex-shrink-0 mt-8 md:mt-0">
                      <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 flex items-center justify-center relative">
                          {student.profilePhotoBase64 ? (
                              <img src={student.profilePhotoBase64} className="w-full h-full object-cover" />
                          ) : (
                              <UserIcon size={48} className="text-slate-300" />
                          )}
                          {user?.role === 'Admin' && (
                              <button 
                                  onClick={() => fileInputRef.current?.click()}
                                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                  <Camera size={24} className="text-white" />
                              </button>
                          )}
                      </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpdate} />
              </div>
              
              <div className="flex-1 text-center md:text-left pt-2">
                  <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{student.name}</h1>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold border ${student.status === 'Active' ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-50' : 'bg-red-500/20 border-red-400/50 text-red-50'}`}>
                          {student.status}
                      </span>
                  </div>
                  <p className="text-primary-100 text-lg mb-4">Student ID: <span className="font-mono bg-primary-700/50 px-2 py-0.5 rounded">{student.id.substring(0,8)}</span></p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-medium text-primary-50">
                      <div className="flex items-center gap-2 bg-primary-700/30 px-3 py-1.5 rounded-lg">
                          <Calendar size={16} /> Joined: {new Date(student.joiningDate).toLocaleDateString('en-GB')}
                      </div>
                      <div className="flex items-center gap-2 bg-primary-700/30 px-3 py-1.5 rounded-lg">
                          <MapPin size={16} /> {student.address}
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 text-lg mb-4 border-b border-slate-100 pb-3">Guardian Details</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parent Name</label>
                        <p className="text-slate-800 font-medium text-lg">{student.parent_name}</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Number</label>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="p-2 bg-slate-100 rounded-full text-slate-500"><Phone size={16}/></div>
                            <p className="text-slate-800 font-mono font-medium">{student.contact_no}</p>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Address</label>
                        <p className="text-slate-600 mt-1 leading-relaxed text-sm">{student.address}</p>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-md p-6 text-white">
                <h3 className="font-bold text-white text-lg mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                        <p className="text-xs text-slate-300 uppercase">Enrolled</p>
                        <p className="text-2xl font-bold">{student.courses.length}</p>
                        <p className="text-xs text-slate-400">Therapies</p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                        <p className="text-xs text-slate-300 uppercase">Pending</p>
                        <p className="text-2xl font-bold text-orange-300">{student.invoices.filter(i => i.status === 'Pending').length}</p>
                        <p className="text-xs text-slate-400">Invoices</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
                <div className="flex border-b border-slate-200 bg-slate-50/50">
                    <button 
                        onClick={() => setActiveTab('finance')}
                        className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 transition-all border-b-2 ${activeTab === 'finance' ? 'border-primary-600 text-primary-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                    >
                        <CreditCard size={18} /> Financials & Invoices
                    </button>
                    <button 
                        onClick={() => setActiveTab('therapy')}
                        className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 transition-all border-b-2 ${activeTab === 'therapy' ? 'border-primary-600 text-primary-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                    >
                        <Activity size={18} /> Therapy & Files
                    </button>
                </div>

                <div className="p-6 md:p-8 flex-1">
                    {activeTab === 'finance' ? (
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Total Paid</span>
                                    <span className="text-2xl font-bold text-emerald-700 mt-1">{currency}{totalPaid.toLocaleString()}</span>
                                </div>
                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">Total Due</span>
                                    <span className="text-2xl font-bold text-orange-700 mt-1">{currency}{totalDue.toLocaleString()}</span>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-800 text-lg">Transaction History</h3>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleGenerateInvoice} 
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 transition-all"
                                        >
                                            <Zap size={18} /> Generate Invoice
                                        </button>
                                        <button 
                                            onClick={() => setShowAdjModal(true)} 
                                            className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 transition-all"
                                        >
                                            <PlusCircle size={18} /> Add New Charge
                                        </button>
                                    </div>
                                </div>

                                {student.pending_adjustments && student.pending_adjustments.length > 0 && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                                        <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                                            <AlertCircle size={16}/> Unbilled Charges (Pending)
                                        </h4>
                                        <div className="space-y-2">
                                            {student.pending_adjustments.map(adj => (
                                                <div key={adj.id} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-amber-100">
                                                    <span className="text-slate-700 font-medium">{adj.type}: {adj.description}</span>
                                                    <span className="font-bold text-amber-700">{currency}{adj.amount}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-100 border-b border-slate-200">
                                            <tr>
                                                <th className="px-5 py-4 font-bold text-slate-700">Invoice #</th>
                                                <th className="px-5 py-4 font-bold text-slate-700">Month</th>
                                                <th className="px-5 py-4 font-bold text-slate-700">Amount</th>
                                                <th className="px-5 py-4 font-bold text-slate-700">Status</th>
                                                <th className="px-5 py-4 font-bold text-slate-700 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {student.invoices.length === 0 ? (
                                                <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">No invoices found.</td></tr>
                                            ) : (
                                                student.invoices.map((inv) => (
                                                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-5 py-4 font-mono text-slate-600 font-medium">{inv.invoiceNo}</td>
                                                        <td className="px-5 py-4 text-slate-800">{inv.month_year}</td>
                                                        <td className="px-5 py-4 font-bold text-slate-800">{currency}{inv.amount_due}</td>
                                                        <td className="px-5 py-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${inv.status === InvoiceStatus.PAID ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                                {inv.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                {inv.status === InvoiceStatus.PENDING && (
                                                                    <>
                                                                        <button 
                                                                            onClick={() => handleMarkPaid(inv.id)} 
                                                                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm"
                                                                        >
                                                                            <Check size={14}/> Paid?
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => handleDeleteInvoice(inv.id)} 
                                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded border border-slate-200 transition-colors"
                                                                            title="Delete Invoice"
                                                                        >
                                                                            <Trash2 size={16}/>
                                                                        </button>
                                                                    </>
                                                                )}
                                                                <button 
                                                                    onClick={() => openPreview(inv.id)} 
                                                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded border border-slate-200 transition-colors"
                                                                    title="Preview Invoice"
                                                                >
                                                                    <Eye size={16}/>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-800 text-lg">Active Enrollments</h3>
                                    <button 
                                        onClick={() => setShowCourseModal(true)} 
                                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 transition-all"
                                    >
                                        <PlusCircle size={18} /> Enroll New
                                    </button>
                                </div>
                                
                                {student.courses.length === 0 ? (
                                    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500">
                                        <p>No active therapy sessions.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {student.courses.map(c => (
                                            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                                        <Activity size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800">{c.courseName}</h4>
                                                        <p className="text-sm text-slate-500">{c.feeBasis} Rate: <span className="font-medium text-emerald-600">{currency}{c.agreedFee}</span></p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveCourse(c.id); }}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Discontinue"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-800 text-lg mb-4 pt-6 border-t border-slate-100">Documents & Records</h3>
                                <form onSubmit={handleFileUpload} className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                        <div className="md:col-span-5">
                                            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Select File</label>
                                            <input type="file" required onChange={e => setUploadFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"/>
                                        </div>
                                        <div className="md:col-span-5">
                                            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Description</label>
                                            <input type="text" placeholder="e.g. Assessment Report..." value={fileDesc} onChange={e => setFileDesc(e.target.value)} className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"/>
                                        </div>
                                        <div className="md:col-span-2">
                                            <button type="submit" disabled={isUploading || !uploadFile} className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors">
                                                {isUploading ? '...' : <><Upload size={16}/> Upload</>}
                                            </button>
                                        </div>
                                    </div>
                                </form>

                                <div className="space-y-3">
                                    {student.files.map(f => (
                                        <div key={f.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-primary-200 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-blue-50 text-blue-500 rounded-lg">
                                                    <FileText size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{f.fileName}</p>
                                                    <p className="text-xs text-slate-500 flex items-center gap-2">
                                                        <span>{new Date(f.uploadDate).toLocaleDateString('en-GB')}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        <span>{f.description}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => downloadFile(f)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Download size={20}/></button>
                                                <button onClick={() => handleDeleteFile(f.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={20}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    {student.files.length === 0 && <p className="text-center text-slate-400 italic py-4">No documents uploaded.</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {previewInvoiceId && previewData && schoolSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                  <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <Printer size={20} className="text-slate-500"/> Invoice Preview
                      </h3>
                      <button onClick={closePreview} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto bg-slate-100 p-6 flex justify-center">
                      <div className="bg-white shadow-lg w-full max-w-[210mm] min-h-[297mm] p-8 origin-top transform scale-90 sm:scale-100">
                          <InvoiceTemplate invoice={previewData.invoice} student={previewData.student} settings={schoolSettings} />
                      </div>
                  </div>

                  <div className="p-4 border-t border-slate-200 bg-white rounded-b-xl flex justify-end gap-3">
                      <button onClick={closePreview} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Close</button>
                      <button 
                          onClick={() => window.open(`#/print/invoice/${previewInvoiceId}`, '_blank')}
                          className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 flex items-center gap-2"
                      >
                          <Printer size={18}/> Print
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Course Enroll Modal */}
      {showCourseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Enroll in Therapy</h3>
                  <form onSubmit={handleCourseEnroll} className="space-y-5">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Select Course</label>
                          <select required className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow" onChange={e => handleCourseSelection(e.target.value)} value={courseForm.courseId}>
                              <option value="">-- Select --</option>
                              {availableCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Fee Basis</label>
                          <div className="flex gap-2">
                              {['Monthly', 'Daily'].map(b => (
                                  <button key={b} type="button" onClick={() => {
                                      const c = availableCourses.find(x => x.id === courseForm.courseId);
                                      setCourseForm({...courseForm, feeBasis: b, agreedFee: c ? (b === 'Monthly' ? c.defaultMonthlyFee : c.defaultDailyFee) : 0})
                                  }} className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-colors ${courseForm.feeBasis === b ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                                      {b}
                                  </button>
                              ))}
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Agreed Fee ({currency})</label>
                          <input type="number" required className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2.5 font-bold text-emerald-600 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow" value={courseForm.agreedFee} onChange={e => setCourseForm({...courseForm, agreedFee: Number(e.target.value)})} />
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                          <button type="button" onClick={() => setShowCourseModal(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                          <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 shadow-md transition-colors">Confirm Enroll</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Adjustment Modal */}
      {showAdjModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Add Financial Charge</h3>
                  <div className="space-y-5">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Charge Type</label>
                          <select className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary-500" value={adjData.type} onChange={e => setAdjData({...adjData, type: e.target.value})}>
                              <option value="Fine">Fine / Penalty</option>
                              <option value="Therapy Material">Therapy Material Cost</option>
                              <option value="Assessment">Assessment Fee</option>
                              <option value="Other">Other Adjustment</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Amount</label>
                          <input type="number" className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary-500" value={adjData.amount} onChange={e => setAdjData({...adjData, amount: e.target.value})} placeholder="0.00" />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                          <input type="text" className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary-500" value={adjData.description} onChange={e => setAdjData({...adjData, description: e.target.value})} placeholder="Enter details..." />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3 pt-2">
                          <button onClick={() => handleAddAdjustment('queue')} className="w-full py-3 bg-orange-100 text-orange-800 font-bold rounded-xl hover:bg-orange-200 text-sm transition-colors border border-orange-200">
                              Add to Next Month's Invoice
                          </button>
                          <button onClick={() => handleAddAdjustment('invoice')} className="w-full py-3 bg-blue-100 text-blue-800 font-bold rounded-xl hover:bg-blue-200 text-sm transition-colors border border-blue-200">
                              Generate Separate Invoice Now
                          </button>
                          <button onClick={() => handleAddAdjustment('instant')} className="w-full py-3 bg-emerald-100 text-emerald-800 font-bold rounded-xl hover:bg-emerald-200 text-sm transition-colors border border-emerald-200">
                              Record Immediate Cash Payment
                          </button>
                      </div>
                      <button onClick={() => setShowAdjModal(false)} className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700 mt-2">Cancel</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default StudentProfile;