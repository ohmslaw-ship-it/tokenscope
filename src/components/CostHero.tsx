"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

import { EntranceBlock, usePageEntranceContext } from "@/components/PageEntrance";
import { PriceFootnote } from "@/components/PriceFootnote";
import { InlineEditableNumber } from "@/components/InlineEditableNumber";
import { SplitCostNumber } from "@/components/SplitCostNumber";
import { models, type ModelDefinition } from "@/data/models";
import {
  ENTRANCE_DURATION_S,
  ENTRANCE_EASE,
  ENTRANCE_REDUCE_DURATION_S,
  ENTRANCE_Y,
  ENTRANCE_DELAYS_MS,
} from "@/lib/entrance";
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
  costFlowReady: boolean;
  animateCostRoll: boolean;
};

export function CostHero({
  selectedModel,
  inputTokens,
  outputTokens,
  requestsPerDay,
  onRequestsPerDayChange,
  currency,
  onSelectModel,
  costFlowReady,
  animateCostRoll,
}: CostHeroProps) {
  const { pageReady, reducedMotion } = usePageEntranceContext();
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
      <EntranceBlock delayMs={ENTRANCE_DELAYS_MS.hero} className="min-w-0">
        <div
          className="text-text-hi"
          style={{ fontSize: "clamp(32px, 10.5vw, 150px)" }}
        >
          <SplitCostNumber
            amount={heroValue}
            currency={currency}
            costsReady={costFlowReady}
            animateRoll={animateCostRoll}
            symbol={symbol}
            variant="hero"
            announceLabel="Estimated monthly cost"
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
          {costFlowReady ? (
            <> · {Number.isFinite(replyShare) ? replyShare.toFixed(1) : "0.0"}% is the reply</>
          ) : null}
        </p>
        {selectedModel.priceNote ? (
          <p className="mt-2 text-[13px] text-muted">{selectedModel.priceNote}</p>
        ) : null}
        <PriceFootnote className="mt-4 min-[1100px]:mt-5" />
      </EntranceBlock>

      <div className="w-full shrink-0 min-[1100px]:w-[280px]">
        {rows.map((row, index) => (
          <motion.button
            key={row.model.id}
            type="button"
            onClick={() => onSelectModel(row.model.id)}
            className="group flex w-full items-baseline justify-between gap-6 py-[9px] text-left"
            initial={{ opacity: 0, y: reducedMotion ? 0 : ENTRANCE_Y }}
            animate={
              pageReady
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: reducedMotion ? 0 : ENTRANCE_Y }
            }
            transition={{
              delay: reducedMotion
                ? 0
                : (ENTRANCE_DELAYS_MS.modelRows +
                    index * ENTRANCE_DELAYS_MS.modelRowStagger) /
                  1000,
              duration: reducedMotion ? ENTRANCE_REDUCE_DURATION_S : ENTRANCE_DURATION_S,
              ease: ENTRANCE_EASE,
            }}
          >
            <span className="text-[13px] text-muted transition-colors group-hover:text-text-hi">
              {row.model.name}
            </span>
            <span
              className={`cost-tabular whitespace-nowrap ${row.same ? "text-[13px] text-muted" : "text-[12.5px] text-text"}`}
            >
              {!costFlowReady
                ? ""
                : row.same
                  ? "same price"
                  : `${symbol}${formatCostInteger(row.cost, currency)}`}
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}