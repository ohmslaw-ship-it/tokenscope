"use client";

import { createContext, useContext, type ReactNode } from "react";
import { motion } from "motion/react";

import {
  ENTRANCE_DURATION_S,
  ENTRANCE_EASE,
  ENTRANCE_REDUCE_DURATION_S,
  ENTRANCE_Y,
  SHARE_BAR_DELAY_S,
  SHARE_BAR_DURATION_S,
  SHARE_BAR_UPDATE_DURATION_S,
} from "@/lib/entrance";

export type PageEntranceState = {
  pageReady: boolean;
  reducedMotion: boolean;
  costFlowReady: boolean;
  entranceComplete: boolean;
};

const PageEntranceContext = createContext<PageEntranceState | null>(null);

export function PageEntranceProvider({
  value,
  children,
}: {
  value: PageEntranceState;
  children: ReactNode;
}) {
  return (
    <PageEntranceContext.Provider value={value}>
      {children}
    </PageEntranceContext.Provider>
  );
}

export function usePageEntranceContext(): PageEntranceState {
  const ctx = useContext(PageEntranceContext);
  if (!ctx) {
    throw new Error("usePageEntranceContext must be used within PageEntranceProvider");
  }
  return ctx;
}

type EntranceBlockProps = {
  delayMs?: number;
  children: ReactNode;
  className?: string;
};

export function EntranceBlock({
  delayMs = 0,
  children,
  className,
}: EntranceBlockProps) {
  const { pageReady, reducedMotion } = usePageEntranceContext();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reducedMotion ? 0 : ENTRANCE_Y }}
      animate={
        pageReady
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: reducedMotion ? 0 : ENTRANCE_Y }
      }
      transition={{
        delay: reducedMotion ? 0 : delayMs / 1000,
        duration: reducedMotion ? ENTRANCE_REDUCE_DURATION_S : ENTRANCE_DURATION_S,
        ease: ENTRANCE_EASE,
      }}
    >
      {children}
    </motion.div>
  );
}

type AnimatedShareBarProps = {
  share: number;
  soft?: boolean;
};

export function AnimatedShareBar({ share, soft = false }: AnimatedShareBarProps) {
  const { pageReady, reducedMotion, entranceComplete } = usePageEntranceContext();
  const widthPct = Math.min(Math.max(share * 100, 0), 100);
  const minWidth = share > 0 ? 3 : 0;

  const transition = reducedMotion
    ? { duration: 0 }
    : entranceComplete
      ? { duration: SHARE_BAR_UPDATE_DURATION_S, ease: ENTRANCE_EASE }
      : {
          delay: SHARE_BAR_DELAY_S,
          duration: SHARE_BAR_DURATION_S,
          ease: ENTRANCE_EASE,
        };

  return (
    <div className="mt-3 flex items-center gap-2.5 font-mono text-[11px] text-muted">
      <div className="relative h-0.5 flex-1 rounded-full bg-white/[0.07]">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${soft ? "bg-accent-soft" : "bg-accent"}`}
          initial={false}
          animate={{ width: pageReady ? `${widthPct}%` : "0%" }}
          transition={pageReady ? transition : { duration: 0 }}
          style={{ minWidth }}
        />
      </div>
      <span>{`${(Math.round(share * 1000) / 10).toFixed(1)}%`}</span>
    </div>
  );
}