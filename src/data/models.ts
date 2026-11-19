export type TokenizerTier = "exact" | "estimated";

export type ModelDefinition = {
  id: string;
  name: string;
  tokenizer: TokenizerTier;
  contextWindow: number;
  inputPricePerM: number;
  outputPricePerM: number;
};

/** Pricing verified from provider docs fetched 20 Nov 2026. */
export const PRICES_AS_OF = "20 Nov 2026";

export const models: ModelDefinition[] = [
  {
    id: "gpt-5",
    name: "GPT-5",
    tokenizer: "exact",
    // developers.openai.com/api/docs/models/gpt-5
    contextWindow: 400_000,
    inputPricePerM: 1.25,
    outputPricePerM: 10,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    tokenizer: "exact",
    // developers.openai.com/api/docs/models/gpt-4o
    contextWindow: 128_000,
    inputPricePerM: 2.5,
    outputPricePerM: 10,
  },
  {
    id: "claude-sonnet-5-5",
    name: "Claude Sonnet 5.5",
    tokenizer: "estimated",
    // platform.claude.com/docs/en/models/overview — Claude Sonnet 5.5
    contextWindow: 1_000_000,
    inputPricePerM: 2,
    outputPricePerM: 10,
  },
  {
    id: "gemini-3-8-flash",
    name: "Gemini 3.8 Flash",
    tokenizer: "estimated",
    // aistudio.google.com/docs/models/gemini-3.8-flash; pricing paid tier through 31 Dec 2026
    contextWindow: 1_048_576,
    inputPricePerM: 0.75,
    outputPricePerM: 3.75,
  },
];

export const defaultModelId = models[0].id;

export function getModelById(id: string): ModelDefinition {
  return models.find((model) => model.id === id) ?? models[0];
}