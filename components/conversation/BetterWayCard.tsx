"use client";

import { useState } from "react";
import type { BetterWay } from "@/lib/llm/schema";
import { useConversationStore } from "@/stores/conversationStore";

interface Props {
  betterWay: BetterWay;
}

export function BetterWayCard({ betterWay }: Props) {
  const [expanded, setExpanded] = useState(false);
  const level = useConversationStore((s) => s.level);
  const isJapaneseLabel = level === "advanced" || level === "expert";

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
            {isJapaneseLabel ? "もっと自然に" : "Better Way"}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[11px] text-emerald-600 hover:text-emerald-800"
        >
          {expanded ? "less ▲" : "breakdown ▼"}
        </button>
      </div>

      {/* User's attempt → improved */}
      {betterWay.user_attempt_normalized && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-gray-400 text-xs shrink-0">you wrote</span>
          <span className="text-gray-500 line-through decoration-gray-300">
            {betterWay.user_attempt_normalized}
          </span>
        </div>
      )}

      {/* Hero: the improved sentence */}
      <div className="space-y-1">
        <p className="text-[11px] text-gray-400 uppercase tracking-wide">Try this</p>
        <div className="text-xl font-bold text-emerald-900 leading-loose tracking-wide pt-3">
          {/* Render improved_tokens with furigana if available, otherwise plain text */}
          {betterWay.improved_tokens.length > 0 ? (
            <ImprovedSentence tokens={betterWay.improved_tokens} />
          ) : (
            betterWay.improved_sentence
          )}
        </div>
      </div>

      {/* Why */}
      <p className="text-sm text-emerald-800 leading-relaxed">{betterWay.why}</p>

      {/* Expandable breakdown */}
      {expanded && betterWay.breakdown.length > 0 && (
        <div className="pt-2 border-t border-emerald-200 space-y-2">
          {betterWay.breakdown.map((token, i) => {
            // Build annotation: kanji → "reading · romaji", kana-only → "romaji"
            const hasKanji = token.reading && token.reading !== token.token;
            const annotation = hasKanji
              ? [token.reading, token.romaji].filter(Boolean).join(" · ")
              : token.romaji ?? token.reading;
            return (
              <div key={i} className="flex gap-3 items-baseline">
                <div className="min-w-[72px]">
                  <span className="font-semibold text-emerald-900 text-sm">{token.token}</span>
                  {annotation && (
                    <span className="text-[10px] text-emerald-600 ml-1">({annotation})</span>
                  )}
                </div>
                <span className="text-xs text-gray-600 leading-relaxed">{token.meaning}</span>
                {token.is_above_level && (
                  <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold uppercase shrink-0">
                    above level
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ImprovedSentence({ tokens }: { tokens: BetterWay["improved_tokens"] }) {
  return (
    <span className="leading-loose">
      {tokens.map((token, i) => (
        <span key={i} className="relative inline-block">
          {token.reading && (
            <span className="absolute -top-4 left-0 right-0 text-center text-[9px] text-emerald-500 leading-none pointer-events-none select-none font-normal">
              {token.reading}
            </span>
          )}
          {token.token}
        </span>
      ))}
    </span>
  );
}
