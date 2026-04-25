"use client";

interface Props {
  onContinue: () => void;
}

export function ContinueButton({ onContinue }: Props) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onContinue}
        className="px-8 py-3 bg-indigo-600 text-white rounded-full text-base font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow-md"
      >
        Continue →
      </button>
      <span className="text-xs text-gray-400">tap to reply</span>
    </div>
  );
}
