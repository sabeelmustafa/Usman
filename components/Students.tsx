import React, { useState, useEffect, useContext } from 'react';
import { api } from '../services/apiService';
import { AuthContext } from '../AuthContext';
import { Student, Invoice, Course } from '../types';
import { Search, Plus, Edit, Eye, User, DollarSign, Trash2, BookOpen, Calendar, MapPin, Phone, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ImageUploader from './ImageUploader';

const Students: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialFormState: Partial<Student> = {
    name: '', dob: '', status: 'Active', 
    parentDetails: { name: '', contact: '', address: '' },
    profilePhotoBase64: null, admissionDate: '', joiningDate: ''
  };
  const [formData, setFormData] = useState<Partial<Student>>(initialFormState);
  
  // State for adding courses during student creation
  const [newCourses, setNewCourses] = useState<{ courseId: string, feeBasis: 'Monthly' | 'Daily', agreedFee: number }[]>([]);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchData();
  }, []);

  // Check for navigation state to auto-open modal (from Dashboard)
  useEffect(() => {
      if (location.state && (location.state as any).openAdd) {
          setEditingId(null);
          setFormData(initialFormState);
          setNewCourses([]);
          setShowModal(true);
          // Clear state to prevent reopening on refresh
          window.history.replaceState({}, document.title);
      }
  }, [location]);

  const fetchData = async () => {
    const [sData, iData, cData] = await Promise.all([
      api.getStudents(),
      api.request<Invoice[]>('getAllInvoices'),
      api.request<Course[]>('getAllCourses')
    ]);
    setStudents(sData);
    setInvoices(iData);
    setCourses(cData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await api.saveStudent({ 
          ...formData, 
          id: editingId || undefined,
          initialCourses: newCourses 
      }, user);
      setShowModal(false);
      setEditingId(null);
      setFormData(initialFormState);
      setNewCourses([]);
      fetchData();
    } catch (e) {
      alert("Error saving student");
    }
  };

  const handleEditClick = (student: Student) => {
    setEditingId(student.id);
    setFormData(student);
    setNewCourses([]); // Don't preload courses for edit to keep it simple, edit enrollment in profile
    setShowModal(true);
  };

  const addCourseRow = () => {
      setNewCourses([...newCourses, { courseId: '', feeBasis: 'Monthly', agreedFee: 0 }]);
  };

  const updateCourseRow = (index: number, field: string, value: any) => {
      const updated = [...newCourses];
      (updated[index] as any)[field] = value;
      
      // Auto-populate fee if course changes
      if (field === 'courseId') {
          const course = courses.find(c => c.id === value);
          if (course) {
              updated[index].agreedFee = updated[index].feeBasis === 'Monthly' ? course.defaultMonthlyFee : course.defaultDailyFee;
          }
      }
      // Auto-populate fee if basis changes
      if (field === 'feeBasis') {
          const course = courses.find(c => c.id === updated[index].courseId);
          if (course) {
              updated[index].agreedFee = value === 'Monthly' ? course.defaultMonthlyFee : course.defaultDailyFee;
          }
      }

      setNewCourses(updated);
  };

  const removeCourseRow = (index: number) => {
      setNewCourses(newCourses.filter((_, i) => i !== index));
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Directory</h1>
          <p className="text-slate-500">Manage therapy enrollments and profiles.</p>
        </div>
        {user?.role === 'Admin' && (
          <button 
            onClick={() => { setEditingId(null); setFormData(initialFormState); setNewCourses([]); setShowModal(true); }}
            className="flex items-center space-x-2 bg-accent-500 hover:bg-accent-600 text-white px-5 py-2.5 rounded-lg shadow-md transition-all font-semibold"
          >
            <Plus size={20} /> <span>Add Student</span>
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search students..." 
            className="w-full pl-10 pr-4 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-600">Student</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Parent / Contact</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Joined</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map((s) => {
              const hasPending = invoices.some(c => c.student_id === s.id && c.status === 'Pending');
              return (
                <tr key={s.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/students/${s.id}`)}>
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                      {s.profilePhotoBase64 ? <img src={s.profilePhotoBase64} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={20}/></div>}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-slate-900">{s.name}</div>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/students/${s.id}`); }}
                          className={`flex items-center justify-center w-5 h-5 rounded-full border transition-colors ${hasPending ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : 'bg-slate-50 border-slate-200 text-slate-300 hover:text-slate-500'}`}
                          title={hasPending ? "Has Unpaid Invoices" : "All Dues Cleared"}
                        >
                          <DollarSign size={12} strokeWidth={3} />
                        </button>
                      </div>
                      <div className="text-xs text-slate-400">ID: {s.id.substring(0, 8)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{s.parentDetails.name} <br/><span className="text-xs">{s.parentDetails.contact}</span></td>
                  <td className="px-6 py-4 text-slate-600">{new Date(s.joiningDate).toLocaleDateString('en-GB')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${s.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => navigate(`/students/${s.id}`)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md border border-slate-200"><Eye size={18}/></button>
                      {user?.role === 'Admin' && (
                        <button onClick={() => handleEditClick(s)} className="p-1.5 text-slate-400 hover:text-primary-600 rounded-md border border-slate-200"><Edit size={18}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${editingId ? 'bg-blue-100 text-blue-600' : 'bg-accent-100 text-accent-600'}`}>
                      {editingId ? <Edit size={24} /> : <User size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Student Profile' : 'Student Registration'}</h3>
                    <p className="text-sm text-slate-500">{editingId ? 'Update student information.' : 'Add a new student to the system.'}</p>
                  </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-2 border border-slate-200 hover:bg-slate-50">
                  <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="flex flex-col md:flex-row h-full">
                  {/* Left Sidebar: Photo & Status */}
                  <div className="w-full md:w-1/3 bg-slate-50/50 p-6 border-r border-slate-100 space-y-6">
                      <div className="flex flex-col items-center text-center">
                          <ImageUploader 
                              currentImage={formData.profilePhotoBase64 || null}
                              onImageChange={(b64) => setFormData({...formData, profilePhotoBase64: b64})}
                              label=""
                          />
                          <p className="text-xs text-slate-400 mt-2">Allowed: JPG, PNG (Max 500KB)</p>
                      </div>
                      
                      <div className="space-y-4">
                          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account Status</label>
                              <select 
                                  required 
                                  className="w-full bg-white text-slate-900 border border-slate-200 rounded-md px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none" 
                                  value={formData.status} 
                                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                              >
                                  <option value="Active">Active</option>
                                  <option value="Inactive">Inactive</option>
                              </select>
                          </div>
                          
                          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-3">
                              <label className="block text-xs font-bold text-slate-500 uppercase">Dates</label>
                              <div>
                                  <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar size={12}/> Joining Date</label>
                                  <input type="date" className="w-full bg-white text-slate-900 border border-slate-200 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar size={12}/> Admission Date</label>
                                  <input type="date" className="w-full bg-white text-slate-900 border border-slate-200 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500" value={formData.admissionDate} onChange={e => setFormData({...formData, admissionDate: e.target.value})} />
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Right Content: Details */}
                  <div className="flex-1 p-8 space-y-8">
                      {/* Personal Info */}
                      <section>
                          <h4 className="text-sm font-bold text-primary-700 uppercase tracking-wider mb-4 border-b border-primary-100 pb-2 flex items-center gap-2">
                              <User size={16}/> Personal Details
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                             <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input required type="text" placeholder="e.g. John Doe" className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 outline-none transition-shadow" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                                <input required type="date" className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 outline-none transition-shadow" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                             </div>
                          </div>
                      </section>

                      {/* Parent Info */}
                      <section>
                          <h4 className="text-sm font-bold text-primary-700 uppercase tracking-wider mb-4 border-b border-primary-100 pb-2 flex items-center gap-2">
                              <Users size={16}/> Guardian Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Parent Name</label>
                                <input required type="text" placeholder="e.g. Jane Doe" className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 outline-none" value={formData.parentDetails?.name} onChange={e => setFormData({...formData, parentDetails: { ...formData.parentDetails!, name: e.target.value }})} />
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input required type="text" placeholder="(555) 123-4567" className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" value={formData.parentDetails?.contact} onChange={e => setFormData({...formData, parentDetails: { ...formData.parentDetails!, contact: e.target.value }})} />
                                </div>
                             </div>
                             <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Residential Address</label>
                                <div className="relative">
                                    <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                                    <textarea required rows={2} placeholder="Street Address, City..." className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none" value={formData.parentDetails?.address} onChange={e => setFormData({...formData, parentDetails: { ...formData.parentDetails!, address: e.target.value }})} />
                                </div>
                             </div>
                          </div>
                      </section>

                      {/* Therapy Enrollment - Only on create */}
                      {!editingId && (
                          <section>
                              <div className="flex justify-between items-center mb-4 border-b border-primary-100 pb-2">
                                  <h4 className="text-sm font-bold text-primary-700 uppercase tracking-wider flex items-center gap-2">
                                      <BookOpen size={16}/> Enrollment (Optional)
                                  </h4>
                                  <button type="button" onClick={addCourseRow} className="text-xs font-bold bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full hover:bg-primary-100 flex items-center gap-1 border border-primary-200 transition-colors">
                                      <Plus size={14}/> Add Class
                                  </button>
                              </div>
                              
                              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                  {newCourses.length > 0 && (
                                    <div className="grid grid-cols-10 gap-2 px-4 py-2 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                                        <div className="col-span-4">Therapy</div>
                                        <div className="col-span-3">Fee Basis</div>
                                        <div className="col-span-2">Agreed Fee</div>
                                        <div className="col-span-1 text-center">Action</div>
                                    </div>
                                  )}
                                  
                                  <div className="p-2 space-y-2">
                                    {newCourses.length === 0 && <p className="text-sm text-slate-400 text-center py-6 italic">No therapies selected for initial enrollment.</p>}
                                    {newCourses.map((nc, idx) => (
                                        <div key={idx} className="grid grid-cols-10 gap-2 items-center">
                                            <div className="col-span-4">
                                                <select 
                                                    className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-2 py-2 text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                                                    value={nc.courseId}
                                                    onChange={e => updateCourseRow(idx, 'courseId', e.target.value)}
                                                >
                                                    <option value="">Select Therapy...</option>
                                                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-3">
                                                <select 
                                                    className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-2 py-2 text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                                                    value={nc.feeBasis}
                                                    onChange={e => updateCourseRow(idx, 'feeBasis', e.target.value)}
                                                >
                                                    <option value="Monthly">Monthly</option>
                                                    <option value="Daily">Daily</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <input 
                                                    type="number" 
                                                    placeholder="0"
                                                    className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-2 py-2 text-sm font-semibold text-emerald-600 focus:ring-1 focus:ring-primary-500 outline-none"
                                                    value={nc.agreedFee}
                                                    onChange={e => updateCourseRow(idx, 'agreedFee', Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="col-span-1 text-center">
                                                <button type="button" onClick={() => removeCourseRow(idx)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                  </div>
                              </div>
                          </section>
                      )}
                  </div>
              </div>
            </form>
            
            {/* Footer */}
            <div className="px-8 py-4 bg-white border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={handleSubmit} type="submit" className="px-8 py-2.5 bg-accent-500 text-white font-bold rounded-lg hover:bg-accent-600 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
                    {editingId ? 'Update Profile' : 'Register Student'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;