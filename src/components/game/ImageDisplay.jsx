"use client";
/**
 * ImageDisplay.jsx
 * Deploy to: src/app/components/quiz/ImageDisplay.jsx
 *
 * Renders question diagram images from question_bank.image_url.
 * Handles loading skeleton, error fallback, and responsive sizing.
 */

import React, { useState } from "react";
import { ImageOff } from "lucide-react";

export default function ImageDisplay({ src, alt = "Question diagram", className = "" }) {
  const [loaded,  setLoaded]  = useState(false);
  const [errored, setErrored] = useState(false);

  if (!src) return null;

  if (errored) {
    return (
      <div
        className={`w-full flex items-center justify-center bg-slate-100 rounded-xl border border-slate-200 p-6 text-slate-400 ${className}`}
        style={{ minHeight: 120 }}
      >
        <div className="flex flex-col items-center gap-2">
          <ImageOff size={28} />
          <span className="text-xs font-bold">Image unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50 mb-4 ${className}`}>
      {!loaded && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse"
          style={{ minHeight: 120 }}
        >
          <div className="w-8 h-8 rounded-full border-4 border-indigo-300 border-t-indigo-600 animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={`w-full h-auto object-contain max-h-64 transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}