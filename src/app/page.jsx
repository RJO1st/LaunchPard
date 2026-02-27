import React from "react";

// --- ICONS ---
const TrophyIcon = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
);
const BrainIcon = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54Z"/></svg>
);
const UsersIcon = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

export default function RoleSelection() {
  return (
    <div className="fixed inset-0 bg-[#6366f1] flex items-center justify-center p-6 z-[6000] animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-2xl rounded-[48px] p-10 md:p-16 shadow-2xl border-b-[16px] border-indigo-200 text-slate-900 text-center">
        <TrophyIcon size={80} className="mx-auto text-indigo-600 mb-8" />
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">Quest Academy</h1>
        <p className="text-slate-500 font-bold text-lg md:text-xl mb-12">Who is entering the academy today?</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a href="/student" className="bg-indigo-50 border-4 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-100 rounded-[32px] p-8 transition-all hover:-translate-y-2 group block">
             <div className="bg-indigo-600 w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <BrainIcon size={40} />
             </div>
             <h3 className="text-2xl font-black text-indigo-900 mb-2">I'm a Student</h3>
             <p className="text-indigo-600/70 font-bold">Start learning & questing</p>
          </a>
          
          <a href="/parent" className="bg-emerald-50 border-4 border-emerald-100 hover:border-emerald-500 hover:bg-emerald-100 rounded-[32px] p-8 transition-all hover:-translate-y-2 group block">
             <div className="bg-emerald-600 w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <UsersIcon size={40} />
             </div>
             <h3 className="text-2xl font-black text-emerald-900 mb-2">I'm a Parent</h3>
             <p className="text-emerald-600/70 font-bold">Manage profiles & progress</p>
          </a>
        </div>
      </div>
    </div>
  );
}