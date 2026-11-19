"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { promptSections, type PromptSection, type SectionId } from "@/data/sample";
import type { PromptToken } from "@/lib/tokens";
import type {
  TokenizeWorkerRequest,
  TokenizeWorkerResponse,
} from "@/workers/tokenize.worker";

const DEBOUNCE_MS = 120;

export type TokenizedSection = PromptSection & {
  tokens: PromptToken[];
  setText: (text: string) => void;
};

function initialTexts(): Record<SectionId, string> {
  return Object.fromEntries(
    promptSections.map((section) => [section.id, section.text]),
  ) as Record<SectionId, string>;
}

function emptyTokens(): Record<SectionId, PromptToken[]> {
  const out = {} as Record<SectionId, PromptToken[]>;
  for (const section of promptSections) {
    out[section.id] = [];
  }
  return out;
}

export function useTokens() {
  const [texts, setTexts] = useState<Record<SectionId, string>>(initialTexts);
  const [tokensBySection, setTokensBySection] =
    useState<Record<SectionId, PromptToken[]>>(emptyTokens);
  const [isReady, setIsReady] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textsRef = useRef(texts);

  textsRef.current = texts;

  const postTokenize = useCallback((sections: string[]) => {
    const worker = workerRef.current;
    if (!worker) return;
    const requestId = ++requestIdRef.current;
    const message: TokenizeWorkerRequest = { requestId, sections };
    worker.postMessage(message);
  }, []);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/tokenize.worker.ts", import.meta.url),
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<TokenizeWorkerResponse>) => {
      const { requestId, sections } = event.data;
      if (requestId !== requestIdRef.current) return;

      setTokensBySection(
        Object.fromEntries(
          promptSections.map((section, index) => [
            section.id,
            sections[index] ?? [],
          ]),
        ) as Record<SectionId, PromptToken[]>,
      );
      setIsReady(true);
    };

    postTokenize(promptSections.map((section) => section.text));

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [postTokenize]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      postTokenize(promptSections.map((section) => textsRef.current[section.id]));
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [texts, postTokenize]);

  const setSectionText = useCallback((id: SectionId, text: string) => {
    setTexts((prev) => ({ ...prev, [id]: text }));
  }, []);

  const sections: TokenizedSection[] = useMemo(
    () =>
      promptSections.map((section) => ({
        ...section,
        text: texts[section.id],
        tokens: tokensBySection[section.id],
        setText: (text: string) => setSectionText(section.id, text),
      })),
    [texts, tokensBySection, setSectionText],
  );

  const total = useMemo(
    () => sections.reduce((sum, section) => sum + section.tokens.length, 0),
    [sections],
  );

  return { sections, total, isReady };
}