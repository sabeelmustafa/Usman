
import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import { Invoice, InvoiceStatus, SchoolSettings, FinancialTransaction, Student } from '../types';
import { CreditCard, Printer, Search, RefreshCcw, FilePlus, X, Check, Eye, User, Calendar, Zap, Trash2 } from 'lucide-react';
import { InvoiceTemplate } from './PrintView';

const Fees: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [currency, setCurrency] = useState('$');
  const [loading, setLoading] = useState(false);
  
  // Batch Gen State
  const [genMonth, setGenMonth] = useState('');
  
  // Individual Gen State
  const [individualStudentId, setIndividualStudentId] = useState('');

  // Preview Modal State
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invData, txnData, settings, sData] = await Promise.all([
        api.request<Invoice[]>('getAllInvoices'),
        api.request<FinancialTransaction[]>('getTransactions'),
        api.request<SchoolSettings>('getSchoolSettings'),
        api.getStudents()
      ]);
      
      const safeTxnData = Array.isArray(txnData) ? txnData : [];
      setInvoices(invData.sort((a,b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime()));
      setTransactions(safeTxnData.filter(t => t.type === 'Fee').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setSchoolSettings(settings);
      setCurrency(settings.currency);
      setStudents(sData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBatch = async () => {
    if (!genMonth) return alert("Please select a month");
    setLoading(true);
    try {
      const res: any = await api.request('generateInvoice', { month_year: genMonth });
      alert(`Generated ${res.generated} invoices for monthly students.`);
      fetchData();
    } catch (e) {
      alert("Error generating invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateIndividual = async () => {
      if (!individualStudentId) return alert("Select a student");
      
      // Default to current month for individual generation
      const today = new Date();
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

      setLoading(true);
      try {
          const res: any = await api.request('generateInvoice', { 
              month_year: currentMonth, 
              studentId: individualStudentId 
          });
          if(res.generated > 0) {
              alert("Invoice generated successfully for all pending dues!");
          } else {
              alert("No new items to bill. Check if an invoice already exists for this month or if there are no pending charges.");
          }
          fetchData();
      } catch(e) {
          alert("Error generating individual invoice");
      } finally {
          setLoading(false);
      }
  };

  const handleMarkPaid = async (id: string) => {
    if (!window.confirm("Confirm payment for this invoice? This will record a transaction.")) return;
    try {
      await api.request('markInvoicePaid', { id });
      fetchData();
    } catch (e) {
      alert("Error updating status");
    }
  };

  const handleDeleteInvoice = async (id: string) => {
      if (!window.confirm("Delete this invoice? Any linked adjustments (fines/fees) will be un-applied and can be billed again later.")) return;
      try {
          await api.request('deleteInvoice', { id });
          fetchData();
      } catch (e) {
          alert("Error deleting invoice");
      }
  };

  const openPreview = async (id: string) => {
      const details = await api.request<any>('getInvoiceDetails', { id });
      setPreviewData(details);
      setPreviewInvoiceId(id);
  };

  const closePreview = () => {
      setPreviewInvoiceId(null);
      setPreviewData(null);
  };
  
  const printInvoice = (id: string) => {
      const url = `${window.location.origin}${window.location.pathname}#/print/invoice/${id}`;
      window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Invoices & Finance</h1>
        <p className="text-slate-500">Manage therapy billing and payments.</p>
      </div>

      <div className="flex border-b border-slate-200">
        <button onClick={() => setActiveTab('invoices')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'invoices' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <CreditCard size={18}/> Invoices
        </button>
        <button onClick={() => setActiveTab('payments')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'payments' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <RefreshCcw size={18}/> Transactions
        </button>
      </div>

      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Batch Generation Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                 <div>
                     <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                         <RefreshCcw size={16} className="text-emerald-600"/> Monthly Batch Invoice
                     </h3>
                     <p className="text-xs text-slate-500 mb-4">
                         Generates invoices <b>only</b> for students with fixed "Monthly" fee basis. 
                         Daily basis students are excluded from this batch.
                     </p>
                 </div>
                 <div className="flex gap-2 items-end">
                     <div className="flex-1">
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Month</label>
                         <input type="month" className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" value={genMonth} onChange={e => setGenMonth(e.target.value)} />
                     </div>
                     <button onClick={handleGenerateBatch} disabled={loading} className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap shadow-sm text-sm">
                        {loading ? '...' : 'Generate Batch'}
                     </button>
                 </div>
              </div>

              {/* Individual Generation Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                 <div>
                     <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                         <User size={16} className="text-blue-600"/> Individual Student Invoice
                     </h3>
                     <p className="text-xs text-slate-500 mb-4">
                         Generates invoice for <b>all pending dues</b> (Course Fees + Adjustments) for the current period.
                     </p>
                 </div>
                 <div className="flex flex-col gap-3">
                     <div className="flex gap-2 items-center">
                         <select 
                             className="flex-1 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                             value={individualStudentId}
                             onChange={e => setIndividualStudentId(e.target.value)}
                         >
                             <option value="">Select Student to Invoice...</option>
                             {students.filter(s => s.status === 'Active').map(s => (
                                 <option key={s.id} value={s.id}>{s.name} (ID: {s.id.substring(0,4)})</option>
                             ))}
                         </select>
                         <button 
                            onClick={handleGenerateIndividual} 
                            disabled={loading || !individualStudentId} 
                            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap shadow-sm text-sm flex items-center gap-2"
                         >
                            <Zap size={16} /> Generate Invoice
                         </button>
                     </div>
                 </div>
              </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 border-b border-slate-200">
                   <tr>
                     <th className="px-6 py-4 font-bold text-slate-700">Invoice #</th>
                     <th className="px-6 py-4 font-bold text-slate-700">Student</th>
                     <th className="px-6 py-4 font-bold text-slate-700">Month</th>
                     <th className="px-6 py-4 font-bold text-slate-700 text-right">Amount</th>
                     <th className="px-6 py-4 font-bold text-slate-700 text-center">Status</th>
                     <th className="px-6 py-4 font-bold text-slate-700 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {invoices.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-slate-500">No invoices found.</td></tr> : 
                    invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-mono text-slate-500 font-medium">{inv.invoiceNo}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{inv.student_name}</td>
                          <td className="px-6 py-4 text-slate-600">{inv.month_year}</td>
                          <td className="px-6 py-4 font-bold text-slate-800 text-right">{currency}{inv.amount_due.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                  {inv.status}
                              </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex justify-end items-center gap-2">
                                 {inv.status === 'Pending' && (
                                     <>
                                         <button 
                                            onClick={() => handleMarkPaid(inv.id)} 
                                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm transition-colors"
                                         >
                                             <Check size={14}/> Paid?
                                         </button>
                                         <button 
                                            onClick={() => handleDeleteInvoice(inv.id)} 
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded transition-colors"
                                            title="Delete Invoice"
                                         >
                                             <Trash2 size={16}/>
                                         </button>
                                     </>
                                 )}
                                 <button 
                                    onClick={() => openPreview(inv.id)} 
                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded transition-colors"
                                    title="Preview & Print"
                                 >
                                     <Eye size={16}/>
                                 </button>
                             </div>
                          </td>
                        </tr>
                    ))}
                 </tbody>
             </table>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="font-bold text-slate-700">Transaction History</h3>
              </div>
              <table className="w-full text-left text-sm">
                  <thead className="bg-white border-b border-slate-100">
                      <tr>
                          <th className="px-6 py-3 font-bold text-slate-600">Date</th>
                          <th className="px-6 py-3 font-bold text-slate-600">Description</th>
                          <th className="px-6 py-3 font-bold text-slate-600 text-right">Amount</th>
                          <th className="px-6 py-3 font-bold text-slate-600 text-center">Status</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {transactions.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-slate-500">No payment records found.</td></tr> :
                      transactions.map(t => (
                          <tr key={t.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 text-slate-600">{new Date(t.date).toLocaleDateString('en-GB')}</td>
                              <td className="px-6 py-4 font-medium text-slate-800">{t.description}</td>
                              <td className="px-6 py-4 text-right font-bold text-emerald-600">+{currency}{t.amount.toLocaleString()}</td>
                              <td className="px-6 py-4 text-center">
                                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">Success</span>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}

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
                          onClick={() => printInvoice(previewInvoiceId)}
                          className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 flex items-center gap-2"
                      >
                          <Printer size={18}/> Print
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Fees;
