"use client";
import { create } from "zustand";
import type { TrayItem } from "@/lib/llm/schema";

interface TrayState {
  items: Array<TrayItem & { id: string }>;
  addItems: (items: TrayItem[]) => void;
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
