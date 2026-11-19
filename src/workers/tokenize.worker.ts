/// <reference lib="webworker" />

import { decode, encode } from "gpt-tokenizer/encoding/o200k_base";

import type { PromptToken } from "@/lib/tokens";

export type TokenizeWorkerRequest = {
  requestId: number;
  sections: string[];
};

export type TokenizeWorkerResponse = {
  requestId: number;
  sections: PromptToken[][];
};

function tokenizeSection(text: string): PromptToken[] {
  return encode(text).map((id) => ({
    id,
    text: decode([id]),
  }));
}

self.onmessage = (event: MessageEvent<TokenizeWorkerRequest>) => {
  const { requestId, sections } = event.data;
  const tokenized = sections.map(tokenizeSection);
  const response: TokenizeWorkerResponse = { requestId, sections: tokenized };
  self.postMessage(response);
};