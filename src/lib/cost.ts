import { FX_INR_PER_USD, type ModelDefinition } from "@/data/models";

export const DEFAULT_REQUESTS_PER_DAY = 5_000;
export const DEFAULT_REPLY_TOKENS = 400;

export const REQUESTS_PER_DAY_MIN = 1;
export const REQUESTS_PER_DAY_MAX = 10_000_000;
export const REPLY_TOKENS_MIN = 1;
export const REPLY_TOKENS_MAX = 128_000;

export type CostCurrency = "INR" | "USD";

const DAYS_PER_MONTH = 30;

export function clampRequestsPerDay(value: number): number {
  const n = Number.isFinite(value) ? Math.round(value) : DEFAULT_REQUESTS_PER_DAY;
  return Math.min(REQUESTS_PER_DAY_MAX, Math.max(REQUESTS_PER_DAY_MIN, n));
}

export function clampReplyTokens(value: number): number {
  const n = Number.isFinite(value) ? Math.round(value) : DEFAULT_REPLY_TOKENS;
  return Math.min(REPLY_TOKENS_MAX, Math.max(REPLY_TOKENS_MIN, n));
}

export function effectivePricesPerM(
  model: ModelDefinition,
  inputTokens: number,
): { input: number; output: number } {
  let inputPricePerM = model.inputPricePerM;
  let outputPricePerM = model.outputPricePerM;

  if (model.longContext && inputTokens > model.longContext.thresholdInput) {
    inputPricePerM *= model.longContext.inputMultiplier;
    outputPricePerM *= model.longContext.outputMultiplier;
  }

  return { input: inputPricePerM, output: outputPricePerM };
}

export function perRequestUSD(
  model: ModelDefinition,
  inputTokens: number,
  outputTokens: number,
): number {
  const { input, output } = effectivePricesPerM(model, inputTokens);
  return (
    (inputTokens * input) / 1_000_000 + (outputTokens * output) / 1_000_000
  );
}

export function monthlyUSD(perRequest: number, requestsPerDay: number): number {
  return perRequest * requestsPerDay * DAYS_PER_MONTH;
}

export function usdToInr(usd: number): number {
  return usd * FX_INR_PER_USD;
}

export function monthlyCostInr(
  model: ModelDefinition,
  inputTokens: number,
  outputTokens: number,
  requestsPerDay: number,
): number {
  const usd = monthlyUSD(
    perRequestUSD(model, inputTokens, outputTokens),
    requestsPerDay,
  );
  return Math.round(usdToInr(usd));
}

export function monthlyCostUsd(
  model: ModelDefinition,
  inputTokens: number,
  outputTokens: number,
  requestsPerDay: number,
): number {
  return monthlyUSD(
    perRequestUSD(model, inputTokens, outputTokens),
    requestsPerDay,
  );
}

export function displayValueFromMonthlyUsd(
  usd: number,
  currency: CostCurrency,
): number {
  if (currency === "USD") {
    return usd >= 1_000 ? Math.round(usd) : Math.round(usd * 100) / 100;
  }
  return Math.round(usdToInr(usd));
}

export function monthlyDisplayValue(
  model: ModelDefinition,
  inputTokens: number,
  outputTokens: number,
  requestsPerDay: number,
  currency: CostCurrency,
): number {
  return displayValueFromMonthlyUsd(
    monthlyCostUsd(model, inputTokens, outputTokens, requestsPerDay),
    currency,
  );
}

export type RequestCostParts = {
  inputUsd: number;
  outputUsd: number;
  totalUsd: number;
  replyShare: number;
};

/** Input vs output split for one request, including long-context pricing. */
export function requestCostParts(
  model: ModelDefinition,
  inputTokens: number,
  outputTokens: number,
): RequestCostParts {
  const totalUsd = perRequestUSD(model, inputTokens, outputTokens);
  const inputUsd = perRequestUSD(model, inputTokens, 0);
  const outputUsd = Math.max(0, totalUsd - inputUsd);
  return {
    inputUsd,
    outputUsd,
    totalUsd,
    replyShare: totalUsd > 0 ? outputUsd / totalUsd : 0,
  };
}

/** This input section's fraction of the full per-request cost. */
export function inputSectionShare(
  parts: RequestCostParts,
  sectionTokens: number,
  inputTokens: number,
): number {
  if (parts.totalUsd <= 0 || inputTokens <= 0 || sectionTokens <= 0) return 0;
  return (sectionTokens / inputTokens) * (parts.inputUsd / parts.totalUsd);
}

export function removedInputMonthlySavingsInr(
  model: ModelDefinition,
  inputTokens: number,
  outputTokens: number,
  requestsPerDay: number,
  removedInputTokens: number,
): number {
  if (removedInputTokens <= 0) return 0;
  const trimmedInput = Math.max(0, inputTokens - removedInputTokens);
  const perRequestSaved =
    perRequestUSD(model, inputTokens, outputTokens) -
    perRequestUSD(model, trimmedInput, outputTokens);
  if (perRequestSaved <= 0) return 0;
  return Math.round(usdToInr(monthlyUSD(perRequestSaved, requestsPerDay)));
}

export function removedInputMonthlySavingsDisplay(
  model: ModelDefinition,
  inputTokens: number,
  outputTokens: number,
  requestsPerDay: number,
  removedInputTokens: number,
  currency: CostCurrency,
): number {
  const inr = removedInputMonthlySavingsInr(
    model,
    inputTokens,
    outputTokens,
    requestsPerDay,
    removedInputTokens,
  );
  if (currency === "INR") return inr;
  const usd = inr / FX_INR_PER_USD;
  return usd >= 1_000 ? Math.round(usd) : Math.round(usd * 100) / 100;
}

export function formatCostInteger(
  value: number,
  currency: CostCurrency,
): string {
  if (currency === "INR") {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(Math.round(value));
  }
  if (value >= 1_000) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(Math.round(value));
  }
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCostDelta(
  delta: number,
  currency: CostCurrency,
): string {
  const sign = delta >= 0 ? "+" : "−";
  const formatted = formatCostInteger(Math.abs(delta), currency);
  const symbol = currency === "INR" ? "₹" : "$";
  return `${sign}${symbol}${formatted}`;
}

export function splitCostAmount(amount: number): {
  whole: number;
  fraction: number;
} {
  const rounded = Math.round(amount * 100) / 100;
  const whole = Math.trunc(rounded);
  const fraction = Math.round(Math.abs(rounded) * 100) % 100;
  return { whole, fraction };
}

export function costFlowLocale(currency: CostCurrency): string {
  return currency === "INR" ? "en-IN" : "en-US";
}

/** Reply panel shows a separate cents flow only for small USD amounts. */
export function costFlowUsesDecimals(
  currency: CostCurrency,
  value: number,
): boolean {
  return currency === "USD" && value < 1_000;
}

export type NumberFlowFormat = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export function numberFlowFormat(
  currency: CostCurrency,
  value: number,
): NumberFlowFormat {
  if (currency === "INR" || value >= 1_000) {
    return { maximumFractionDigits: 0 };
  }
  return { minimumFractionDigits: 2, maximumFractionDigits: 2 };
}