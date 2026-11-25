import React, { useEffect, useState } from "react";

const STAGES = [
  "Memeriksa hak akses peran Anda...",
  "Mencari dokumen yang relevan...",
  "Membaca sumber dan menyusun jawaban...",
  "Memeriksa sitasi...",
];

/** Gelembung "sedang memproses": tahap berganti + bar progres indeterminate. */
export const ThinkingBubble: React.FC = () => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex justify-start">
      <div className="max-w-3xl w-full">
        <div className="inline-block min-w-[16rem] bg-[#1C1C1A] border border-[#2E2E2B] text-gray-300 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm text-xs">
          <div className="flex items-center gap-2">
            <span className="flex gap-1">
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </span>
            <span key={stage} className="animate-pulse">
              {STAGES[stage]}
            </span>
          </div>
          <div className="mt-3 h-1 w-full bg-[#2A2A28] rounded-full overflow-hidden">
            <div
              className="h-full w-1/3 bg-red-500 rounded-full"
              style={{ animation: "chat-progress 1.4s ease-in-out infinite" }}
            />
          </div>
        </div>
        <style>{`@keyframes chat-progress{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
      </div>
    </div>
  );
};

/** Menampilkan teks bertahap (efek mengetik); total durasi dibatasi sekitar 2,5 detik. */
export const TypedText: React.FC<{ text: string; onTick?: () => void; onDone: () => void }> = ({
  text,
  onTick,
  onDone,
}) => {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const step = Math.max(1, Math.ceil(text.length / 120));
    const t = setInterval(() => {
      setShown((n) => {
        const next = Math.min(n + step, text.length);
        if (next >= text.length) clearInterval(t);
        return next;
      });
    }, 20);
    return () => clearInterval(t);
  }, [text]);

  useEffect(() => {
    onTick?.();
    if (shown >= text.length) onDone();
  }, [shown]);

  return <div className="whitespace-pre-wrap">{text.slice(0, shown)}</div>;
};
