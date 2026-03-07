"use client";
/**
 * TaraEIB.jsx
 * Deploy to: src/app/components/game/TaraEIB.jsx
 *
 * Tara's "Explain It Back" challenge — shown after a wrong answer.
 * Scholar must articulate why the correct answer is right before proceeding.
 *
 * Exports:
 *   default  TaraEIB    — the challenge widget
 *   named    useTaraGate — hook to track whether the challenge is complete
 */

import React, { useState, useCallback } from "react";
import { Zap } from "lucide-react";

// ─── LOCAL FALLBACK FEEDBACK ─────────────────────────────────────────────────
// Used when /api/tara is unavailable or times out (6 s)
const LOCAL_FEEDBACK = (text, subject, scholarName, scholarYear) => {
  const name   = scholarName || "Cadet";
  const lower  = (text || "").toLowerCase();
  const minLen = scholarYear <= 2 ? 5 : scholarYear <= 4 ? 10 : 15;

  if ((text || "").trim().length < minLen) {
    return scholarYear <= 2
      ? `Tara: Good try, ${name}! Can you add one more word to explain? 🌟`
      : `Tara: Copy that, ${name}. Can you explain *why* that answer is correct? 🤔`;
  }

  const keywords = {
    maths:      ["add","total","units","tens","carry","subtract","equals","because","calculate","divide","multiply","fraction","percent","factor","multiple","prime","square","ratio"],
    english:    ["verb","noun","adjective","adverb","action","describes","word","sentence","because","grammar","clause","prefix","suffix","tense","metaphor","simile","synonym","antonym"],
    verbal:     ["pattern","sequence","opposite","similar","letter","next","because","odd","order","skip","code","analogy","alphabet","relationship","category"],
    nvr:        ["shape","pattern","colour","color","rotate","flip","size","odd","different","same","repeat","mirror","reflect","symmetr","transform"],
    science:    ["element","atom","force","energy","gravity","cell","organism","reaction","compound","velocity","mass","current","photosynthesis","friction","pressure","density"],
    physics:    ["force","energy","gravity","velocity","mass","acceleration","newton","joule","watt","circuit","voltage","current","wave","frequency","pressure"],
    chemistry:  ["element","atom","molecule","reaction","compound","mixture","oxidation","acid","base","bond","electron","proton","neutron","dissolve"],
    biology:    ["cell","organism","photosynthesis","evolution","habitat","ecosystem","dna","gene","respiration","nutrient","organ","tissue","enzyme","species"],
    geography:  ["climate","region","population","migration","erosion","continent","latitude","longitude","urban","rural","river","mountain","economic","sustainable"],
    history:    ["century","decade","era","empire","revolution","conflict","treaty","evidence","source","cause","consequence","change","chronology","significant"],
    economics:  ["supply","demand","price","market","cost","profit","trade","gdp","inflation","tax","budget","goods","services","capital"],
    government: ["law","constitution","government","democracy","election","parliament","policy","rights","citizen","sovereignty"],
  };

  const subKey = (subject in keywords) ? subject
    : subject === 'basic_science' ? 'science'
    : subject === 'social_studies' || subject === 'hass' ? 'geography'
    : subject === 'business_studies' || subject === 'commerce' || subject === 'financial_accounting' ? 'economics'
    : subject === 'basic_technology' ? 'science'
    : 'maths';

  const hasKeyword = keywords[subKey]?.some(k => lower.includes(k));

  const positives = {
    maths:      [`Tara: Affirmative, ${name}! That's Commander-level reasoning! 🚀`, `Tara: Excellent step-by-step thinking, ${name}! 🏆`],
    english:    [`Tara: Spot on, ${name}! Explaining *why* shows real understanding! 🌟`, `Tara: Roger that, ${name}! You identified the rule correctly! 📡`],
    verbal:     [`Tara: Superb, ${name}! You spotted the pattern! 🔍`, `Tara: Brilliant decoding, ${name}! 🧩`],
    nvr:        [`Tara: Excellent, ${name}! Describing what changes is the strategy! 👁️`, `Tara: Target acquired, ${name}! 🌟`],
    science:    [`Tara: Outstanding scientific thinking, ${name}! 🔬`, `Tara: Excellent — evidence-based reasoning is key! ⚗️`],
    physics:    [`Tara: Perfect, ${name}! You applied the physical law correctly! ⚡`, `Tara: Excellent, ${name}! Textbook physics! 🔭`],
    chemistry:  [`Tara: Brilliant, ${name}! You grasped the chemical process! 🧪`, `Tara: Perfect — that's exactly how chemists explain it! ⚗️`],
    biology:    [`Tara: Excellent, ${name}! You understood the biological process! 🌿`, `Tara: Brilliant, ${name}! Biologist-level reasoning! 🔬`],
    geography:  [`Tara: Great geographical analysis, ${name}! 🌍`, `Tara: Excellent — you connected the factors perfectly! 🗺️`],
    history:    [`Tara: Impressive historical thinking, ${name}! Cause and consequence is key! 📜`, `Tara: Historian-level reasoning, ${name}! 🏛️`],
    economics:  [`Tara: Great economic reasoning, ${name}! 📊`, `Tara: Perfect — you understood the market forces! 💡`],
    government: [`Tara: Excellent civic reasoning, ${name}! 🏛️`, `Tara: Great — you grasped the political concept! 🌐`],
  };

  const nudges = {
    maths:      `Tara: Good effort, ${name}! Describe the *steps* — check units, operations, or rounding. 💪`,
    english:    `Tara: Good effort, ${name}! Try naming the *type* of word or literary technique. Almost there!`,
    verbal:     `Tara: Good thinking, ${name}! Describe the *rule* — are letters skipping? Are words opposites? 🔎`,
    nvr:        `Tara: Nice work, ${name}! Describe *what changes* — shape, size, colour, or position. 🎨`,
    science:    `Tara: Good effort, ${name}! Try using scientific terms — name the process, force, or reaction. 🔬`,
    physics:    `Tara: Good attempt! Try mentioning the physical law or formula involved. ⚡`,
    chemistry:  `Tara: Good try, ${name}! Name the chemical process or type of reaction. 🧪`,
    biology:    `Tara: Good effort, ${name}! Try naming the biological process or organism involved. 🌿`,
    geography:  `Tara: Almost, ${name}! Think about location, patterns, or human/physical geography terms. 🌍`,
    history:    `Tara: Good thinking! Try mentioning specific evidence or cause-and-effect. 📜`,
    economics:  `Tara: Almost, ${name}! Try using terms like supply, demand, cost, or market. 📊`,
    government: `Tara: Good attempt! Try using terms like rights, democracy, law, or policy. 🏛️`,
  };

  const posArr = positives[subKey] || positives.maths;
  if (hasKeyword) return posArr[Math.floor(Math.random() * posArr.length)];
  return nudges[subKey] || nudges.maths;
};

// ─── TARA EIB COMPONENT ───────────────────────────────────────────────────────
export default function TaraEIB({ student, subject, currentQ, correctAnswer, onFeedbackReceived }) {
  const [text,     setText]     = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [locked,   setLocked]   = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || locked) return;
    setLoading(true);

    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch("/api/tara", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        signal:  controller.signal,
        body:    JSON.stringify({
          text, subject, correctAnswer,
          scholarName: student?.name,
          scholarYear: parseInt(student?.year_level || student?.year || 4),
          question: currentQ,
        }),
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.feedback) throw new Error("Empty feedback");
      setFeedback(data.feedback);
    } catch {
      clearTimeout(timeout);
      setFeedback(
        LOCAL_FEEDBACK(text, subject, student?.name, parseInt(student?.year_level || student?.year || 4))
      );
    } finally {
      setLoading(false);
      setLocked(true);
      onFeedbackReceived?.();
    }
  }, [text, locked, subject, correctAnswer, currentQ, student, onFeedbackReceived]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !locked) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-amber-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-200 mb-3">
      <p className="text-amber-800 font-bold text-xs sm:text-sm mb-2 sm:mb-3">
        <span className="font-black">Tara's Challenge:</span> Why is{" "}
        <span className="underline font-black">{correctAnswer}</span> the correct answer?
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={locked}
        rows={2}
        placeholder="Type your reasoning and press Enter…"
        className="w-full p-2 sm:p-3 rounded-lg sm:rounded-xl border border-amber-200 font-bold text-xs sm:text-sm bg-white mb-2 resize-none focus:outline-none focus:border-amber-400 disabled:opacity-60"
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || loading || locked}
        className="w-full bg-amber-500 text-white font-black py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs uppercase tracking-widest border-b-2 border-amber-700 disabled:opacity-50 flex items-center justify-center gap-1 transition-all active:border-b-0 active:translate-y-0.5"
      >
        <Zap size={12} /> {loading ? "Thinking…" : "Tell Tara ✨"}
      </button>
      {feedback && (
        <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl border border-amber-100 text-amber-900 font-bold italic text-xs sm:text-sm leading-relaxed">
          {feedback}
        </div>
      )}
    </div>
  );
}

// ─── useTaraGate ──────────────────────────────────────────────────────────────
/**
 * Tracks whether TaraEIB's challenge has been completed.
 *
 * Usage:
 *   const { taraComplete, onFeedbackReceived, resetTara } = useTaraGate();
 *   <TaraEIB ... onFeedbackReceived={onFeedbackReceived} />
 *   const canProceed = isCorrect || (selected !== null && !isCorrect && taraComplete);
 *   // call resetTara() when moving to next question
 */
export function useTaraGate() {
  const [taraComplete, setTaraComplete] = useState(false);
  const onFeedbackReceived = useCallback(() => setTaraComplete(true), []);
  const resetTara          = useCallback(() => setTaraComplete(false), []);
  return { taraComplete, onFeedbackReceived, resetTara };
}