"use client";

interface Props {
  text: string;
}

export function UserBubble({ text }: Props) {
  return (
    <div className="flex gap-3 items-start justify-end w-full">
      <div className="bg-indigo-50 border border-indigo-100 text-gray-900 rounded-2xl rounded-tr-none px-4 py-3 shadow-sm max-w-sm">
        <p className="text-base font-medium leading-relaxed">{text}</p>
      </div>
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold shrink-0 mt-1">
        Me
      </div>
    </div>
  );
}
