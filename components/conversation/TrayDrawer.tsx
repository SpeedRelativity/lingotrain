"use client";
import { useTrayStore } from "@/stores/trayStore";

const TYPE_LABEL: Record<string, string> = {
  vocab: "vocab",
  grammar: "grammar",
  particle: "particle",
  expression: "phrase",
};

const TYPE_COLOR: Record<string, string> = {
  vocab: "bg-emerald-100 text-emerald-800",
  grammar: "bg-purple-100 text-purple-800",
  particle: "bg-orange-100 text-orange-800",
  expression: "bg-sky-100 text-sky-800",
};

export function TrayDrawer() {
  const items = useTrayStore((s) => s.items);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="px-4 py-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Session tray
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 min-w-[100px] max-w-[160px]"
            >
              <span
                className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                  TYPE_COLOR[item.type] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {TYPE_LABEL[item.type] ?? item.type}
              </span>
              <p className="text-sm font-medium text-gray-900 mt-1">{item.jp}</p>
              {item.reading && (
                <p className="text-xs text-gray-500">{item.reading}</p>
              )}
              <p className="text-xs text-gray-600 truncate">{item.en}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
