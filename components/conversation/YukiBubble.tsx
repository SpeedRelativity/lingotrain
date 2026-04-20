"use client";
import { useState } from "react";
import type { TurnResponse } from "@/lib/llm/schema";

interface Props {
  response: TurnResponse;
  onReplay?: () => void;
}

export function YukiBubble({ response, onReplay }: Props) {
  const [showTranslation, setShowTranslation] = useState(false);

  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
        Y
      </div>
      <div className="flex-1 space-y-1">
        <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm max-w-sm">
          <p className="text-gray-900 text-base leading-relaxed">{response.yuki.ja}</p>
          {showTranslation && (
            <p className="text-gray-500 text-sm mt-1 border-t pt-1">{response.yuki.en}</p>
          )}
        </div>
        <div className="flex gap-3 pl-1">
          <button
            onClick={() => setShowTranslation((v) => !v)}
            className="text-xs text-indigo-500 hover:text-indigo-700"
          >
            {showTranslation ? "hide translation" : "show translation"}
          </button>
          {onReplay && (
            <button
              onClick={onReplay}
              className="text-xs text-indigo-500 hover:text-indigo-700"
            >
              replay
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
