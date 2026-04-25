"use client";
import { create } from "zustand";
import type { TrayItem } from "@/lib/llm/schema";

export type TrayItemWithMeta = TrayItem & { id: string; turn_index?: number };

interface TrayState {
  items: TrayItemWithMeta[];
  addItems: (items: Array<TrayItem & { turn_index?: number }>) => void;
  clear: () => void;
}

export const useTrayStore = create<TrayState>((set) => ({
  items: [],

  addItems: (newItems) =>
    set((s) => ({
      items: [
        ...s.items,
        ...newItems.map((item) => ({ ...item, id: crypto.randomUUID() })),
      ],
    })),

  clear: () => set({ items: [] }),
}));
