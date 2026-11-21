"use client";

import NumberFlow from "@number-flow/react";
import { useCallback, type ReactNode } from "react";

import type { ModelDefinition } from "@/data/models";
import {
  numberFlowFormat,
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

function SavingsSpan({
  value,
  currency,
}: {
  value: number;
  currency: CostCurrency;
}) {
  const symbol = currency === "INR" ? "₹" : "$";
  const flowFormat = numberFlowFormat(currency, value);
  return (
    <span className="whitespace-nowrap">
      {symbol}
      <NumberFlow value={value} format={flowFormat} willChange />
    </span>
  );
}

function noteBody(
  suggestion: Suggestion,
  modelName: string,
  savings: number,
  currency: CostCurrency,
): ReactNode {
  const saves = (
    <>
      {" "}
      Saves <SavingsSpan value={savings} currency={currency} /> a month.
    </>
  );

  if (suggestion.kind === "wordy") {
    const replacement = suggestion.replacement;
    const canBe = replacement ? `"${replacement}"` : "removed";
    return (
      <>
        &quot;{suggestion.phrase}&quot; can be {canBe}.{saves}
      </>
    );
  }

  if (suggestion.kind === "repeat") {
    return (
      <>
        This repeats a line in {suggestion.repeatFromLabel}.{saves}
      </>
    );
  }

  return (
    <>
      Cut this example and save <SavingsSpan value={savings} currency={currency} /> a month
      on {modelName}.
    </>
  );
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

  if (savingsDisplay <= 0) return null;

  const handleEnter = useCallback(() => onHoverChange(true), [onHoverChange]);
  const handleLeave = useCallback(() => onHoverChange(false), [onHoverChange]);

  return (
    <aside
      className="w-[200px] shrink-0 border-l border-accent py-1 pl-4 font-serif text-[13px] italic leading-snug text-accent"
      aria-label="Trim suggestion"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <p>{noteBody(suggestion, selectedModel.name, savingsDisplay, currency)}</p>
      <button
        type="button"
        onClick={onApply}
        className="mt-1.5 cursor-pointer border-0 bg-transparent p-0 font-serif text-[12px] not-italic text-accent underline-offset-2 hover:underline"
      >
        Apply
      </button>
    </aside>
  );
}

type AppliedMarginNoteProps = {
  onUndo: () => void;
};

export function AppliedMarginNote({
  onUndo,
}: AppliedMarginNoteProps) {
  return (
    <aside
      className="w-[200px] shrink-0 py-1 pl-4 font-serif text-[13px] leading-snug text-faint"
      aria-live="polite"
    >
      Applied ·{" "}
      <button
        type="button"
        onClick={onUndo}
        className="cursor-pointer border-0 bg-transparent p-0 font-serif text-faint underline-offset-2 hover:text-accent hover:underline"
      >
        Undo
      </button>
    </aside>
  );
}