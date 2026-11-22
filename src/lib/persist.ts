import { defaultModelId, getModelById } from "@/data/models";
import {
  defaultPresetId,
  getPresetById,
  type SectionId,
} from "@/data/sample";
import {
  clampReplyTokens,
  clampRequestsPerDay,
  DEFAULT_REPLY_TOKENS,
  DEFAULT_REQUESTS_PER_DAY,
  type CostCurrency,
} from "@/lib/cost";

export const STORAGE_KEY = "tokenscope:v1";

export type PersistedWorkspace = {
  presetId: string;
  texts: Record<SectionId, string>;
  modelId: string;
  currency: CostCurrency;
  requestsPerDay: number;
  replyTokens: number;
};

const SECTION_IDS: SectionId[] = ["system", "example1", "example2", "user"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidTexts(value: unknown): value is Record<SectionId, string> {
  if (!isRecord(value)) return false;
  return SECTION_IDS.every((id) => typeof value[id] === "string");
}

export function loadPersistedWorkspace(): PersistedWorkspace | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;

    const presetId = parsed.presetId;
    const texts = parsed.texts;
    const modelId = parsed.modelId;
    const currency = parsed.currency;
    const requestsPerDay = parsed.requestsPerDay;
    const replyTokens = parsed.replyTokens;

    if (typeof presetId !== "string" || !getPresetById(presetId)) return null;
    if (!isValidTexts(texts)) return null;
    if (typeof modelId !== "string" || !getModelById(modelId)) return null;
    if (currency !== "INR" && currency !== "USD") return null;
    if (typeof requestsPerDay !== "number" || !Number.isFinite(requestsPerDay))
      return null;
    if (typeof replyTokens !== "number" || !Number.isFinite(replyTokens))
      return null;

    return {
      presetId,
      texts,
      modelId,
      currency,
      requestsPerDay: clampRequestsPerDay(requestsPerDay),
      replyTokens: clampReplyTokens(replyTokens),
    };
  } catch {
    return null;
  }
}

export function savePersistedWorkspace(data: PersistedWorkspace): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // private mode, quota, etc.
  }
}

export function defaultWorkspaceSnapshot(
  texts: Record<SectionId, string>,
): PersistedWorkspace {
  return {
    presetId: defaultPresetId,
    texts,
    modelId: defaultModelId,
    currency: "INR",
    requestsPerDay: DEFAULT_REQUESTS_PER_DAY,
    replyTokens: DEFAULT_REPLY_TOKENS,
  };
}
