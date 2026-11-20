import type { SectionId } from "./sample";

export const sectionTokenCounts: Record<SectionId, number> = {
  system: 147,
  example1: 128,
  example2: 119,
  user: 20,
};

export const totalTokens = 414;
export const encodingName = "o200k_base";

export const selectedModelLabel = "GPT-6.2 Sol · estimated";
export const selectedModelShort = "GPT-6.2 Sol estimated";

export const monthlyCostInr = 63_317;

export const marginNote = {
  savingsInr: 1_997,
  model: "GPT-6.2 Sol",
};

export const ledgerComparisons = [
  {
    name: "Gemini 3.8 Flash",
    tier: "estimated" as const,
    costInr: 25_376,
    deltaInr: -37_941,
  },
  {
    name: "Claude Sonnet 5.5",
    tier: "estimated" as const,
    costInr: 67_669,
    deltaInr: 4_352,
  },
  {
    name: "GPT-5.6 Terra",
    tier: "exact" as const,
    costInr: 70_571,
    deltaInr: 7_254,
  },
];

export const usageAssumptions = {
  requestsPerDay: 5_000,
  replyTokens: 400,
};

export const pricingFootnote = {
  asOf: "20 Nov 2026",
  fxInrPerUsd: 93.44,
};