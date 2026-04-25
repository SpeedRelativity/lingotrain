"use client";

import { useEffect, useState } from "react";

interface Usage {
  groqRequests: number;
  geminiRequests: number;
  elevenlabsChars: number;
  turnCount: number;
}

// Free tier limits (approximate)
const LIMITS = {
  groqRequests: 2000,       // Groq Whisper free: ~2000 req/day
  geminiRequests: 1500,     // Gemini 2.5 Flash free: 1500 req/day
  elevenlabsChars: 500000,  // ElevenLabs Pro: 500k chars/month
};

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function UsageBar() {
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    if (!open) return;
    async function load() {
      const res = await fetch("/api/usage");
      setUsage(await res.json());
    }
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [open]);

  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <span>API usage</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-4 pb-3 space-y-2.5">
          {usage === null ? (
            <p className="text-xs text-gray-400">Loading…</p>
          ) : (
            <>
              <Row
                label="LLM (Gemini)"
                value={usage.geminiRequests}
                max={LIMITS.geminiRequests}
                unit="req/day"
                color="bg-indigo-400"
              />
              <Row
                label="STT (Groq Whisper)"
                value={usage.groqRequests}
                max={LIMITS.groqRequests}
                unit="req/day"
                color="bg-emerald-400"
              />
              <Row
                label="TTS (ElevenLabs)"
                value={usage.elevenlabsChars}
                max={LIMITS.elevenlabsChars}
                unit="chars/mo"
                color="bg-violet-400"
              />
              <p className="text-[10px] text-gray-300 pt-0.5">
                Resets on server restart · counters are session-scoped
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  max,
  unit,
  color,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const warning = pct >= 80;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-gray-500">{label}</span>
        <span className={warning ? "text-amber-500 font-medium" : "text-gray-400"}>
          {value.toLocaleString()} / {max.toLocaleString()} {unit}
        </span>
      </div>
      <Bar value={value} max={max} color={warning ? "bg-amber-400" : color} />
    </div>
  );
}
