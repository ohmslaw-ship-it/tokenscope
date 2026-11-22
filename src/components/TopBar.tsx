"use client";

import { useId } from "react";

import { TierLabel } from "@/components/TierLabel";
import { models, type ModelDefinition } from "@/data/models";
import { samplePresets } from "@/data/sample";
import { useListbox } from "@/hooks/useListbox";
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

function formatContextPercent(used: number, limit: number): string {
  if (limit <= 0) return "0.0";
  return (Math.round((used / limit) * 1000) / 10).toFixed(1);
}

const segmentShell =
  "flex rounded-lg bg-white/[0.04] p-0.5 text-[12.5px] text-muted shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]";

const segmentItem = "rounded-md px-[11px] py-[5px]";

const segmentOn =
  "bg-white/[0.09] text-text-hi shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

const menuButtonClass =
  "flex h-[30px] items-center gap-2 rounded-lg bg-white/[0.04] pr-2.5 pl-3 text-[12.5px] text-text-hi shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]";

const menuListClass =
  "absolute z-50 mt-1.5 min-w-[240px] overflow-hidden rounded-lg bg-surface py-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),0_16px_40px_-16px_rgba(0,0,0,0.6)] outline-none";

export type WorkspaceView = "inspect" | "compare";

type TopBarProps = {
  view: WorkspaceView;
  onViewChange: (view: WorkspaceView) => void;
  selectedModel: ModelDefinition;
  onSelectModel: (id: string) => void;
  currency: CostCurrency;
  onCurrencyChange: (currency: CostCurrency) => void;
  usedTokens: number;
  contextWindow: number;
  presetId: string;
  presetName: string;
  presetEdited: boolean;
  onSelectPreset: (presetId: string) => void;
};

function PresetMenu({
  placement,
  presetId,
  presetName,
  presetEdited,
  onSelectPreset,
}: {
  placement: "inline" | "mobile";
  presetId: string;
  presetName: string;
  presetEdited: boolean;
  onSelectPreset: (presetId: string) => void;
}) {
  const listId = useId();
  const selectedIndex = Math.max(
    0,
    samplePresets.findIndex((p) => p.id === presetId),
  );

  const {
    open,
    highlightIndex,
    setHighlightIndex,
    rootRef,
    listRef,
    close,
    openMenu,
    onTriggerKeyDown,
    onListKeyDown,
  } = useListbox({
    itemCount: samplePresets.length,
    selectedIndex,
    onSelect: (index) => {
      const preset = samplePresets[index];
      if (preset) onSelectPreset(preset.id);
    },
  });

  const shellClass =
    placement === "inline"
      ? "relative hidden min-[1100px]:block"
      : "relative min-[1100px]:hidden";

  return (
    <div ref={rootRef} className={shellClass}>
      <button
        type="button"
        className={menuButtonClass}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (open) close();
          else openMenu();
        }}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="text-muted">Sample:</span> {presetName}
        {presetEdited ? (
          <span className="text-faint"> (edited)</span>
        ) : null}
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
          className={`${menuListClass} left-0 min-[1100px]:left-0`}
        >
          {samplePresets.map((preset, index) => {
            const highlighted = index === highlightIndex;
            return (
              <li
                key={preset.id}
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={preset.id === presetId}
              >
                <button
                  type="button"
                  className={`flex w-full px-3 py-2 text-left text-[12.5px] ${
                    highlighted ? "bg-white/[0.06] text-text-hi" : "text-text"
                  }`}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onClick={() => {
                    onSelectPreset(preset.id);
                    close();
                  }}
                >
                  {preset.name}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function TopBar({
  view,
  onViewChange,
  selectedModel,
  onSelectModel,
  currency,
  onCurrencyChange,
  usedTokens,
  contextWindow,
  presetId,
  presetName,
  presetEdited,
  onSelectPreset,
}: TopBarProps) {
  const modelListId = useId();
  const modelSelectedIndex = models.findIndex((m) => m.id === selectedModel.id);
  const percent = formatContextPercent(usedTokens, contextWindow);

  const {
    open: modelOpen,
    highlightIndex: modelHighlight,
    setHighlightIndex: setModelHighlight,
    rootRef: modelRootRef,
    listRef: modelListRef,
    close: closeModel,
    openMenu: openModelMenu,
    onTriggerKeyDown: onModelTriggerKeyDown,
    onListKeyDown: onModelListKeyDown,
  } = useListbox({
    itemCount: models.length,
    selectedIndex: modelSelectedIndex,
    onSelect: (index) => {
      const model = models[index];
      if (model) onSelectModel(model.id);
    },
  });

  return (
    <header className="relative z-30 flex min-h-14 flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3 min-[1100px]:h-14 min-[1100px]:flex-nowrap min-[1100px]:py-0">
      <div className="flex min-w-0 flex-wrap items-center gap-8">
        <div className="text-[14.5px] font-semibold tracking-[-0.01em] text-text-hi">
          Tokenscope
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-4">
          <div className={segmentShell} role="group" aria-label="View mode">
            <button
              type="button"
              className={`${segmentItem} ${view === "inspect" ? segmentOn : ""}`}
              aria-pressed={view === "inspect"}
              onClick={() => onViewChange("inspect")}
            >
              Inspect
            </button>
            <button
              type="button"
              className={`${segmentItem} ${view === "compare" ? segmentOn : ""}`}
              aria-pressed={view === "compare"}
              onClick={() => onViewChange("compare")}
            >
              Compare
            </button>
          </div>
          <PresetMenu
            placement="inline"
            presetId={presetId}
            presetName={presetName}
            presetEdited={presetEdited}
            onSelectPreset={onSelectPreset}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-3.5">
        <PresetMenu
          placement="mobile"
          presetId={presetId}
          presetName={presetName}
          presetEdited={presetEdited}
          onSelectPreset={onSelectPreset}
        />

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

        <div ref={modelRootRef} className="relative">
          <button
            type="button"
            className={menuButtonClass}
            aria-haspopup="listbox"
            aria-expanded={modelOpen}
            aria-controls={modelListId}
            onClick={() => {
              if (modelOpen) closeModel();
              else openModelMenu();
            }}
            onKeyDown={onModelTriggerKeyDown}
          >
            {selectedModel.name}{" "}
            <TierLabel tier={selectedModel.tokenizer} placement="bottom" />
            <ChevronDown />
          </button>

          {modelOpen ? (
            <ul
              ref={modelListRef}
              id={modelListId}
              role="listbox"
              aria-activedescendant={`${modelListId}-option-${modelHighlight}`}
              tabIndex={0}
              onKeyDown={onModelListKeyDown}
              className={`${menuListClass} right-0`}
            >
              {models.map((model, index) => {
                const selected = model.id === selectedModel.id;
                const highlighted = index === modelHighlight;
                return (
                  <li
                    key={model.id}
                    id={`${modelListId}-option-${index}`}
                    role="option"
                    aria-selected={selected}
                  >
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-[12.5px] ${
                        highlighted ? "bg-white/[0.06] text-text-hi" : "text-text"
                      }`}
                      onMouseEnter={() => setModelHighlight(index)}
                      onClick={() => {
                        onSelectModel(model.id);
                        closeModel();
                      }}
                    >
                      <span>{model.name}</span>
                      <TierLabel tier={model.tokenizer} placement="bottom" />
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