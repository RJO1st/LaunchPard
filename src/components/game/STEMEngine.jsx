"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Atom, TestTube, Dna, Microscope, Activity, Camera, Calculator, FlaskConical,
  CheckCircle, XCircle, Zap, ArrowRight, Wrench, ShoppingCart, Sigma } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { generateSessionQuestions } from "../../lib/proceduralEngine";
import { normalizeQuestion, buildCompletionPayload, saveQuizResult, getSessionTimer } from "../../lib/quizUtils";
import TaraEIB, { useTaraGate } from "./TaraEIB";
import ContextPanel from "./ContextPanel";
import { EngineLoading, EngineFinished, EngineHeader, MCQOptions, FeedbackArea, getSubjectLabels } from "./QuizShell";

const XP_PER_QUESTION = 10;

const THEMES = {
  physics:       { Icon: Atom,       bg: "bg-indigo-50",  border: "border-indigo-100",  text: "text-indigo-900",  accent: "text-indigo-600",  btn: "bg-indigo-600 hover:bg-indigo-700" },
  chemistry:     { Icon: TestTube,   bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-900", accent: "text-emerald-600", btn: "bg-emerald-600 hover:bg-emerald-700" },
  biology:       { Icon: Dna,        bg: "bg-green-50",   border: "border-green-100",   text: "text-green-900",   accent: "text-green-600",   btn: "bg-green-600 hover:bg-green-700" },
  science:       { Icon: Microscope, bg: "bg-cyan-50",    border: "border-cyan-100",    text: "text-cyan-900",    accent: "text-cyan-600",    btn: "bg-cyan-600 hover:bg-cyan-700" },
  financial_accounting: { Icon: Calculator, bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-900", accent: "text-emerald-600", btn: "bg-emerald-600 hover:bg-emerald-700" },
  commerce:       { Icon: ShoppingCart, bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-900", accent: "text-amber-600", btn: "bg-amber-600 hover:bg-amber-700" },
  basic_technology: { Icon: Wrench,     bg: "bg-stone-50", border: "border-stone-100", text: "text-stone-900", accent: "text-stone-600", btn: "bg-stone-600 hover:bg-stone-700" },
  further_mathematics: { Icon: Sigma,   bg: "bg-indigo-50", border: "border-indigo-100", text: "text-indigo-900", accent: "text-indigo-600", btn: "bg-indigo-600 hover:bg-indigo-700" },
  basic_science: { Icon: FlaskConical, bg: "bg-lime-50", border: "border-lime-100", text: "text-lime-900", accent: "text-lime-600", btn: "bg-lime-600 hover:bg-lime-700" },
};
const DEFAULT_THEME = { Icon: Microscope, bg: "bg-slate-50", border: "border-slate-100", text: "text-slate-900", accent: "text-slate-600", btn: "bg-slate-600 hover:bg-slate-700" };

export default function STEMEngine({ student, subject, scenario, questions: initialQuestions, onComplete, onClose }) {
  const timerDuration = useMemo(() => getSessionTimer("stem", student), [student]);
  const labels = useMemo(() => getSubjectLabels(subject), [subject]);

  const [sessionQuestions, setSessionQuestions] = useState(initialQuestions || []);
  const [loading, setLoading] = useState(!initialQuestions?.length);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState({ score: 0, answers: [] });
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [topicSummary, setTopicSummary] = useState({});
  const [numAnswer, setNumAnswer] = useState("");
  const resultsRef = useRef({ score: 0, answers: [] }); // fix: stale-closure guard
  const [explanationText, setExplanationText] = useState("");
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [stepError, setStepError] = useState("");
  const timerRef = useRef(null);
  const { taraComplete, onFeedbackReceived, resetTara } = useTaraGate();

  const theme = THEMES[subject?.toLowerCase()] || DEFAULT_THEME;
  const SubjectIcon = theme.Icon;

  useEffect(() => {
    if (initialQuestions?.length) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const qs = await generateSessionQuestions(student, subject, "foundation", 5);
        if (!cancelled) setSessionQuestions(qs || []);
      } catch (e) { console.error("[STEM] fetch failed:", e); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [initialQuestions, student, subject]);

  const normalizedQuestions = useMemo(() => (sessionQuestions || []).map(normalizeQuestion), [sessionQuestions]);
  const currentQ = normalizedQuestions[qIdx];

  useEffect(() => {
    if (finished || !currentQ || loading) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((p) => { if (p <= 1) { clearInterval(timerRef.current); setFinished(true); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [finished, currentQ, loading]);

  const recordTopicResult = useCallback((topic, isCorrect) => {
    if (!topic) return;
    setTopicSummary((prev) => {
      const e = prev[topic] || { correct: 0, total: 0 };
      return { ...prev, [topic]: { correct: e.correct + (isCorrect ? 1 : 0), total: e.total + 1 } };
    });
  }, []);

  const handlePick = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    const isCorrect = idx === currentQ.a;
    setResults((r) => {
      const next = { ...r, score: r.score + (isCorrect ? 1 : 0), answers: [...r.answers, { q: currentQ.q, isCorrect, correct: currentQ.opts[currentQ.a], myAnswer: currentQ.opts[idx] }] };
      resultsRef.current = next;
      return next;
    });
    recordTopicResult(currentQ.topic || subject, isCorrect);
  };

  const handleNumericalSubmit = () => {
    if (!numAnswer.trim()) { setStepError("Please enter a calculated value before submitting."); return; }
    setStepError("");
    const isCorrect = Math.abs(parseFloat(numAnswer) - currentQ.a) < 0.01;
    setSelected(isCorrect ? true : false);
    setResults((r) => {
      const next = { ...r, score: r.score + (isCorrect ? 1 : 0), answers: [...r.answers, { q: currentQ.q, isCorrect, correct: String(currentQ.a), myAnswer: numAnswer }] };
      resultsRef.current = next;
      return next;
    });
    recordTopicResult(currentQ.topic || subject, isCorrect);
  };

  const finishQuest = useCallback(async () => {
    const { answers } = resultsRef.current; // read ref — avoids stale closure
    const payload = buildCompletionPayload({ answers, totalQuestions: normalizedQuestions.length, xpPerQuestion: XP_PER_QUESTION, topicSummary });
    await saveQuizResult(supabase, { studentId: student?.id, subject, questions: normalizedQuestions, answers, topicSummary, xpPerQuestion: XP_PER_QUESTION });
    onComplete?.(payload);
  }, [normalizedQuestions, topicSummary, student, subject, onComplete]);

  useEffect(() => { if (finished && timeLeft === 0) finishQuest(); }, [finished, timeLeft, finishQuest]);

  const next = () => {
    if (qIdx < normalizedQuestions.length - 1) {
      setQIdx((p) => p + 1); setSelected(null); setNumAnswer(""); setExplanationText(""); setPhotoUploaded(false); setStepError(""); resetTara();
    } else { setFinished(true); finishQuest(); }
  };

  const isAdvancedQ = currentQ?.type === "numerical_input" || currentQ?.requires_explanation;
  const isCorrectAnswer = isAdvancedQ ? selected === true : selected === currentQ?.a;
  const canProceed = isCorrectAnswer || (selected !== null && !isCorrectAnswer && taraComplete);

  if (loading || !currentQ) return <EngineLoading Icon={SubjectIcon} accent={theme.accent} title={labels.loading} subtitle="Setting up scenario." />;
  if (finished) {
    const finalScore = results.answers.filter((a) => a.isCorrect).length;
    return <EngineFinished Icon={Activity} accent={theme.accent} textColor={theme.text} btnClass={theme.btn} finalScore={finalScore} totalQuestions={normalizedQuestions.length} title={labels.finish} onClose={onClose} />;
  }

  // Dynamic scenario title — uses scenario data if available, else subject-specific
  const scenarioTitle = scenario?.title || labels.scenario;
  const scenarioContext = scenario?.context || `Review the ${subject} data and analyze the outcomes.`;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[4000] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-6xl h-[95vh] sm:h-[90vh] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border-b-4 border-slate-200">
        <EngineHeader Icon={SubjectIcon} bg={theme.bg} border={theme.border} textColor={theme.text} accent={theme.accent} btnClass={theme.btn} label={labels.header} qIdx={qIdx} totalQuestions={normalizedQuestions.length} timeLeft={timeLeft} onClose={onClose} />

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Context Anchor — stays frozen while questions change */}
          <div className="hidden md:flex md:w-[45%] flex-col overflow-hidden shrink-0" style={{ maxHeight: "calc(90vh - 56px)" }}>
            <ContextPanel
              anchor={{
                title:         scenarioTitle,
                description:   scenarioContext,
                image_url:     scenario?.image_url   || currentQ?.image_url   || null,
                latex_formulas: scenario?.formulas?.map(f => f) || currentQ?.latex_formulas || [],
                svg_content:   scenario?.svg_content || currentQ?.svg_content || null,
                data_table:    scenario?.data_table  || currentQ?.data_table  || null,
              }}
              theme={theme}
              className="flex-1"
            />
          </div>

          {/* Right: Question */}
          <div className="md:w-1/2 p-4 sm:p-6 md:p-8 overflow-y-auto bg-white flex flex-col flex-1">
            <div className="max-w-lg mx-auto w-full flex-1">
              <h3 className="text-base sm:text-xl font-black text-slate-800 mb-4 sm:mb-6">{currentQ.q}</h3>

              {!isAdvancedQ && <MCQOptions opts={currentQ.opts} correctIdx={currentQ.a} selected={selected} onPick={handlePick} />}

              {isAdvancedQ && (
                <div className="space-y-4 mb-5">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wide">Calculated Result</label>
                    <div className="flex gap-2 items-center">
                      <input type="number" disabled={selected !== null} value={numAnswer} onChange={(e) => setNumAnswer(e.target.value)} placeholder="Enter value"
                        className="flex-1 px-3 py-2.5 text-base font-mono font-bold border-2 border-slate-200 rounded-xl focus:border-slate-400 outline-none disabled:bg-slate-50" />
                      <span className="font-black text-sm text-slate-400 bg-slate-100 px-3 py-2.5 rounded-xl border-2 border-slate-100">{currentQ.units || "Units"}</span>
                    </div>
                  </div>
                  <textarea disabled={selected !== null} value={explanationText} onChange={(e) => setExplanationText(e.target.value)} placeholder="Briefly explain your method..." rows={2}
                    className="w-full px-3 py-2.5 text-sm font-bold border-2 border-slate-200 rounded-xl focus:border-slate-400 outline-none resize-none disabled:bg-slate-50" />
                  <button onClick={() => setPhotoUploaded(true)} className={`w-full p-3 rounded-xl border-2 transition-all text-sm font-bold flex items-center justify-center gap-2 ${photoUploaded ? "bg-emerald-50 border-emerald-400 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                    <Camera size={16} /> {photoUploaded ? "✓ Working Uploaded" : "Upload Scratchpad Photo"}
                  </button>
                  {stepError && <div className="p-2.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200">{stepError}</div>}
                  {selected === null && (
                    <button onClick={handleNumericalSubmit} className={`w-full text-white font-black py-3 rounded-xl text-sm shadow border-b-4 border-black/20 transition-all active:border-b-0 active:translate-y-1 flex items-center justify-center gap-2 ${theme.btn}`}>
                      <Calculator size={18} /> Submit Calculation
                    </button>
                  )}
                  {selected !== null && (
                    <div className={`p-3 rounded-xl border-2 text-sm ${isCorrectAnswer ? "bg-emerald-50 border-emerald-400" : "bg-rose-50 border-rose-400"}`}>
                      <h4 className={`font-black flex items-center gap-2 mb-1 ${isCorrectAnswer ? "text-emerald-700" : "text-rose-700"}`}>
                        {isCorrectAnswer ? <CheckCircle size={18} /> : <XCircle size={18} />}
                        {isCorrectAnswer ? "Correct!" : "Incorrect"}
                      </h4>
                      {!isCorrectAnswer && <p className="font-bold text-rose-600 text-xs">You entered: {numAnswer} {currentQ.units}</p>}
                      <p className="font-bold text-slate-800 text-xs mt-1">Answer: {currentQ.a} {currentQ.units}</p>
                    </div>
                  )}
                </div>
              )}

              {!isAdvancedQ && (
                <FeedbackArea
                  selected={selected} isCorrectAnswer={isCorrectAnswer} canProceed={canProceed}
                  currentQ={currentQ} student={student} subject={subject}
                  themeBg={theme.bg} themeBorder={theme.border} themeAccent={theme.accent}
                  taraFeedbackReceived={onFeedbackReceived}
                  onNext={next} isLast={qIdx === normalizedQuestions.length - 1}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}