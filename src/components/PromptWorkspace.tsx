"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { CostHero } from "@/components/CostHero";
import { RequestFlow } from "@/components/RequestFlow";
import { TopBar } from "@/components/TopBar";
import { defaultModelId, getModelById } from "@/data/models";
import type { SectionId } from "@/data/sample";
import { useTokens } from "@/hooks/useTokens";
import {
  DEFAULT_REPLY_TOKENS,
  DEFAULT_REQUESTS_PER_DAY,
  type CostCurrency,
} from "@/lib/cost";
import { analyze, applySuggestionToText, type Suggestion } from "@/lib/trim";

const UNDO_MS = 6_000;

type UndoState = {
  sectionId: SectionId;
  previousText: string;
};

export function PromptWorkspace() {
  const { sections, total, isReady: costsReady } = useTokens();
  const [modelId, setModelId] = useState(defaultModelId);
  const [currency, setCurrency] = useState<CostCurrency>("INR");
  const [requestsPerDay, setRequestsPerDay] = useState(DEFAULT_REQUESTS_PER_DAY);
  const [replyTokens, setReplyTokens] = useState(DEFAULT_REPLY_TOKENS);
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

  return (
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
          <TopBar
            selectedModel={selectedModel}
            onSelectModel={setModelId}
            currency={currency}
            onCurrencyChange={setCurrency}
            usedTokens={total + replyTokens}
            contextWindow={selectedModel.contextWindow}
          />
        </div>
        <div className="px-6 pt-8 min-[1100px]:absolute min-[1100px]:inset-x-16 min-[1100px]:top-[110px] min-[1100px]:px-0 min-[1100px]:pt-0">
          <CostHero
            selectedModel={selectedModel}
            inputTokens={total}
            outputTokens={replyTokens}
            requestsPerDay={requestsPerDay}
            onRequestsPerDayChange={setRequestsPerDay}
            currency={currency}
            onSelectModel={setModelId}
            costsReady={costsReady}
          />
        </div>
        <RequestFlow
          sections={sections}
          model={selectedModel}
          currency={currency}
          costsReady={costsReady}
          replyTokens={replyTokens}
          onReplyTokensChange={setReplyTokens}
          requestsPerDay={requestsPerDay}
          suggestions={suggestions}
          undoSectionId={undo?.sectionId ?? null}
          hoveredSuggestion={hoveredSuggestion}
          onHoverSuggestion={setHoveredSuggestionId}
          onApply={handleApply}
          onUndo={handleUndo}
        />
      </div>
    </div>
  );
}
