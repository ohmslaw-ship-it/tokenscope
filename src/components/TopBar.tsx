"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { models, type ModelDefinition, type TokenizerTier } from "@/data/models";
import type { CostCurrency } from "@/lib/cost";

function ChevronDown() {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 8 8"
      fill="none"
      aria-hidden
      className="text-muted"
    >
      <path
        d="M1.5 3L4 5.5L6.5 3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function tierLabel(tier: TokenizerTier): string {
  return tier === "exact" ? "exact" : "est.";
}

function formatContextPercent(used: number, limit: number): string {
  if (limit <= 0) return "0.0";
  return (Math.round((used / limit) * 1000) / 10).toFixed(1);
}

const segmentShell =
  "flex rounded-lg bg-white/[0.04] p-0.5 text-[12.5px] text-muted shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]";

const segmentItem = "rounded-md px-[11px] py-[5px]";

const segmentOn =
  "bg-white/[0.09] text-text-hi shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

type TopBarProps = {
  selectedModel: ModelDefinition;
  onSelectModel: (id: string) => void;
  currency: CostCurrency;
  onCurrencyChange: (currency: CostCurrency) => void;
  usedTokens: number;
  contextWindow: number;
};

export function TopBar({
  selectedModel,
  onSelectModel,
  currency,
  onCurrencyChange,
  usedTokens,
  contextWindow,
}: TopBarProps) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  const selectedIndex = models.findIndex((m) => m.id === selectedModel.id);
  const percent = formatContextPercent(usedTokens, contextWindow);

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
    <header className="relative z-30 flex min-h-14 flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3 min-[1100px]:h-14 min-[1100px]:flex-nowrap min-[1100px]:py-0">
      <div className="flex items-center gap-8">
        <div className="text-[14.5px] font-semibold tracking-[-0.01em] text-text-hi">
          Tokenscope
        </div>
        <div className={segmentShell} role="group" aria-label="View mode">
          <button type="button" className={`${segmentItem} ${segmentOn}`} aria-pressed>
            Inspect
          </button>
          <button
            type="button"
            className={segmentItem}
            disabled
            aria-disabled="true"
          >
            Compare
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3.5">
        <p className="font-mono text-[11.5px] whitespace-nowrap text-muted">
          <span className="text-text">{usedTokens.toLocaleString("en-US")}</span>
          {" / "}
          {contextWindow.toLocaleString("en-US")}
          {" · "}
          {percent}%
        </p>

        <div className={segmentShell} role="group" aria-label="Currency">
          <button
            type="button"
            className={`${segmentItem} ${currency === "INR" ? segmentOn : ""}`}
            aria-pressed={currency === "INR"}
            onClick={() => onCurrencyChange("INR")}
          >
            ₹
          </button>
          <button
            type="button"
            className={`${segmentItem} ${currency === "USD" ? segmentOn : ""}`}
            aria-pressed={currency === "USD"}
            onClick={() => onCurrencyChange("USD")}
          >
            $
          </button>
        </div>

        <div ref={rootRef} className="relative">
          <button
            type="button"
            className="flex h-[30px] items-center gap-2 rounded-lg bg-white/[0.04] pr-2.5 pl-3 text-[12.5px] text-text-hi shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => {
              if (open) close();
              else openMenu();
            }}
            onKeyDown={onTriggerKeyDown}
          >
            {selectedModel.name}
            <span className="text-muted">{tierLabel(selectedModel.tokenizer)}</span>
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
              className="absolute right-0 z-50 mt-1.5 min-w-[240px] overflow-hidden rounded-lg bg-surface py-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),0_16px_40px_-16px_rgba(0,0,0,0.6)] outline-none"
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
                      className={`flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-[12.5px] ${
                        highlighted ? "bg-white/[0.06] text-text-hi" : "text-text"
                      }`}
                      onMouseEnter={() => setHighlightIndex(index)}
                      onClick={() => {
                        onSelectModel(model.id);
                        close();
                      }}
                    >
                      <span>{model.name}</span>
                      <span className="text-muted">{tierLabel(model.tokenizer)}</span>
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
