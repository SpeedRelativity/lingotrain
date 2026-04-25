"use client";

import { useState } from "react";
import type { TurnResponse } from "@/lib/llm/schema";
import { GlossedText } from "./GlossedText";
import { useConversationStore } from "@/stores/conversationStore";

interface Props {
  response: TurnResponse;
  onReplay?: () => void;
}

export function YukiBubble({ response, onReplay }: Props) {
  const [showTranslation, setShowTranslation] = useState(false);
  const level = useConversationStore((s) => s.level);
  // Show translation by default only at beginner level
  const [autoShown] = useState(level === "beginner");
  const translationVisible = showTranslation || autoShown;

  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0 mt-1">
        Y
      </div>
      <div className="flex-1 space-y-1.5 max-w-sm">
        <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
          {/* New vocab indicator */}
          {response.meta.proactive_teach && (
            <div className="flex items-center gap-1 mb-2">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wide">
                new this turn
              </span>
            </div>
          )}

          {/* Main Japanese text with glosses */}
          <p className="text-gray-900 text-base leading-8">
            <GlossedText tokens={response.yuki.tokens} />
          </p>

          {/* Translation */}
          {translationVisible && (
            <p className="text-gray-500 text-sm mt-2 pt-2 border-t border-gray-100 leading-relaxed">
              {response.yuki.en}
            </p>
          )}
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3 pl-1">
          <button
            onClick={() => setShowTranslation((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
            title={translationVisible ? "Hide translation" : "Show translation"}
          >
            {translationVisible ? (
              <>
                <EyeOffIcon />
                <span>訳</span>
              </>
            ) : (
              <>
                <EyeIcon />
                <span>訳</span>
              </>
            )}
          </button>
          {onReplay && (
            <button
              onClick={onReplay}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
              title="Replay audio"
            >
              <ReplayIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function ReplayIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
