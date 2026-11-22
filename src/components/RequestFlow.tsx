"use client";

import { useMemo, useState } from "react";

import { AnimatedShareBar, EntranceBlock } from "@/components/PageEntrance";
import { InlineEditableNumber } from "@/components/InlineEditableNumber";
import { SplitCostNumber } from "@/components/SplitCostNumber";
import { ENTRANCE_DELAYS_MS } from "@/lib/entrance";
import { AppliedMarginNote, MarginNote } from "@/components/MarginNote";
import { ResetSampleLink } from "@/components/ResetSampleLink";
import { EditablePromptSection } from "@/components/PromptDocument";
import type { ModelDefinition } from "@/data/models";
import type { SectionId } from "@/data/sample";
import type { TokenizedSection } from "@/hooks/useTokens";
import {
  clampReplyTokens,
  displayValueFromMonthlyUsd,
  inputSectionShare,
  monthlyUSD,
  requestCostParts,
  type CostCurrency,
} from "@/lib/cost";
import { charRangesToTokenIndices, type Suggestion } from "@/lib/trim";

const formatCount = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

const panelFrame =
  "flex h-auto min-h-[320px] flex-col overflow-hidden rounded-[14px] px-6 pt-6 min-[1100px]:h-full min-[1100px]:min-h-0";

const panelSurface =
  "bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_0_0_1px_rgba(255,255,255,0.035),0_10px_30px_-12px_rgba(0,0,0,0.5)]";

function PanelHeader({
  title,
  count,
  muted = false,
}: {
  title: string;
  count: number;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2
        className={`text-[14px] font-medium tracking-[-0.005em] ${muted ? "text-muted" : "text-text-hi"}`}
      >
        {title}
      </h2>
      <span className="font-mono text-[11.5px] text-muted">
        {count.toLocaleString("en-US")}
      </span>
    </div>
  );
}

function middlePanelTitle(label1: string, label2: string): string {
  if (/^Example\s+\d+$/i.test(label1) && /^Example\s+\d+$/i.test(label2)) {
    return "Examples";
  }
  return `${label1} & ${label2}`;
}

function exampleName(text: string, fallback: string): string {
  const match = text.match(/^Example\s+\d+\s*[-–—]\s*([^.!\n]+)/i);
  if (!match) return fallback;
  const raw = match[1].trim();
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

type RequestFlowProps = {
  sections: TokenizedSection[];
  model: ModelDefinition;
  currency: CostCurrency;
  replyTokens: number;
  onReplyTokensChange: (value: number) => void;
  requestsPerDay: number;
  suggestions: Suggestion[];
  undoSectionId: SectionId | null;
  hoveredSuggestion: Suggestion | null;
  onHoverSuggestion: (id: string | null) => void;
  onApply: (suggestion: Suggestion) => void;
  onUndo: () => void;
  costFlowReady: boolean;
  animateCostRoll: boolean;
  showResetSample?: boolean;
  onResetSample?: () => void;
};

export function RequestFlow({
  sections,
  model,
  currency,
  replyTokens,
  onReplyTokensChange,
  requestsPerDay,
  suggestions,
  undoSectionId,
  hoveredSuggestion,
  onHoverSuggestion,
  onApply,
  onUndo,
  costFlowReady,
  animateCostRoll,
  showResetSample,
  onResetSample,
}: RequestFlowProps) {
  const [userFocused, setUserFocused] = useState(false);
  const symbol = currency === "INR" ? "₹" : "$";

  const byId = useMemo(() => {
    return Object.fromEntries(sections.map((section) => [section.id, section])) as Record<
      SectionId,
      TokenizedSection
    >;
  }, [sections]);

  const system = byId.system;
  const example1 = byId.example1;
  const example2 = byId.example2;
  const user = byId.user;
  const inputTokens = sections.reduce((sum, section) => sum + section.tokens.length, 0);
  const parts = useMemo(
    () => requestCostParts(model, inputTokens, replyTokens),
    [model, inputTokens, replyTokens],
  );

  const replyValue = useMemo(() => {
    const usd = monthlyUSD(parts.outputUsd, requestsPerDay);
    return displayValueFromMonthlyUsd(usd, currency);
  }, [parts.outputUsd, requestsPerDay, currency]);

  const shareFor = (tokens: number) => inputSectionShare(parts, tokens, inputTokens);

  const picks = (id: SectionId, max: number) =>
    suggestions.filter((suggestion) => suggestion.sectionId === id).slice(0, max);

  const examplePicks = suggestions
    .filter(
      (suggestion) =>
        suggestion.sectionId === "example1" || suggestion.sectionId === "example2",
    )
    .slice(0, 2);

  const highlightsFor = (section: TokenizedSection) =>
    hoveredSuggestion?.sectionId === section.id
      ? charRangesToTokenIndices(section.tokens, hoveredSuggestion.ranges)
      : undefined;

  const renderTrims = (id: SectionId, items: Suggestion[]) => {
    if (undoSectionId === id) return <AppliedMarginNote onUndo={onUndo} />;
    if (items.length === 0) return null;
    return items.map((suggestion) => (
      <MarginNote
        key={suggestion.id}
        suggestion={suggestion}
        selectedModel={model}
        inputTokens={inputTokens}
        outputTokens={replyTokens}
        requestsPerDay={requestsPerDay}
        currency={currency}
        onApply={() => onApply(suggestion)}
        onHoverChange={(hovered) => onHoverSuggestion(hovered ? suggestion.id : null)}
      />
    ));
  };

  const systemTrims = renderTrims("system", picks("system", 2));
  const userTrims = renderTrims("user", picks("user", 2));

  const userShadow = userFocused
    ? "shadow-[inset_0_0_0_1px_rgba(124,196,224,0.55),inset_0_1px_0_rgba(255,255,255,0.1),0_16px_40px_-16px_rgba(0,0,0,0.6)]"
    : "shadow-[inset_0_0_0_1px_rgba(124,196,224,0.32),inset_0_1px_0_rgba(255,255,255,0.08),0_16px_40px_-16px_rgba(0,0,0,0.6)]";

  const middleTitle = middlePanelTitle(example1.label, example2.label);

  return (
    <section className="mt-12 px-6 pb-8 min-[1100px]:absolute min-[1100px]:inset-x-16 min-[1100px]:top-[404px] min-[1100px]:bottom-6 min-[1100px]:mt-0 min-[1100px]:px-0 min-[1100px]:pb-0">
      {showResetSample && onResetSample ? (
        <div className="mb-3 flex justify-end min-[1100px]:mb-2">
          <ResetSampleLink onReset={onResetSample} />
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-5 min-[700px]:max-[1099px]:grid-cols-2 min-[1100px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_250px] min-[1100px]:grid-rows-[minmax(0,1fr)] min-[1100px]:h-full">
      <EntranceBlock
        delayMs={ENTRANCE_DELAYS_MS.panelSystem}
        className={`${panelFrame} ${panelSurface}`}
      >
        <PanelHeader title={system.label} count={system.tokens.length} />
        <AnimatedShareBar share={shareFor(system.tokens.length)} />
        <div className="relative mt-[30px] -mx-6 min-h-0 flex-1 max-[1099px]:h-[340px] max-[1099px]:flex-none">
          <div className="absolute inset-0">
            <EditablePromptSection
              text={system.text}
              tokens={system.tokens}
              onTextChange={system.setText}
              trimHighlightIndices={highlightsFor(system)}
              ariaLabel={system.label}
              fadeTo="#0F1A33"
              bleed
            />
          </div>
        </div>
        {systemTrims ? <div className="pb-4">{systemTrims}</div> : null}
      </EntranceBlock>

      <EntranceBlock
        delayMs={ENTRANCE_DELAYS_MS.panelExamples}
        className={`${panelFrame} ${panelSurface}`}
      >
        <PanelHeader
          title={middleTitle}
          count={example1.tokens.length + example2.tokens.length}
        />
        <AnimatedShareBar
          share={shareFor(example1.tokens.length + example2.tokens.length)}
        />
        <div className="ink-scroll mt-5 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-6">
          {(
            [
              [example1, "Delayed shipment"],
              [example2, "Refund request"],
            ] as const
          ).map(([section, fallback]) => (
            <div key={section.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <h3 className="text-[13px] text-text">
                  {/^Example\s+\d+$/i.test(section.label)
                    ? exampleName(section.text, fallback)
                    : section.label}
                </h3>
                <span className="font-mono text-[11px] text-muted">
                  {section.tokens.length.toLocaleString("en-US")}
                </span>
              </div>
              <EditablePromptSection
                text={section.text}
                tokens={section.tokens}
                onTextChange={section.setText}
                trimHighlightIndices={highlightsFor(section)}
                mode="clip"
                ariaLabel={fallback}
              />
              {renderTrims(
                section.id,
                examplePicks.filter((suggestion) => suggestion.sectionId === section.id),
              )}
            </div>
          ))}
        </div>
      </EntranceBlock>

      <EntranceBlock
        delayMs={ENTRANCE_DELAYS_MS.panelUser}
        className={`${panelFrame} max-[639px]:min-h-0 bg-[linear-gradient(180deg,#172A50,#111F3E_60%)] ${userShadow}`}
      >
        <PanelHeader title={user.label} count={user.tokens.length} />
        <AnimatedShareBar share={shareFor(user.tokens.length)} />
        <div className="relative mt-[22px] -mx-6 min-h-0 flex-1 max-[639px]:h-auto max-[639px]:min-h-[180px] max-[639px]:flex-none min-[640px]:max-[1099px]:h-[280px] min-[640px]:max-[1099px]:flex-none">
          <div className="absolute inset-0">
            <EditablePromptSection
              text={user.text}
              tokens={user.tokens}
              onTextChange={user.setText}
              trimHighlightIndices={highlightsFor(user)}
              tone="user"
              placeholder="Type a customer message…"
              ariaLabel={user.label}
              fadeTo="#111F3E"
              bleed
              onFocusChange={setUserFocused}
            />
          </div>
        </div>
        {userTrims ? <div className="pb-4">{userTrims}</div> : null}
      </EntranceBlock>

      <EntranceBlock
        delayMs={ENTRANCE_DELAYS_MS.panelReply}
        className="flex h-auto min-h-[240px] flex-col overflow-hidden rounded-[14px] bg-transparent px-6 pt-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] min-[1100px]:h-full min-[1100px]:min-h-0"
      >
        <PanelHeader title="Reply" count={replyTokens} muted />
        <AnimatedShareBar share={parts.replyShare} soft />
        <p className="mt-[22px] text-[13px] leading-5 text-muted">
          Written by the model on every request, up to{" "}
          <InlineEditableNumber
            value={replyTokens}
            onCommit={onReplyTokensChange}
            clamp={clampReplyTokens}
            format={formatCount}
            ariaLabel="reply length"
            className="text-muted"
          />{" "}
          tokens.
        </p>
        <div className="mt-5 text-[40px] text-text">
          <SplitCostNumber
            amount={replyValue}
            currency={currency}
            costsReady={costFlowReady}
            animateRoll={animateCostRoll}
            symbol={symbol}
            variant="reply"
            announceLabel="Reply cost"
          />
        </div>
        <p className="mt-2 text-[12.5px] text-muted">per month</p>
      </EntranceBlock>
      </div>
    </section>
  );
}
