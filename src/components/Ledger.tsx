"use client";

import NumberFlow from "@number-flow/react";
import { useMemo } from "react";

import { InlineEditableNumber } from "@/components/InlineEditableNumber";
import { FX_INR_PER_USD, models, PRICES_AS_OF, type ModelDefinition } from "@/data/models";
import {
  clampReplyTokens,
  clampRequestsPerDay,
  formatCostDelta,
  formatCostInteger,
  monthlyDisplayValue,
  numberFlowFormat,
  type CostCurrency,
} from "@/lib/cost";

type LedgerProps = {
  selectedModel: ModelDefinition;
  inputTokens: number;
  outputTokens: number;
  requestsPerDay: number;
  onRequestsPerDayChange: (value: number) => void;
  onReplyTokensChange: (value: number) => void;
  currency: CostCurrency;
  onSelectModel: (id: string) => void;
};

const formatCount = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

export function Ledger({
  selectedModel,
  inputTokens,
  outputTokens,
  requestsPerDay,
  onRequestsPerDayChange,
  onReplyTokensChange,
  currency,
  onSelectModel,
}: LedgerProps) {
  const heroValue = useMemo(
    () =>
      monthlyDisplayValue(
        selectedModel,
        inputTokens,
        outputTokens,
        requestsPerDay,
        currency,
      ),
    [selectedModel, inputTokens, outputTokens, requestsPerDay, currency],
  );

  const heroFormat = useMemo(
    () => numberFlowFormat(currency, heroValue),
    [currency, heroValue],
  );

  const selectedMonthly = useMemo(
    () =>
      monthlyDisplayValue(
        selectedModel,
        inputTokens,
        outputTokens,
        requestsPerDay,
        currency,
      ),
    [selectedModel, inputTokens, outputTokens, requestsPerDay, currency],
  );

  const comparisonRows = useMemo(() => {
    return models
      .filter((model) => model.id !== selectedModel.id)
      .map((model) => {
        const cost = monthlyDisplayValue(
          model,
          inputTokens,
          outputTokens,
          requestsPerDay,
          currency,
        );
        return {
          model,
          cost,
          delta: cost - selectedMonthly,
        };
      })
      .sort((a, b) => a.cost - b.cost);
  }, [
    selectedModel.id,
    inputTokens,
    outputTokens,
    requestsPerDay,
    currency,
    selectedMonthly,
  ]);

  const currencySymbol = currency === "INR" ? "₹" : "$";

  return (
    <aside className="sticky top-8 w-[240px] shrink-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
        THIS MONTH
      </p>
      <p className="mt-3 font-serif text-[48px] leading-none text-accent">
        {currencySymbol}
        <NumberFlow value={heroValue} format={heroFormat} willChange />
      </p>
      <p className="mt-2 font-mono text-[12px] text-muted">
        {selectedModel.name} · {selectedModel.tokenizer}
      </p>
      {selectedModel.priceNote ? (
        <p className="mt-2 font-mono text-[10px] leading-relaxed text-faint">
          {selectedModel.priceNote}
        </p>
      ) : null}

      <ul className="mt-8 border-t border-hairline">
        {comparisonRows.map((row) => (
          <li
            key={row.model.id}
            className="border-b border-hairline py-4 first:border-t-0"
          >
            <button
              type="button"
              className="w-full cursor-pointer text-left"
              onClick={() => onSelectModel(row.model.id)}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[11px] text-text-2">
                  {row.model.name}
                </span>
                <span className="font-mono text-[11px] text-faint">
                  {row.model.tokenizer}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span className="font-mono text-[12px] text-muted">
                  {currencySymbol}
                  {formatCostInteger(row.cost, currency)}
                </span>
                <span className="font-mono text-[12px] text-muted">
                  {row.delta === 0
                    ? "same price"
                    : formatCostDelta(row.delta, currency)}
                </span>
              </div>
              {row.model.priceNote ? (
                <p className="mt-2 font-mono text-[10px] leading-relaxed text-faint">
                  {row.model.priceNote}
                </p>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-8 space-y-1 font-mono text-[11px] text-muted">
        <p className="flex flex-wrap items-baseline gap-x-1">
          <InlineEditableNumber
            value={requestsPerDay}
            onCommit={onRequestsPerDayChange}
            clamp={clampRequestsPerDay}
            format={formatCount}
            ariaLabel="requests per day"
          />
          <span>requests / day</span>
        </p>
        <p className="flex flex-wrap items-baseline gap-x-1">
          <InlineEditableNumber
            value={outputTokens}
            onCommit={onReplyTokensChange}
            clamp={clampReplyTokens}
            format={formatCount}
            ariaLabel="reply tokens"
          />
          <span>token replies</span>
        </p>
      </div>
      <p className="mt-6 font-mono text-[10px] leading-relaxed text-faint">
        Prices as of {PRICES_AS_OF} · FX ₹{FX_INR_PER_USD.toFixed(2)} / $1 ·
        30-day month
      </p>
    </aside>
  );
}