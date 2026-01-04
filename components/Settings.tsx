
import React, { useState, useEffect, useContext, useRef } from 'react';
import { api } from '../services/apiService';
import { SchoolSettings, User } from '../types';
import { AuthContext } from '../AuthContext';
import { Save, Upload, User as UserIcon, Building, ShieldCheck, Landmark, Mail, Phone, MapPin, Globe, CreditCard, Lock, Database, Download, UploadCloud, AlertTriangle, CheckCircle, XCircle, Trash2, Calendar, Plus } from 'lucide-react';

const Settings: React.FC = () => {
  const { user, updateUser, logout } = useContext(AuthContext);
  const [settings, setSettings] = useState<SchoolSettings>({
    name: '', address: '', contact_no: '', email: '', website: '', logo_url: '', currency: '$',
    bankName: '', bankAccountTitle: '', bankAccountNumber: '', bankIban: '',
    weeklyOffDays: [0, 6], holidays: []
  });
  const [activeTab, setActiveTab] = useState<'general' | 'profile' | 'data' | 'calendar'>('general');
  const [profileData, setProfileData] = useState({ name: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // Holiday Input State
  const [newHolidayDate, setNewHolidayDate] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
    if (user) {
        setProfileData({ name: user.name, password: '' });
    }
  }, [user]);

  useEffect(() => {
      if (notification) {
          const timer = setTimeout(() => setNotification(null), 4000);
          return () => clearTimeout(timer);
      }
  }, [notification]);

  const loadSettings = async () => {
    try {
      const data = await api.request<SchoolSettings>('getSchoolSettings');
      // Ensure arrays exist
      if (!data.weeklyOffDays) data.weeklyOffDays = [0, 6]; // Default Sun, Sat
      if (!data.holidays) data.holidays = [];
      setSettings(data);
    } catch (e) {
      console.error(e);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
      setNotification({ type, message });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
          showNotification('error', "File too large. Please upload an image smaller than 2MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, logo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.request('updateSchoolSettings', settings);
      showNotification('success', "Configuration saved successfully!");
    } catch (e) {
      showNotification('error', "Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const updatedUser = await api.request<User>('updateUserProfile', { 
          id: user.id, 
          name: profileData.name, 
          password: profileData.password 
      });
      updateUser(updatedUser);
      setProfileData(prev => ({ ...prev, password: '' })); 
      showNotification('success', "Profile updated successfully!");
    } catch (e) {
      showNotification('error', "Error updating profile credentials.");
    } finally {
      setLoading(false);
    }
  };
  
  const toggleWeeklyOff = (dayIndex: number) => {
      const current = settings.weeklyOffDays || [];
      const updated = current.includes(dayIndex) 
        ? current.filter(d => d !== dayIndex)
        : [...current, dayIndex];
      setSettings({ ...settings, weeklyOffDays: updated });
  };

  const addHoliday = () => {
      if (!newHolidayDate) return;
      const current = settings.holidays || [];
      if (current.includes(newHolidayDate)) return;
      
      setSettings({ ...settings, holidays: [...current, newHolidayDate].sort() });
      setNewHolidayDate('');
  };

  const removeHoliday = (dateStr: string) => {
      setSettings({ ...settings, holidays: (settings.holidays || []).filter(d => d !== dateStr) });
  };

  // --- Data Management Handlers ---

  const handleExportData = async () => {
      try {
          const data = await api.exportDatabase();
          const jsonString = JSON.stringify(data, null, 2);
          const blob = new Blob([jsonString], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement("a");
          link.href = url;
          link.download = `schoolflow_backup_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          showNotification('success', "Backup file downloaded.");
      } catch (e) {
          showNotification('error', "Failed to export data.");
      }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!window.confirm("WARNING: This will overwrite ALL existing data. Continue?")) {
          e.target.value = '';
          return;
      }

      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const jsonContent = event.target?.result as string;
              if (!jsonContent) throw new Error("File is empty.");
              const parsedData = JSON.parse(jsonContent);
              await api.importDatabase(parsedData);
              alert("✅ Data restored successfully!\n\nThe page will now reload.");
              window.location.reload();
          } catch (err: any) {
              alert(`❌ Import Failed:\n\n${err.message}`);
          } finally {
              setLoading(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      };
      reader.readAsText(file);
  };
  
  const handleFactoryReset = async () => {
      if (!window.confirm("DANGER: This will delete ALL data (Students, Fees, Staff, Settings).")) return;
      try {
          await api.factoryReset();
          alert("System reset. You will be logged out.");
          logout();
          window.location.href = "/";
      } catch (e) {
          alert("Error resetting system.");
      }
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative pb-10">
      {/* Notification Toast */}
      {notification && (
          <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-5 duration-300 border ${
              notification.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'
          }`}>
              {notification.type === 'success' ? <CheckCircle size={24} className="text-emerald-500" /> : <XCircle size={24} className="text-red-500" />}
              <div>
                  <h4 className="font-bold text-sm">{notification.type === 'success' ? 'Success' : 'Error'}</h4>
                  <p className="text-sm opacity-90">{notification.message}</p>
              </div>
              <button onClick={() => setNotification(null)} className="ml-4 opacity-50 hover:opacity-100"><XCircle size={16}/></button>
          </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#eff4f9] rounded-3xl p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-white opacity-40 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2 text-slate-900">System Configuration</h1>
            <p className="text-slate-600 max-w-xl text-lg">Manage your institution's global settings, calendar, and administrative credentials.</p>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-4 mt-8 overflow-x-auto pb-1">
            <button onClick={() => setActiveTab('general')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold transition-all duration-300 whitespace-nowrap ${activeTab === 'general' ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}>
                <Building size={20} /> Organization
            </button>
            <button onClick={() => setActiveTab('calendar')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold transition-all duration-300 whitespace-nowrap ${activeTab === 'calendar' ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}>
                <Calendar size={20} /> Work Calendar
            </button>
            <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold transition-all duration-300 whitespace-nowrap ${activeTab === 'profile' ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}>
                <ShieldCheck size={20} /> Admin Profile
            </button>
            <button onClick={() => setActiveTab('data')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold transition-all duration-300 whitespace-nowrap ${activeTab === 'data' ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}>
                <Database size={20} /> Data Management
            </button>
        </div>
      </div>

      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Branding & Basic Info */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Branding Card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Globe size={24} className="text-primary-600"/> Identity & Branding
                        </h2>
                        
                        <div className="space-y-6">
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center gap-6">
                                <div className="w-24 h-24 rounded-xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {settings.logo_url ? (
                                        <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <span className="text-xs text-slate-400 font-medium">No Logo</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 text-lg">School Logo</h3>
                                    <p className="text-sm text-slate-600 mb-3">Upload a PNG or JPG (Max 2MB)</p>
                                    <label className="cursor-pointer bg-white border border-slate-200 hover:border-primary-500 hover:text-primary-600 text-slate-800 px-4 py-2 rounded-lg text-sm font-bold inline-flex items-center gap-2 transition-all shadow-sm">
                                        <Upload size={18} /> Choose File
                                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-base font-bold text-slate-900 mb-2">Institution Name</label>
                                    <input required type="text" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-base font-bold text-slate-900 mb-2">Official Email</label>
                                    <input required type="email" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-base font-bold text-slate-900 mb-2">Phone Number</label>
                                    <input required type="text" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={settings.contact_no} onChange={e => setSettings({...settings, contact_no: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-base font-bold text-slate-900 mb-2">Website</label>
                                    <input type="text" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={settings.website || ''} onChange={e => setSettings({...settings, website: e.target.value})} placeholder="www.yourschool.com" />
                                </div>
                                <div>
                                    <label className="block text-base font-bold text-slate-900 mb-2">Currency Symbol</label>
                                    <input required type="text" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})} placeholder="$" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-base font-bold text-slate-900 mb-2">Physical Address</label>
                                    <textarea required rows={2} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 resize-none" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Bank Details & Actions */}
                <div className="space-y-8">
                    {/* Bank Details */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 relative overflow-hidden">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Landmark size={24} className="text-primary-600"/> Banking Details
                        </h2>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-900 uppercase mb-2">Bank Name</label>
                                <input type="text" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500" value={settings.bankName || ''} onChange={e => setSettings({...settings, bankName: e.target.value})} placeholder="e.g. Chase Bank" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-900 uppercase mb-2">Account Title</label>
                                <input type="text" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500" value={settings.bankAccountTitle || ''} onChange={e => setSettings({...settings, bankAccountTitle: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-900 uppercase mb-2">Account Number</label>
                                <input type="text" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 font-mono" value={settings.bankAccountNumber || ''} onChange={e => setSettings({...settings, bankAccountNumber: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-900 uppercase mb-2">IBAN / Swift</label>
                                <input type="text" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 font-mono" value={settings.bankIban || ''} onChange={e => setSettings({...settings, bankIban: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                        <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-3.5 rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 text-base">
                            <Save size={20} /> {loading ? 'Saving Changes...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
      )}

      {activeTab === 'calendar' && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Weekly Offs */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                      <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <Calendar size={24} className="text-blue-600"/> Weekly Off Days
                      </h2>
                      <p className="text-slate-500 mb-6 text-sm">Select the standard weekly holidays (e.g. Weekends). These days will generally not be marked as 'Absent' for staff.</p>
                      
                      <div className="space-y-3">
                          {daysOfWeek.map((day, idx) => {
                              const isSelected = settings.weeklyOffDays?.includes(idx);
                              return (
                                  <div key={day} 
                                      onClick={() => toggleWeeklyOff(idx)}
                                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                                  >
                                      <span className={`font-bold ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>{day}</span>
                                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                          {isSelected && <CheckCircle size={14} className="text-white"/>}
                                      </div>
                                  </div>
                              )
                          })}
                      </div>
                      <div className="mt-8">
                         <button onClick={handleSaveSettings} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900">Save Calendar Settings</button>
                      </div>
                  </div>

                  {/* Special Holidays */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col">
                      <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <Landmark size={24} className="text-purple-600"/> Annual Holidays
                      </h2>
                      <p className="text-slate-500 mb-6 text-sm">Add specific dates for festivals or public holidays.</p>

                      <div className="flex gap-2 mb-6">
                          <input 
                              type="date" 
                              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                              value={newHolidayDate}
                              onChange={e => setNewHolidayDate(e.target.value)}
                          />
                          <button onClick={addHoliday} className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700 shadow-sm">
                              <Plus size={20} />
                          </button>
                      </div>

                      <div className="flex-1 overflow-y-auto max-h-[400px] space-y-2 pr-2">
                          {settings.holidays && settings.holidays.length > 0 ? (
                              settings.holidays.map(dateStr => (
                                  <div key={dateStr} className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100">
                                      <span className="font-mono font-bold text-purple-900">
                                          {new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                                      </span>
                                      <button onClick={() => removeHoliday(dateStr)} className="text-purple-400 hover:text-red-500 p-1">
                                          <XCircle size={18} />
                                      </button>
                                  </div>
                              ))
                          ) : (
                              <div className="text-center py-10 text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                  No specific holidays added.
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'profile' && (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-12">
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 mb-4 ring-8 ring-primary-50/50">
                        <UserIcon size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Administrator Profile</h2>
                    <p className="text-slate-500 text-lg mt-1">Update your access credentials.</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-8">
                    <div>
                        <label className="block text-base font-bold text-slate-900 mb-2">Display Name</label>
                        <input required type="text" className="w-full px-4 py-3.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-base font-bold text-slate-900 mb-2">New Password</label>
                        <input type="password" placeholder="Leave blank to keep current" className="w-full px-4 py-3.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})} />
                    </div>
                    
                    <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 shadow-xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 mt-6 text-lg">
                        <ShieldCheck size={22} /> {loading ? 'Updating...' : 'Update Credentials'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col justify-between">
                    <div>
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                            <Download size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Backup System Data</h2>
                        <p className="text-slate-500 leading-relaxed mb-8">
                            Create a complete snapshot of your system. Download the JSON file to keep your data safe.
                        </p>
                    </div>
                    <button 
                        onClick={handleExportData}
                        className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                    >
                        <Download size={20} /> Download Backup File
                    </button>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -mr-10 -mt-10 z-0"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-6">
                            <UploadCloud size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Restore Data</h2>
                        <p className="text-slate-500 leading-relaxed mb-6">
                            Upload a previously backed-up JSON file to restore your system.
                        </p>
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 mb-8">
                            <AlertTriangle className="text-red-600 shrink-0" size={20}/>
                            <p className="text-xs text-red-700 font-medium">
                                Warning: This action will <strong>permanently overwrite</strong> all current data.
                            </p>
                        </div>
                    </div>
                    
                    <div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImportData}
                            onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} 
                            accept=".json" 
                            className="hidden" 
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 shadow-xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-70"
                        >
                            <UploadCloud size={20} /> {loading ? 'Restoring...' : 'Select Backup File'}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Factory Reset Section */}
            <div className="bg-red-50 rounded-3xl border border-red-100 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                     <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-red-600 shadow-sm shrink-0">
                         <Trash2 size={24} />
                     </div>
                     <div>
                         <h3 className="text-lg font-bold text-red-800">Factory Reset System</h3>
                         <p className="text-red-600/80 text-sm mt-1 max-w-lg">
                             This will completely wipe the database (students, staff, fees, settings) and reset it to a fresh install state.
                             <br/><strong>This action is irreversible.</strong>
                         </p>
                     </div>
                </div>
                <button 
                   onClick={handleFactoryReset}
                   className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 whitespace-nowrap transition-colors"
                >
                    Reset System
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
