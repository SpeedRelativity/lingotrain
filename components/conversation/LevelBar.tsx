"use client";

import { LEVELS, type Level } from "@/lib/llm/schema";
import { useConversationStore } from "@/stores/conversationStore";

const LEVEL_LABELS: Record<Level, string> = {
  beginner: "Beginner",
  easy: "Easy",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

// cool → warm gradient across tiers
const LEVEL_COLORS: Record<Level, { active: string; text: string }> = {
  beginner:     { active: "bg-sky-500",    text: "text-sky-700" },
  easy:         { active: "bg-teal-500",   text: "text-teal-700" },
  intermediate: { active: "bg-indigo-500", text: "text-indigo-700" },
  advanced:     { active: "bg-violet-500", text: "text-violet-700" },
  expert:       { active: "bg-rose-500",   text: "text-rose-700" },
};

export function LevelBar() {
  const { level, setLevel } = useConversationStore();

  return (
    <div className="px-4 py-2 bg-white border-b border-gray-100">
      <div className="flex rounded-lg overflow-hidden border border-gray-200 divide-x divide-gray-200">
        {LEVELS.map((l) => {
          const isActive = l === level;
          const colors = LEVEL_COLORS[l];
          return (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`
                flex-1 py-1.5 text-[11px] font-medium transition-all duration-150
                ${isActive
                  ? `${colors.active} text-white`
                  : "bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                }
              `}
            >
              {LEVEL_LABELS[l]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
