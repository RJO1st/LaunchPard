"use client";
import React, { useState, useEffect } from "react";

// --- INLINED ICONS (Self-contained for preview environment) ---
const TrophyIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);
const BrainIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.5 2A5 5 0 0 1 12 7.33A5 5 0 0 1 14.5 2"/><path d="M17 15a5 5 0 1 1-5 5"/><path d="M2 9a5 5 0 0 1 7-4.5h.5a5 5 0 0 1 4.5 7v.5a5 5 0 0 1-7 4.5H6.5a5 5 0 0 1-4.5-7Z"/><path d="M22 9a5 5 0 0 0-7-4.5h-.5a5 5 0 0 0-4.5 7v.5a5 5 0 0 0 7 4.5h.5a5 5 0 0 0 4.5-7Z"/></svg>
);
const ZapIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
);
const ShieldCheckIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>
);
const SpeechIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);
const ArrowRightIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

export default function App() {
  const [demoQ, setDemoQ] = useState(null);
  const [demoFeedback, setDemoFeedback] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setDemoQ({ 
      q: "Find the next number in the sequence: 34, 46, 58, 70, ?", 
      opts: ["81", "82", "83", "94"], 
      a: 1, 
      exp: "The rule is to add 12 each time. (70 + 12 = 82). This tests numerical pattern recognition.",
      subject: "Maths Reasoning" 
    });
  }, []);

  const handleDemoAnswer = (idx) => {
    const isCorrect = idx === demoQ.a;
    setDemoFeedback({ 
      success: isCorrect, 
      text: isCorrect ? "Excellent! A Scholar's logic in action. ⭐" : "Mistakes are just data points for growth.",
      explanation: demoQ.exp,
      idx
    });
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 font-sans scroll-smooth">
      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 w-full z-[100] bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
              <TrophyIcon size={24} />
            </div>
            <span className="text-2xl font-black tracking-tight">Quest Academy</span>
          </a>
          <div className="hidden md:flex items-center gap-8 font-bold text-slate-500">
            <a href="#features" className="hover:text-indigo-600 transition-colors">The Edge</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it Works</a>
            <a href="/parent" className="bg-slate-100 text-slate-900 px-6 py-3 rounded-2xl hover:bg-slate-200 transition-all border border-slate-200">Parent Dashboard</a>
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
                <ZapIcon size={16} /> 2026 UK 11+ MASTERY
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] mb-8 text-slate-900 text-balance">
                Building <span className="text-indigo-600">Scholars,</span><br /> Not just test-takers.
              </h1>
              <p className="text-xl text-slate-500 font-bold mb-10 max-w-xl leading-relaxed italic">
                Worksheets are finite. Quest Academy is infinite. Experience an 11+ curriculum that adapts to your child's actual cognitive speed, from Year 1 to Year 6.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 font-black">
                <a href="/student" className="bg-indigo-600 text-white text-xl px-10 py-6 rounded-3xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all text-center">
                  Start Free Journey
                </a>
                <a href="#how-it-works" className="bg-white border-4 border-slate-100 text-slate-600 text-xl px-10 py-6 rounded-3xl hover:border-indigo-500 transition-all text-center">
                  See the Science
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
                    <div className="text-center">
                      <ZapIcon size={48} className="text-slate-200 mx-auto mb-2" />
                      <span className="text-slate-300 font-black text-xs uppercase tracking-widest italic">Infinite Engine Online</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-100">
                    <span className="font-black text-emerald-700">Reading Comprehension Unlocked</span>
                    <TrophyIcon size={20} className="text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- THE QUEST EDGE (Conviction Section) --- */}
        <section id="features" className="py-24 bg-slate-50 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-black mb-4">The Quest Edge</h2>
            <p className="text-xl text-slate-500 font-bold mb-20">Why parents are leaving traditional worksheets behind.</p>
            <div className="grid md:grid-cols-3 gap-8 text-left">
              {[
                { 
                  title: "Logic Over Memory", 
                  desc: "Sage doesn't just grade papers; she coaches logic. Our 'Explain it Back' AI targets the mental process, ensuring true understanding.", 
                  icon: <SpeechIcon size={32}/>, 
                  color: "text-purple-600", 
                  bg: "bg-purple-50" 
                },
                { 
                  title: "Infinite Question Pool", 
                  desc: "Zero repetitive questions. Our engine uses procedural generation to create unique puzzles, preventing rote memorization.", 
                  icon: <ZapIcon size={32}/>, 
                  color: "text-amber-600", 
                  bg: "bg-amber-50" 
                },
                { 
                  title: "Verified by The Vault", 
                  desc: "Secure server-side grading ensures that every earned point is authentic. No shortcuts, just pure verified scholarship.", 
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

        {/* --- HOW IT WORKS --- */}
        <section id="how-it-works" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-black mb-4">How it Works</h2>
              <p className="text-xl text-slate-500 font-bold">A proven roadmap to 11+ Gateway mastery.</p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-12 relative">
              <div className="hidden lg:block absolute top-1/3 left-0 w-full h-1 border-t-4 border-dashed border-indigo-100 -z-10" />
              {[
                { step: "1", title: "Join", desc: "Create your parent account and set up scholar profiles for your children." },
                { step: "2", title: "Explore", desc: "Scholars enter age-appropriate worlds (Meadowlands to Tower of Trials)." },
                { step: "3", title: "Conquer", desc: "Complete adaptive quests with Sage providing instant logic coaching." },
                { step: "4", title: "Master", desc: "Review mistakes in the Journal and earn the verified Scholar's Trophy." }
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

        {/* --- LIVE DEMO --- */}
        <section id="demo" className="py-24 px-6 bg-slate-900 text-white rounded-[80px] mx-4 md:mx-10 my-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black mb-4 italic tracking-tight underline decoration-indigo-500 underline-offset-8">The Engine in Action</h2>
              <p className="text-indigo-300 font-bold italic">Experience the logic coach. No account required.</p>
            </div>
            <div className="bg-white rounded-[48px] p-8 md:p-16 text-slate-900 shadow-2xl min-h-[420px]">
              {demoQ && (
                <div className="animate-in fade-in duration-500">
                  <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mb-6">
                    <ZapIcon size={16} /> {demoQ.subject}
                  </div>
                  <h4 className="text-2xl md:text-4xl font-black mb-10 leading-tight text-balance">{demoQ.q}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {demoQ.opts.map((opt, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleDemoAnswer(i)} 
                        disabled={demoFeedback !== null} 
                        className={`p-6 rounded-2xl font-black border-2 transition-all text-lg text-left ${
                          demoFeedback 
                            ? (i === demoQ.a ? "bg-emerald-50 border-emerald-500 text-emerald-700" : (demoFeedback.idx === i ? "bg-rose-50 border-rose-500 text-rose-700" : "opacity-30 border-slate-100")) 
                            : "bg-white border-slate-100 hover:border-indigo-500 hover:bg-slate-50"}`}
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
                          <p className="font-black text-indigo-900 text-sm uppercase tracking-widest">Logic Coach Insights:</p>
                          <p className="font-bold text-indigo-800 leading-relaxed italic">"{demoFeedback.explanation}"</p>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
                        <p className={`font-black text-xl ${demoFeedback.success ? "text-emerald-600" : "text-rose-600"}`}>
                          {demoFeedback.text}
                        </p>
                        <a href="/student" className="w-full md:w-auto bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2">
                          Start Official Quest <ArrowRightIcon size={20} />
                        </a>
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
            <span className="text-xl font-black tracking-tight tracking-tighter">Quest Academy</span>
          </div>
          <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Secured by Vault-Sync • UK 11+ Platforms</p>
        </div>
      </footer>
    </div>
  );
}
