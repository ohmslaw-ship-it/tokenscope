"use client";

import { useEffect, useRef, useState } from "react";

/** Gate cost NumberFlow until tokenisation is ready; animate only after the first revealed value. */
export function useCostNumberFlow(isReady: boolean, value: number) {
  const revealedRef = useRef(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!revealedRef.current) {
      revealedRef.current = true;
      return;
    }
    setAnimated(true);
  }, [isReady, value]);

  return { show: isReady, animated };
}