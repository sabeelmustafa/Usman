
import React, { useState, useEffect, useContext } from 'react';
import { api } from '../services/apiService';
import { AuthContext } from '../AuthContext';
import { Student, Staff, AttendanceRecord, Course, StudentCourse, SchoolSettings } from '../types';
import { Calendar, Save, CheckCircle, XCircle, Clock, AlertCircle, DollarSign, Ban, Coffee, List, History } from 'lucide-react';

const Attendance: React.FC = () => {
  const { user } = useContext(AuthContext);
  
  // View State
  const [viewMode, setViewMode] = useState<'mark' | 'history'>('mark');
  
  // Mark Mode State
  const [activeTab, setActiveTab] = useState<'Student' | 'Staff'>('Student');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [entities, setEntities] = useState<(Student | Staff)[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'Present' | 'Absent' | 'Late' | 'PaidLeave' | 'UnpaidLeave'>>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  
  // History Mode State
  const [historyMonth, setHistoryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [messageBox, setMessageBox] = useState<{ type: 'success' | 'error', title: string, message: string } | null>(null);

  useEffect(() => {
    fetchCourses();
    api.request<SchoolSettings>('getSchoolSettings').then(setSettings);
    // Pre-fetch basic directories for history usage
    api.getStaff().then(setAllStaff);
    api.getStudents().then(setAllStudents);
  }, []);

  useEffect(() => {
    if (viewMode === 'mark') {
        if (activeTab === 'Staff') {
          fetchStaff();
        } else if (activeTab === 'Student' && selectedCourseId) {
          fetchStudents();
        }
    } else {
        fetchHistory();
    }
  }, [activeTab, date, selectedCourseId, viewMode, historyMonth]);

  const fetchCourses = async () => {
    let data = await api.request<Course[]>('getAllCourses');
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

  const fetchHistory = async () => {
      setLoading(true);
      try {
          const records = await api.getAttendanceReport(historyMonth, activeTab);
          setHistoryRecords(records);
          
          if(activeTab === 'Staff') {
              const staff = await api.getStaff();
              setEntities(staff.filter(s => s.status === 'Active'));
          } else {
              // For history, show ALL students if no specific filter, or maybe still filter by course?
              // Let's default to ALL active students for the grid to be useful overview
              const students = await api.getStudents();
              if (selectedCourseId) {
                  const scs = await api.request<StudentCourse[]>('getAllStudentCourses');
                  const enrolledIds = scs.filter(sc => sc.courseId === selectedCourseId).map(sc => sc.studentId);
                  setEntities(students.filter(s => enrolledIds.includes(s.id) && s.status === 'Active'));
              } else {
                  setEntities(students.filter(s => s.status === 'Active'));
              }
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const handleStatusChange = (id: string, status: any) => {
    setAttendance(prev => ({ ...prev, [id]: status }));
  };

  const handleSave = async () => {
    if (!user) return;
    
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

  // Check if current date is holiday or weekend
  const getDayStatus = () => {
      if (!settings) return null;
      const d = new Date(date);
      const dayIndex = d.getDay();
      
      if (settings.weeklyOffDays?.includes(dayIndex)) return { isOff: true, label: 'Weekly Off' };
      if (settings.holidays?.includes(date)) return { isOff: true, label: 'Holiday' };
      return null;
  };

  const dayStatus = getDayStatus();

  // Helper for History Grid
  const getDaysInMonth = (yearMonth: string) => {
      const [year, month] = yearMonth.split('-').map(Number);
      const days = new Date(year, month, 0).getDate();
      return Array.from({length: days}, (_, i) => i + 1);
  };

  const getRecordForDay = (entityId: string, day: number) => {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const fullDate = `${historyMonth}-${dayStr}`;
      return historyRecords.find(r => r.entityId === entityId && r.date === fullDate);
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance Manager</h1>
          <p className="text-slate-500 font-medium">Track presence and view history.</p>
        </div>
        
        <div className="flex gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-200 p-1 rounded-lg">
                <button onClick={() => setViewMode('mark')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'mark' ? 'bg-white shadow text-primary-700' : 'text-slate-600 hover:text-slate-800'}`}>
                    <CheckCircle size={16}/> Daily Entry
                </button>
                <button onClick={() => setViewMode('history')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'history' ? 'bg-white shadow text-primary-700' : 'text-slate-600 hover:text-slate-800'}`}>
                    <History size={16}/> History
                </button>
            </div>

            {/* Entity Type Toggle */}
            {user?.role !== 'Teacher' && (
            <div className="flex bg-slate-200 p-1 rounded-lg">
                <button onClick={() => setActiveTab('Student')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'Student' ? 'bg-white shadow text-primary-700' : 'text-slate-600 hover:text-slate-800'}`}>Students</button>
                <button onClick={() => setActiveTab('Staff')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'Staff' ? 'bg-white shadow text-primary-700' : 'text-slate-600 hover:text-slate-800'}`}>Staff</button>
            </div>
            )}
        </div>
      </div>
      
      {/* ---------------- MARK MODE ---------------- */}
      {viewMode === 'mark' && (
          <div className="animate-in fade-in duration-300">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end mb-6">
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

              {dayStatus && (
                  <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-xl flex items-center gap-2 mb-6">
                      <Coffee size={20} />
                      <div>
                          <span className="font-bold">Notice:</span> The selected date is marked as a <strong>{dayStatus.label}</strong> in the calendar. Attendance is optional.
                      </div>
                  </div>
              )}

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
          </div>
      )}

      {/* ---------------- HISTORY MODE ---------------- */}
      {viewMode === 'history' && (
          <div className="animate-in fade-in duration-300 space-y-6">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-64">
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Month</label>
                      <input 
                          type="month" 
                          className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" 
                          value={historyMonth}
                          onChange={e => setHistoryMonth(e.target.value)}
                      />
                  </div>
                  
                  {activeTab === 'Student' && (
                      <div className="w-full sm:w-64">
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Filter by Therapy (Optional)</label>
                          <select 
                              className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" 
                              value={selectedCourseId} 
                              onChange={e => setSelectedCourseId(e.target.value)}
                          >
                              <option value="">All Students</option>
                              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                      </div>
                  )}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {loading ? (
                      <div className="p-8 text-center text-slate-500">Loading history...</div>
                  ) : entities.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">No records found.</div>
                  ) : (
                      <div className="overflow-x-auto pb-2">
                          <table className="w-full text-xs border-collapse">
                              <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200">
                                      <th className="p-3 text-left font-bold text-slate-700 min-w-[150px] sticky left-0 bg-slate-50 z-10 border-r border-slate-200">Name</th>
                                      <th className="p-2 text-center font-bold text-slate-700 min-w-[60px] bg-slate-50">Summary</th>
                                      {getDaysInMonth(historyMonth).map(day => (
                                          <th key={day} className="p-2 text-center text-slate-500 font-medium min-w-[32px] border-l border-slate-100">
                                              {day}
                                          </th>
                                      ))}
                                  </tr>
                              </thead>
                              <tbody>
                                  {entities.map(entity => {
                                      // Calculate Summary
                                      const entityRecords = historyRecords.filter(r => r.entityId === entity.id);
                                      const present = entityRecords.filter(r => r.status === 'Present').length;
                                      const absent = entityRecords.filter(r => r.status === 'Absent' || r.status === 'UnpaidLeave').length;
                                      const late = entityRecords.filter(r => r.status === 'Late').length;

                                      return (
                                          <tr key={entity.id} className="border-b border-slate-100 hover:bg-slate-50">
                                              <td className="p-3 font-medium text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200">
                                                  {entity.name}
                                                  <div className="text-[10px] text-slate-400">ID: {entity.id.substring(0,6)}</div>
                                              </td>
                                              <td className="p-2 text-center bg-white">
                                                  <div className="flex justify-center gap-1.5 text-[10px] font-bold">
                                                      <span className="text-emerald-600 bg-emerald-50 px-1 rounded" title="Present">P:{present}</span>
                                                      <span className="text-red-600 bg-red-50 px-1 rounded" title="Absent">A:{absent}</span>
                                                      {late > 0 && <span className="text-orange-600 bg-orange-50 px-1 rounded" title="Late">L:{late}</span>}
                                                  </div>
                                              </td>
                                              {getDaysInMonth(historyMonth).map(day => {
                                                  const record = getRecordForDay(entity.id, day);
                                                  let content = <span className="text-slate-200">-</span>;
                                                  let bgClass = "";
                                                  
                                                  if (record) {
                                                      switch(record.status) {
                                                          case 'Present': content = <span className="text-emerald-600 font-bold">P</span>; bgClass="bg-emerald-50"; break;
                                                          case 'Absent': content = <span className="text-red-600 font-bold">A</span>; bgClass="bg-red-50"; break;
                                                          case 'Late': content = <span className="text-orange-600 font-bold">L</span>; bgClass="bg-orange-50"; break;
                                                          case 'PaidLeave': content = <span className="text-blue-600 font-bold">PL</span>; bgClass="bg-blue-50"; break;
                                                          case 'UnpaidLeave': content = <span className="text-purple-600 font-bold">UL</span>; bgClass="bg-purple-50"; break;
                                                      }
                                                  }

                                                  return (
                                                      <td key={day} className={`p-1 text-center border-l border-slate-100 ${bgClass}`}>
                                                          {content}
                                                      </td>
                                                  );
                                              })}
                                          </tr>
                                      );
                                  })}
                              </tbody>
                          </table>
                      </div>
                  )}
              </div>
              <div className="flex gap-4 text-xs text-slate-500 font-medium justify-center">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span> P = Present</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"></span> A = Absent</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-500 rounded-full"></span> L = Late</span>
                  {activeTab === 'Staff' && (
                      <>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> PL = Paid Leave</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-500 rounded-full"></span> UL = Unpaid Leave</span>
                      </>
                  )}
              </div>
          </div>
      )}

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
