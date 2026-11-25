import React from "react";

interface Cite {
  index: number;
  document_id: string;
  filename: string;
  classification: string;
}

/** Teks jawaban dengan penanda sitasi [n] yang dapat diklik untuk membuka dokumen sumbernya. */
export const CitedText: React.FC<{
  text: string;
  citations: Cite[];
  onOpen: (c: Cite) => void;
}> = ({ text, citations, onOpen }) => (
  <div className="whitespace-pre-wrap">
    {text.split(/(\[\d+\])/g).map((part, i) => {
      const cite = /^\[(\d+)\]$/.test(part) ? citations.find((c) => c.index === Number(part.slice(1, -1))) : undefined;
      return cite ? (
        <button
          key={i}
          type="button"
          onClick={() => onOpen(cite)}
          title={`Buka ${cite.filename}`}
          className="mx-0.5 px-1 rounded text-[11px] font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/25 hover:text-red-300 underline-offset-2 hover:underline transition cursor-pointer"
        >
          [{cite.index}]
        </button>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      );
    })}
  </div>
);
