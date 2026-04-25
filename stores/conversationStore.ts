"use client";
import { create } from "zustand";
import type { TurnResponse, Level } from "@/lib/llm/schema";

export type ConversationTurn =
  | { role: "yuki"; response: TurnResponse; id: string }
  | { role: "user"; text: string; id: string };

type UIMode = "idle" | "recording" | "processing" | "paused" | "speaking";

interface ConversationState {
  sessionId: string | null;
  userId: string | null;
  turns: ConversationTurn[];
  mode: UIMode;
  turnIndex: number;
  latestResponse: TurnResponse | null;
  level: Level;

  setSession: (sessionId: string, userId: string) => void;
  setLevel: (level: Level) => void;
  addUserTurn: (text: string) => void;
  addYukiTurn: (response: TurnResponse) => void;
  setMode: (mode: UIMode) => void;
  reset: () => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  sessionId: null,
  userId: null,
  turns: [],
  mode: "idle",
  turnIndex: 0,
  latestResponse: null,
  level: "beginner",

  setSession: (sessionId, userId) => set({ sessionId, userId }),
  setLevel: (level) => set({ level }),

  addUserTurn: (text) =>
    set((s) => ({
      turns: [...s.turns, { role: "user", text, id: crypto.randomUUID() }],
      turnIndex: s.turnIndex + 1,
    })),

  addYukiTurn: (response) =>
    set((s) => ({
      turns: [...s.turns, { role: "yuki", response, id: crypto.randomUUID() }],
      latestResponse: response,
      turnIndex: s.turnIndex + 1,
    })),

  setMode: (mode) => set({ mode }),

  reset: () =>
    set({
      sessionId: null,
      userId: null,
      turns: [],
      mode: "idle",
      turnIndex: 0,
      latestResponse: null,
    }),
}));
