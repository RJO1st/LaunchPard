"use client";
import React from "react";
import { BookIcon, XCircleIcon } from "../ui/Icons";

export default function MistakeJournal({ mistakes, onClose }) {
  // Add a safety fallback just in case mistakes is undefined
  const safeMistakes = mistakes || [];

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[5000] flex items-center justify-center p-4 md:p-8 text-slate-900">
      <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 md:p-8 bg-rose-50 border-b border-rose-100 flex justify-between items-center text-slate-900">
          <h2 className="text-2xl font-black text-rose-600 flex items-center gap-3">
            <BookIcon /> Mistake Journal
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-rose-100 rounded-xl text-rose-400 font-bold transition-all">
            <XCircleIcon size={32} />
          </button>
        </div>
        
        {/* Scrollable List of Mistakes */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-slate-900">
          {safeMistakes.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-4">🌟</div>
              <p className="text-slate-400 font-bold italic text-lg">Your journal is clean! Keep training to reach mastery.</p>
            </div>
          ) : (
            safeMistakes.map((m, i) => (
              <div key={i} className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-sm hover:border-rose-200 transition-colors">
                <p className="font-black text-slate-800 text-lg mb-3">{m.q}</p>
                <div className="flex items-center gap-2 text-emerald-600 font-bold mb-3 bg-emerald-50 inline-block px-3 py-1 rounded-lg">
                   <span>Correct Solution: {m.correct}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <p className="text-indigo-600 font-black text-xs uppercase tracking-widest mb-1">Logic Coach</p>
                  <p className="text-slate-600 font-bold">{m.exp}</p>
                </div>
              </div>
            ))
          )}
        </div>
        
      </div>
    </div>
  );
}
