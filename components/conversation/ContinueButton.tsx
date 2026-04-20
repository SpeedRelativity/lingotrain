"use client";

interface Props {
  onContinue: () => void;
}

export function ContinueButton({ onContinue }: Props) {
  return (
    <button
      onClick={onContinue}
      className="px-6 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 active:scale-95 transition-all shadow-md"
    >
      Continue →
    </button>
  );
}
