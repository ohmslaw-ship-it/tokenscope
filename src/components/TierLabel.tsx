"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

const TIP_MAX_WIDTH = 280;
const VIEWPORT_PAD = 16;
const TIP_GAP = 8;

type TierLabelProps = {
  tier: TokenizerTier;
  placement?: "top" | "bottom";
};

export function TierLabel({ tier, placement = "top" }: TierLabelProps) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [tipPos, setTipPos] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );
  const { label, tip } = TIER_COPY[tier];

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setTipPos(null);
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const width = Math.min(TIP_MAX_WIDTH, window.innerWidth - VIEWPORT_PAD * 2);
    const nearRight = rect.right > window.innerWidth - VIEWPORT_PAD - width * 0.35;

    let left = nearRight
      ? rect.right - width
      : rect.left + rect.width / 2 - width / 2;
    left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - VIEWPORT_PAD - width));

    const top =
      placement === "bottom" ? rect.bottom + TIP_GAP : rect.top - TIP_GAP;

    setTipPos({ top, left, width });
  }, [open, placement]);

  return (
    <>
      <span
        ref={triggerRef}
        tabIndex={0}
        className="relative inline-flex cursor-help rounded-sm text-muted underline decoration-white/20 decoration-dotted underline-offset-[3px] outline-none hover:text-text focus-visible:text-text focus-visible:decoration-accent/50"
        aria-describedby={open ? tipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {label}
      </span>
      {open && tipPos
        ? createPortal(
            <span
              id={tipId}
              role="tooltip"
              className="pointer-events-none fixed z-[80] rounded-lg bg-[#1C2C4F] px-3 py-2 text-left text-[11px] font-normal leading-[1.45] tracking-normal text-text shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.45)]"
              style={{
                top: tipPos.top,
                left: tipPos.left,
                width: tipPos.width,
                transform: placement === "top" ? "translateY(-100%)" : undefined,
              }}
            >
              {tip}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}