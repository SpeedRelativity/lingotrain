"use client";

interface Props {
  mode: "idle" | "recording" | "processing" | "paused" | "speaking";
  onStart: () => void;
  onStop: () => void;
}

export function MicButton({ mode, onStart, onStop }: Props) {
  const isRecording = mode === "recording";
  const isDisabled = mode === "processing" || mode === "speaking";

  return (
    <button
      onPointerDown={!isDisabled ? (isRecording ? undefined : onStart) : undefined}
      onPointerUp={!isDisabled ? (isRecording ? onStop : undefined) : undefined}
      onClick={isRecording ? onStop : (!isDisabled ? onStart : undefined)}
      disabled={isDisabled}
      className={`
        w-20 h-20 rounded-full flex items-center justify-center
        transition-all duration-150 select-none
        ${isRecording
          ? "bg-red-500 scale-110 shadow-lg shadow-red-300"
          : isDisabled
          ? "bg-gray-200 cursor-not-allowed"
          : "bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md"
        }
      `}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
    >
      {isRecording ? (
        <span className="w-5 h-5 bg-white rounded-sm" />
      ) : mode === "processing" ? (
        <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <MicIcon />
      )}
    </button>
  );
}

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="white"
      className="w-8 h-8"
    >
      <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
      <path d="M19 10a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V20H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-3.08A7 7 0 0 0 19 10z" />
    </svg>
  );
}
