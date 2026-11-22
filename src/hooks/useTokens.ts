"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  defaultPresetId,
  getPresetById,
  labelsFromPreset,
  presetTextsMatch,
  textsFromPreset,
  type PromptSection,
  type SectionId,
} from "@/data/sample";
import { loadPersistedWorkspace } from "@/lib/persist";
import type { PromptToken } from "@/lib/tokens";
import type {
  TokenizeWorkerRequest,
  TokenizeWorkerResponse,
} from "@/workers/tokenize.worker";

const DEBOUNCE_MS = 120;
const SECTION_IDS: SectionId[] = ["system", "example1", "example2", "user"];

export type TokenizedSection = PromptSection & {
  tokens: PromptToken[];
  setText: (text: string) => void;
};

function emptyTokens(): Record<SectionId, PromptToken[]> {
  const out = {} as Record<SectionId, PromptToken[]>;
  for (const id of SECTION_IDS) {
    out[id] = [];
  }
  return out;
}

function snapshotTexts(source: Record<SectionId, string>) {
  return SECTION_IDS.map((id) => source[id]).join("\x00");
}

export type WorkspaceRestore = {
  presetId: string;
  modelId: string;
  currency: import("@/lib/cost").CostCurrency;
  requestsPerDay: number;
  replyTokens: number;
};

type UseTokensOptions = {
  onRestore?: (data: WorkspaceRestore) => void;
};

export function useTokens(options?: UseTokensOptions) {
  const [presetId, setPresetId] = useState(defaultPresetId);
  const [texts, setTexts] = useState<Record<SectionId, string>>(() =>
    textsFromPreset(defaultPresetId),
  );
  const [tokensBySection, setTokensBySection] =
    useState<Record<SectionId, PromptToken[]>>(emptyTokens);
  const [isReady, setIsReady] = useState(false);
  const [clientInitDone, setClientInitDone] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textsRef = useRef(texts);
  const lastSentSnapshotRef = useRef<string | null>(null);
  const skipDebounceRef = useRef(false);

  const activePreset = getPresetById(presetId) ?? getPresetById(defaultPresetId)!;
  const sectionMeta = useMemo(() => {
    const labels = labelsFromPreset(presetId);
    return SECTION_IDS.map((id) => ({
      id,
      label: labels[id],
    }));
  }, [presetId]);

  const isEdited = useMemo(
    () => !presetTextsMatch(presetId, texts),
    [presetId, texts],
  );

  const onRestoreRef = useRef(options?.onRestore);
  onRestoreRef.current = options?.onRestore;

  useLayoutEffect(() => {
    const saved = loadPersistedWorkspace();
    if (saved) {
      setPresetId(saved.presetId);
      setTexts(saved.texts);
      textsRef.current = saved.texts;
      onRestoreRef.current?.({
        presetId: saved.presetId,
        modelId: saved.modelId,
        currency: saved.currency,
        requestsPerDay: saved.requestsPerDay,
        replyTokens: saved.replyTokens,
      });
    }
    setClientInitDone(true);
  }, []);

  const postTokenize = useCallback((sections: string[]) => {
    const worker = workerRef.current;
    if (!worker) return;
    const requestId = ++requestIdRef.current;
    const message: TokenizeWorkerRequest = { requestId, sections };
    worker.postMessage(message);
  }, []);

  useEffect(() => {
    if (!clientInitDone) return;

    const worker = new Worker(
      new URL("../workers/tokenize.worker.ts", import.meta.url),
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<TokenizeWorkerResponse>) => {
      const { requestId, sections } = event.data;
      if (requestId !== requestIdRef.current) return;

      setTokensBySection(
        Object.fromEntries(
          SECTION_IDS.map((id, index) => [id, sections[index] ?? []]),
        ) as Record<SectionId, PromptToken[]>,
      );
      setIsReady(true);
    };

    const initial = SECTION_IDS.map((id) => textsRef.current[id]);
    postTokenize(initial);
    lastSentSnapshotRef.current = snapshotTexts(textsRef.current);

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [clientInitDone, postTokenize]);

  useEffect(() => {
    if (!clientInitDone) return;
    textsRef.current = texts;
    const snapshot = snapshotTexts(texts);
    if (snapshot === lastSentSnapshotRef.current) return;

    if (skipDebounceRef.current) {
      skipDebounceRef.current = false;
      lastSentSnapshotRef.current = snapshotTexts(textsRef.current);
      postTokenize(SECTION_IDS.map((id) => textsRef.current[id]));
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      lastSentSnapshotRef.current = snapshotTexts(textsRef.current);
      postTokenize(SECTION_IDS.map((id) => textsRef.current[id]));
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [texts, postTokenize, clientInitDone]);

  const setSectionText = useCallback((id: SectionId, text: string) => {
    setTexts((prev) => ({ ...prev, [id]: text }));
  }, []);

  const loadPreset = useCallback(
    (nextPresetId: string) => {
      const preset = getPresetById(nextPresetId);
      if (!preset) return;
      const nextTexts = textsFromPreset(nextPresetId);
      skipDebounceRef.current = true;
      setPresetId(nextPresetId);
      setTexts(nextTexts);
      textsRef.current = nextTexts;
      lastSentSnapshotRef.current = snapshotTexts(nextTexts);
      postTokenize(SECTION_IDS.map((id) => nextTexts[id]));
      return preset.replyTokens;
    },
    [postTokenize],
  );

  const resetToPreset = useCallback(() => {
    const reply = loadPreset(presetId);
    return reply;
  }, [loadPreset, presetId]);

  const sections: TokenizedSection[] = useMemo(
    () =>
      sectionMeta.map((section) => ({
        ...section,
        text: texts[section.id],
        tokens: tokensBySection[section.id],
        setText: (text: string) => setSectionText(section.id, text),
      })),
    [texts, tokensBySection, setSectionText, sectionMeta],
  );

  const total = useMemo(
    () => sections.reduce((sum, section) => sum + section.tokens.length, 0),
    [sections],
  );

  return {
    sections,
    total,
    isReady: clientInitDone && isReady,
    presetId,
    activePreset,
    isEdited,
    loadPreset,
    resetToPreset,
  };
}