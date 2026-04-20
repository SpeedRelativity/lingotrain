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

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const { userId, turns, mode, turnIndex, latestResponse, setMode, addUserTurn, addYukiTurn, setSession } =
    useConversationStore();
  const { addItems, clear } = useTrayStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize session and kick off Yuki's opening line
  useEffect(() => {
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

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  const playAudio = useCallback(async (text: string) => {
    setMode("speaking");
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setMode("paused");
      };
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
        body: JSON.stringify({ sessionId: sid, userId: uid, userText, turnIndex: index }),
      });
      const response = await res.json();
      addYukiTurn(response);
      if (response.tray_items?.length > 0) {
        addItems(response.tray_items);
      }
      await playAudio(response.yuki.ja);
    } catch {
      setMode("idle");
    }
  }

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    audioChunksRef.current = [];
    recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
    recorder.start();
    mediaRecorderRef.current = recorder;
    setMode("recording");
  }

  async function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    recorder.stop();
    recorder.stream.getTracks().forEach((t) => t.stop());
    setMode("processing");

    await new Promise<void>((res) => { recorder.onstop = () => res(); });

    const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", blob);

    const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: formData });
    const { text } = await transcribeRes.json();

    addUserTurn(text);
    await sendTurn(sessionId, userId!, text, turnIndex);
  }

  function handleContinue() {
    setMode("idle");
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
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
            Y
          </div>
          <span className="font-semibold text-gray-900">Yuki</span>
          <span className="text-xs text-gray-400">N5-N4</span>
        </div>
        <button
          onClick={handleEndSession}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          End session
        </button>
      </header>

      {/* Conversation scroll area */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-48">
        {turns.map((turn) => (
          <div key={turn.id}>
            {turn.role === "yuki" ? (
              <div className="space-y-2">
                <YukiBubble
                  response={turn.response}
                  onReplay={() => playAudio(turn.response.yuki.ja)}
                />
                {turn.response.correction && (
                  <div className="ml-11">
                    <CorrectionCard correction={turn.response.correction} />
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
      <div className="fixed bottom-24 left-0 right-0 flex flex-col items-center gap-3 px-4">
        {mode === "paused" && (
          <ContinueButton onContinue={handleContinue} />
        )}
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

      <TrayDrawer />
    </div>
  );
}
