"use client";
import React from "react";
import { XCircle, CheckCircle, ArrowRight, Zap } from "lucide-react";
import TaraEIB from "./TaraEIB";

// ─── SUBJECT LABEL MAP ───────────────────────────────────────────────────────
// Dynamic labels instead of "Lab Experiment" for everything
const SUBJECT_LABELS = {
  physics:       { header: "Physics Lab Station",        scenario: "Experiment Data",      loading: "Calibrating instruments...",    finish: "Lab Analysis Complete!" },
  chemistry:     { header: "Chemistry Lab Station",      scenario: "Reaction Data",        loading: "Preparing reagents...",         finish: "Lab Analysis Complete!" },
  biology:       { header: "Biology Lab Station",        scenario: "Field Observation",     loading: "Setting up microscope...",      finish: "Lab Analysis Complete!" },
  science:       { header: "Science Investigation",      scenario: "Investigation Data",    loading: "Gathering evidence...",         finish: "Investigation Complete!" },
  basic_science: { header: "Science Discovery",          scenario: "Discovery Data",        loading: "Exploring the world...",        finish: "Discovery Complete!" },
  history:       { header: "History Source Analysis",     scenario: "Primary Source",        loading: "Unearthing archives...",        finish: "Source Analysis Complete!" },
  geography:     { header: "Geography Field Study",      scenario: "Field Data",            loading: "Reading the terrain...",        finish: "Field Study Complete!" },
  social_studies:{ header: "Social Studies Investigation",scenario: "Case Study",            loading: "Reviewing evidence...",         finish: "Investigation Complete!" },
  hass:          { header: "HASS Investigation",         scenario: "Source Material",        loading: "Gathering sources...",          finish: "Investigation Complete!" },
  english:       { header: "Reading Comprehension",      scenario: "Reading Passage",        loading: "Loading passage...",            finish: "Passage Complete!" },
  financial_accounting: { header: "Financial Accounting",   scenario: "Ledger Data",        loading: "Crunching numbers...",    finish: "Accounting Complete!" },
  commerce:            { header: "Commerce Analysis",       scenario: "Market Data",        loading: "Analyzing trade...",      finish: "Commerce Complete!" },
  basic_technology:    { header: "Technology Workshop",     scenario: "Technical Data",      loading: "Setting up equipment...", finish: "Workshop Complete!" },
  further_mathematics: { header: "Further Mathematics",     scenario: "Advanced Problem",    loading: "Calculating...",          finish: "Problem Solved!" },
  economics:           { header: "Economics Study",         scenario: "Economic Indicators", loading: "Analyzing markets...",    finish: "Economic Analysis Complete!" },
  government:          { header: "Government & Politics",   scenario: "Policy Document",     loading: "Reviewing legislation...",finish: "Political Analysis Complete!" },
  business_studies:    { header: "Business Studies",        scenario: "Case Study",          loading: "Evaluating business...",  finish: "Business Analysis Complete!" },
};
export function getSubjectLabels(subject) {
  return SUBJECT_LABELS[subject?.toLowerCase()] || {
    header: `${subject} Study`, scenario: "Study Material",
    loading: "Preparing...", finish: "Complete!",
  };
}

// ─── LOADING ─────────────────────────────────────────────────────────────────
export function EngineLoading({ Icon, accent, title, subtitle }) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[5000] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] p-6 text-center max-w-xs w-full shadow-2xl">
        <Icon size={44} className={`mx-auto mb-3 animate-bounce ${accent}`} />
        <h3 className="text-lg font-black text-slate-800 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 font-bold">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── FINISHED ────────────────────────────────────────────────────────────────
export function EngineFinished({ Icon, accent, textColor, btnClass, finalScore, totalQuestions, title, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[5000] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] p-6 sm:p-8 text-center max-w-sm w-full shadow-2xl border-b-4 border-slate-200">
        <Icon size={48} className={`mx-auto mb-3 ${accent}`} />
        <h2 className={`text-xl sm:text-2xl font-black mb-2 ${textColor}`}>{title}</h2>
        <p className="text-slate-500 font-bold mb-5">You scored {finalScore} out of {totalQuestions}</p>
        <button onClick={() => onClose?.()} className={`w-full text-white font-black py-3.5 rounded-2xl text-sm shadow border-b-4 transition-all active:border-b-0 active:translate-y-1 ${btnClass} border-black/20`}>
          Return to Base
        </button>
      </div>
    </div>
  );
}

// ─── HEADER ──────────────────────────────────────────────────────────────────
export function EngineHeader({ Icon, bg, border, textColor, accent, btnClass, label, qIdx, totalQuestions, timeLeft, onClose }) {
  return (
    <div className={`h-14 px-4 sm:px-6 ${bg} border-b ${border} flex items-center justify-between shrink-0`}>
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className={`${btnClass} text-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl shrink-0`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <h2 className={`font-black leading-none uppercase tracking-wide text-xs sm:text-sm truncate ${textColor}`}>{label}</h2>
          <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${accent}`}>
            Question {qIdx + 1} of {totalQuestions}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className={`text-lg sm:text-xl font-black tabular-nums ${timeLeft < 60 ? "text-rose-500 animate-pulse" : "text-slate-700"}`}>
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
        </div>
        <button onClick={() => onClose?.()} className="text-slate-400 hover:text-rose-500 transition-colors">
          <XCircle size={24} />
        </button>
      </div>
    </div>
  );
}

// ─── MCQ OPTIONS ─────────────────────────────────────────────────────────────
export function MCQOptions({ opts, correctIdx, selected, onPick }) {
  return (
    <div className="space-y-2.5 mb-5">
      {opts.map((opt, i) => {
        const isAnswered = selected !== null;
        const isOptionCorrect = i === correctIdx;
        const isSelected = selected === i;

        let cls = "bg-white border-slate-200 hover:border-slate-400 text-slate-700";
        if (isAnswered) {
          if (isOptionCorrect) cls = "bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-100";
          else if (isSelected) cls = "bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-100";
          else cls = "bg-white border-slate-100 opacity-40 grayscale";
        }

        return (
          <button key={i} disabled={isAnswered} onClick={() => onPick(i)}
            className={`w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl font-bold border-2 transition-all text-left flex justify-between items-center text-sm sm:text-[15px] ${cls}`}>
            <span>{opt}</span>
            {isAnswered && isOptionCorrect && <CheckCircle className="text-emerald-500 shrink-0" size={18} />}
            {isAnswered && isSelected && !isOptionCorrect && <XCircle className="text-rose-500 shrink-0" size={18} />}
          </button>
        );
      })}
    </div>
  );
}

// ─── FEEDBACK + TARA + NEXT ──────────────────────────────────────────────────
export function FeedbackArea({
  selected, isCorrectAnswer, canProceed, currentQ, student, subject,
  themeBg, themeBorder, themeAccent, taraFeedbackReceived, onNext, isLast,
}) {
  if (selected === null) return null;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-5 pt-5 border-t border-slate-100">
      <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-l-4 flex gap-2.5 items-start mb-3 ${themeBg} ${themeBorder} text-slate-800`}>
        <Zap size={20} className={`shrink-0 mt-0.5 ${themeAccent}`} />
        <p className="text-xs sm:text-sm font-bold leading-relaxed">{currentQ.exp}</p>
      </div>
      {!isCorrectAnswer && (
        <TaraEIB student={student} subject={subject} currentQ={currentQ}
          correctAnswer={currentQ.opts[currentQ.a]} onFeedbackReceived={taraFeedbackReceived} />
      )}
      {canProceed && (
        <button onClick={onNext}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3 sm:py-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 text-sm sm:text-base border-b-4 border-black transition-all active:border-b-0 active:translate-y-1">
          {isLast ? "Complete" : "Next Question"} <ArrowRight size={18} />
        </button>
      )}
    </div>
  );
}