"use client";

import { motion } from "motion/react";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type KeyboardEvent,
} from "react";

import { EntranceBlock, usePageEntranceContext } from "@/components/PageEntrance";
import { priceFootnoteText } from "@/components/PriceFootnote";
import { ResetSampleLink } from "@/components/ResetSampleLink";
import { SplitCostNumber } from "@/components/SplitCostNumber";
import { TierLabel } from "@/components/TierLabel";
import type { WorkspaceView } from "@/components/TopBar";
import { models, type ModelDefinition } from "@/data/models";
import type { TokenizedSection } from "@/hooks/useTokens";
import {
  ENTRANCE_DURATION_S,
  ENTRANCE_EASE,
  ENTRANCE_REDUCE_DURATION_S,
  ENTRANCE_Y,
  ENTRANCE_DELAYS_MS,
  SHARE_BAR_DELAY_S,
  SHARE_BAR_DURATION_S,
  SHARE_BAR_UPDATE_DURATION_S,
} from "@/lib/entrance";
import { billableOutputTokens } from "@/lib/billing";
import {
  effectivePricesPerM,
  formatCostInteger,
  monthlyCostUsd,
  requestCostParts,
  usdToInr,
  type CostCurrency,
} from "@/lib/cost";

function formatTokenCount(value: number): string {
  return `${value.toLocaleString("en-US")}-token`;
}

function formatRateUsd(price: number): string {
  return `$${price}`;
}

function monthlyAmount(
  model: ModelDefinition,
  inputTokens: number,
  outputTokens: number,
  requestsPerDay: number,
  currency: CostCurrency,
): number {
  const usd = monthlyCostUsd(model, inputTokens, outputTokens, requestsPerDay);
  const amount = currency === "INR" ? usdToInr(usd) : usd;
  return Math.round(amount * 100) / 100;
}

function deltaWhole(
  selected: number,
  row: number,
): number {
  return Math.round(Math.abs(selected - row));
}

type CompareRow = {
  model: ModelDefinition;
  amount: number;
  parts: ReturnType<typeof requestCostParts>;
};

type CompareViewProps = {
  sections: TokenizedSection[];
  selectedModel: ModelDefinition;
  inputTokens: number;
  outputTokens: number;
  requestsPerDay: number;
  currency: CostCurrency;
  onSelectModel: (id: string) => void;
  onViewChange: (view: WorkspaceView) => void;
  costFlowReady: boolean;
  animateCostRoll: boolean;
  showResetSample?: boolean;
  onResetSample?: () => void;
};

function CompareCostBar({
  widthShare,
  inputShare,
}: {
  widthShare: number;
  inputShare: number;
}) {
  const { pageReady, reducedMotion, entranceComplete } = usePageEntranceContext();
  const outerPct = Math.min(Math.max(widthShare * 100, 0), 100);
  const promptPct = widthShare > 0 ? Math.min(Math.max(inputShare * 100, 0), 100) : 0;
  const minOuter = widthShare > 0 ? 6 : 0;

  const transition = reducedMotion
    ? { duration: 0 }
    : entranceComplete
      ? { duration: SHARE_BAR_UPDATE_DURATION_S, ease: ENTRANCE_EASE }
      : {
          delay: SHARE_BAR_DELAY_S,
          duration: SHARE_BAR_DURATION_S,
          ease: ENTRANCE_EASE,
        };

  return (
    <div className="relative h-1.5 overflow-hidden rounded bg-white/[0.06]">
      <motion.div
        className="absolute inset-y-0 left-0 flex min-w-[6px] overflow-hidden rounded-[3px]"
        initial={false}
        animate={{ width: pageReady ? `${outerPct}%` : "0%" }}
        transition={pageReady ? transition : { duration: 0 }}
        style={{ minWidth: minOuter }}
      >
        <motion.div
          className="h-full bg-accent-soft opacity-70"
          initial={false}
          animate={{ width: pageReady ? `${promptPct}%` : "0%" }}
          transition={pageReady ? transition : { duration: 0 }}
        />
        <motion.div className="h-full flex-1 bg-accent" />
      </motion.div>
    </div>
  );
}

function CompareUserField({
  text,
  onTextChange,
  tokenCount,
}: {
  text: string;
  onTextChange: (text: string) => void;
  tokenCount: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 23;
    const maxHeight = lineHeight * 2;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  useLayoutEffect(() => {
    resize();
  }, [text, resize]);

  return (
    <div className="grid grid-cols-1 gap-4 max-sm:gap-3 min-[1100px]:grid-cols-[150px_1fr] min-[1100px]:gap-6">
      <div>
        <p className="text-[14px] font-medium text-text-hi">User message</p>
        <p className="mt-1.5 font-mono text-[11.5px] text-muted">
          {tokenCount.toLocaleString("en-US")} tokens
        </p>
      </div>
      <div className="prompt-editor-shell rounded-sm">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          rows={1}
          aria-label="User message"
          className="ink-scroll max-h-[46px] min-h-[23px] w-full resize-none border-0 bg-transparent font-mono text-[13.5px] leading-[23px] text-text-hi outline-none placeholder:text-muted"
          onInput={resize}
        />
      </div>
    </div>
  );
}

function VsSelected({
  selectedAmount,
  rowAmount,
  currency,
}: {
  selectedAmount: number;
  rowAmount: number;
  currency: CostCurrency;
}) {
  const symbol = currency === "INR" ? "₹" : "$";
  const delta = deltaWhole(selectedAmount, rowAmount);

  if (delta === 0) {
    return <span className="font-mono text-[12.5px] text-muted">same price</span>;
  }

  const formatted = formatCostInteger(delta, currency);

  if (rowAmount < selectedAmount) {
    return (
      <span className="font-mono text-[12.5px] text-accent-soft">
        {symbol}
        {formatted} less
      </span>
    );
  }

  return (
    <span className="font-mono text-[12.5px] text-muted">
      +{symbol}
      {formatted}
    </span>
  );
}

export function CompareView({
  sections,
  selectedModel,
  inputTokens,
  outputTokens,
  requestsPerDay,
  currency,
  onSelectModel,
  onViewChange,
  costFlowReady,
  animateCostRoll,
  showResetSample,
  onResetSample,
}: CompareViewProps) {
  const { pageReady, reducedMotion } = usePageEntranceContext();
  const symbol = currency === "INR" ? "₹" : "$";
  const billableOutput = billableOutputTokens(inputTokens, outputTokens);

  const user = useMemo(
    () => sections.find((s) => s.id === "user"),
    [sections],
  );

  const rows = useMemo((): CompareRow[] => {
    return models
      .map((model) => ({
        model,
        amount: monthlyAmount(
          model,
          inputTokens,
          billableOutput,
          requestsPerDay,
          currency,
        ),
        parts: requestCostParts(model, inputTokens, billableOutput),
      }))
      .sort((a, b) => a.amount - b.amount || models.indexOf(a.model) - models.indexOf(b.model));
  }, [inputTokens, billableOutput, requestsPerDay, currency]);

  const selectedAmount = useMemo(
    () =>
      monthlyAmount(
        selectedModel,
        inputTokens,
        billableOutput,
        requestsPerDay,
        currency,
      ),
    [selectedModel, inputTokens, billableOutput, requestsPerDay, currency],
  );

  const maxMonthlyUsd = useMemo(
    () =>
      Math.max(
        ...models.map((m) =>
          monthlyCostUsd(m, inputTokens, billableOutput, requestsPerDay),
        ),
        0,
      ),
    [inputTokens, billableOutput, requestsPerDay],
  );

  const headline = useMemo(() => {
    const cheapest = rows[0];
    if (!cheapest) return null;

    const allSameCost = rows.every((row) => row.amount === cheapest.amount);
    if (allSameCost) {
      return { kind: "allSame" as const };
    }

    const cheapestIsSelected = cheapest.model.id === selectedModel.id;

    if (cheapestIsSelected) {
      const next = rows[1];
      if (!next) {
        return {
          kind: "solo" as const,
          text: `${selectedModel.name} is the cheapest way to run this prompt.`,
        };
      }
      const savings = deltaWhole(next.amount, selectedAmount);
      if (savings === 0) {
        return {
          kind: "solo" as const,
          text: `${selectedModel.name} is the cheapest way to run this prompt.`,
        };
      }
      const formatted = `${symbol}${formatCostInteger(savings, currency)}`;
      return {
        kind: "selectedCheapest" as const,
        name: selectedModel.name,
        formatted,
        nextName: next.model.name,
      };
    }

    const savings = deltaWhole(selectedAmount, cheapest.amount);
    const formatted = `${symbol}${formatCostInteger(savings, currency)}`;
    return {
      kind: "otherCheapest" as const,
      name: cheapest.model.name,
      formatted,
      selectedName: selectedModel.name,
    };
  }, [rows, selectedModel, selectedAmount, currency, symbol]);

  const subline = useMemo(() => {
    const shares = models.map((m) =>
      requestCostParts(m, inputTokens, billableOutput).replyShare,
    );
    const minShare = shares.length > 0 ? Math.min(...shares) : 0;
    const floorPct = Math.floor(minShare * 1000) / 10;
    const roundedDown = Math.floor(floorPct / 10) * 10;
    return { roundedDown, showReplyNote: roundedDown >= 50 };
  }, [inputTokens, billableOutput]);

  const selectRow = useCallback(
    (id: string) => {
      onSelectModel(id);
      onViewChange("inspect");
    },
    [onSelectModel, onViewChange],
  );

  const onRowKeyDown = (id: string) => (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectRow(id);
    }
  };

  if (!user) return null;

  return (
    <section className="min-[1100px]:relative min-[1100px]:min-h-[760px]">
      <EntranceBlock
        delayMs={ENTRANCE_DELAYS_MS.compareHeadline}
        className="max-w-[980px] min-[1100px]:absolute min-[1100px]:left-0 min-[1100px]:top-0"
      >
        <h1 className="text-[32px] font-semibold tracking-[-0.035em] text-text-hi min-[640px]:text-[40px] min-[640px]:leading-[1.08]">
          {headline?.kind === "allSame" ? (
            "Every model costs the same for this prompt."
          ) : headline?.kind === "otherCheapest" ? (
            <>
              <span className="text-accent-soft">{headline.name}</span> runs this prompt for
              <br />
              {headline.formatted} less a month than {headline.selectedName}.
            </>
          ) : headline?.kind === "selectedCheapest" ? (
            <>
              {headline.name} is the cheapest way to run this prompt, {headline.formatted}{" "}
              less a month than {headline.nextName}.
            </>
          ) : headline?.kind === "solo" ? (
            headline.text
          ) : null}
        </h1>
      </EntranceBlock>

      <EntranceBlock
        delayMs={ENTRANCE_DELAYS_MS.compareSubline}
        className="mt-[18px] max-w-[980px] min-[1100px]:absolute min-[1100px]:left-0 min-[1100px]:top-[88px] min-[1100px]:mt-0"
      >
        <p className="text-[15px] leading-[23px] text-muted">
          Same <b className="font-medium text-text">{formatTokenCount(inputTokens)}</b>{" "}
          prompt and{" "}
          <b className="font-medium text-text">{formatTokenCount(billableOutput)}</b>{" "}
          reply at{" "}
          <b className="font-medium text-text">
            {requestsPerDay.toLocaleString("en-US")}
          </b>{" "}
          requests a day.
          {subline.showReplyNote ? (
            <>
              {" "}
              On every model, the reply is more than{" "}
              {subline.roundedDown}% of the bill.
            </>
          ) : null}
        </p>
      </EntranceBlock>

      <EntranceBlock
        delayMs={ENTRANCE_DELAYS_MS.compareTable}
        className="mt-10 min-[1100px]:absolute min-[1100px]:left-0 min-[1100px]:right-0 min-[1100px]:top-[182px] min-[1100px]:mt-0"
      >
        <div className="hidden grid-cols-[270px_minmax(0,1fr)_190px_130px_190px] gap-x-8 px-5 pb-3 font-mono text-[11px] tracking-[0.01em] text-faint min-[1100px]:grid">
          <div>Model</div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block h-[3px] w-2.5 rounded-sm bg-accent-soft opacity-55" aria-hidden />
              Prompt
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block h-[3px] w-2.5 rounded-sm bg-accent" aria-hidden />
              Reply
            </span>
          </div>
          <div>Rates per 1M tokens</div>
          <div className="text-right">vs selected</div>
          <div className="text-right">Per month</div>
        </div>

        <div>
          {rows.map((row, index) => {
            const selected = row.model.id === selectedModel.id;
            const rates = effectivePricesPerM(row.model, inputTokens);
            const rowUsd = monthlyCostUsd(
              row.model,
              inputTokens,
              billableOutput,
              requestsPerDay,
            );
            const widthShare =
              maxMonthlyUsd > 0 ? rowUsd / maxMonthlyUsd : 0;
            const inputShare =
              row.parts.totalUsd > 0
                ? row.parts.inputUsd / row.parts.totalUsd
                : 0;

            const rowShell = selected
              ? "border-t border-transparent bg-[linear-gradient(180deg,#152547,#111F3E)] rounded-[14px] shadow-[inset_0_0_0_1px_rgba(124,196,224,0.28),inset_0_1px_0_rgba(255,255,255,0.06)]"
              : "border-t border-white/[0.06]";

            const prevSelected =
              index > 0 && rows[index - 1].model.id === selectedModel.id;

            return (
              <motion.button
                key={row.model.id}
                type="button"
                onClick={() => selectRow(row.model.id)}
                onKeyDown={onRowKeyDown(row.model.id)}
                aria-pressed={selected}
                className={`group w-full text-left transition-colors hover:bg-white/[0.04] ${rowShell} ${
                  prevSelected ? "border-t-transparent" : ""
                } last:border-b last:border-white/[0.06]`}
                initial={{ opacity: 0, y: reducedMotion ? 0 : ENTRANCE_Y }}
                animate={
                  pageReady
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: reducedMotion ? 0 : ENTRANCE_Y }
                }
                transition={{
                  delay: reducedMotion
                    ? 0
                    : (ENTRANCE_DELAYS_MS.compareTable +
                        index * ENTRANCE_DELAYS_MS.compareTableRowStagger) /
                      1000,
                  duration: reducedMotion
                    ? ENTRANCE_REDUCE_DURATION_S
                    : ENTRANCE_DURATION_S,
                  ease: ENTRANCE_EASE,
                }}
              >
                <div className="hidden h-[72px] grid-cols-[270px_minmax(0,1fr)_190px_130px_190px] items-center gap-x-8 px-5 min-[1100px]:grid">
                  <div>
                    <div className="text-[16px] font-medium tracking-[-0.01em] text-text">
                      <span className={selected ? "text-text-hi" : undefined}>
                        {row.model.name}
                      </span>
                      <span className="ml-2 font-mono text-[11px] font-normal text-faint">
                        <TierLabel tier={row.model.tokenizer} />
                      </span>
                    </div>
                    {selected ? (
                      <p className="mt-1 font-mono text-[11px] text-accent">Selected</p>
                    ) : row.model.priceNoteShort ? (
                      <p className="mt-1 whitespace-nowrap text-[12px] text-faint">
                        {row.model.priceNoteShort}
                      </p>
                    ) : null}
                  </div>
                  <CompareCostBar widthShare={widthShare} inputShare={inputShare} />
                  <p className="font-mono text-[12px] text-muted">
                    {formatRateUsd(rates.input)} in · {formatRateUsd(rates.output)} out
                  </p>
                  <div className="text-right">
                    {selected ? (
                      <span className="font-mono text-[12.5px] text-muted">—</span>
                    ) : (
                      <VsSelected
                        selectedAmount={selectedAmount}
                        rowAmount={row.amount}
                        currency={currency}
                      />
                    )}
                  </div>
                  <div className="text-right">
                    <SplitCostNumber
                      amount={row.amount}
                      currency={currency}
                      costsReady={costFlowReady}
                      animateRoll={animateCostRoll}
                      symbol={symbol}
                      variant="compare"
                      announceLabel={`${row.model.name} monthly cost`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 px-4 py-4 min-[640px]:px-5 min-[640px]:py-5 min-[1100px]:hidden">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[16px] font-medium tracking-[-0.01em] text-text">
                        {row.model.name}
                        <span className="ml-2 font-mono text-[11px] font-normal text-faint">
                          <TierLabel tier={row.model.tokenizer} />
                        </span>
                      </p>
                      {selected ? (
                        <p className="mt-1 font-mono text-[11px] text-accent">Selected</p>
                      ) : row.model.priceNoteShort ? (
                        <p className="mt-1 whitespace-nowrap text-[12px] text-faint">
                          {row.model.priceNoteShort}
                        </p>
                      ) : null}
                    </div>
                    <SplitCostNumber
                      amount={row.amount}
                      currency={currency}
                      costsReady={costFlowReady}
                      animateRoll={animateCostRoll}
                      symbol={symbol}
                      variant="compare"
                      announceLabel={`${row.model.name} monthly cost`}
                    />
                  </div>
                  <CompareCostBar widthShare={widthShare} inputShare={inputShare} />
                  <p className="font-mono text-[11px] text-muted">
                    {formatRateUsd(rates.input)} in · {formatRateUsd(rates.output)} out
                    {" · "}
                    {selected ? (
                      "—"
                    ) : (
                      <VsSelected
                        selectedAmount={selectedAmount}
                        rowAmount={row.amount}
                        currency={currency}
                      />
                    )}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </EntranceBlock>

      <EntranceBlock
        delayMs={ENTRANCE_DELAYS_MS.comparePanel}
        className="mt-8 min-[1100px]:absolute min-[1100px]:left-0 min-[1100px]:right-0 min-[1100px]:top-[clamp(606px,calc(606px+(100vh-900px)*0.5),690px)] min-[1100px]:mt-0"
      >
        <div className="min-h-[100px] rounded-[14px] bg-[linear-gradient(180deg,#172A50,#111F3E_70%)] px-[22px] py-[18px] shadow-[inset_0_0_0_1px_rgba(124,196,224,0.32),inset_0_1px_0_rgba(255,255,255,0.08),0_16px_40px_-16px_rgba(0,0,0,0.6)]">
          <CompareUserField
            text={user.text}
            onTextChange={user.setText}
            tokenCount={user.tokens.length}
          />
        </div>
      </EntranceBlock>

      <EntranceBlock
        delayMs={ENTRANCE_DELAYS_MS.compareFooter}
        className="mt-6 text-[12.5px] text-faint min-[1100px]:absolute min-[1100px]:left-5 min-[1100px]:top-[clamp(728px,calc(728px+(100vh-900px)*0.5),812px)] min-[1100px]:mt-0"
      >
        <span>
          Click a model to select it and open it in Inspect. System prompt and examples
          are edited in Inspect.
          {showResetSample && onResetSample ? (
            <>
              {" · "}
              <ResetSampleLink onReset={onResetSample} className="inline" />
            </>
          ) : null}
          {" · "}
          {priceFootnoteText()}
        </span>
      </EntranceBlock>
    </section>
  );
}