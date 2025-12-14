
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/apiService';
import { SchoolSettings, Invoice, Student, SalarySlip, Staff, Exam, ClassLevel } from '../types';
import { GraduationCap, Loader2 } from 'lucide-react';

// New Styled Header for Invoice
export const InvoiceHeader = ({ settings, title }: { settings: SchoolSettings, title: string }) => (
    <div className="mb-8">
       {/* Top Colored Strip */}
       <div className="h-4 bg-slate-800 w-full mb-6"></div>
       
       <div className="flex justify-between items-start px-8">
           <div className="flex items-center gap-4">
               {settings.logo_url ? (
                   <img src={settings.logo_url} className="h-20 w-auto object-contain" alt="Logo"/>
               ) : (
                   <div className="w-16 h-16 bg-slate-100 flex items-center justify-center rounded-lg text-slate-400 border border-slate-200">
                       <GraduationCap size={32} />
                   </div>
               )}
               <div>
                   <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900 leading-none">{settings.name || 'School Name'}</h1>
                   <p className="text-sm text-slate-500 mt-1 font-medium tracking-wider">OFFICIAL INVOICE</p>
               </div>
           </div>
           
           <div className="text-right text-sm text-slate-500">
               <p className="font-medium text-slate-900">{settings.address}</p>
               <p>{settings.contact_no}</p>
               <p>{settings.email}</p>
           </div>
       </div>
       
       <div className="border-b border-slate-200 mx-8 mt-6"></div>
   </div>
);

// Legacy Header for other docs
export const PrintHeader = ({ settings, title }: { settings: SchoolSettings, title: string }) => (
    <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
       <div className="flex flex-col gap-2">
           {settings.logo_url ? (
               <img src={settings.logo_url} className="h-24 w-auto object-contain self-start" alt="Logo"/>
           ) : (
               <div className="flex items-center gap-2">
                   <div className="w-12 h-12 bg-slate-100 flex items-center justify-center rounded-full text-slate-400">
                       <GraduationCap size={24} />
                   </div>
                   <h1 className="text-xl font-bold uppercase tracking-widest text-slate-900">{settings.name || 'School Name'}</h1>
               </div>
           )}
           <div className="text-sm text-slate-600 font-medium">
               <p>{settings.address}</p>
               <p>{settings.contact_no} | {settings.email}</p>
           </div>
       </div>
       <div className="text-right pt-2">
           <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide border-2 border-slate-800 px-3 py-1 inline-block">{title}</h2>
           <p className="text-sm text-slate-500 mt-2">Date: {new Date().toLocaleDateString()}</p>
       </div>
   </div>
);

export const InvoiceTemplate: React.FC<{ invoice: Invoice, student: Student, settings: SchoolSettings }> = ({ invoice, student, settings }) => {
    return (
        <div className="w-full bg-white mb-8 break-inside-avoid print:break-inside-avoid relative print:p-0 min-h-[800px] flex flex-col">
            <InvoiceHeader settings={settings} title="INVOICE" />
            
            <div className="px-8 flex justify-between mb-8">
                <div className="w-1/2">
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</h3>
                   <div className="border-l-4 border-slate-800 pl-4 py-1">
                       <p className="text-xl font-bold text-slate-800">{student.name}</p>
                       <p className="text-slate-600 font-medium">{student.parentDetails.name}</p>
                       <p className="text-sm text-slate-500 mt-1">{student.parentDetails.address}</p>
                       <p className="text-sm text-slate-500">{student.parentDetails.contact}</p>
                   </div>
                </div>
                <div className="w-1/2 flex flex-col items-end">
                    <div className="text-right w-full">
                        <div className="flex justify-end gap-8 mb-2">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Invoice No</p>
                                <p className="font-mono font-bold text-slate-800 text-lg">{invoice.invoiceNo}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Date Issued</p>
                                <p className="font-mono text-slate-800">{new Date().toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Due Date</p>
                                <p className="font-mono text-slate-800">{invoice.due_date}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                             <span className={`px-4 py-1.5 rounded text-sm font-bold border uppercase tracking-wide ${invoice.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                Status: {invoice.status}
                             </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-8 mb-8 flex-1">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-800 text-white">
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider rounded-tl-lg rounded-bl-lg">Description</th>
                            <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider w-40 rounded-tr-lg rounded-br-lg">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {invoice.items.map((item, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                <td className="px-6 py-4 text-slate-700 font-medium border-b border-slate-100">{item.description}</td>
                                <td className="px-6 py-4 text-right font-mono text-slate-800 border-b border-slate-100">{settings.currency}{item.amount.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="px-8 pb-8">
                <div className="flex justify-end">
                    <div className="w-64 bg-slate-50 rounded-xl p-6 border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-500 text-sm font-medium">Subtotal</span>
                            <span className="text-slate-800 font-mono font-bold">{settings.currency}{invoice.amount_due.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-slate-200 my-2"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-800 font-bold uppercase tracking-wide text-sm">Total Due</span>
                            <span className="text-primary-700 font-bold text-xl">{settings.currency}{invoice.amount_due.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="mt-12 flex items-end justify-between border-t border-slate-200 pt-6">
                    <div className="text-sm text-slate-500 max-w-md">
                        <p className="font-bold text-slate-700 uppercase tracking-wide text-xs mb-2">Payment Details</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <span>Bank:</span> <span className="text-slate-800 font-medium">{settings.bankName}</span>
                            <span>Account Title:</span> <span className="text-slate-800 font-medium">{settings.bankAccountTitle}</span>
                            <span>Account No:</span> <span className="text-slate-800 font-medium">{settings.bankAccountNumber}</span>
                        </div>
                    </div>
                    
                    <div className="text-center">
                        <p className="text-2xl font-serif italic text-slate-300 mb-2 select-none">Authorized</p>
                        <div className="w-48 border-b-2 border-slate-800"></div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold mt-1 tracking-widest">Authority Signature</p>
                    </div>
                </div>
                
                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-400">Thank you for your timely payment. This is a computer-generated invoice.</p>
                </div>
            </div>
            
            {/* Bottom Strip */}
            <div className="h-2 bg-slate-800 w-full mt-auto"></div>
        </div>
    );
};

export const SalarySlipTemplate: React.FC<{ slip: any, staff: Staff, settings: SchoolSettings }> = ({ slip, staff, settings }) => {
    const stats = slip.attendanceStats || { totalDays: 0, present: 0, late: 0, absent: 0, paidLeave: 0 };

    return (
        <div className="w-full bg-white p-8 mb-8 break-inside-avoid print:break-inside-avoid relative print:p-0 border border-slate-200 print:border-none">
            <PrintHeader settings={settings} title="PAYSLIP" />
            
            {/* Employee Details Grid */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 text-sm">
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Employee Name</p>
                    <p className="font-bold text-slate-900 text-lg">{staff.name}</p>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Designation</p>
                    <p className="font-medium text-slate-900">{staff.designation}</p>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">CNIC Number</p>
                    <p className="font-mono text-slate-900">{staff.cnic || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Contact</p>
                    <p className="font-mono text-slate-900">{staff.contact}</p>
                </div>
                <div className="col-span-2">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Address</p>
                    <p className="text-slate-900">{staff.address || 'N/A'}</p>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6 bg-slate-50 p-4 rounded border border-slate-200">
                 <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Payslip Period</p>
                    <p className="font-mono font-bold text-slate-800 text-lg">{slip.monthYear}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-bold text-slate-500 uppercase">Generated On</p>
                    <p className="text-slate-700">{new Date(slip.generationDate).toLocaleDateString()}</p>
                 </div>
            </div>

            {/* Attendance Summary */}
            <div className="mb-8">
                <h3 className="font-bold text-slate-800 text-sm uppercase border-b border-slate-300 pb-1 mb-3">Attendance Summary</h3>
                <div className="grid grid-cols-5 gap-2 text-center text-sm">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <p className="text-xs text-slate-500 font-bold uppercase">Total Days</p>
                        <p className="font-bold text-slate-800">{stats.totalDays}</p>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
                        <p className="text-xs text-emerald-600 font-bold uppercase">Present</p>
                        <p className="font-bold text-emerald-800">{stats.present}</p>
                    </div>
                    <div className="bg-orange-50 p-2 rounded border border-orange-100">
                        <p className="text-xs text-orange-600 font-bold uppercase">Late</p>
                        <p className="font-bold text-orange-800">{stats.late}</p>
                    </div>
                    <div className="bg-blue-50 p-2 rounded border border-blue-100">
                        <p className="text-xs text-blue-600 font-bold uppercase">Paid Leave</p>
                        <p className="font-bold text-blue-800">{stats.paidLeave}</p>
                    </div>
                    <div className="bg-red-50 p-2 rounded border border-red-100">
                        <p className="text-xs text-red-600 font-bold uppercase">Absent/Unpaid</p>
                        <p className="font-bold text-red-800">{stats.absent}</p>
                    </div>
                </div>
            </div>

            {/* Salary Details Table */}
            <table className="w-full mb-8 border-collapse">
                <thead className="bg-slate-800 text-white">
                    <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold uppercase">Description</th>
                        <th className="px-4 py-3 text-right text-sm font-bold uppercase w-40">Amount</th>
                    </tr>
                </thead>
                <tbody className="border border-slate-200 divide-y divide-slate-200">
                    <tr>
                        <td className="px-4 py-3 text-slate-700 font-medium">Basic Salary</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-800">{settings.currency}{slip.baseSalary.toLocaleString()}</td>
                    </tr>
                    {/* Detailed Adjustments if available */}
                    {slip.adjustments && slip.adjustments.length > 0 ? (
                        slip.adjustments.map((adj: any) => (
                            <tr key={adj.id}>
                                <td className={`px-4 py-3 ${adj.type === 'Bonus' ? 'text-emerald-700' : 'text-red-700'}`}>
                                    {adj.type}: {adj.description}
                                </td>
                                <td className={`px-4 py-3 text-right font-mono ${adj.type === 'Bonus' ? 'text-emerald-700' : 'text-red-700'}`}>
                                    {adj.type === 'Bonus' ? '+' : '-'}{settings.currency}{adj.amount.toLocaleString()}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <>
                            {slip.totalBonuses > 0 && (
                                <tr>
                                    <td className="px-4 py-3 text-emerald-700">Bonuses / Allowances</td>
                                    <td className="px-4 py-3 text-right font-mono text-emerald-700">+{settings.currency}{slip.totalBonuses.toLocaleString()}</td>
                                </tr>
                            )}
                            {slip.totalDeductions > 0 && (
                                <tr>
                                    <td className="px-4 py-3 text-red-700">Deductions (Fines/Tax/Advance)</td>
                                    <td className="px-4 py-3 text-right font-mono text-red-700">-{settings.currency}{slip.totalDeductions.toLocaleString()}</td>
                                </tr>
                            )}
                        </>
                    )}
                </tbody>
                <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-800">
                        <td className="px-4 py-3 text-right font-bold text-slate-800 uppercase">Net Payable</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 text-xl">{settings.currency}{slip.netSalary.toLocaleString()}</td>
                    </tr>
                </tfoot>
            </table>

            <div className="mt-12 flex justify-between items-end gap-8">
                <div className="text-center flex-1">
                     <div className="h-10 border-b border-slate-300 mb-2"></div>
                     <p className="text-xs text-slate-400 uppercase font-bold">Employee Signature</p>
                </div>
                <div className="text-center flex-1">
                     <div className="h-10 border-b border-slate-300 mb-2"></div>
                     <p className="text-xs text-slate-400 uppercase font-bold">Accountant / Admin</p>
                </div>
                <div className="text-center flex-1">
                     <div className="h-10 border-b border-slate-300 mb-2"></div>
                     <p className="text-xs text-slate-400 uppercase font-bold">Director Signature</p>
                </div>
            </div>
            
            <div className="mt-8 text-center text-[10px] text-slate-400">
                <p>Generated by SchoolFlow Management System on {new Date().toLocaleString()}</p>
            </div>
        </div>
    );
};

// Main Component
const PrintView: React.FC = () => {
  const { type, id } = useParams();
  const [data, setData] = useState<any>(null);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await api.request<SchoolSettings>('getSchoolSettings');
        setSettings(s);

        if (type === 'invoice') {
             const d = await api.request('getInvoiceDetails', { id });
             setData(d);
        } else if (type === 'salary-slip') {
             const slip = await api.request<SalarySlip>('getSlipById', { id });
             setData(slip);
        } else if (type === 'batch-salary-slip') {
             const slips = await api.request<SalarySlip[]>('getSlipsByMonth', { monthYear: id });
             const fullSlips = await Promise.all(slips.map((s:any) => api.request('getSlipById', { id: s.id })));
             setData(fullSlips);
        } else if (type === 'exam-schedule') {
             const exams = await api.request<Exam[]>('getExams');
             const exam = exams.find((e:any) => e.id === id);
             const classes = await api.request<ClassLevel[]>('getAllClasses');
             const cls = classes.find((c:any) => c.id === exam?.classId);
             setData({ exam, cls });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [type, id]);

  useEffect(() => {
     if (!loading && data) {
         setTimeout(() => window.print(), 1000);
     }
  }, [loading, data]);

  if (loading || !settings) return (
      <div className="flex h-screen items-center justify-center gap-3 text-slate-500">
          <Loader2 className="animate-spin" /> Preparing Document...
      </div>
  );

  if (!data) return <div className="p-8 text-center text-red-500">Document not found.</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white">
       {type === 'invoice' && <InvoiceTemplate invoice={data.invoice} student={data.student} settings={settings} />}
       
       {type === 'salary-slip' && <SalarySlipTemplate slip={data} staff={data.staff} settings={settings} />}
       
       {type === 'batch-salary-slip' && Array.isArray(data) && data.map((item: any, idx: number) => (
           <div key={idx} className="break-after-page">
               <SalarySlipTemplate slip={item} staff={item.staff} settings={settings} />
           </div>
       ))}

       {type === 'exam-schedule' && (
           <div className="w-full bg-white p-8">
               <PrintHeader settings={settings} title="EXAM SCHEDULE" />
               <div className="mb-6">
                   <h2 className="text-2xl font-bold text-slate-800">{data.exam.name}</h2>
                   <p className="text-lg text-slate-600">Class: {data.cls?.name}</p>
               </div>
               <table className="w-full border-collapse border border-slate-300">
                   <thead>
                       <tr className="bg-slate-100">
                           <th className="border border-slate-300 px-4 py-2 text-left">Subject</th>
                           <th className="border border-slate-300 px-4 py-2 text-left">Date</th>
                           <th className="border border-slate-300 px-4 py-2 text-left">Time</th>
                       </tr>
                   </thead>
                   <tbody>
                       {data.exam.schedule.map((s:any, i:number) => (
                           <tr key={i}>
                               <td className="border border-slate-300 px-4 py-2 font-bold">{s.subject}</td>
                               <td className="border border-slate-300 px-4 py-2">{new Date(s.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                               <td className="border border-slate-300 px-4 py-2">09:00 AM</td>
                           </tr>
                       ))}
                   </tbody>
               </table>
           </div>
       )}
    </div>
  );
};

export default PrintView;
