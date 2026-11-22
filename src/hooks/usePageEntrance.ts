"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import {
  ENTRANCE_DELAYS_MS,
  entranceCompleteMs,
  PAGE_READY_TIMEOUT_MS,
} from "@/lib/entrance";

export function usePageEntrance(tokenReady: boolean) {
  const reducedMotion = useReducedMotion() ?? false;
  const [timeoutReady, setTimeoutReady] = useState(false);
  const [costFlowReady, setCostFlowReady] = useState(false);
  const [entranceComplete, setEntranceComplete] = useState(false);
  const costFlowReadyRef = useRef(false);

  const pageReady = tokenReady || timeoutReady;

  useEffect(() => {
    const safety = window.setTimeout(() => setTimeoutReady(true), PAGE_READY_TIMEOUT_MS);
    return () => window.clearTimeout(safety);
  }, []);

  useEffect(() => {
    if (!pageReady || !tokenReady || costFlowReadyRef.current) return;
    const delay = reducedMotion ? 0 : ENTRANCE_DELAYS_MS.hero;
    const id = window.setTimeout(() => {
      costFlowReadyRef.current = true;
      setCostFlowReady(true);
    }, delay);
    return () => window.clearTimeout(id);
  }, [pageReady, tokenReady, reducedMotion]);

  useEffect(() => {
    if (!pageReady) return;
    const id = window.setTimeout(
      () => setEntranceComplete(true),
      entranceCompleteMs(reducedMotion),
    );
    return () => window.clearTimeout(id);
  }, [pageReady, reducedMotion]);

  return {
    pageReady,
    reducedMotion,
    costFlowReady,
    entranceComplete,
  };
}