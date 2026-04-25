"use client";

import { useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useConversationStore } from "@/stores/conversationStore";
import { useTrayStore } from "@/stores/trayStore";
import { YukiBubble } from "@/components/conversation/YukiBubble";
import { UserBubble } from "@/components/conversation/UserBubble";
import { CorrectionCard } from "@/components/conversation/CorrectionCard";
import { MicButton } from "@/components/conversation/MicButton";
import { ContinueButton } from "@/components/conversation/ContinueButton";
import { TrayDrawer } from "@/components/conversation/TrayDrawer";
import { LevelBar } from "@/components/conversation/LevelBar";
import { UsageBar } from "@/components/conversation/UsageBar";
import { BetterWayCard } from "@/components/conversation/BetterWayCard";

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const { userId, turns, mode, turnIndex, level, latestResponse, setMode, addUserTurn, addYukiTurn, setSession } =
    useConversationStore();
  const { addItems, clear } = useTrayStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const turnRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const dbTurnIndexRef = useRef(0);
  const openerFiredRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize session
  useEffect(() => {
    if (openerFiredRef.current) return;
    openerFiredRef.current = true;
    const storedUserId = sessionStorage.getItem("yuki_user_id");
    if (!storedUserId) {
      router.replace("/");
      return;
    }
    setSession(sessionId, storedUserId);
    clear();
    sendTurn(sessionId, storedUserId, "", 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Auto-scroll to bottom on new turns
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  // Idle nudge: if user hasn't responded within 20s after mode goes idle, Yuki prompts
  useEffect(() => {
    if (mode === "idle" && turns.length > 0) {
      idleTimerRef.current = setTimeout(() => {
        const storedUserId = sessionStorage.getItem("yuki_user_id");
        if (storedUserId && mode === "idle") {
          sendTurn(sessionId, storedUserId, "[IDLE_NUDGE]", dbTurnIndexRef.current);
        }
      }, 20000);
    }
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, turns.length]);

  const playAudio = useCallback(async (text: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setMode("speaking");
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`speak ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); setMode("paused"); };
      audio.onerror = () => { URL.revokeObjectURL(url); setMode("paused"); };
      await audio.play();
    } catch {
      setMode("paused");
    }
  }, [setMode]);

  async function sendTurn(sid: string, uid: string, userText: string, index: number) {
    setMode("processing");
    try {
      const res = await fetch("/api/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, userId: uid, userText, turnIndex: index, level }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `turn ${res.status}`);
      }
      const response = await res.json();
      addYukiTurn(response);
      if (response.tray_items?.length > 0) {
        // Attach the current turn index so tray cards can scroll back
        const withIndex = response.tray_items.map((item: object) => ({
          ...item,
          turn_index: dbTurnIndexRef.current,
        }));
        addItems(withIndex);
      }
      dbTurnIndexRef.current = index + (userText && userText !== "[IDLE_NUDGE]" ? 2 : 1);
      await playAudio(response.yuki.ja);
    } catch (e) {
      console.error("[sendTurn]", e);
      setMode("idle");
    }
  }

  async function startRecording() {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setMode("recording");
    } catch {
      alert("Microphone access denied. Please allow microphone access and try again.");
    }
  }

  async function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    recorder.stop();
    recorder.stream.getTracks().forEach((t) => t.stop());
    setMode("processing");

    await new Promise<void>((res) => { recorder.onstop = () => res(); });

    const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", blob);

    try {
      const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: formData });
      if (!transcribeRes.ok) throw new Error(`transcribe ${transcribeRes.status}`);
      const { text } = await transcribeRes.json();

      if (!text?.trim()) { setMode("idle"); return; }

      addUserTurn(text);
      const currentIndex = dbTurnIndexRef.current;
      await sendTurn(sessionId, userId!, text, currentIndex);
    } catch (e) {
      console.error("[stopRecording]", e);
      setMode("idle");
    }
  }

  function handleScrollToTurn(turnIdx: number) {
    turnRefs.current[turnIdx]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleEndSession() {
    const topic = latestResponse?.meta.topic ?? "conversation";
    await fetch("/api/session/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, topic, turnCount: turnIndex }),
    });
    router.push(`/session/${sessionId}/summary`);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
              Y
            </div>
            <span className="font-semibold text-gray-900">Yuki</span>
          </div>
          <button onClick={handleEndSession} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            End session
          </button>
        </div>
        <LevelBar />
        <UsageBar />
      </header>

      {/* Conversation */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-52">
        {turns.map((turn, i) => (
          <div
            key={turn.id}
            ref={(el) => { turnRefs.current[i] = el; }}
          >
            {turn.role === "yuki" ? (
              <div className="space-y-2">
                <YukiBubble
                  response={turn.response}
                  onReplay={() => playAudio(turn.response.yuki.ja)}
                />
                {turn.response.correction_type === "mistake" && turn.response.correction && (
                  <div className="ml-11">
                    <CorrectionCard correction={turn.response.correction} />
                  </div>
                )}
                {turn.response.correction_type === "upgrade" && turn.response.better_way && (
                  <div className="ml-11">
                    <BetterWayCard betterWay={turn.response.better_way} />
                  </div>
                )}
              </div>
            ) : (
              <UserBubble text={turn.text} />
            )}
          </div>
        ))}
        <div ref={scrollRef} />
      </main>

      {/* Controls */}
      <div className="fixed bottom-28 left-0 right-0 flex flex-col items-center gap-3 px-4 pointer-events-none">
        <div className="pointer-events-auto flex flex-col items-center gap-3">
          {mode === "paused" && <ContinueButton onContinue={() => setMode("idle")} />}
          {(mode === "idle" || mode === "recording") && (
            <MicButton mode={mode} onStart={startRecording} onStop={stopRecording} />
          )}
          {mode === "processing" && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              thinking…
            </div>
          )}
          {mode === "speaking" && (
            <div className="text-sm text-indigo-500 animate-pulse">Yuki is speaking…</div>
          )}
        </div>
      </div>

      <TrayDrawer onScrollToTurn={handleScrollToTurn} />
    </div>
  );
}
