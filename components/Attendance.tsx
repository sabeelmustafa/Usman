
import React, { useState, useEffect, useContext } from 'react';
import { api } from '../services/apiService';
import { AuthContext } from '../AuthContext';
import { Student, Staff, AttendanceRecord, Course, StudentCourse } from '../types';
import { Calendar, Save, CheckCircle, XCircle, Clock, AlertCircle, DollarSign, Ban } from 'lucide-react';

const Attendance: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<'Student' | 'Staff'>('Student');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [entities, setEntities] = useState<(Student | Staff)[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'Present' | 'Absent' | 'Late' | 'PaidLeave' | 'UnpaidLeave'>>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Message Box State
  const [saving, setSaving] = useState(false);
  const [messageBox, setMessageBox] = useState<{ type: 'success' | 'error', title: string, message: string } | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (activeTab === 'Staff') {
      fetchStaff();
    } else if (activeTab === 'Student' && selectedCourseId) {
      fetchStudents();
    }
  }, [activeTab, date, selectedCourseId]);

  const fetchCourses = async () => {
    // Replaced Classes with Courses (Therapies)
    let data = await api.request<Course[]>('getAllCourses');
    
    // Filter logic removed or adapted if teachers are assigned to specific courses in future
    // For now, show all therapies available
    
    setCourses(data);
    if (data.length > 0) setSelectedCourseId(data[0].id);
  };

  const fetchStaff = async () => {
    setLoading(true);
    const staffList = await api.getStaff();
    const records = await api.getAttendance(date, 'Staff');
    
    setEntities(staffList.filter(s => s.status === 'Active'));
    const map: Record<string, any> = {};
    records.forEach(r => map[r.entityId] = r.status);
    setAttendance(map);
    setLoading(false);
  };

  const fetchStudents = async () => {
    setLoading(true);
    const [allStudents, studentCourses, records] = await Promise.all([
        api.getStudents(),
        api.request<StudentCourse[]>('getAllStudentCourses'),
        api.getAttendance(date, 'Student')
    ]);

    // Filter students enrolled in the selected Therapy (Course)
    const enrolledStudentIds = studentCourses
        .filter(sc => sc.courseId === selectedCourseId)
        .map(sc => sc.studentId);

    const classStudents = allStudents.filter(s => 
        enrolledStudentIds.includes(s.id) && s.status === 'Active'
    );
    
    setEntities(classStudents);
    const map: Record<string, any> = {};
    records.forEach(r => map[r.entityId] = r.status);
    setAttendance(map);
    setLoading(false);
  };

  const handleStatusChange = (id: string, status: any) => {
    setAttendance(prev => ({ ...prev, [id]: status }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Filter out entities that haven't been marked
    const validEntities = entities.filter(e => attendance[e.id]);
    
    if (validEntities.length === 0) {
        setMessageBox({ 
            type: 'error', 
            title: 'No Selection', 
            message: 'Please mark attendance for at least one person before saving.' 
        });
        return;
    }

    setSaving(true);
    try {
      const records: AttendanceRecord[] = validEntities.map(e => ({
        id: '', 
        entityId: e.id,
        entityType: activeTab,
        date: date,
        status: attendance[e.id]
      }));
      await api.saveAttendance(records, user);
      
      // Show Success Modal
      setMessageBox({ 
        type: 'success', 
        title: 'Success', 
        message: `Attendance saved successfully for ${records.length} records.` 
      });

    } catch (e) {
      setMessageBox({ 
        type: 'error', 
        title: 'Error', 
        message: 'Failed to save attendance. Please try again.' 
      });
    } finally {
      setSaving(false);
    }
  };

  const StatusButton = ({ id, status, current, label, icon: Icon }: any) => {
    const colors: any = { 
        'Present': 'text-emerald-700 bg-emerald-100 border-emerald-300', 
        'Absent': 'text-red-700 bg-red-100 border-red-300', 
        'Late': 'text-orange-700 bg-orange-100 border-orange-300',
        'PaidLeave': 'text-blue-700 bg-blue-100 border-blue-300',
        'UnpaidLeave': 'text-purple-700 bg-purple-100 border-purple-300'
    };
    
    const isSelected = current === status;
    return (
      <button onClick={() => handleStatusChange(id, status)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all ${isSelected ? colors[status] + ' ring-1 ring-offset-1' : 'text-slate-500 border-transparent hover:bg-slate-100'}`} title={label}>
        <Icon size={16} /> <span className="text-sm font-bold hidden sm:inline">{label}</span>
      </button>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daily Attendance</h1>
          <p className="text-slate-500 font-medium">Track presence for staff and students.</p>
        </div>
        
        {/* Only Admin sees Staff tab usually, but Teacher is excluded explicitly */}
        {user?.role !== 'Teacher' && (
          <div className="flex bg-slate-200 p-1 rounded-lg">
            <button onClick={() => setActiveTab('Student')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'Student' ? 'bg-white shadow text-primary-700' : 'text-slate-600 hover:text-slate-800'}`}>Students</button>
            <button onClick={() => setActiveTab('Staff')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'Staff' ? 'bg-white shadow text-primary-700' : 'text-slate-600 hover:text-slate-800'}`}>Staff</button>
          </div>
        )}
      </div>
      
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full md:w-auto">
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Date</label>
          <div className="relative">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-primary-500 outline-none relative z-0" />
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10" size={18} />
          </div>
        </div>
        
        {activeTab === 'Student' && (
          <div className="flex-1 w-full md:w-auto">
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Therapy</label>
            {courses.length > 0 ? (
                <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-primary-500 outline-none">
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            ) : (
                <div className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">No therapies found.</div>
            )}
          </div>
        )}

        <button 
            onClick={handleSave} 
            disabled={saving || entities.length === 0}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 shadow-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : <><Save size={18} /> Save Attendance</>}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-slate-500 font-medium">Loading records...</div>
        ) : entities.length === 0 ? (
           <div className="p-8 text-center text-slate-500 font-medium">No records found. Select a therapy or date.</div> 
        ) : (
          <div className="divide-y divide-slate-100">
            {entities.map(entity => (
              <div key={entity.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-300">
                    {entity.profilePhotoBase64 ? <img src={entity.profilePhotoBase64} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">{entity.name[0]}</div>}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{entity.name}</p>
                    <p className="text-xs text-slate-500 font-medium">ID: {entity.id.substring(0,6)}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <StatusButton id={entity.id} status="Present" current={attendance[entity.id]} label="Present" icon={CheckCircle} />
                  <StatusButton id={entity.id} status="Late" current={attendance[entity.id]} label="Late" icon={Clock} />
                  
                  {activeTab === 'Staff' ? (
                      <>
                        <StatusButton id={entity.id} status="PaidLeave" current={attendance[entity.id]} label="Paid Leave" icon={DollarSign} />
                        <StatusButton id={entity.id} status="UnpaidLeave" current={attendance[entity.id]} label="Unpaid / Absent" icon={Ban} />
                      </>
                  ) : (
                      <StatusButton id={entity.id} status="Absent" current={attendance[entity.id]} label="Absent" icon={XCircle} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Box (Modal) */}
      {messageBox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center transform scale-100 transition-transform">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${messageBox.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
               {messageBox.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{messageBox.title}</h3>
            <p className="text-slate-600 mb-6">{messageBox.message}</p>
            <button 
               onClick={() => setMessageBox(null)}
               className="w-full py-2.5 rounded-lg font-bold text-white transition-colors bg-slate-800 hover:bg-slate-900"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
