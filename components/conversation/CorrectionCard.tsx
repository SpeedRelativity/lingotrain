"use client";
import type { Correction } from "@/lib/llm/schema";

interface Props {
  correction: Correction;
}

export function CorrectionCard({ correction }: Props) {
  const isMajor = correction.severity === "major";

  return (
    <div className={`rounded-xl border px-4 py-3 space-y-3 ${
      isMajor ? "border-amber-200 bg-amber-50" : "border-blue-100 bg-blue-50"
    }`}>
      {/* Label */}
      <span className={`text-[10px] font-bold uppercase tracking-widest ${
        isMajor ? "text-amber-600" : "text-blue-500"
      }`}>
        {isMajor ? "correction" : "tip"}
      </span>

      {/* Hero: the corrected form */}
      <div className="space-y-1">
        <p className="text-[11px] text-gray-400 uppercase tracking-wide">Better</p>
        <p className={`text-xl font-bold tracking-wide ${
          isMajor ? "text-amber-800" : "text-blue-800"
        }`}>
          {correction.corrected}
        </p>
      </div>

      {/* What they said */}
      <div className="flex items-baseline gap-2 text-sm">
        <span className="text-gray-400 text-xs shrink-0">you said</span>
        <span className="text-gray-600 line-through decoration-red-300">{correction.user_said_raw}</span>
      </div>

      {/* Breakdown */}
      {correction.breakdown.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-gray-200">
          {correction.breakdown.map((token, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <span className="font-semibold text-gray-800 min-w-[40px]">{token.token}</span>
              <span className="text-gray-500">{token.role} — {token.note}</span>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <p className="text-xs text-gray-500 leading-relaxed">{correction.explanation_en}</p>
    </div>
  );
}
