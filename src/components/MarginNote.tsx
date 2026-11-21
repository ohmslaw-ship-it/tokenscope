"use client";

import { useCallback } from "react";

import type { ModelDefinition } from "@/data/models";
import {
  formatCostInteger,
  removedInputMonthlySavingsDisplay,
  type CostCurrency,
} from "@/lib/cost";
import type { Suggestion } from "@/lib/trim";

type MarginNoteProps = {
  suggestion: Suggestion;
  selectedModel: ModelDefinition;
  inputTokens: number;
  outputTokens: number;
  requestsPerDay: number;
  currency: CostCurrency;
  onApply: () => void;
  onHoverChange: (hovered: boolean) => void;
};

function trimCopy(suggestion: Suggestion, savings: string): string {
  if (suggestion.kind === "wordy" && suggestion.phrase) {
    return `Cut "${suggestion.phrase}" · save ${savings}/mo`;
  }
  if (suggestion.kind === "repeat") {
    return `Cut a repeated line · save ${savings}/mo`;
  }
  return `Cut this example · save ${savings}/mo`;
}

export function MarginNote({
  suggestion,
  selectedModel,
  inputTokens,
  outputTokens,
  requestsPerDay,
  currency,
  onApply,
  onHoverChange,
}: MarginNoteProps) {
  const savingsDisplay = removedInputMonthlySavingsDisplay(
    selectedModel,
    inputTokens,
    outputTokens,
    requestsPerDay,
    suggestion.tokensSaved,
    currency,
  );

  const handleEnter = useCallback(() => onHoverChange(true), [onHoverChange]);
  const handleLeave = useCallback(() => onHoverChange(false), [onHoverChange]);

  if (savingsDisplay <= 0) return null;

  const symbol = currency === "INR" ? "₹" : "$";
  const savings = `${symbol}${formatCostInteger(savingsDisplay, currency)}`;

  return (
    <div
      className="mt-3 flex items-baseline justify-between gap-4 border-t border-white/[0.06] pt-3 text-[12.5px] text-accent-soft"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <p>{trimCopy(suggestion, savings)}</p>
      <button
        type="button"
        onClick={onApply}
        className="shrink-0 cursor-pointer border-0 bg-transparent p-0 font-medium text-accent"
      >
        Apply
      </button>
    </div>
  );
}

type AppliedMarginNoteProps = {
  onUndo: () => void;
};

export function AppliedMarginNote({ onUndo }: AppliedMarginNoteProps) {
  return (
    <p
      className="mt-3 border-t border-white/[0.06] pt-3 text-[12.5px] text-accent-soft"
      aria-live="polite"
    >
      Applied ·{" "}
      <button
        type="button"
        onClick={onUndo}
        className="cursor-pointer border-0 bg-transparent p-0 font-medium text-accent"
      >
        Undo
      </button>
    </p>
  );
}
