"use client";
import React, { useState, useEffect } from "react";

// --- INLINED ICONS (Optimized for performance and accessibility) ---
const TrophyIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);

const BrainIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.5 2A5 5 0 0 1 12 7.33A5 5 0 0 1 14.5 2"/><path d="M17 15a5 5 0 1 1-5 5"/><path d="M2 9a5 5 0 0 1 7-4.5h.5a5 5 0 0 1 4.5 7v.5a5 5 0 0 1-7 4.5H6.5a5 5 0 0 1-4.5-7Z"/><path d="M22 9a5 5 0 0 0-7-4.5h-.5a5 5 0 0 0-4.5 7v.5a5 5 0 0 0 7 4.5h.5a5 5 0 0 0 4.5-7Z"/></svg>
);

const ShieldCheckIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>
);

const ZapIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
);

const StarIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);

const CheckIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 6 9 17l-5-5"/></svg>
);

const ArrowRightIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

// --- ZERO-API PROCEDURAL LOGIC (Optimized for SEO/Demo) ---
const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

const generateDemoMath = (year = 5) => {
  const a = Math.floor(Math.random() * 50) + 10;
  const b = Math.floor(Math.random() * 50) + 5;
  const ans = a + b;
  const opts = shuffle([String(ans), String(ans + 10), String(ans - 5), String(ans + 2)]);
  return { q: `Calculate: ${a} + ${b}`, opts, a: opts.indexOf(String(ans)), subject: "Maths" };
};

const generateDemoVR = () => {
  const words = [
    { start: "Rain", end: "bow", full: "Rainbow" },
    { start: "Sun", end: "flower", full: "Sunflower" },
    { start: "Foot", end: "ball", full: "Football" }
  ];
  const item = words[Math.floor(Math.random() * words.length)];
  const opts = shuffle([item.end, "drop", "light", "case"]);
  return { q: `Find the word that completes the compound word: ${item.start} + [ ? ]`, opts, a: opts.indexOf(item.end), subject: "Verbal Reasoning" };
};

export default function LandingPage() {
  const [demoQ, setDemoQ] = useState(null);
  const [demoFeedback, setDemoFeedback] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setDemoQ(generateDemoMath());
  }, []);

  const handleDemoAnswer = (idx) => {
    if (idx === demoQ.a) {
      setDemoFeedback({ success: true, text: "Excellent! That's correct. ⭐" });
    } else {
      setDemoFeedback({ success: false, text: `Not quite. The answer was ${demoQ.opts[demoQ.a]}.` });
    }
  };

  const nextDemo = () => {
    setDemoFeedback(null);
    setDemoQ(Math.random() > 0.5 ? generateDemoMath() : generateDemoVR());
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 font-sans">
      {/* --- SEO METADATA (Hidden for UI, used by crawlers) --- */}
      <h2 className="sr-only">Quest Academy: The Intelligent 11+ Learning Platform</h2>

      <nav className="fixed top-0 w-full z-[100] bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <header className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
              <TrophyIcon size={24} />
            </div>
            <span className="text-2xl font-black tracking-tight">Quest Academy</span>
          </header>
          <div className="hidden md:flex items-center gap-8 font-bold text-slate-500">
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
            <a href="/parent" className="bg-slate-100 text-slate-900 px-6 py-3 rounded-2xl hover:bg-slate-200 transition-all">Parent Dashboard</a>
            <a href="/student" className="bg-indigo-600 text-white px-8 py-3 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-0.5">Start Questing</a>
          </div>
        </div>
      </nav>

      <main id="main-content">
        <section className="pt-40 pb-20 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <article>
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full font-black text-sm mb-6 uppercase tracking-wider">
                <ZapIcon size={16} /> 2026 UK 11+ Master Platform
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] mb-8 text-slate-900">
                Building <span className="text-indigo-600">Scholars,</span><br /> Not just test-takers.
              </h1>
              <p className="text-xl text-slate-500 font-bold mb-10 max-w-xl leading-relaxed">
                Quest Academy adapts to your child's level from Year 1 to Year 6. Master GL, CEM, and CSSE with Sage, our unique AI tutor.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 font-black">
                <a href="/student" className="bg-indigo-600 text-white text-xl px-10 py-6 rounded-3xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all text-center">
                  Start Free Journey
                </a>
                <a href="#demo" className="bg-white border-4 border-slate-100 text-slate-600 text-xl px-10 py-6 rounded-3xl hover:border-indigo-500 transition-all text-center">
                  Try Live Demo
                </a>
              </div>
            </article>

            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-indigo-500/10 blur-[120px] rounded-full" />
              <div className="relative bg-white border-[16px] border-slate-100 rounded-[64px] p-8 shadow-2xl rotate-2">
                 <div className="space-y-6">
                    <div className="h-12 w-2/3 bg-slate-50 rounded-2xl" />
                    <div className="grid grid-cols-2 gap-4">
                       <div className="h-32 bg-indigo-50 rounded-3xl" />
                       <div className="h-32 bg-slate-50 rounded-3xl" />
                    </div>
                    <div className="h-20 bg-emerald-50 rounded-3xl flex items-center px-6">
                       <CheckIcon className="text-emerald-500 mr-4" />
                       <div className="h-4 w-1/2 bg-emerald-200 rounded-full" />
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="py-24 px-6 bg-slate-900 text-white rounded-[80px] mx-4 md:mx-10 my-20">
           <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                 <h2 className="text-3xl md:text-5xl font-black mb-4 italic">The Infinite Engine</h2>
                 <p className="text-indigo-300 font-bold italic">Zero repetitive questions. Infinite growth.</p>
              </div>

              <div className="bg-white rounded-[48px] p-8 md:p-16 text-slate-900 shadow-2xl relative">
                 {demoQ && (
                   <div className="animate-in">
                      <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mb-6">
                         <StarIcon size={16} /> {demoQ.subject}
                      </div>
                      <h4 className="text-3xl md:text-4xl font-black mb-10 leading-tight">{demoQ.q}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {demoQ.opts.map((opt, i) => (
                           <button 
                             key={i} 
                             onClick={() => handleDemoAnswer(i)}
                             disabled={demoFeedback !== null}
                             className={`p-6 rounded-2xl font-black border-2 transition-all text-lg text-left ${demoFeedback ? (i === demoQ.a ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "opacity-30 border-slate-100") : "bg-white border-slate-100 hover:border-indigo-500"}`}
                           >
                             {opt}
                           </button>
                         ))}
                      </div>
                      {demoFeedback && (
                        <div className="mt-8 p-6 bg-slate-100 rounded-2xl font-bold flex items-center justify-between">
                           <span>{demoFeedback.text}</span>
                           <button onClick={nextDemo} className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors">Try Next</button>
                        </div>
                      )}
                   </div>
                 )}
              </div>
           </div>
        </section>

        <section id="pricing" className="py-24 px-6 text-center">
           <div className="max-w-7xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-black mb-12">Choose Your Path</h2>
              <div className="grid md:grid-cols-2 max-w-4xl mx-auto gap-8">
                 <div className="p-10 rounded-[48px] border-4 border-slate-100 bg-white text-left">
                    <h3 className="text-2xl font-black mb-2">Free Adventurer</h3>
                    <div className="text-4xl font-black mb-6">£0 <span className="text-sm text-slate-400">/mo</span></div>
                    <ul className="space-y-4 mb-10 font-bold text-slate-500">
                       <li className="flex items-center gap-2"><CheckIcon size={18} className="text-emerald-500" /> Adaptive Maths & VR</li>
                       <li className="flex items-center gap-2"><CheckIcon size={18} className="text-emerald-500" /> Local Progress Tracking</li>
                       <li className="flex items-center gap-2 opacity-30"><CheckIcon size={18} /> No AI Feedback</li>
                    </ul>
                    <a href="/student" className="block w-full text-center py-5 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-colors">Get Started</a>
                 </div>

                 <div className="p-10 rounded-[48px] border-4 border-indigo-600 bg-indigo-50 text-left relative overflow-hidden shadow-2xl shadow-indigo-100">
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white px-6 py-2 rounded-bl-2xl font-black text-xs">BEST FOR 11+ PREP</div>
                    <h3 className="text-2xl font-black mb-2">Scholar Pro</h3>
                    <div className="text-4xl font-black mb-6">£14 <span className="text-sm text-slate-400">/mo</span></div>
                    <ul className="space-y-4 mb-10 font-bold text-slate-700">
                       <li className="flex items-center gap-2"><CheckIcon size={18} className="text-indigo-600" /> All Subjects (GL/CEM/CSSE)</li>
                       <li className="flex items-center gap-2"><CheckIcon size={18} className="text-indigo-600" /> Sage AI Logic Coaching</li>
                       <li className="flex items-center gap-2"><CheckIcon size={18} className="text-indigo-600" /> Secure Cloud Vault Storage</li>
                    </ul>
                    <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl transition-all">Join the Elite</button>
                 </div>
              </div>
           </div>
        </section>
      </main>

      <footer className="py-20 border-t border-slate-100">
         <div className="max-w-7xl mx-auto px-6 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-10">
            <div>
               <div className="text-2xl font-black mb-2">Quest Academy</div>
               <p className="text-slate-400 font-bold max-w-xs italic tracking-tight">Building scholars for the next generation.</p>
            </div>
            <div className="flex gap-10 font-bold text-slate-400">
               <a href="#" className="hover:text-indigo-600">Privacy</a>
               <a href="#" className="hover:text-indigo-600">Terms</a>
               <a href="#" className="hover:text-indigo-600">FAQ</a>
            </div>
         </div>
      </footer>
    </div>
  );
}
