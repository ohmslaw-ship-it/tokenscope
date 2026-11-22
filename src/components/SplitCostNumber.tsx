"use client";

import NumberFlow, { NumberFlowGroup } from "@number-flow/react";

import {
  costFlowLocale,
  costFlowUsesDecimals,
  splitCostAmount,
  type CostCurrency,
} from "@/lib/cost";

type SplitCostNumberProps = {
  amount: number;
  currency: CostCurrency;
  costsReady: boolean;
  animateRoll?: boolean;
  symbol: string;
  variant: "hero" | "reply";
};

export function SplitCostNumber({
  amount,
  currency,
  costsReady,
  animateRoll = true,
  symbol,
  variant,
}: SplitCostNumberProps) {
  const value = costsReady ? amount : 0;
  const flowProps = { animated: animateRoll, willChange: animateRoll } as const;
  const { whole, fraction } = splitCostAmount(value);
  const locale = costFlowLocale(currency);
  const showFraction =
    variant === "hero" || costFlowUsesDecimals(currency, value);

  const wholeFlow = (
    <span className={variant === "hero" ? "hero-cost-slot" : "reply-cost-slot"}>
      <NumberFlow
        value={whole}
        locales={locale}
        format={{ maximumFractionDigits: 0 }}
        {...flowProps}
      />
    </span>
  );

  const fractionFlow = (
    <span
      className={
        variant === "hero" ? "hero-cost-frac-slot" : "reply-cost-frac-slot"
      }
    >
      <NumberFlow
        value={fraction}
        locales="en-US"
        format={{ minimumIntegerDigits: 2, useGrouping: false }}
        prefix="."
        {...flowProps}
      />
    </span>
  );

  const rowClass = variant === "hero" ? "hero-cost cost-tabular" : "reply-cost cost-tabular";
  const symbolClass =
    variant === "hero" ? "hero-cost-symbol" : "reply-cost-symbol";

  return (
    <p className={rowClass}>
      <span className={symbolClass}>{symbol}</span>
      {showFraction ? (
        <NumberFlowGroup>
          {wholeFlow}
          {fractionFlow}
        </NumberFlowGroup>
      ) : (
        wholeFlow
      )}
    </p>
  );
}