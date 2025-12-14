
import React, { useState, useEffect, useContext, useRef } from 'react';
import { api } from '../services/apiService';
import { SchoolSettings, User } from '../types';
import { AuthContext } from '../AuthContext';
import { Save, Upload, User as UserIcon, Building, ShieldCheck, Landmark, Mail, Phone, MapPin, Globe, CreditCard, Lock, Database, Download, UploadCloud, AlertTriangle } from 'lucide-react';

const Settings: React.FC = () => {
  const { user, updateUser, logout } = useContext(AuthContext);
  const [settings, setSettings] = useState<SchoolSettings>({
    name: '', address: '', contact_no: '', email: '', logo_url: '', currency: '$',
    bankName: '', bankAccountTitle: '', bankAccountNumber: '', bankIban: ''
  });
  const [activeTab, setActiveTab] = useState<'general' | 'profile' | 'data'>('general');
  const [profileData, setProfileData] = useState({ name: '', password: '' });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
    if (user) {
        setProfileData({ name: user.name, password: '' });
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const data = await api.request<SchoolSettings>('getSchoolSettings');
      setSettings(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
          alert("File too large. Please upload an image smaller than 2MB.");
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
      alert("School settings updated successfully!");
    } catch (e) {
      alert("Error saving settings");
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
      alert("Profile updated successfully!");
    } catch (e) {
      alert("Error updating profile");
    } finally {
      setLoading(false);
    }
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
      } catch (e) {
          alert("Failed to export data.");
      }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!window.confirm("WARNING: This will overwrite ALL existing data (students, staff, finances) with the backup file. This action cannot be undone. Continue?")) {
          e.target.value = ''; // Reset
          return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              await api.importDatabase(json);
              alert("Data restored successfully! The system will now reload.");
              window.location.reload();
          } catch (e) {
              alert("Error importing file. Invalid format or corrupt data.");
          }
      };
      reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Banner - MATCHING SIDEBAR COLOR */}
      <div className="bg-[#eff4f9] rounded-3xl p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-white opacity-40 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2 text-slate-900">System Configuration</h1>
            <p className="text-slate-600 max-w-xl text-lg">Manage your institution's global settings, billing information, and administrative credentials.</p>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-4 mt-8">
            <button 
                onClick={() => setActiveTab('general')}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold transition-all duration-300 ${activeTab === 'general' ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}
            >
                <Building size={20} /> Organization
            </button>
            <button 
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold transition-all duration-300 ${activeTab === 'profile' ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}
            >
                <ShieldCheck size={20} /> Admin Profile
            </button>
            <button 
                onClick={() => setActiveTab('data')}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold transition-all duration-300 ${activeTab === 'data' ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}
            >
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
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                        <input required type="text" className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-slate-900 text-base" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-base font-bold text-slate-900 mb-2">Official Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                        <input required type="email" className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-slate-900 text-base" value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-base font-bold text-slate-900 mb-2">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                        <input required type="text" className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-slate-900 text-base" value={settings.contact_no} onChange={e => setSettings({...settings, contact_no: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-base font-bold text-slate-900 mb-2">Currency Symbol</label>
                                    <input required type="text" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-slate-900 text-base" value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})} placeholder="$" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-base font-bold text-slate-900 mb-2">Physical Address</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3.5 text-slate-500" size={20} />
                                        <textarea required rows={2} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none text-slate-900 text-base" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Bank Details & Actions */}
                <div className="space-y-8">
                    {/* Bank Details - LIGHT THEME */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 relative overflow-hidden">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Landmark size={24} className="text-primary-600"/> Banking Details
                        </h2>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-900 uppercase mb-2">Bank Name</label>
                                <input type="text" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" value={settings.bankName || ''} onChange={e => setSettings({...settings, bankName: e.target.value})} placeholder="e.g. Chase Bank" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-900 uppercase mb-2">Account Title</label>
                                <input type="text" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" value={settings.bankAccountTitle || ''} onChange={e => setSettings({...settings, bankAccountTitle: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-900 uppercase mb-2">Account Number</label>
                                <div className="relative">
                                    <CreditCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                                    <input type="text" className="w-full pl-10 bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-mono" value={settings.bankAccountNumber || ''} onChange={e => setSettings({...settings, bankAccountNumber: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-900 uppercase mb-2">IBAN / Swift</label>
                                <input type="text" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-mono" value={settings.bankIban || ''} onChange={e => setSettings({...settings, bankIban: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                        <p className="text-sm text-slate-600 mb-4">Review your changes before saving. These updates will reflect on all invoices and printed documents immediately.</p>
                        <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-3.5 rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 text-base">
                            <Save size={20} /> {loading ? 'Saving Changes...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
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
                        <div className="relative">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input required type="text" className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-slate-900 text-base" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-base font-bold text-slate-900 mb-2">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input type="password" placeholder="Leave blank to keep current" className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-slate-900 text-base" value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})} />
                        </div>
                        <p className="text-sm text-slate-500 mt-2 ml-1">Must be at least 6 characters long.</p>
                    </div>
                    
                    <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 shadow-xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 mt-6 text-lg">
                        <ShieldCheck size={22} /> {loading ? 'Updating...' : 'Update Credentials'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col justify-between">
                <div>
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                        <Download size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Backup System Data</h2>
                    <p className="text-slate-500 leading-relaxed mb-8">
                        Create a complete snapshot of your system. This includes student records, financial transactions, staff details, and settings. Download the JSON file to keep your data safe.
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
                            Warning: This action will <strong>permanently overwrite</strong> all current data. This cannot be undone.
                        </p>
                    </div>
                </div>
                
                <div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImportData} 
                        accept=".json" 
                        className="hidden" 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 shadow-xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                    >
                        <UploadCloud size={20} /> Select Backup File
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
