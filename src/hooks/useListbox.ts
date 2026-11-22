"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseListboxOptions = {
  itemCount: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export function useListbox({
  itemCount,
  selectedIndex,
  onSelect,
}: UseListboxOptions) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const close = useCallback(() => setOpen(false), []);

  const openMenu = useCallback(() => {
    setHighlightIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }, [selectedIndex]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, close]);

  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMenu();
    }
  };

  const onListKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (itemCount <= 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((i) => (i + 1) % itemCount);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((i) => (i - 1 + itemCount) % itemCount);
    } else if (event.key === "Home") {
      event.preventDefault();
      setHighlightIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setHighlightIndex(itemCount - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(highlightIndex);
      close();
    }
  };

  return {
    open,
    highlightIndex,
    setHighlightIndex,
    rootRef,
    listRef,
    close,
    openMenu,
    onTriggerKeyDown,
    onListKeyDown,
  };
}