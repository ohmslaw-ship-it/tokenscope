"use client";

import NumberFlow from "@number-flow/react";

import type { ModelDefinition } from "@/data/models";
import {
  numberFlowFormat,
  removedInputMonthlySavingsDisplay,
  type CostCurrency,
} from "@/lib/cost";

type MarginNoteProps = {
  selectedModel: ModelDefinition;
  inputTokens: number;
  outputTokens: number;
  requestsPerDay: number;
  example1Tokens: number;
  currency: CostCurrency;
};

export function MarginNote({
  selectedModel,
  inputTokens,
  outputTokens,
  requestsPerDay,
  example1Tokens,
  currency,
}: MarginNoteProps) {
  const savingsDisplay = removedInputMonthlySavingsDisplay(
    selectedModel,
    inputTokens,
    outputTokens,
    requestsPerDay,
    example1Tokens,
    currency,
  );

  if (savingsDisplay <= 0) return null;

  const symbol = currency === "INR" ? "₹" : "$";
  const flowFormat = numberFlowFormat(currency, savingsDisplay);

  return (
    <aside
      className="w-[200px] shrink-0 border-l border-accent py-1 pl-4 font-serif text-[13px] italic leading-snug text-accent"
      aria-label="Cost suggestion"
    >
      Cut this example and save{" "}
      <span className="whitespace-nowrap">
        {symbol}
        <NumberFlow value={savingsDisplay} format={flowFormat} willChange />
      </span>{" "}
      a month on {selectedModel.name}.
    </aside>
  );
}