"use client";

import { useState } from "react";
import type { GlossToken } from "@/lib/llm/schema";

interface Props {
  tokens: GlossToken[];
}

export function GlossedText({ tokens }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(i: number) {
    setOpenIndex((prev) => (prev === i ? null : i));
  }

  return (
    <span className="leading-loose">
      {tokens.map((token, i) => {
        const hasGloss = !token.known && (token.reading || token.meaning);
        const isOpen = openIndex === i;

        if (!hasGloss) {
          // Still show furigana above kanji even for "known" tokens
          if (token.reading) {
            return (
              <span key={i} className="relative inline-block mt-3">
                <span className="absolute -top-3.5 left-0 right-0 text-center text-[9px] text-gray-400 leading-none pointer-events-none select-none">
                  {token.reading}
                </span>
                <span className={token.is_new ? "text-indigo-600 font-medium" : undefined}>
                  {token.surface}
                </span>
              </span>
            );
          }
          return (
            <span key={i} className={token.is_new ? "text-indigo-600 font-medium" : undefined}>
              {token.surface}
            </span>
          );
        }

        return (
          <span key={i} className="relative inline-block">
            <button
              onClick={() => toggle(i)}
              className={`
                relative rounded px-0.5 transition-colors
                ${token.is_new
                  ? "text-indigo-600 font-semibold underline decoration-dotted decoration-indigo-400"
                  : "text-gray-900 underline decoration-dotted decoration-gray-300 hover:decoration-indigo-400"
                }
              `}
            >
              {/* Furigana above */}
              {token.reading && (
                <span className="absolute -top-3.5 left-0 right-0 text-center text-[9px] text-gray-400 leading-none pointer-events-none select-none">
                  {token.reading}
                </span>
              )}
              {token.surface}
              {token.is_new && (
                <span className="absolute -top-2 -right-1.5 w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              )}
            </button>

            {/* Gloss popover */}
            {isOpen && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 flex flex-col items-center pointer-events-none">
                <span className="bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg">
                  {token.reading && (
                    <span className="text-gray-300 mr-1">{token.reading}</span>
                  )}
                  {token.meaning && (
                    <span>{token.meaning}</span>
                  )}
                </span>
                <span className="w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
