
import React, { useEffect, useState } from 'react';
import { api } from '../services/apiService';
import { AuditLogEntry } from '../types';
import { ShieldAlert, Search } from 'lucide-react';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getAuditLogs().then(setLogs);
  }, []);

  const filteredLogs = logs.filter(l => 
    l.userName.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.details?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">System Audit Logs</h1>
        <p className="text-slate-500">Track all administrative actions and security events.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
           <div className="flex items-center gap-2 text-slate-600">
             <ShieldAlert size={18} />
             <span className="font-semibold">{logs.length} Total Events</span>
           </div>
           <div className="relative">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search logs..." 
               className="pl-9 pr-4 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 outline-none" 
               value={search}
               onChange={e => setSearch(e.target.value)}
             />
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-slate-600">Timestamp</th>
                <th className="px-6 py-3 text-slate-600">User</th>
                <th className="px-6 py-3 text-slate-600">Action</th>
                <th className="px-6 py-3 text-slate-600">Resource</th>
                <th className="px-6 py-3 text-slate-600">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-slate-500 font-mono text-xs">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-3 font-medium text-slate-800">{log.userName}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                      log.action === 'DELETE' ? 'bg-red-50 text-red-700 border-red-200' :
                      log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      log.action === 'CREATE' ? 'bg-green-50 text-green-700 border-green-200' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-600 uppercase text-xs font-semibold">{log.resource}</td>
                  <td className="px-6 py-3 text-slate-600 max-w-md truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
