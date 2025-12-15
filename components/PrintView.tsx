
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/apiService';
import { SchoolSettings, Invoice, Student, SalarySlip, Staff, Exam, ClassLevel } from '../types';
import { GraduationCap, Loader2, Globe, Mail, Phone, MapPin, CreditCard } from 'lucide-react';

// New Styled Header for Invoice
export const InvoiceTemplate: React.FC<{ invoice: Invoice, student: Student, settings: SchoolSettings }> = ({ invoice, student, settings }) => {
    return (
        <div className="w-full bg-white min-h-[297mm] break-inside-avoid print:break-inside-avoid relative print:p-0 flex flex-col font-sans text-slate-700">
            
            {/* Top Brand Bar */}
            <div className="h-3 w-full bg-[#0F87A6]"></div>

            {/* Header Section */}
            <div className="flex justify-between items-start px-12 pt-10 pb-6">
                {/* Left: Logo & School Info */}
                <div className="flex flex-col gap-4 max-w-[50%]">
                    <div className="h-20 flex items-center justify-start">
                        {settings.logo_url ? (
                            <img src={settings.logo_url} className="max-h-full max-w-full object-contain" alt="Logo"/>
                        ) : (
                            <div className="w-16 h-16 bg-[#0F87A6]/10 flex items-center justify-center rounded-lg text-[#0F87A6]">
                                <GraduationCap size={32} />
                            </div>
                        )}
                    </div>
                    <div className="text-sm text-slate-500 space-y-1">
                        <p className="font-bold text-slate-800 text-base">{settings.address}</p>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1"><Phone size={12} className="text-[#F15D69]"/> {settings.contact_no}</span>
                            <span className="flex items-center gap-1"><Mail size={12} className="text-[#F15D69]"/> {settings.email}</span>
                        </div>
                        {settings.website && <div className="flex items-center gap-1 text-xs"><Globe size={12} className="text-[#F15D69]"/> {settings.website}</div>}
                    </div>
                </div>

                {/* Right: Title, Status, Metadata */}
                <div className="text-right">
                    <h1 className="text-5xl font-extrabold text-[#0F87A6] tracking-tighter uppercase leading-none mb-2">Invoice</h1>
                    
                    {/* Status Badge */}
                    <div className="mb-6">
                        <span className={`px-3 py-1 rounded text-sm font-bold border uppercase tracking-wider ${
                            invoice.status === 'Paid' 
                            ? 'bg-white text-[#0F87A6] border-[#0F87A6]' 
                            : 'bg-white text-[#F15D69] border-[#F15D69]'
                        }`}>
                            {invoice.status}
                        </span>
                    </div>

                    {/* Metadata Table */}
                    <div className="text-sm space-y-1">
                        <div className="flex justify-end gap-4 items-center">
                            <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">Invoice No</span>
                            <span className="font-mono font-bold text-slate-800 text-lg">{invoice.invoiceNo}</span>
                        </div>
                        <div className="flex justify-end gap-4 items-center">
                            <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">Date</span>
                            <span className="font-medium text-slate-700">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-end gap-4 items-center">
                            <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">Due Date</span>
                            <span className="font-medium text-[#F15D69]">{invoice.due_date}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Separator */}
            <div className="px-12 my-2">
                <div className="w-full h-px bg-slate-100"></div>
            </div>

            {/* Bill To Section - Compact */}
            <div className="px-12 py-6">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#0F87A6] uppercase tracking-[0.2em] mb-1">Invoice To</span>
                    <p className="text-2xl font-bold text-slate-900 leading-none">{student.name}</p>
                    <p className="text-slate-600 font-medium text-sm">{student.parentDetails.name}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1"><MapPin size={12}/> {student.parentDetails.address}</span>
                        <span className="flex items-center gap-1"><Phone size={12}/> {student.parentDetails.contact}</span>
                    </div>
                </div>
            </div>

            {/* Line Items */}
            <div className="px-12 mt-2 flex-1">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-[#0F87A6]">
                            <th className="py-3 text-left text-xs font-bold text-[#0F87A6] uppercase tracking-wider">Description</th>
                            <th className="py-3 text-right text-xs font-bold text-[#0F87A6] uppercase tracking-wider w-32">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {invoice.items.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-100">
                                <td className="py-4 text-slate-700 font-medium">{item.description}</td>
                                <td className="py-4 text-right font-mono text-slate-900 font-bold">{settings.currency}{item.amount.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer Section */}
            <div className="px-12 pb-12 break-inside-avoid">
                {/* Totals */}
                <div className="flex justify-end mb-8">
                    <div className="w-64">
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-500 text-sm font-medium">Subtotal</span>
                            <span className="text-slate-800 font-mono font-bold">{settings.currency}{invoice.amount_due.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-[#0F87A6] font-bold uppercase tracking-wider text-sm">Total Due</span>
                            <span className="text-[#0F87A6] font-extrabold text-2xl">{settings.currency}{invoice.amount_due.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Info & Signature */}
                <div className="grid grid-cols-2 gap-12 border-t border-slate-200 pt-8">
                    <div>
                        <h4 className="font-bold text-[#0F87A6] uppercase text-[10px] tracking-wider mb-3 flex items-center gap-2">
                            <CreditCard size={14}/> Payment Details
                        </h4>
                        <div className="text-xs text-slate-600 space-y-1">
                            <p><span className="font-bold text-slate-400 w-20 inline-block">Bank:</span> {settings.bankName}</p>
                            <p><span className="font-bold text-slate-400 w-20 inline-block">Title:</span> {settings.bankAccountTitle}</p>
                            <p><span className="font-bold text-slate-400 w-20 inline-block">Account:</span> <span className="font-mono font-bold">{settings.bankAccountNumber}</span></p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col justify-end items-end text-center">
                        <div className="w-40 border-b border-slate-300 mb-2"></div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Authorized Signature</p>
                    </div>
                </div>
            </div>
            
            {/* Bottom Bar */}
            <div className="bg-[#0F87A6] py-2 text-center mt-auto">
                <p className="text-[10px] text-white/80 font-medium">Thank you for your business. {settings.website && `| ${settings.website}`}</p>
            </div>
        </div>
    );
};

// Legacy Header for other docs (Exams)
export const PrintHeader = ({ settings, title }: { settings: SchoolSettings, title: string }) => (
    <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
       <div className="flex flex-col gap-2">
           {settings.logo_url ? (
               <img src={settings.logo_url} className="h-24 w-auto object-contain self-start" alt="Logo"/>
           ) : (
               <div className="w-12 h-12 bg-slate-100 flex items-center justify-center rounded-full text-slate-400">
                   <GraduationCap size={24} />
               </div>
           )}
           <div className="text-sm text-slate-600 font-medium mt-2">
               <p>{settings.address}</p>
               <p>{settings.contact_no} | {settings.email}</p>
               {settings.website && <p>{settings.website}</p>}
           </div>
       </div>
       <div className="text-right pt-2">
           <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide border-2 border-slate-800 px-3 py-1 inline-block">{title}</h2>
           <p className="text-sm text-slate-500 mt-2">Date: {new Date().toLocaleDateString()}</p>
       </div>
   </div>
);

export const SalarySlipTemplate: React.FC<{ slip: any, staff: Staff, settings: SchoolSettings }> = ({ slip, staff, settings }) => {
    const stats = slip.attendanceStats || { totalDays: 0, present: 0, late: 0, absent: 0, paidLeave: 0 };

    return (
        <div className="w-full bg-white min-h-[297mm] break-inside-avoid print:break-inside-avoid relative print:p-0 flex flex-col font-sans text-slate-700">
             {/* Top Brand Bar */}
            <div className="h-3 w-full bg-[#0F87A6]"></div>

            {/* Header Section */}
            <div className="flex justify-between items-start px-12 pt-10 pb-6">
                {/* Left: Logo & School Info */}
                <div className="flex flex-col gap-4 max-w-[50%]">
                    <div className="h-20 flex items-center justify-start">
                        {settings.logo_url ? (
                            <img src={settings.logo_url} className="max-h-full max-w-full object-contain" alt="Logo"/>
                        ) : (
                            <div className="w-16 h-16 bg-[#0F87A6]/10 flex items-center justify-center rounded-lg text-[#0F87A6]">
                                <GraduationCap size={32} />
                            </div>
                        )}
                    </div>
                    <div className="text-sm text-slate-500 space-y-1">
                        <p className="font-bold text-slate-800 text-base">{settings.address}</p>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1"><Phone size={12} className="text-[#F15D69]"/> {settings.contact_no}</span>
                            <span className="flex items-center gap-1"><Mail size={12} className="text-[#F15D69]"/> {settings.email}</span>
                        </div>
                        {settings.website && <div className="flex items-center gap-1 text-xs"><Globe size={12} className="text-[#F15D69]"/> {settings.website}</div>}
                    </div>
                </div>

                {/* Right: Title */}
                <div className="text-right">
                    <h1 className="text-5xl font-extrabold text-[#0F87A6] tracking-tighter uppercase leading-none mb-1">Payslip</h1>
                    <p className="text-slate-400 uppercase text-xs font-bold tracking-widest">Confidential</p>
                </div>
            </div>

            {/* Separator */}
            <div className="px-12 my-2">
                <div className="w-full h-px bg-slate-100"></div>
            </div>

            {/* Two-Column Detail Layout */}
            <div className="px-12 py-8 grid grid-cols-2 gap-12">
                {/* Left: Employee Info */}
                <div>
                     <h3 className="text-[10px] font-bold text-[#0F87A6] uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2">Employee Details</h3>
                     <div className="space-y-4">
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-bold">Name</p>
                            <p className="text-xl font-bold text-slate-900">{staff.name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold">Designation</p>
                                <p className="text-sm font-medium text-slate-700">{staff.designation}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold">Employee ID</p>
                                <p className="text-sm font-mono font-bold text-slate-700">{staff.id.substring(0,6)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold">CNIC</p>
                                <p className="text-sm font-medium text-slate-700">{staff.cnic || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold">Contact</p>
                                <p className="text-sm font-medium text-slate-700">{staff.contact}</p>
                            </div>
                        </div>
                     </div>
                </div>

                {/* Right: Pay Period & Attendance Summary */}
                <div>
                    <h3 className="text-[10px] font-bold text-[#0F87A6] uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2">Pay Period & Attendance</h3>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-bold">Period</p>
                            <p className="text-lg font-bold text-slate-800">{slip.monthYear}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-xs text-slate-400 uppercase font-bold">Generated On</p>
                             <p className="text-sm font-medium text-slate-700">{new Date(slip.generationDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                    
                    {/* Clean Attendance Grid */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                                <span className="block text-xl font-bold text-slate-700">{stats.totalDays}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Days</span>
                            </div>
                            <div>
                                <span className="block text-xl font-bold text-emerald-600">{stats.present}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Present</span>
                            </div>
                            <div>
                                <span className="block text-xl font-bold text-orange-500">{stats.late}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Late</span>
                            </div>
                            <div>
                                <span className="block text-xl font-bold text-red-500">{stats.absent}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Absent</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Salary Table */}
            <div className="px-12 mt-2 flex-1">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-[#0F87A6]">
                            <th className="py-3 text-left text-xs font-bold text-[#0F87A6] uppercase tracking-wider">Earnings / Deductions</th>
                            <th className="py-3 text-left text-xs font-bold text-[#0F87A6] uppercase tracking-wider">Type</th>
                            <th className="py-3 text-right text-xs font-bold text-[#0F87A6] uppercase tracking-wider w-32">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {/* Basic Salary */}
                        <tr className="border-b border-slate-100">
                            <td className="py-4 text-slate-700 font-bold">Basic Salary</td>
                            <td className="py-4 text-slate-500 text-xs uppercase font-medium">Earning</td>
                            <td className="py-4 text-right font-mono text-slate-900 font-bold">{settings.currency}{slip.baseSalary.toLocaleString()}</td>
                        </tr>
                        
                        {/* Attendance Deduction */}
                        {slip.attendanceDeduction > 0 && (
                            <tr className="border-b border-slate-100">
                                <td className="py-4 text-slate-700 font-medium">Absence / Unpaid Leave ({stats.absent} days)</td>
                                <td className="py-4"><span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-red-50 text-red-600">Deduction</span></td>
                                <td className="py-4 text-right font-mono font-bold text-red-600">-{settings.currency}{slip.attendanceDeduction.toLocaleString()}</td>
                            </tr>
                        )}

                        {/* Adjustments */}
                        {slip.adjustments && slip.adjustments.length > 0 ? (
                            slip.adjustments.map((adj: any) => (
                                <tr key={adj.id} className="border-b border-slate-100">
                                    <td className="py-4 text-slate-700 font-medium">{adj.description}</td>
                                    <td className="py-4">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${adj.type === 'Bonus' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                            {adj.type}
                                        </span>
                                    </td>
                                    <td className={`py-4 text-right font-mono font-bold ${adj.type === 'Bonus' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {adj.type === 'Bonus' ? '+' : '-'}{settings.currency}{adj.amount.toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <>
                                {slip.totalBonuses > 0 && (
                                    <tr className="border-b border-slate-100">
                                        <td className="py-4 text-slate-700 font-medium">Allowances & Bonuses</td>
                                        <td className="py-4"><span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-emerald-50 text-emerald-600">Bonus</span></td>
                                        <td className="py-4 text-right font-mono font-bold text-emerald-600">+{settings.currency}{slip.totalBonuses.toLocaleString()}</td>
                                    </tr>
                                )}
                                {slip.totalDeductions > 0 && (
                                    <tr className="border-b border-slate-100">
                                        <td className="py-4 text-slate-700 font-medium">Other Deductions (Fines, Advance)</td>
                                        <td className="py-4"><span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-red-50 text-red-600">Deduction</span></td>
                                        <td className="py-4 text-right font-mono font-bold text-red-600">-{settings.currency}{slip.totalDeductions.toLocaleString()}</td>
                                    </tr>
                                )}
                            </>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer Section */}
            <div className="px-12 pb-12 break-inside-avoid">
                {/* Totals */}
                <div className="flex justify-end mb-8">
                    <div className="w-64">
                        <div className="flex justify-between items-center py-3">
                            <span className="text-[#0F87A6] font-bold uppercase tracking-wider text-sm">Net Payable</span>
                            <span className="text-[#0F87A6] font-extrabold text-2xl">{settings.currency}{slip.netSalary.toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 text-right mt-1">*Amount transferred to bank account</p>
                    </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-8 border-t border-slate-200 pt-12">
                    <div className="text-center">
                        <div className="w-full border-b border-slate-300 mb-2"></div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Employee</p>
                    </div>
                    <div className="text-center">
                        <div className="w-full border-b border-slate-300 mb-2"></div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Accountant</p>
                    </div>
                    <div className="text-center">
                        <div className="w-full border-b border-slate-300 mb-2"></div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Director</p>
                    </div>
                </div>
            </div>
            
            {/* Bottom Bar */}
            <div className="bg-[#0F87A6] py-2 text-center mt-auto">
                <p className="text-[10px] text-white/80 font-medium">Generated by SchoolFlow Management System. {settings.website && `| ${settings.website}`}</p>
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
