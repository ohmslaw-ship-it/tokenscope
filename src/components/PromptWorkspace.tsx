"use client";

import { Fragment, useCallback, useState } from "react";

import { Ledger } from "@/components/Ledger";
import { MarginGutter } from "@/components/MarginGutter";
import { MarginNote } from "@/components/MarginNote";
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

const sectionSpacing = "pt-8";
const gridColumns = "140px 680px 200px 240px";

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
                    />
                  </div>
                  <div
                    className={index > 0 ? sectionSpacing : undefined}
                    style={{ gridColumn: 3, gridRow: row }}
                  >
                    {section.id === "example1" ? (
                      <MarginNote
                        selectedModel={selectedModel}
                        inputTokens={total}
                        outputTokens={replyTokens}
                        requestsPerDay={requestsPerDay}
                        example1Tokens={tokensBySection.example1}
                        currency={currency}
                      />
                    ) : null}
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