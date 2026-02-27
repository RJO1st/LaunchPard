"use client";
import React, { useState, useEffect } from "react";

// --- INLINED ICONS (Self-contained for the preview environment) ---
const TrophyIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);
const BrainIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.5 2A5 5 0 0 1 12 7.33A5 5 0 0 1 14.5 2"/><path d="M17 15a5 5 0 1 1-5 5"/><path d="M2 9a5 5 0 0 1 7-4.5h.5a5 5 0 0 1 4.5 7v.5a5 5 0 0 1-7 4.5H6.5a5 5 0 0 1-4.5-7Z"/><path d="M22 9a5 5 0 0 0-7-4.5h-.5a5 5 0 0 0-4.5 7v.5a5 5 0 0 0 7 4.5h.5a5 5 0 0 0 4.5-7Z"/></svg>
);
const ShieldCheckIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>
);
const ZapIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
);
const CheckCircleIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const ArrowRightIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
const SpeechIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);
const BookIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
);

// --- INLINED PROCEDURAL LOGIC (Optimized for Landing Page Demo) ---
const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

const generateDemoMath = (year = 5) => {
  const a = Math.floor(Math.random() * 12) + 1;
  const b = Math.floor(Math.random() * 12) + 1;
  const ans = a * b;
  const opts = shuffle([String(ans), String(ans + 2), String(ans - 3), String(ans + 10)]);
  return { 
    q: `What is ${a} × ${b}?`, 
    opts, 
    a: opts.indexOf(String(ans)), 
    exp: `${a} groups of ${b} equals ${ans}. Multiplication is repeated addition!`,
    subject: 'Maths' 
  };
};

const generateDemoVerbal = () => {
  const analogies = [
    { p1: ["Up", "Down"], w: "Left", a: "Right", ex: "The words are opposites." },
    { p1: ["Hand", "Glove"], w: "Foot", a: "Sock", ex: "The first item is worn on the second body part." }
  ];
  const item = analogies[Math.floor(Math.random() * analogies.length)];
  const ans = item.a;
  const wrong = shuffle(["Sky", "Home", "Tree", "Water"]).filter(w => w !== ans).slice(0, 3);
  const opts = shuffle([String(ans), ...wrong]);
  return { 
    q: `${item.p1[0]} is to ${item.p1[1]} as ${item.w} is to... ?`, 
    opts, 
    a: opts.indexOf(String(ans)), 
    exp: item.ex,
    subject: 'Verbal Reasoning' 
  };
};

export default function App() {
  const [demoQ, setDemoQ] = useState(null);
  const [demoFeedback, setDemoFeedback] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setDemoQ(generateDemoMath(5));
  }, []);

  const handleDemoAnswer = (idx) => {
    const isCorrect = idx === demoQ.a;
    setDemoFeedback({ 
      success: isCorrect, 
      text: isCorrect ? "Excellent! You have the heart of a scholar. ⭐" : "Keep going! Mastery takes practice.",
      explanation: demoQ.exp,
      idx
    });
  };

  const nextDemo = () => {
    setDemoFeedback(null);
    setDemoQ(Math.random() > 0.5 ? generateDemoMath(5) : generateDemoVerbal());
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 font-sans scroll-smooth">
      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 w-full z-[100] bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
              <TrophyIcon size={24} />
            </div>
            <span className="text-2xl font-black tracking-tight">Quest Academy</span>
          </a>
          <div className="hidden md:flex items-center gap-8 font-bold text-slate-500">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Why Quest?</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it Works</a>
            <a href="#demo" className="hover:text-indigo-600 transition-colors">Try Demo</a>
            <a href="/parent" className="bg-slate-100 text-slate-900 px-6 py-3 rounded-2xl hover:bg-slate-200 transition-all">Parent Login</a>
            <a href="/student" className="bg-indigo-600 text-white px-8 py-3 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-0.5">Enter Academy</a>
          </div>
        </div>
      </nav>

      <main>
        {/* --- HERO SECTION --- */}
        <section className="pt-40 pb-20 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <article>
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full font-black text-sm mb-6 uppercase tracking-wider">
                <ZapIcon size={16} /> THE 11+ MASTERY ODYSSEY
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] mb-8 text-slate-900">
                Building <span className="text-indigo-600">Scholars,</span><br /> Not just test-takers.
              </h1>
              <p className="text-xl text-slate-500 font-bold mb-10 max-w-xl leading-relaxed">
                Experience infinite practice and AI-powered logic coaching. We adapt to your child's level to ensure exam success and lifelong confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 font-black">
                <a href="/student" className="bg-indigo-600 text-white text-xl px-10 py-6 rounded-3xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all text-center">
                  Start Free Journey
                </a>
                <a href="#how-it-works" className="bg-white border-4 border-slate-100 text-slate-600 text-xl px-10 py-6 rounded-3xl hover:border-indigo-500 transition-all text-center">
                  Learn the Way
                </a>
              </div>
            </article>

            {/* Visual Decorative Element */}
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/10 blur-[120px] rounded-full" />
              <div className="relative bg-white border-[12px] border-slate-100 rounded-[64px] p-8 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl">
                    <BrainIcon className="text-indigo-600" />
                    <div className="h-3 w-1/2 bg-indigo-200 rounded-full" />
                  </div>
                  <div className="h-40 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex items-center justify-center">
                    <ZapIcon size={48} className="text-slate-200" />
                  </div>
                  <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-100">
                    <span className="font-black text-emerald-700 text-sm md:text-base">Mastery Achieved!</span>
                    <CheckCircleIcon className="text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- THE QUEST EDGE (DIFFERENTIATION) --- */}
        <section id="features" className="py-24 bg-slate-50 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-black mb-4">The Quest Edge</h2>
            <p className="text-xl text-slate-500 font-bold mb-20">The smarter choice for 11+ preparation.</p>
            <div className="grid md:grid-cols-3 gap-8 text-left">
              {[
                { 
                  title: "Sage AI Tutor", 
                  desc: "Real-time logic coaching that identifies logic errors immediately.", 
                  icon: <SpeechIcon size={32}/>, 
                  color: "text-purple-600", 
                  bg: "bg-purple-50" 
                },
                { 
                  title: "Infinite Engine", 
                  desc: "Trillions of unique questions generated locally to ensure infinite growth.", 
                  icon: <ZapIcon size={32}/>, 
                  color: "text-amber-600", 
                  bg: "bg-amber-50" 
                },
                { 
                  title: "The Vault", 
                  desc: "Secure server-side grading and cloud sync protects every milestone.", 
                  icon: <ShieldCheckIcon size={32}/>, 
                  color: "text-emerald-600", 
                  bg: "bg-emerald-50" 
                }
              ].map((f, i) => (
                <div key={i} className="bg-white p-10 rounded-[40px] border-b-8 border-slate-200 hover:border-indigo-500 transition-all group shadow-sm">
                  <div className={`${f.bg} ${f.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                    {f.icon}
                  </div>
                  <h3 className="text-2xl font-black mb-4">{f.title}</h3>
                  <p className="text-slate-500 font-bold leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- HOW IT WORKS (FOUR SIMPLE STEPS) --- */}
        <section id="how-it-works" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-black mb-4">How it Works</h2>
              <p className="text-xl text-slate-500 font-bold">Four simple steps to 11+ mastery.</p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-12 relative">
              <div className="hidden lg:block absolute top-1/3 left-0 w-full h-1 border-t-4 border-dashed border-indigo-100 -z-10" />
              {[
                { step: "1", title: "Join", desc: "Create your scholar profiles.", icon: <ZapIcon /> },
                { step: "2", title: "Select World", desc: "Enter age-appropriate worlds.", icon: <BookIcon /> },
                { step: "3", title: "Conquer", desc: "Adaptive tasks with Sage's guidance.", icon: <BrainIcon /> },
                { step: "4", title: "Master", desc: "Clear journals and earn trophies.", icon: <TrophyIcon /> }
              ].map((s, i) => (
                <div key={i} className="text-center group">
                  <div className="w-20 h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-8 text-3xl font-black shadow-xl ring-8 ring-white group-hover:scale-110 transition-transform">
                    {s.step}
                  </div>
                  <h3 className="text-2xl font-black mb-3">{s.title}</h3>
                  <p className="text-slate-500 font-bold leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- LIVE DEMO (WITH EXPLANATIONS) --- */}
        <section id="demo" className="py-24 px-6 bg-slate-900 text-white rounded-[80px] mx-4 md:mx-10 my-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black mb-4 italic">Try the Engine</h2>
              <p className="text-indigo-300 font-bold italic">Experience instant logic coaching with zero API overhead.</p>
            </div>
            <div className="bg-white rounded-[48px] p-8 md:p-16 text-slate-900 shadow-2xl min-h-[400px]">
              {demoQ && (
                <div className="animate-in fade-in duration-500">
                  <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mb-6">
                    <ZapIcon size={16} /> {demoQ.subject}
                  </div>
                  <h4 className="text-2xl md:text-4xl font-black mb-10 leading-tight">{demoQ.q}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {demoQ.opts.map((opt, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleDemoAnswer(i)} 
                        disabled={demoFeedback !== null} 
                        className={`p-6 rounded-2xl font-black border-2 transition-all text-lg text-left ${
                          demoFeedback 
                            ? (i === demoQ.a ? "bg-emerald-50 border-emerald-500 text-emerald-700" : (demoFeedback.idx === i ? "bg-rose-50 border-rose-500 text-rose-700" : "opacity-30 border-slate-100")) 
                            : "bg-white border-slate-100 hover:border-indigo-500"}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {demoFeedback && (
                    <div className="mt-8 space-y-6 animate-in slide-in-from-bottom-4">
                      <div className="p-6 bg-indigo-50 rounded-[24px] border-l-8 border-indigo-500 flex gap-5 items-center">
                        <BrainIcon size={32} className="text-indigo-500 shrink-0" />
                        <div className="space-y-1">
                          <p className="font-black text-indigo-900">Sage's Wisdom:</p>
                          <p className="font-bold text-indigo-800 leading-relaxed">{demoFeedback.explanation}</p>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
                        <p className={`font-black text-xl ${demoFeedback.success ? "text-emerald-600" : "text-rose-600"}`}>
                          {demoFeedback.text}
                        </p>
                        <button onClick={nextDemo} className="w-full md:w-auto bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2">
                          Next Practice Quest <ArrowRightIcon size={20} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-20 border-t border-slate-100 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <TrophyIcon size={20} />
            </div>
            <span className="text-xl font-black tracking-tight">Quest Academy</span>
          </div>
          <p className="text-slate-300 font-bold text-sm">© 2026 Quest Academy Learning Platforms. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
