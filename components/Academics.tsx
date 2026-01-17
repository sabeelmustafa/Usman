
import React, { useState, useEffect, useContext } from 'react';
import { api } from '../services/apiService';
import { AuthContext } from '../AuthContext';
import { ClassLevel, Exam, Student, ExamResult } from '../types';
import { Plus, Check, Search, Save, Calendar, Printer } from 'lucide-react';

const Academics: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<'exams' | 'results'>('results');
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  
  // Create Exam State
  const [newExam, setNewExam] = useState<{ name: string; class_id: string; schedule: Record<string, string> }>({ 
    name: '', class_id: '', schedule: {} 
  });
  const [selectedClassSubjects, setSelectedClassSubjects] = useState<string[]>([]);

  // Results Entry State
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>(''); // Derived from Exam
  const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');
  
  // Marks State
  const [marksData, setMarksData] = useState<Record<string, { marks: string, total: string }>>({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    let [cData, eData] = await Promise.all([
      api.request<ClassLevel[]>('getAllClasses'),
      api.request<Exam[]>('getExams')
    ]);

    // Role Filtering for Teachers (Multiple Classes)
    if (user?.role === 'Teacher' && user.assignedClassIds && user.assignedClassIds.length > 0) {
      cData = cData.filter(c => user.assignedClassIds!.includes(c.id));
      eData = eData.filter(e => user.assignedClassIds!.includes(e.classId));
    }

    setClasses(cData);
    setExams(eData);
  };

  const handleClassSelectForExam = (classId: string) => {
    setNewExam({ ...newExam, class_id: classId, schedule: {} });
    const cls = classes.find(c => c.id === classId);
    // If Teacher, only allow assigned subjects
    let subjects = cls?.subjects || [];
    if (user?.role === 'Teacher' && user.assignedSubjects && user.assignedSubjects.length > 0) {
        subjects = subjects.filter(s => user.assignedSubjects!.includes(s));
    }
    setSelectedClassSubjects(subjects);
  };

  const handleDateChange = (subject: string, date: string) => {
    setNewExam(prev => ({
        ...prev,
        schedule: { ...prev.schedule, [subject]: date }
    }));
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const scheduleArray = Object.entries(newExam.schedule).map(([sub, date]) => ({
        subject: sub,
        date: date
    }));
    try {
      await api.request('addExam', { name: newExam.name, classId: newExam.class_id, schedule: scheduleArray });
      setNewExam({ name: '', class_id: '', schedule: {} });
      setSelectedClassSubjects([]);
      fetchInitialData();
      alert("Exam scheduled successfully!");
    } catch (err) {
      alert("Error scheduling exam");
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      const exam = exams.find(e => e.id === selectedExamId);
      if (exam) {
        setSelectedClassId(exam.classId);
        api.request<Student[]>('getAllStudents').then(all => {
          setStudentsInClass(all.filter(s => s.classId === exam.classId && s.status === 'Active'));
        });
        setSelectedStudentId('');
        setMarksData({});
      }
    } else {
      setStudentsInClass([]);
      setSelectedStudentId('');
    }
  }, [selectedExamId]);

  useEffect(() => {
    if (selectedStudentId && selectedClassId) {
      const cls = classes.find(c => c.id === selectedClassId);
      if (cls && cls.subjects) {
        let subjects = cls.subjects;
        // If Teacher, only allow entry for assigned subjects
        if (user?.role === 'Teacher' && user.assignedSubjects && user.assignedSubjects.length > 0) {
            subjects = subjects.filter(s => user.assignedSubjects!.includes(s));
        }

        const initMarks: any = {};
        subjects.forEach(sub => {
          initMarks[sub] = { marks: '', total: '100' };
        });
        setMarksData(initMarks);
      }
    }
  }, [selectedStudentId, selectedClassId, user]);

  const handleMarkChange = (subject: string, field: 'marks' | 'total', value: string) => {
    setMarksData(prev => ({
      ...prev,
      [subject]: { ...prev[subject], [field]: value }
    }));
  };

  const calculateGrade = (obtained: number, total: number) => {
    if (total === 0) return '-';
    const p = (obtained / total) * 100;
    if (p >= 90) return 'A+';
    if (p >= 80) return 'A';
    if (p >= 70) return 'B';
    if (p >= 60) return 'C';
    if (p >= 50) return 'D';
    return 'F';
  };

  const handleSaveResults = async () => {
    if (!selectedStudentId || !selectedExamId) return;
    try {
      const promises = Object.entries(marksData).map(([subject, data]: [string, { marks: string, total: string }]) => {
        if (data.marks === '') return Promise.resolve();
        return api.request('recordStudentResult', {
          student_id: selectedStudentId,
          exam_id: selectedExamId,
          subject_name: subject,
          marks_obtained: Number(data.marks),
          total_marks: Number(data.total),
          grade: calculateGrade(Number(data.marks), Number(data.total))
        });
      });
      await Promise.all(promises);
      alert("Results saved for student!");
      setSelectedStudentId('');
      setStudentSearch('');
      setMarksData({});
    } catch (e) {
      alert("Error saving results");
    }
  };
  
  const printExam = (id: string) => {
      const url = `${window.location.origin}${window.location.pathname}#/print/exam-schedule/${id}`;
      window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Academics</h1>
        <p className="text-slate-600 font-medium">Exam scheduling and result management.</p>
        {user?.role === 'Teacher' && <p className="text-xs text-primary-700 mt-1 font-bold">Limited View: Assigned Classes & Subjects Only</p>}
      </div>

      <div className="flex border-b border-slate-200">
        <button onClick={() => setActiveTab('results')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'results' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-600 hover:text-slate-800'}`}>Results Entry</button>
        <button onClick={() => setActiveTab('exams')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'exams' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-600 hover:text-slate-800'}`}>Exam Scheduler</button>
      </div>

      {activeTab === 'exams' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
            <h3 className="font-bold text-slate-800 mb-4">Schedule New Exam</h3>
            <form onSubmit={handleCreateExam} className="space-y-4">
               <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Class</label>
                {classes.length > 0 ? (
                    <select required className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 font-medium outline-none focus:ring-2 focus:ring-primary-500" value={newExam.class_id} onChange={e => handleClassSelectForExam(e.target.value)}>
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                ) : (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">No assigned classes found.</div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Exam Name</label>
                <input required type="text" placeholder="e.g. Final Term" className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={newExam.name} onChange={e => setNewExam({...newExam, name: e.target.value})} />
              </div>

              {selectedClassSubjects.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                   <label className="block text-sm font-bold text-slate-700 mb-2">Subject Dates</label>
                   <div className="space-y-2">
                       {selectedClassSubjects.map(sub => (
                           <div key={sub} className="flex items-center gap-2">
                               <span className="text-sm text-slate-700 font-medium w-1/3 truncate" title={sub}>{sub}</span>
                               <input required type="date" className="flex-1 bg-white text-slate-900 border border-slate-300 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary-500" onChange={(e) => handleDateChange(sub, e.target.value)} />
                           </div>
                       ))}
                   </div>
                </div>
              )}

              <button type="submit" className="w-full bg-primary-600 text-white font-bold py-2 rounded-lg hover:bg-primary-700 shadow-sm">Create Exam</button>
            </form>
          </div>

          <div className="md:col-span-2 space-y-4">
            {exams.length === 0 ? <div className="text-center py-10 text-slate-500 font-medium">No exams scheduled.</div> : 
              exams.map(ex => (
                <div key={ex.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800">{ex.name}</h4>
                    <p className="text-sm text-slate-600 font-medium">{classes.find(c => c.id === ex.classId)?.name}</p>
                    <div className="mt-2 text-xs text-slate-500 font-medium">{ex.schedule?.length} subjects scheduled</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                     <button onClick={() => printExam(ex.id)} className="flex items-center gap-1 text-sm font-bold bg-slate-100 px-3 py-1.5 rounded text-slate-700 hover:bg-slate-200 transition-colors">
                        <Printer size={14}/> Print Schedule
                     </button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {activeTab === 'results' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          <div className="p-6 border-b border-slate-200 bg-slate-50 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">1. Select Exam</label>
              <select className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
                <option value="">-- Choose Exam --</option>
                {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name} ({classes.find(c => c.id === ex.classId)?.name})</option>)}
              </select>
            </div>
            
            <div className="relative">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">2. Select Student</label>
              <input type="text" placeholder={selectedExamId ? "Search Student Name or ID..." : "Select Exam First"} disabled={!selectedExamId} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" value={studentSearch} onChange={e => { setStudentSearch(e.target.value); if (selectedStudentId) setSelectedStudentId(''); }} />
              {selectedExamId && !selectedStudentId && studentSearch && (
                 <div className="absolute z-10 w-full bg-white border border-slate-200 shadow-lg rounded-lg mt-1 max-h-60 overflow-y-auto">
                    {studentsInClass.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.id.toString().includes(studentSearch)).map(s => (
                        <div key={s.id} className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-800 font-medium" onClick={() => { setSelectedStudentId(s.id); setStudentSearch(`${s.name} (ID: ${s.id.substring(0,8)})`); }}>
                            {s.name} <span className="text-slate-500 text-xs ml-2">#{s.id.substring(0,8)}</span>
                        </div>
                    ))}
                    {studentsInClass.length === 0 && <div className="p-3 text-xs text-slate-500">No students found in this class.</div>}
                 </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {!selectedStudentId ? <div className="text-center text-slate-500 py-10 font-medium">Select an exam and a student to enter results.</div> : (
                <div className="max-w-3xl mx-auto">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center">
                        <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded mr-2 font-bold">Step 3</span> Enter Marks for {studentSearch.split('(')[0]}
                    </h3>
                    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                                <tr>
                                    <th className="px-4 py-3">Subject</th>
                                    <th className="px-4 py-3 w-32">Total Marks</th>
                                    <th className="px-4 py-3 w-32">Obtained</th>
                                    <th className="px-4 py-3 w-24 text-center">Grade</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {Object.entries(marksData).map(([subject, data]: [string, { marks: string, total: string }]) => (
                                    <tr key={subject} className="hover:bg-white transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-800 bg-white">{subject}</td>
                                        <td className="px-4 py-3">
                                            <input 
                                                type="number" 
                                                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center focus:ring-2 focus:ring-primary-500 outline-none"
                                                value={data.total}
                                                onChange={(e) => handleMarkChange(subject, 'total', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input 
                                                type="number" 
                                                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center font-bold text-slate-800 focus:ring-2 focus:ring-primary-500 outline-none"
                                                value={data.marks}
                                                onChange={(e) => handleMarkChange(subject, 'marks', e.target.value)}
                                                placeholder="-"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-slate-600">
                                            {calculateGrade(Number(data.marks || 0), Number(data.total || 100))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button 
                            onClick={handleSaveResults} 
                            className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                        >
                            <Save size={18} /> Save Result Card
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Academics;
