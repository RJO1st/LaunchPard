"use client";
import React from "react";
import { BookIcon, XCircleIcon } from "../ui/Icons";

export default function MistakeJournal({ mistakes, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[5000] flex items-center justify-center p-4 md:p-8 text-slate-900">
      <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 md:p-8 bg-rose-50 border-b border-rose-100 flex justify-between items-center text-slate-900">
          <h2 className="text-2xl font-black text-rose-600 flex items-center gap-3"><BookIcon /> Mistake Journal</h2>
          <button onClick={onClose} className="p-2 hover:bg-rose-100 rounded-xl text-rose-400 font-bold transition-all"><XCircleIcon size={32} /></button>
        </div>
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-slate-900">
          {mistakes.length === 0 ? (
            <p className="text-center text-slate-400 font-bold py-10 italic">Your journal is clean! Keep training to reach mastery.</p>
          ) : (
            mistakes.map((m, i) => (
              <div key={i} className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100">
                <p className="font-black text-slate-800 mb-2">{m.q}</p>
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-2">
                   <span>Correct Solution: {m.correct}</span>
                </div>
                <p className="text-slate-500 text-sm font-bold">Logic: {m.exp}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
