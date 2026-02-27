"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRightIcon, UserPlusIcon, StarIcon } from "../../components/ui/Icons";

const STORAGE_KEY = "quest_academy_pro_v9";

export default function ParentDashboardPage() {
  const [db, setDb] = useState({ students: [] });
  const [mounted, setMounted] = useState(false);
  
  const [data, setData] = useState({ name: "", year: "4", region: "GL" });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { 
      try {
        const parsed = JSON.parse(saved);
        setDb(parsed);
        if(parsed.students.length === 0) setShowForm(true);
      } catch(e) {}
    } else {
        setShowForm(true);
    }
  }, []);

  const saveDb = (newDb) => {
    setDb(newDb);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDb));
  };

  const handleAddStudent = (e) => {
    e.preventDefault();
    const newStudent = { 
      ...data, 
      id: Math.random().toString(36).substring(2, 9),
      year: parseInt(data.year),
      prog: { xp: 0, mistakes: [], completedQuestions: 0, proficiency: 50 }
    };
    saveDb({ ...db, students: [...(db.students || []), newStudent] });
    setData({ name: "", year: "4", region: "GL" });
    setShowForm(false);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 animate-in fade-in">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-black mb-8 transition-colors">
            <ArrowRightIcon className="rotate-180" size={20} /> Back to Gateway
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">Parent Portal</h1>
            <p className="text-slate-500 font-bold">Manage your scholars and track their odyssey.</p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all">
                <UserPlusIcon size={20}/> Add Scholar
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-xl border-2 border-indigo-100 mb-10">
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3"><UserPlusIcon className="text-indigo-500"/> Register New Scholar</h2>
            <form onSubmit={handleAddStudent} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-black text-slate-500 mb-2 uppercase tracking-wider">Scholar Name</label>
                  <input required placeholder="First Name" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black focus:border-indigo-500 outline-none transition-all" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-500 mb-2 uppercase tracking-wider">School Year</label>
                  <select className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black cursor-pointer focus:border-indigo-500 transition-all" value={data.year} onChange={e => setData({ ...data, year: e.target.value })}>
                    {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-500 mb-2 uppercase tracking-wider">Target Exam</label>
                  <select className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black cursor-pointer focus:border-indigo-500 transition-all" value={data.region} onChange={e => setData({ ...data, region: e.target.value })}>
                    <option value="GL">GL Assessment</option>
                    <option value="CEM">CEM (Cambridge)</option>
                    <option value="CSSE">Essex (CSSE)</option>
                    <option value="LONDON">London Boroughs</option>
                    <option value="SEAG">Northern Ireland (SEAG)</option>
                    <option value="ISEB">ISEB Common Pre-Test</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="bg-indigo-600 text-white font-black px-8 py-4 rounded-xl shadow-lg hover:bg-indigo-700 transition-all">Create Profile</button>
                {db.students.length > 0 && <button type="button" onClick={() => setShowForm(false)} className="bg-slate-100 text-slate-600 font-black px-8 py-4 rounded-xl hover:bg-slate-200 transition-all">Cancel</button>}
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {db.students.map(s => (
            <div key={s.id} className="bg-white rounded-[32px] p-8 border-2 border-slate-100 shadow-sm hover:shadow-md transition-all">
               <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-3xl mb-6">{s.name[0]}</div>
               <h3 className="text-2xl font-black text-slate-800 mb-1">{s.name}</h3>
               <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mb-6">Year {s.year} • {s.region}</p>
               
               <div className="space-y-4 pt-4 border-t-2 border-slate-50">
                 <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Experience</span>
                    <span className="font-black text-amber-500 flex items-center gap-1"><StarIcon size={16}/> {s.prog.xp} XP</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Questions</span>
                    <span className="font-black text-emerald-500">{s.prog.completedQuestions}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Proficiency</span>
                    <span className="font-black text-indigo-500">{s.prog.proficiency}%</span>
                 </div>
               </div>
            </div>
          ))}
          {!showForm && db.students.length === 0 && (
             <div className="col-span-full text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-black text-xl mb-4">No scholars registered yet.</p>
                <button onClick={() => setShowForm(true)} className="text-indigo-600 font-bold hover:underline">Add your first scholar</button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}