export type TokenizerTier = "exact" | "estimated";

export type LongContextPricing = {
  thresholdInput: number;
  inputMultiplier: number;
  outputMultiplier: number;
};

export type ModelDefinition = {
  id: string;
  name: string;
  tokenizer: TokenizerTier;
  contextWindow: number;
  inputPricePerM: number;
  outputPricePerM: number;
  maxInput?: number;
  longContext?: LongContextPricing;
  priceNote?: string;
  priceNoteShort?: string;
};

/** Pricing verified from provider docs fetched 20 Nov 2026. */
export const PRICES_AS_OF = "20 Nov 2026";
export const FX_INR_PER_USD = 93.44;

const openAiLongContext: LongContextPricing = {
  thresholdInput: 272_000,
  inputMultiplier: 2,
  outputMultiplier: 1.5,
};

export const models: ModelDefinition[] = [
  {
    id: "gpt-6.2-sol",
    name: "GPT-6.2 Sol",
    tokenizer: "estimated",
    contextWindow: 1_050_000,
    maxInput: 922_000,
    inputPricePerM: 2,
    outputPricePerM: 10,
    longContext: openAiLongContext,
  },
  {
    id: "gpt-6.2-astra",
    name: "GPT-6.2 Astra",
    tokenizer: "estimated",
    contextWindow: 1_050_000,
    maxInput: 922_000,
    inputPricePerM: 8,
    outputPricePerM: 40,
    longContext: openAiLongContext,
  },
  {
    id: "gpt-5.6-terra",
    name: "GPT-5.6 Terra",
    tokenizer: "exact",
    contextWindow: 1_050_000,
    maxInput: 922_000,
    inputPricePerM: 2,
    outputPricePerM: 12,
    longContext: openAiLongContext,
  },
  {
    id: "claude-sonnet-5-5",
    name: "Claude Sonnet 5.5",
    tokenizer: "estimated",
    contextWindow: 1_000_000,
    inputPricePerM: 2,
    outputPricePerM: 10,
  },
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    tokenizer: "estimated",
    contextWindow: 1_048_576,
    inputPricePerM: 0.75,
    outputPricePerM: 3.75,
    priceNote: "Promo rate until 31 Dec 2026 ($1.50 / $7.50 after)",
    priceNoteShort: "Promo rate until 31 Dec 2026",
  },
];

export const defaultModelId = models[0].id;

export function getModelById(id: string): ModelDefinition {
  return models.find((model) => model.id === id) ?? models[0];
}