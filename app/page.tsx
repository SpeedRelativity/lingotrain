"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function startSession() {
    setLoading(true);
    try {
      const res = await fetch("/api/session/start", { method: "POST" });
      const { sessionId, userId } = await res.json();
      sessionStorage.setItem("yuki_user_id", userId);
      router.push(`/session/${sessionId}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-20 h-20 rounded-full bg-indigo-500 flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-lg">
          Y
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Yuki</h1>
          <p className="text-gray-500 mt-1">Your Japanese conversation partner</p>
        </div>
        <div className="text-sm text-gray-400 space-y-1">
          <p>N5-N4 level • です/ます form</p>
          <p>Speak naturally — Yuki will correct and guide you</p>
        </div>
        <button
          onClick={startSession}
          disabled={loading}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-lg font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow-md disabled:opacity-60"
        >
          {loading ? "Starting…" : "Start conversation"}
        </button>
      </div>
    </div>
  );
}
