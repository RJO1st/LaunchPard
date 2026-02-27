"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";

// --- INLINED ICONS ---
const TrophyIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);
const XCircleIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
);
const BrainIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.5 2A5 5 0 0 1 12 7.33A5 5 0 0 1 14.5 2"/><path d="M17 15a5 5 0 1 1-5 5"/><path d="M2 9a5 5 0 0 1 7-4.5h.5a5 5 0 0 1 4.5 7v.5a5 5 0 0 1-7 4.5H6.5a5 5 0 0 1-4.5-7Z"/><path d="M22 9a5 5 0 0 0-7-4.5h-.5a5 5 0 0 0-4.5 7v.5a5 5 0 0 0 7 4.5h.5a5 5 0 0 0 4.5-7Z"/></svg>
);
const ZapIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
);
const ArrowRightIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

// --- INLINED API HELPER ---
const fetchClaudeResponse = async (prompt, system) => {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        model: "claude-sonnet-4-20250514", 
        max_tokens: 300, 
        system, 
        messages: [{ role: "user", content: prompt }] 
      })
    });
    const data = await response.json();
    return data.content[0].text;
  } catch (err) {
    return "Sage says: That's a great effort! Explaining your thinking is the secret to becoming a master scholar. ⭐ Keep going!";
  }
};

const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

export default function App(props) {
  // If being used as a child component, we use props. If standalone, we use defaults.
  return <QuizEngine {...props} />;
}

function QuizEngine({ 
  world = "Ancient Library", 
  student = { name: "Scholar" }, 
  subject = "maths", 
  mistakes = [], 
  onComplete = () => {}, 
  onClose = () => {} 
}) {
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [eibText, setEibText] = useState("");
  const [eibFeedback, setEibFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [results, setResults] = useState({ score: 0, newMistakes: [] });
  const [finished, setFinished] = useState(false);
  
  const timerRef = useRef(null);
  const eibCache = useRef({}); 

  // Initialize questions
  useEffect(() => {
    const loadQs = async () => {
      // For the preview environment, we generate dummy questions if the generator isn't provided
      const dummyQs = [
        {
          q: "What is 12 × 11?",
          opts: ["121", "132", "144", "110"],
          a: 1,
          exp: "12 groups of 11 equals 132.",
          subject: "maths"
        },
        {
          q: "Find the odd one out: Apple, Banana, Carrot, Pear",
          opts: ["Apple", "Banana", "Carrot", "Pear"],
          a: 2,
          exp: "Carrot is a vegetable; the others are fruits.",
          subject: "verbal"
        }
      ];
      setSessionQuestions(dummyQs);
      setGenerating(false);
    };
    loadQs();
  }, []);

  const handlePick = useCallback((idx) => {
    if (selected !== null) return;
    setSelected(idx);
    
    const currQ = sessionQuestions[qIdx];
    if (!currQ) return;

    if (idx === currQ.a) {
      setResults(r => ({ ...r, score: r.score + 1 }));
    } else {
      setResults(r => ({ ...r, newMistakes: [...r.newMistakes, { q: currQ.q, correct: currQ.opts[currQ.a], exp: currQ.exp }] }));
    }
  }, [selected, qIdx, sessionQuestions]);

  const handleEIB = async () => {
    const currQ = sessionQuestions[qIdx];
    const cacheKey = `${currQ.q}-${eibText}`;
    
    if (eibCache.current[cacheKey]) {
      setEibFeedback(eibCache.current[cacheKey]);
      return;
    }

    setLoading(true);
    
    // Switch context based on age
    const examContext = student.year >= 5 ? `${student.region} 11+ exam` : `Year ${student.year} primary school`;
    const age = parseInt(student.year) + 4;

    const feedback = await fetchClaudeResponse(
      `Student ${student.name} (Year ${student.year}, ${examContext}) explained why "${currQ.opts[currQ.a]}" is correct for: "${currQ.q}". Their explanation: "${eibText}"`,
      `You are Sage, a warm encouraging tutor for a Year ${student.year} student (Age ${age}). Address the student directly by name. Give 2-3 sentences of specific, age-appropriate feedback. Keep your vocabulary simple if they are Year 1-3. Start positively, gently correct any misunderstanding, end with '⭐ Keep going!'`
    );
    
    eibCache.current[cacheKey] = feedback;
    setEibFeedback(feedback);
    setLoading(false);
  };

  const nextQuest = () => {
    if (qIdx < sessionQuestions.length - 1) {
      setQIdx(qIdx + 1);
      setSelected(null);
      setEibText("");
      setEibFeedback("");
    } else {
      setFinished(true);
    }
  };

  if (generating) {
    return (
      <div className="fixed inset-0 bg-white z-[5000] flex items-center justify-center">
        <div className="text-center">
          <BrainIcon size={48} className="text-indigo-600 animate-pulse mx-auto mb-4" />
          <p className="font-black text-slate-400 uppercase tracking-widest">Sage is preparing your quest...</p>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[5000] flex items-center justify-center p-6 text-slate-900 text-center">
        <div className="bg-white w-full max-w-md rounded-[40px] p-12 shadow-2xl border-b-8 border-indigo-200">
          <TrophyIcon size={80} className="mx-auto text-amber-400 mb-6" />
          <h2 className="text-5xl font-black mb-2">{results.score} / {sessionQuestions.length}</h2>
          <p className="font-bold text-slate-400 mb-8">Quest Completed!</p>
          <button onClick={() => onComplete(results)} className="w-full bg-indigo-600 text-white font-black py-5 rounded-3xl shadow-xl hover:bg-indigo-700 transition-all">Collect Rewards</button>
        </div>
      </div>
    );
  }

  const q = sessionQuestions[qIdx];

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[4000] flex items-center justify-center p-4 md:p-8 text-slate-900">
      <div className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border-t-8 border-indigo-500">
        <div className="p-6 md:p-12 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <span className="font-black text-indigo-500 uppercase tracking-widest text-xs md:text-sm">
              {world} • Q{qIdx + 1}
            </span>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
              <XCircleIcon size={28}/>
            </button>
          </div>

          <h3 className="text-2xl md:text-4xl font-black mb-10 leading-tight text-slate-800">{q?.q}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {q?.opts.map((opt, i) => (
              <button 
                key={i} 
                disabled={selected !== null} 
                onClick={() => handlePick(i)} 
                className={`w-full text-left p-6 rounded-2xl font-black border-2 transition-all text-lg 
                  ${selected === null ? "bg-white border-slate-200 hover:border-indigo-500" 
                  : i === q.a ? "bg-emerald-50 border-emerald-500 text-emerald-700" 
                  : selected === i ? "bg-rose-50 border-rose-500 text-rose-700" 
                  : "opacity-40 border-slate-100"}`}
              >
                {opt}
              </button>
            ))}
          </div>

          {selected !== null && (
            <div className="mt-10 space-y-6 animate-in slide-in-from-bottom-4">
              <div className="p-6 bg-indigo-50 rounded-[24px] border-l-8 border-indigo-500 flex gap-5 items-center">
                <BrainIcon size={32} className="text-indigo-500 shrink-0" />
                <p className="font-bold text-indigo-900">{q?.exp}</p>
              </div>
              
              {!eibFeedback && (
                <div className="p-6 bg-amber-50 rounded-[32px] border-2 border-amber-200">
                  <h4 className="text-amber-900 font-black text-xs uppercase mb-4 tracking-widest flex items-center gap-2">
                    <ZapIcon size={18}/> Explain It Back
                  </h4>
                  <textarea 
                    value={eibText} 
                    onChange={e => setEibText(e.target.value)} 
                    className="w-full p-5 rounded-2xl border-2 border-amber-100 font-bold mb-4 focus:outline-none focus:border-amber-400 bg-white" 
                    rows={3} 
                    placeholder="Teach Sage why the correct answer is right..." 
                  />
                  <button 
                    disabled={loading || !eibText.trim()} 
                    onClick={handleEIB} 
                    className="w-full bg-amber-500 text-white font-black py-5 rounded-2xl shadow-lg hover:bg-amber-600 transition-all disabled:opacity-50"
                  >
                    {loading ? "Sage is listening..." : "Explain it Back ✨"}
                  </button>
                </div>
              )}

              {eibFeedback && (
                <div className="p-6 bg-purple-50 rounded-[32px] border-2 border-purple-100 text-purple-700 font-bold italic shadow-sm animate-in zoom-in-95">
                  {eibFeedback}
                </div>
              )}
              
              {(selected === q?.a || eibFeedback) && (
                <button 
                  onClick={nextQuest} 
                  className="w-full bg-slate-900 text-white font-black py-6 rounded-2xl flex items-center justify-center gap-3 shadow-xl mt-6 hover:bg-black transition-all"
                >
                  {qIdx === sessionQuestions.length - 1 ? "Complete Journey" : "Next Quest"} 
                  <ArrowRightIcon size={24} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
