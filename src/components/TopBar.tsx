"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { models, type ModelDefinition } from "@/data/models";

function ChevronDown() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden
      className="text-muted"
    >
      <path
        d="M2 3.5L5 6.5L8 3.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type TopBarProps = {
  selectedModel: ModelDefinition;
  onSelectModel: (id: string) => void;
};

export function TopBar({ selectedModel, onSelectModel }: TopBarProps) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  const selectedIndex = models.findIndex((m) => m.id === selectedModel.id);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const index = selectedIndex >= 0 ? selectedIndex : 0;
    setHighlightIndex(index);
    listRef.current?.focus();
  }, [open, selectedIndex]);

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
      setOpen(true);
    }
  };

  const onListKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((i) => (i + 1) % models.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((i) => (i - 1 + models.length) % models.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setHighlightIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setHighlightIndex(models.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const model = models[highlightIndex];
      if (model) {
        onSelectModel(model.id);
        close();
      }
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-hairline px-6">
      <div className="font-serif text-[22px] leading-none text-text">
        <span className="font-normal not-italic">Token</span>
        <span className="italic text-accent">scope</span>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="flex rounded-[var(--radius-control)] border border-hairline p-0.5"
          role="group"
          aria-label="View mode"
        >
          <button
            type="button"
            className="rounded-[4px] bg-surface px-3 py-1.5 font-mono text-[12px] text-text"
          >
            Inspect
          </button>
          <button
            type="button"
            className="rounded-[4px] px-3 py-1.5 font-mono text-[12px] text-muted"
          >
            Compare
          </button>
        </div>

        <div
          className="flex rounded-[var(--radius-control)] border border-hairline p-0.5"
          role="group"
          aria-label="Currency"
        >
          <button
            type="button"
            className="min-w-[36px] rounded-[4px] bg-surface px-2 py-1.5 font-mono text-[12px] text-text"
          >
            ₹
          </button>
          <button
            type="button"
            className="min-w-[36px] rounded-[4px] px-2 py-1.5 font-mono text-[12px] text-muted"
          >
            $
          </button>
        </div>

        <div ref={rootRef} className="relative">
          <button
            type="button"
            className="flex items-center gap-2 rounded-[var(--radius-control)] border border-hairline bg-surface px-3 py-1.5 font-mono text-[12px] text-text-2"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen((value) => !value)}
            onKeyDown={onTriggerKeyDown}
          >
            {selectedModel.name} · {selectedModel.tokenizer}
            <ChevronDown />
          </button>

          {open ? (
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-activedescendant={`${listId}-option-${highlightIndex}`}
              tabIndex={0}
              onKeyDown={onListKeyDown}
              className="absolute right-0 z-50 mt-1 min-w-[220px] rounded-[var(--radius-control)] border border-hairline bg-surface py-1 shadow-none outline-none"
            >
              {models.map((model, index) => {
                const selected = model.id === selectedModel.id;
                const highlighted = index === highlightIndex;
                return (
                  <li
                    key={model.id}
                    id={`${listId}-option-${index}`}
                    role="option"
                    aria-selected={selected}
                  >
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left font-mono text-[12px] ${
                        highlighted ? "bg-token-hover text-text" : "text-text-2"
                      }`}
                      onMouseEnter={() => setHighlightIndex(index)}
                      onClick={() => {
                        onSelectModel(model.id);
                        close();
                      }}
                    >
                      <span>{model.name}</span>
                      <span className="text-muted">{model.tokenizer}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </header>
  );
}