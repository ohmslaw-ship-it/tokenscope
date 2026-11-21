"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

import { Ledger } from "@/components/Ledger";
import { MarginGutter } from "@/components/MarginGutter";
import { AppliedMarginNote, MarginNote } from "@/components/MarginNote";
import { EditablePromptSection, PromptFooter } from "@/components/PromptDocument";
import { ContextBar } from "@/components/ContextBar";
import { TopBar } from "@/components/TopBar";
import { defaultModelId, getModelById } from "@/data/models";
import type { SectionId } from "@/data/sample";
import { useTokens } from "@/hooks/useTokens";
import {
  DEFAULT_REPLY_TOKENS,
  DEFAULT_REQUESTS_PER_DAY,
  type CostCurrency,
} from "@/lib/cost";
import {
  analyze,
  applySuggestionToText,
  charRangesToTokenIndices,
  type Suggestion,
} from "@/lib/trim";

const sectionSpacing = "pt-8";
const gridColumns = "140px 680px 200px 240px";
const UNDO_MS = 6_000;

type UndoState = {
  sectionId: SectionId;
  previousText: string;
};

export function PromptWorkspace() {
  const { sections, total } = useTokens();
  const [modelId, setModelId] = useState(defaultModelId);
  const [currency, setCurrency] = useState<CostCurrency>("INR");
  const [requestsPerDay, setRequestsPerDay] = useState(DEFAULT_REQUESTS_PER_DAY);
  const [replyTokens, setReplyTokens] = useState(DEFAULT_REPLY_TOKENS);
  const selectedModel = getModelById(modelId);
  const [sectionHeights, setSectionHeights] = useState<
    Partial<Record<SectionId, number>>
  >({});
  const [hoveredSuggestionId, setHoveredSuggestionId] = useState<string | null>(
    null,
  );
  const [undo, setUndo] = useState<UndoState | null>(null);

  const promptSectionsForAnalyze = useMemo(
    () =>
      sections.map(({ id, label, text }) => ({
        id,
        label,
        text,
      })),
    [sections],
  );

  const suggestions = useMemo(
    () => analyze(promptSectionsForAnalyze),
    [promptSectionsForAnalyze],
  );

  const visibleSuggestions = useMemo(
    () => suggestions.slice(0, 3),
    [suggestions],
  );

  const hoveredSuggestion = useMemo(
    () =>
      visibleSuggestions.find((s) => s.id === hoveredSuggestionId) ?? null,
    [visibleSuggestions, hoveredSuggestionId],
  );

  const suggestionsBySection = useMemo(() => {
    const map = new Map<SectionId, Suggestion[]>();
    for (const suggestion of visibleSuggestions) {
      const list = map.get(suggestion.sectionId) ?? [];
      list.push(suggestion);
      map.set(suggestion.sectionId, list);
    }
    return map;
  }, [visibleSuggestions]);

  const tokensBySection = sections.reduce(
    (acc, section) => {
      acc[section.id] = section.tokens.length;
      return acc;
    },
    {} as Record<SectionId, number>,
  );

  const makeHeightHandler = useCallback(
    (id: SectionId) => (height: number) => {
      setSectionHeights((prev) =>
        prev[id] === height ? prev : { ...prev, [id]: height },
      );
    },
    [],
  );

  const handleApply = useCallback(
    (suggestion: Suggestion) => {
      const section = sections.find((s) => s.id === suggestion.sectionId);
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
    const section = sections.find((s) => s.id === undo.sectionId);
    if (section) {
      section.setText(undo.previousText);
    }
    setUndo(null);
  }, [sections, undo]);

  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [undo]);

  const ledgerRowSpan = sections.length + 1;

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto w-full max-w-[1280px]">
        <TopBar
          selectedModel={selectedModel}
          onSelectModel={setModelId}
          currency={currency}
          onCurrencyChange={setCurrency}
        />
        <ContextBar
          model={selectedModel}
          totalInputTokens={total}
          tokensBySection={tokensBySection}
          replyTokens={replyTokens}
        />

        <main className="pb-16 pt-10">
          <div
            className="mx-auto grid gap-x-2"
            style={{
              gridTemplateColumns: gridColumns,
              width: "fit-content",
              maxWidth: "100%",
            }}
          >
            {sections.map((section, index) => {
              const row = index + 1;
              const sectionNotes = suggestionsBySection.get(section.id) ?? [];
              const showUndo = undo?.sectionId === section.id;
              const trimHighlightIndices =
                hoveredSuggestion?.sectionId === section.id
                  ? charRangesToTokenIndices(
                      section.tokens,
                      hoveredSuggestion.ranges,
                    )
                  : undefined;

              return (
                <Fragment key={section.id}>
                  <div
                    className={index > 0 ? sectionSpacing : undefined}
                    style={{ gridColumn: 1, gridRow: row }}
                  >
                    <MarginGutter
                      sectionId={section.id}
                      label={section.label}
                      tokenCount={section.tokens.length}
                      contentHeight={sectionHeights[section.id]}
                    />
                  </div>
                  <div style={{ gridColumn: 2, gridRow: row }}>
                    <EditablePromptSection
                      text={section.text}
                      tokens={section.tokens}
                      onTextChange={section.setText}
                      offset={index > 0}
                      onHeightChange={makeHeightHandler(section.id)}
                      trimHighlightIndices={trimHighlightIndices}
                    />
                  </div>
                  <div
                    className={`${index > 0 ? sectionSpacing : ""} flex flex-col gap-4`}
                    style={{ gridColumn: 3, gridRow: row }}
                  >
                    {showUndo ? (
                      <AppliedMarginNote onUndo={handleUndo} />
                    ) : (
                      sectionNotes.map((suggestion) => (
                        <MarginNote
                          key={suggestion.id}
                          suggestion={suggestion}
                          selectedModel={selectedModel}
                          inputTokens={total}
                          outputTokens={replyTokens}
                          requestsPerDay={requestsPerDay}
                          currency={currency}
                          onApply={() => handleApply(suggestion)}
                          onHoverChange={(hovered) =>
                            setHoveredSuggestionId(
                              hovered ? suggestion.id : null,
                            )
                          }
                        />
                      ))
                    )}
                  </div>
                </Fragment>
              );
            })}

            <div
              className="sticky top-8 self-start"
              style={{
                gridColumn: 4,
                gridRow: `1 / span ${ledgerRowSpan}`,
              }}
            >
              <Ledger
                selectedModel={selectedModel}
                inputTokens={total}
                outputTokens={replyTokens}
                requestsPerDay={requestsPerDay}
                onRequestsPerDayChange={setRequestsPerDay}
                onReplyTokensChange={setReplyTokens}
                currency={currency}
                onSelectModel={setModelId}
              />
            </div>

            <div style={{ gridColumn: 2, gridRow: sections.length + 1 }}>
              <PromptFooter total={total} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}