"use client";
import { useState } from "react";

const CURRICULA = ["uk_11plus", "uk_national", "us_common_core", "australian", "ib_pyp", "waec"];

export default function FillPage() {
  const [logs,    setLogs]    = useState([]);
  const [running, setRunning] = useState(null);

  const fill = async (curriculum) => {
    setRunning(curriculum);
    setLogs(prev => [...prev, `▶ Starting ${curriculum}...`]);

    try {
      const res  = await fetch(`/api/batch-generate?curriculum=${curriculum}`);
      const data = await res.json();

      if (data.log) data.log.forEach(l => setLogs(prev => [...prev, l]));
      setLogs(prev => [
        ...prev,
        `✅ ${curriculum}: +${data.total} questions | ${data.totalDeficientCells} cells remaining`,
      ]);
    } catch (err) {
      setLogs(prev => [...prev, `❌ ${curriculum}: ${err.message}`]);
    }

    setRunning(null);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black mb-6">🚀 Fill Question Bank</h1>
      <p className="text-sm text-slate-500 mb-6">
        Click each curriculum to fill 8 cells. Click multiple times until the response shows 0 cells remaining.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {CURRICULA.map(c => (
          <button
            key={c}
            onClick={() => fill(c)}
            disabled={!!running}
            className="p-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-wait text-sm"
          >
            {running === c ? "⏳ Running..." : `Fill ${c}`}
          </button>
        ))}
      </div>

      {logs.length > 0 && (
        <div className="bg-slate-900 rounded-xl p-4 max-h-96 overflow-y-auto">
          {logs.map((line, i) => (
            <p key={i} className={`text-xs font-mono mb-1 ${
              line.startsWith("✅") ? "text-emerald-400" :
              line.startsWith("❌") ? "text-rose-400"    :
              line.startsWith("▶")  ? "text-indigo-400"  :
              "text-slate-300"
            }`}>{line}</p>
          ))}
        </div>
      )}

      <button
        onClick={() => setLogs([])}
        className="mt-4 text-xs text-slate-400 underline"
      >
        Clear logs
      </button>
    </div>
  );
}