"use client";
import type { Correction } from "@/lib/llm/schema";

interface Props {
  correction: Correction;
}

export function CorrectionCard({ correction }: Props) {
  const isMajor = correction.severity === "major";

  return (
    <div
      className={`rounded-xl border px-4 py-3 space-y-2 ${
        isMajor
          ? "border-amber-300 bg-amber-50"
          : "border-blue-200 bg-blue-50"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`text-xs font-semibold uppercase tracking-wide ${
            isMajor ? "text-amber-700" : "text-blue-600"
          }`}
        >
          {isMajor ? "correction" : "tip"}
        </span>
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex gap-2">
          <span className="text-gray-400 w-16 shrink-0">You said:</span>
          <span className="text-gray-700">{correction.user_said_raw}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-400 w-16 shrink-0">Better:</span>
          <span className="text-gray-900 font-medium">{correction.corrected}</span>
        </div>
      </div>

      {correction.breakdown.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-gray-200">
          {correction.breakdown.map((token, i) => (
            <div key={i} className="text-xs text-gray-600 flex gap-2">
              <span className="font-medium text-gray-800 w-12 shrink-0">
                {token.token}
              </span>
              <span className="text-gray-500">{token.role} — {token.note}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-600 pt-1">{correction.explanation_en}</p>
    </div>
  );
}
