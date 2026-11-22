"use client";

import NumberFlow, { NumberFlowGroup } from "@number-flow/react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  costFlowLocale,
  costFlowUsesDecimals,
  formatCostInteger,
  splitCostAmount,
  type CostCurrency,
} from "@/lib/cost";

type SplitCostNumberProps = {
  amount: number;
  currency: CostCurrency;
  costsReady: boolean;
  animateRoll?: boolean;
  symbol: string;
  variant: "hero" | "reply" | "compare";
  announceLabel?: string;
};

function accessibleCostPhrase(
  amount: number,
  currency: CostCurrency,
  symbol: string,
): string {
  const rounded = Math.round(amount * 100) / 100;
  if (currency === "INR" || rounded >= 1_000) {
    return `${symbol}${formatCostInteger(rounded, currency)}`;
  }
  return `${symbol}${rounded.toFixed(2)}`;
}

export function SplitCostNumber({
  amount,
  currency,
  costsReady,
  animateRoll = true,
  symbol,
  variant,
  announceLabel,
}: SplitCostNumberProps) {
  const value = costsReady ? amount : 0;
  const flowProps = { animated: animateRoll, willChange: animateRoll } as const;
  const { whole, fraction } = splitCostAmount(value);
  const locale = costFlowLocale(currency);
  const slotClass =
    variant === "hero"
      ? "hero-cost-slot"
      : variant === "compare"
        ? "compare-cost-slot"
        : "reply-cost-slot";
  const fracSlotClass =
    variant === "hero"
      ? "hero-cost-frac-slot"
      : variant === "compare"
        ? "compare-cost-frac-slot"
        : "reply-cost-frac-slot";

  const showFraction =
    variant === "hero" ||
    variant === "compare" ||
    costFlowUsesDecimals(currency, value);

  const debouncedValue = useDebouncedValue(value, 600);
  const announced = costsReady
    ? accessibleCostPhrase(debouncedValue, currency, symbol)
    : accessibleCostPhrase(0, currency, symbol);

  const wholeFlow = (
    <span className={slotClass} aria-hidden>
      <NumberFlow
        value={whole}
        locales={locale}
        format={{ maximumFractionDigits: 0 }}
        {...flowProps}
      />
    </span>
  );

  const fractionFlow = (
    <span className={fracSlotClass} aria-hidden>
      <NumberFlow
        value={fraction}
        locales="en-US"
        format={{ minimumIntegerDigits: 2, useGrouping: false }}
        prefix="."
        {...flowProps}
      />
    </span>
  );

  const rowClass =
    variant === "hero"
      ? "hero-cost cost-tabular"
      : variant === "compare"
        ? "compare-cost cost-tabular"
        : "reply-cost cost-tabular";
  const symbolClass =
    variant === "hero"
      ? "hero-cost-symbol"
      : variant === "compare"
        ? "compare-cost-symbol"
        : "reply-cost-symbol";

  return (
    <>
      <p className={rowClass} aria-hidden>
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
      <span className="sr-only" aria-live="polite">
        {announceLabel ? `${announceLabel}: ` : ""}
        {announced} per month
      </span>
    </>
  );
}