"use client";

import { useMemo } from "react";

import { InlineEditableNumber } from "@/components/InlineEditableNumber";
import { SplitCostNumber } from "@/components/SplitCostNumber";
import { models, type ModelDefinition } from "@/data/models";
import {
  clampRequestsPerDay,
  formatCostInteger,
  monthlyCostUsd,
  monthlyDisplayValue,
  requestCostParts,
  usdToInr,
  type CostCurrency,
} from "@/lib/cost";

const formatCount = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

type CostHeroProps = {
  selectedModel: ModelDefinition;
  inputTokens: number;
  outputTokens: number;
  requestsPerDay: number;
  onRequestsPerDayChange: (value: number) => void;
  currency: CostCurrency;
  onSelectModel: (id: string) => void;
  costsReady: boolean;
};

export function CostHero({
  selectedModel,
  inputTokens,
  outputTokens,
  requestsPerDay,
  onRequestsPerDayChange,
  currency,
  onSelectModel,
  costsReady,
}: CostHeroProps) {
  const symbol = currency === "INR" ? "₹" : "$";

  const heroValue = useMemo(() => {
    const usd = monthlyCostUsd(
      selectedModel,
      inputTokens,
      outputTokens,
      requestsPerDay,
    );
    const amount = currency === "INR" ? usdToInr(usd) : usd;
    return Math.round(amount * 100) / 100;
  }, [selectedModel, inputTokens, outputTokens, requestsPerDay, currency]);

  const replyShare = useMemo(() => {
    const parts = requestCostParts(selectedModel, inputTokens, outputTokens);
    return Math.round(parts.replyShare * 1000) / 10;
  }, [selectedModel, inputTokens, outputTokens]);

  const rows = useMemo(() => {
    const selectedCost = monthlyDisplayValue(
      selectedModel,
      inputTokens,
      outputTokens,
      requestsPerDay,
      currency,
    );
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
        return { model, cost, same: cost === selectedCost };
      })
      .sort((a, b) => a.cost - b.cost);
  }, [selectedModel, inputTokens, outputTokens, requestsPerDay, currency]);

  return (
    <section className="flex flex-col gap-10 min-[1100px]:flex-row min-[1100px]:items-end min-[1100px]:justify-between min-[1100px]:gap-12">
      <div className="min-w-0">
        <div
          className="text-text-hi"
          style={{ fontSize: "clamp(32px, 10.5vw, 150px)" }}
        >
          <SplitCostNumber
            amount={heroValue}
            currency={currency}
            costsReady={costsReady}
            symbol={symbol}
            variant="hero"
          />
        </div>
        <p className="mt-[24px] text-[15px] text-muted">
          per month on{" "}
          <span className="font-medium text-text">{selectedModel.name}</span> at{" "}
          <InlineEditableNumber
            value={requestsPerDay}
            onCommit={onRequestsPerDayChange}
            clamp={clampRequestsPerDay}
            format={formatCount}
            ariaLabel="requests per day"
            className="font-medium text-text"
          />{" "}
          requests a day
          {costsReady ? (
            <> · {replyShare.toFixed(1)}% is the reply</>
          ) : null}
        </p>
        {selectedModel.priceNote ? (
          <p className="mt-2 text-[13px] text-muted">{selectedModel.priceNote}</p>
        ) : null}
      </div>

      <div className="w-full shrink-0 min-[1100px]:w-[280px]">
        {rows.map((row) => (
          <button
            key={row.model.id}
            type="button"
            onClick={() => onSelectModel(row.model.id)}
            className="group flex w-full items-baseline justify-between gap-6 py-[9px] text-left"
          >
            <span className="text-[13px] text-muted transition-colors group-hover:text-text-hi">
              {row.model.name}
            </span>
            <span
              className={`cost-tabular whitespace-nowrap ${row.same ? "text-[13px] text-muted" : "text-[12.5px] text-text"}`}
            >
              {!costsReady
                ? ""
                : row.same
                  ? "same price"
                  : `${symbol}${formatCostInteger(row.cost, currency)}`}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
