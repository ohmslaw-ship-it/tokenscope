"use client";

import NumberFlow from "@number-flow/react";
import { motion } from "motion/react";
import { useMemo, useRef, useState, useLayoutEffect } from "react";

import { usageAssumptions } from "@/data/placeholder";
import type { ModelDefinition } from "@/data/models";
import type { SectionId } from "@/data/sample";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { sectionGutterHex } from "@/lib/section-colors";

const RESERVED_REPLY_TOKENS = usageAssumptions.replyTokens;
const TRACK_COLOR = "rgba(243, 247, 251, 0.06)";
const RESERVED_FILL = "rgba(243, 247, 251, 0.16)";

const SECTION_ORDER: SectionId[] = ["system", "example1", "example2", "user"];

type ContextBarProps = {
  model: ModelDefinition;
  totalInputTokens: number;
  tokensBySection: Record<SectionId, number>;
};

function formatPercent(used: number, limit: number): number {
  return Math.round((used / limit) * 1000) / 10;
}

export function ContextBar({
  model,
  totalInputTokens,
  tokensBySection,
}: ContextBarProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(([entry]) => {
      setTrackWidth(entry.contentRect.width);
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  const usedTokens = totalInputTokens + RESERVED_REPLY_TOKENS;
  const { contextWindow } = model;
  const usageRatio = usedTokens / contextWindow;
  const percent = formatPercent(usedTokens, contextWindow);
  const overBy = usedTokens - contextWindow;

  const status = overBy > 0 ? "over" : percent > 80 ? "warn" : "ok";

  const segmentWeights = useMemo(() => {
    const weights: { key: string; weight: number; color: string; hatched?: boolean }[] =
      SECTION_ORDER.map((id) => ({
        key: id,
        weight: tokensBySection[id],
        color: sectionGutterHex[id],
      }));
    weights.push({
      key: "reserved",
      weight: RESERVED_REPLY_TOKENS,
      color: RESERVED_FILL,
      hatched: true,
    });
    return weights;
  }, [tokensBySection]);

  const totalWeight = segmentWeights.reduce((sum, s) => sum + s.weight, 0);

  const fillPercent = Math.min(usageRatio, 1) * 100;
  const fillPx =
    usedTokens > 0 && trackWidth > 0
      ? Math.min(Math.max(usageRatio * trackWidth, 2), trackWidth)
      : usedTokens > 0
        ? 2
        : 0;
  const fillWidth =
    trackWidth > 0 && usedTokens > 0 ? `${fillPx}px` : `${fillPercent}%`;

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 300, damping: 30 };

  const textColor =
    status === "over" ? "#E08A7C" : status === "warn" ? "#E0B07C" : "var(--color-text-2)";

  return (
    <div className="flex h-10 items-center gap-4 border-b border-hairline px-6">
      <p
        className="shrink-0 font-mono text-[12px] whitespace-nowrap"
        style={{ color: textColor }}
      >
        {status === "over" ? (
          <>Over the limit by {overBy.toLocaleString()} tokens</>
        ) : prefersReducedMotion ? (
          <>
            {usedTokens.toLocaleString()} of {contextWindow.toLocaleString()} tokens ·{" "}
            {percent}%
          </>
        ) : (
          <>
            <NumberFlow value={usedTokens} willChange /> of{" "}
            <NumberFlow value={contextWindow} willChange /> tokens ·{" "}
            <NumberFlow
              value={percent}
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
              suffix="%"
              willChange
            />
          </>
        )}
        {status === "warn" ? (
          <span className="ml-2 text-muted">Close to the limit</span>
        ) : null}
      </p>

      <div
        ref={trackRef}
        className="flex h-1 min-w-[120px] flex-1 overflow-hidden rounded-[2px]"
        style={{ backgroundColor: TRACK_COLOR }}
        role="img"
        aria-label={`Context usage ${percent} percent`}
      >
        {usedTokens > 0 ? (
          <motion.div
            className="flex h-full overflow-hidden rounded-[2px]"
            initial={false}
            animate={{ width: fillWidth }}
            transition={transition}
            style={{ minWidth: 2 }}
          >
            {segmentWeights.map((segment) => {
              const share = totalWeight > 0 ? segment.weight / totalWeight : 0;
              return (
                <motion.div
                  key={segment.key}
                  className="h-full"
                  initial={false}
                  animate={{ flexGrow: segment.weight, flexBasis: 0 }}
                  transition={transition}
                  style={{
                    flexGrow: segment.weight,
                    flexBasis: 0,
                    width: `${share * 100}%`,
                    backgroundColor: segment.hatched ? undefined : segment.color,
                    backgroundImage: segment.hatched
                      ? `repeating-linear-gradient(-45deg, ${RESERVED_FILL}, ${RESERVED_FILL} 2px, rgba(10,18,38,0.35) 2px, rgba(10,18,38,0.35) 4px)`
                      : undefined,
                  }}
                />
              );
            })}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}