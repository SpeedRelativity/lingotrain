"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { TrayItem } from "@/lib/llm/schema";

const TYPE_COLOR: Record<string, string> = {
  vocab: "bg-emerald-100 text-emerald-800",
  grammar: "bg-purple-100 text-purple-800",
  particle: "bg-orange-100 text-orange-800",
  expression: "bg-sky-100 text-sky-800",
};

export default function SummaryPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [trayItems, setTrayItems] = useState<(TrayItem & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/session/summary?sessionId=${sessionId}`);
      const data = await res.json();
      setTrayItems(data.trayItems ?? []);
      setLoading(false);
    }
    load();
  }, [sessionId]);

  const grouped = trayItems.reduce(
    (acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    },
    {} as Record<string, typeof trayItems>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 max-w-lg mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session complete</h1>
          <p className="text-gray-500 text-sm mt-1">Here's what you collected today.</p>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading…</p>
        ) : trayItems.length === 0 ? (
          <p className="text-gray-500">Nothing collected — just conversation practice today.</p>
        ) : (
          Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {type}
              </h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-gray-200 px-4 py-3 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-medium text-gray-900">{item.jp}</span>
                      {item.reading && (
                        <span className="text-sm text-gray-400">({item.reading})</span>
                      )}
                      <span
                        className={`ml-auto text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                          TYPE_COLOR[item.type] ?? ""
                        }`}
                      >
                        {item.source === "user_error"
                          ? "from your error"
                          : item.source === "user_unknown"
                          ? "you didn't know"
                          : "new from Yuki"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{item.en}</p>
                    {item.example_sentence && (
                      <div className="pt-1 border-t border-gray-100 text-xs text-gray-500 space-y-0.5">
                        <p>{item.example_sentence.jp}</p>
                        <p>{item.example_sentence.en}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        <button
          onClick={() => router.push("/")}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          Start another session
        </button>
      </div>
    </div>
  );
}
