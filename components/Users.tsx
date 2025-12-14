
import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import { User, ClassLevel, Role } from '../types';
import { Plus, Edit2, Trash2, CheckSquare, Square } from 'lucide-react';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [standardSubjects, setStandardSubjects] = useState<string[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialFormState: Partial<User> = {
    username: '', password: '', name: '', role: 'Accountant', 
    assignedClassIds: [], assignedSubjects: []
  };
  const [formData, setFormData] = useState<Partial<User>>(initialFormState);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [u, c, s] = await Promise.all([
      api.request<User[]>('getAllUsers'),
      api.request<ClassLevel[]>('getAllClasses'),
      api.request<string[]>('getStandardSubjects')
    ]);
    setUsers(u);
    setClasses(c);
    setStandardSubjects(s);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.request('manageUser', { type: 'edit', data: { ...formData, id: editingId } });
      } else {
        if (!formData.password) return alert("Password required for new users");
        await api.request('manageUser', { type: 'add', data: formData });
      }
      setShowModal(false);
      fetchData();
    } catch (e: any) {
      alert(e.message || "Error saving user");
    }
  };

  const handleEdit = (u: User) => {
    setEditingId(u.id);
    setFormData({ ...u, password: '' }); // Don't show password
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm("Delete this user?")) return;
    await api.request('manageUser', { type: 'delete', id });
    fetchData();
  };

  const toggleSubject = (sub: string) => {
    const current = formData.assignedSubjects || [];
    if (current.includes(sub)) {
      setFormData({ ...formData, assignedSubjects: current.filter(s => s !== sub) });
    } else {
      setFormData({ ...formData, assignedSubjects: [...current, sub] });
    }
  };

  const toggleClass = (classId: string) => {
    const current = formData.assignedClassIds || [];
    if (current.includes(classId)) {
        setFormData({ ...formData, assignedClassIds: current.filter(id => id !== classId) });
    } else {
        setFormData({ ...formData, assignedClassIds: [...current, classId] });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500">Create and manage system access accounts.</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setFormData(initialFormState); setShowModal(true); }}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 shadow-sm transition-colors"
        >
          <Plus size={20} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-700">Name</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Username</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Role</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Assignments (Teacher)</th>
              <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{u.name}</td>
                <td className="px-6 py-4 text-slate-600 font-medium">{u.username}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold border ${
                    u.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    u.role === 'Teacher' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-600">
                  {u.role === 'Teacher' ? (
                     <div>
                       <div className="font-semibold text-slate-800 mb-1">
                           Classes: {u.assignedClassIds && u.assignedClassIds.length > 0 
                             ? classes.filter(c => u.assignedClassIds?.includes(c.id)).map(c => c.name).join(', ') 
                             : 'None'}
                       </div>
                       <div className="text-slate-500 truncate max-w-xs">{u.assignedSubjects?.join(', ') || 'No subjects'}</div>
                     </div>
                  ) : <span className="text-slate-400">-</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                     <button onClick={() => handleEdit(u)} className="p-1.5 text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded transition-colors"><Edit2 size={16}/></button>
                     {u.username !== 'admin' && (
                       <button onClick={() => handleDelete(u.id)} className="p-1.5 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-300 rounded transition-colors"><Trash2 size={16}/></button>
                     )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">{editingId ? 'Edit User' : 'New User'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl transition-colors">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                  <input required type="text" className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
                  <input required type="text" className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                  <input type="password" placeholder={editingId ? "Leave blank to keep" : "Required"} className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <div className="col-span-2">
                   <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                   <div className="grid grid-cols-3 gap-2">
                      {(['Admin', 'Accountant', 'Teacher'] as Role[]).map(r => (
                        <button 
                          key={r}
                          type="button"
                          onClick={() => setFormData({...formData, role: r})}
                          className={`py-2 text-sm font-bold rounded-lg border transition-all ${formData.role === r ? 'bg-primary-600 text-white border-primary-600 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                        >
                          {r}
                        </button>
                      ))}
                   </div>
                </div>
              </div>

              {formData.role === 'Teacher' && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                   <h4 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">Teacher Assignments</h4>
                   <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Assigned Classes</label>
                      <div className="space-y-1 max-h-32 overflow-y-auto bg-white border border-slate-300 rounded-lg p-2">
                          {classes.length === 0 ? <p className="text-xs text-slate-400 p-1">No classes available</p> : 
                             classes.map(c => {
                                 const isSelected = formData.assignedClassIds?.includes(c.id);
                                 return (
                                     <div key={c.id} onClick={() => toggleClass(c.id)} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                                         {isSelected ? <CheckSquare size={16} className="text-primary-600"/> : <Square size={16} className="text-slate-400"/>}
                                         <span className={`text-sm ${isSelected ? 'text-primary-700 font-semibold' : 'text-slate-600'}`}>{c.name}</span>
                                     </div>
                                 )
                             })
                          }
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Assigned Subjects</label>
                      <div className="flex flex-wrap gap-2">
                         {standardSubjects.map(sub => (
                           <button
                             key={sub}
                             type="button"
                             onClick={() => toggleSubject(sub)}
                             className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                               formData.assignedSubjects?.includes(sub) 
                                ? 'bg-blue-100 text-blue-700 border-blue-300' 
                                : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                             }`}
                           >
                             {sub}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button type="submit" className="px-6 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 shadow-md transition-colors">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
