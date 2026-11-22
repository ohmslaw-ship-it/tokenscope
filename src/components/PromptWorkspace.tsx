"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { CompareView } from "@/components/CompareView";
import { CostHero } from "@/components/CostHero";
import { EntranceBlock, PageEntranceProvider } from "@/components/PageEntrance";
import { RequestFlow } from "@/components/RequestFlow";
import { TopBar, type WorkspaceView } from "@/components/TopBar";
import { usePageEntrance } from "@/hooks/usePageEntrance";
import { ENTRANCE_DELAYS_MS } from "@/lib/entrance";
import { defaultModelId, getModelById } from "@/data/models";
import type { SectionId } from "@/data/sample";
import { useTokens } from "@/hooks/useTokens";
import {
  DEFAULT_REPLY_TOKENS,
  DEFAULT_REQUESTS_PER_DAY,
  type CostCurrency,
} from "@/lib/cost";
import { savePersistedWorkspace, type PersistedWorkspace } from "@/lib/persist";
import { analyze, applySuggestionToText, type Suggestion } from "@/lib/trim";

const UNDO_MS = 6_000;
const PERSIST_DEBOUNCE_MS = 400;

type UndoState = {
  sectionId: SectionId;
  previousText: string;
};

export function PromptWorkspace() {
  const restoreRef = useRef(false);
  const [modelId, setModelId] = useState(defaultModelId);
  const [currency, setCurrency] = useState<CostCurrency>("INR");
  const [requestsPerDay, setRequestsPerDay] = useState(DEFAULT_REQUESTS_PER_DAY);
  const [replyTokens, setReplyTokens] = useState(DEFAULT_REPLY_TOKENS);

  const onRestore = useCallback(
    (data: {
      presetId: string;
      modelId: string;
      currency: CostCurrency;
      requestsPerDay: number;
      replyTokens: number;
    }) => {
      if (restoreRef.current) return;
      restoreRef.current = true;
      setModelId(data.modelId);
      setCurrency(data.currency);
      setRequestsPerDay(data.requestsPerDay);
      setReplyTokens(data.replyTokens);
    },
    [],
  );

  const {
    sections,
    total,
    isReady: tokenReady,
    activePreset,
    isEdited,
    loadPreset,
    resetToPreset,
    presetId,
  } = useTokens({ onRestore });

  const textsForPersist = useMemo(
    () =>
      Object.fromEntries(sections.map((s) => [s.id, s.text])) as Record<
        SectionId,
        string
      >,
    [sections],
  );

  const entrance = usePageEntrance(tokenReady);
  const [view, setView] = useState<WorkspaceView>("inspect");
  const [hoveredSuggestionId, setHoveredSuggestionId] = useState<string | null>(null);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const selectedModel = getModelById(modelId);

  const promptSectionsForAnalyze = useMemo(
    () => sections.map(({ id, label, text }) => ({ id, label, text })),
    [sections],
  );

  const suggestions = useMemo(
    () => analyze(promptSectionsForAnalyze),
    [promptSectionsForAnalyze],
  );

  const hoveredSuggestion = useMemo(
    () => suggestions.find((suggestion) => suggestion.id === hoveredSuggestionId) ?? null,
    [suggestions, hoveredSuggestionId],
  );

  const handleApply = useCallback(
    (suggestion: Suggestion) => {
      const section = sections.find((item) => item.id === suggestion.sectionId);
      if (!section) return;
      const previousText = section.text;
      const nextText = applySuggestionToText(
        section.text,
        suggestion.ranges,
        suggestion.replacement,
      );
      setUndo({ sectionId: suggestion.sectionId, previousText });
      section.setText(nextText);
      setHoveredSuggestionId(null);
    },
    [sections],
  );

  const handleUndo = useCallback(() => {
    if (!undo) return;
    const section = sections.find((item) => item.id === undo.sectionId);
    if (section) section.setText(undo.previousText);
    setUndo(null);
  }, [sections, undo]);

  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [undo]);

  const handleSelectPreset = useCallback(
    (nextPresetId: string) => {
      const nextReply = loadPreset(nextPresetId);
      if (nextReply !== undefined) setReplyTokens(nextReply);
    },
    [loadPreset],
  );

  const handleResetSample = useCallback(() => {
    const nextReply = resetToPreset();
    if (nextReply !== undefined) setReplyTokens(nextReply);
  }, [resetToPreset]);

  useEffect(() => {
    const payload: PersistedWorkspace = {
      presetId,
      texts: textsForPersist,
      modelId,
      currency,
      requestsPerDay,
      replyTokens,
    };
    const timer = setTimeout(() => savePersistedWorkspace(payload), PERSIST_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [presetId, textsForPersist, modelId, currency, requestsPerDay, replyTokens]);

  return (
    <PageEntranceProvider value={entrance}>
      <div className="relative min-h-screen bg-bg min-[1100px]:h-screen min-[1100px]:overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none fixed top-[-380px] left-[-200px] z-0 h-[900px] w-[1300px]"
          style={{
            background:
              "radial-gradient(closest-side, rgba(40,70,130,.32), transparent)",
          }}
        />
        <div className="relative z-10 min-h-screen min-[1100px]:h-full">
          <div className="px-6 min-[1100px]:px-16">
            <EntranceBlock delayMs={ENTRANCE_DELAYS_MS.topBar}>
              <TopBar
                view={view}
                onViewChange={setView}
                selectedModel={selectedModel}
                onSelectModel={setModelId}
                currency={currency}
                onCurrencyChange={setCurrency}
                usedTokens={total + replyTokens}
                contextWindow={selectedModel.contextWindow}
                presetId={presetId}
                presetName={activePreset.name}
                presetEdited={isEdited}
                onSelectPreset={handleSelectPreset}
              />
            </EntranceBlock>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: entrance.reducedMotion ? 0 : 0.2,
              }}
            >
              {view === "inspect" ? (
                <>
                  <div className="px-6 pt-8 min-[1100px]:absolute min-[1100px]:inset-x-16 min-[1100px]:top-[110px] min-[1100px]:px-0 min-[1100px]:pt-0">
                    <CostHero
                      selectedModel={selectedModel}
                      inputTokens={total}
                      outputTokens={replyTokens}
                      requestsPerDay={requestsPerDay}
                      onRequestsPerDayChange={setRequestsPerDay}
                      currency={currency}
                      onSelectModel={setModelId}
                      costFlowReady={entrance.costFlowReady}
                      animateCostRoll={!entrance.reducedMotion}
                    />
                  </div>
                  <RequestFlow
                    sections={sections}
                    model={selectedModel}
                    currency={currency}
                    costFlowReady={entrance.costFlowReady}
                    animateCostRoll={!entrance.reducedMotion}
                    replyTokens={replyTokens}
                    onReplyTokensChange={setReplyTokens}
                    requestsPerDay={requestsPerDay}
                    suggestions={suggestions}
                    undoSectionId={undo?.sectionId ?? null}
                    hoveredSuggestion={hoveredSuggestion}
                    onHoverSuggestion={setHoveredSuggestionId}
                    onApply={handleApply}
                    onUndo={handleUndo}
                    showResetSample={isEdited}
                    onResetSample={handleResetSample}
                  />
                </>
              ) : (
                <div className="px-6 pt-8 min-[1100px]:absolute min-[1100px]:inset-x-16 min-[1100px]:top-[110px] min-[1100px]:px-0 min-[1100px]:pt-0">
                  <CompareView
                    sections={sections}
                    selectedModel={selectedModel}
                    inputTokens={total}
                    outputTokens={replyTokens}
                    requestsPerDay={requestsPerDay}
                    currency={currency}
                    onSelectModel={setModelId}
                    onViewChange={setView}
                    costFlowReady={entrance.costFlowReady}
                    animateCostRoll={!entrance.reducedMotion}
                    showResetSample={isEdited}
                    onResetSample={handleResetSample}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </PageEntranceProvider>
  );
}