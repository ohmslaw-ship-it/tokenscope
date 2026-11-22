"use client";

import { useId, useState } from "react";

import type { TokenizerTier } from "@/data/models";

const TIER_COPY: Record<TokenizerTier, { label: string; tip: string }> = {
  estimated: {
    label: "est.",
    tip: "Token count estimated with OpenAI's o200k tokenizer. This model's own tokenizer may differ by a few percent.",
  },
  exact: {
    label: "exact",
    tip: "Token count from this model's own tokenizer.",
  },
};

export function TierLabel({ tier }: { tier: TokenizerTier }) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const { label, tip } = TIER_COPY[tier];

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="cursor-help rounded-sm text-muted underline decoration-white/20 decoration-dotted underline-offset-[3px] outline-none hover:text-text focus-visible:text-text focus-visible:decoration-accent/50"
        aria-describedby={open ? tipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {label}
      </button>
      {open ? (
        <span
          id={tipId}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-[60] mb-2 w-[min(280px,calc(100vw-32px))] -translate-x-1/2 rounded-lg bg-[#1C2C4F] px-3 py-2 text-left text-[11px] font-normal leading-[1.45] tracking-normal text-text shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.45)]"
        >
          {tip}
        </span>
      ) : null}
    </span>
  );
}