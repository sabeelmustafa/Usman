
import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import { Course, SchoolSettings } from '../types';
import { Edit2, Trash2, Save, X, Activity } from 'lucide-react';

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [currency, setCurrency] = useState('$');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Course>>({ name: '', capacity: 10, defaultMonthlyFee: 0, defaultDailyFee: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cData, settings] = await Promise.all([
        api.request<Course[]>('getAllCourses'),
        api.request<SchoolSettings>('getSchoolSettings')
      ]);
      setCourses(cData);
      setCurrency(settings.currency);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (c: Course) => {
    setEditingId(c.id);
    setFormData(c);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: '', capacity: 10, defaultMonthlyFee: 0, defaultDailyFee: 0 });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.request('manageCourse', { type: 'edit', data: { ...formData, id: editingId } });
      } else {
        await api.request('manageCourse', { type: 'add', data: formData });
      }
      handleCancel(); 
      fetchData(); 
    } catch (e: any) {
      alert(e.message || "Error saving course");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this therapy course?")) return;
    try {
      await api.request('manageCourse', { type: 'delete', id });
      fetchData();
    } catch (e: any) {
      alert(e.message || "Error deleting course");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Therapies & Courses</h1>
        <p className="text-slate-500">Manage available therapy programs and fee structures.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-6">
            <h3 className="font-bold text-slate-800 mb-4">{editingId ? 'Edit Therapy' : 'Add New Therapy'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Therapy Name</label>
                <input required type="text" placeholder="e.g. Speech Therapy" className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Capacity (Students)</label>
                <input required type="number" className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Fee ({currency})</label>
                    <input required type="number" className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={formData.defaultMonthlyFee} onChange={e => setFormData({...formData, defaultMonthlyFee: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Daily Fee ({currency})</label>
                    <input required type="number" className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={formData.defaultDailyFee} onChange={e => setFormData({...formData, defaultDailyFee: Number(e.target.value)})} />
                  </div>
              </div>
              
              <div className="flex space-x-2 pt-2">
                <button type="submit" className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 flex justify-center items-center gap-2">
                  <Save size={18} /> {editingId ? 'Update' : 'Save Therapy'}
                </button>
                {editingId && (
                  <button type="button" onClick={handleCancel} className="px-3 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                    <X size={18} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-4">
             {courses.length === 0 && <div className="text-center py-10 text-slate-500">No therapy courses found. Add one to get started.</div>}
             
             {courses.map(c => (
               <div key={c.id} className={`bg-white p-5 rounded-xl border transition-all ${editingId === c.id ? 'border-primary-500 ring-1 ring-primary-500 shadow-md' : 'border-slate-200 shadow-sm'}`}>
                 <div className="flex justify-between items-start">
                   <div>
                     <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Activity size={20}/></div>
                         <h4 className="font-bold text-lg text-slate-800">{c.name}</h4>
                     </div>
                     <div className="text-sm text-slate-600 mt-2 flex gap-4">
                       <span>Capacity: <b>{c.capacity}</b></span>
                       <span>Monthly: <b className="text-emerald-600">{currency}{c.defaultMonthlyFee}</b></span>
                       <span>Daily: <b className="text-emerald-600">{currency}{c.defaultDailyFee}</b></span>
                     </div>
                   </div>
                   <div className="flex space-x-2">
                     <button onClick={() => handleEdit(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                       <Edit2 size={18} />
                     </button>
                     <button onClick={() => handleDelete(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                       <Trash2 size={18} />
                     </button>
                   </div>
                 </div>
               </div>
             ))}
        </div>
      </div>
    </div>
  );
};

export default Courses;
