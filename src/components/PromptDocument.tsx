"use client";

import NumberFlow from "@number-flow/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type RefObject,
} from "react";

import { encodingName } from "@/data/placeholder";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { PromptToken } from "@/lib/tokens";
import { formatTokenTooltipText } from "@/lib/tokens";

const DOCUMENT_CLASS =
  "w-[680px] max-w-full font-mono text-[13px] leading-[1.75] whitespace-pre-wrap break-words text-text-2";

type HoveredToken = {
  id: number;
  text: string;
  top: number;
  left: number;
  width: number;
};

function TokenLayer({
  tokens,
  hoveredIndex,
  layerRef,
}: {
  tokens: PromptToken[];
  hoveredIndex: number | null;
  layerRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={layerRef}
      className={`${DOCUMENT_CLASS} col-start-1 row-start-1 pointer-events-none`}
      aria-hidden
    >
      {tokens.map((token, index) => {
        const isHovered = hoveredIndex === index;

        return (
          <span
            key={`${index}-${token.id}`}
            data-token-index={index}
            className={`prompt-token${isHovered ? " prompt-token--hover" : ""}`}
          >
            {token.text}
          </span>
        );
      })}
    </div>
  );
}

function TokenTooltip({ token, anchor }: { token: HoveredToken; anchor: HoveredToken }) {
  return (
    <div
      className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full font-mono text-[11px] text-text"
      style={{
        left: anchor.left + anchor.width / 2,
        top: anchor.top - 6,
      }}
      role="tooltip"
    >
      <div className="rounded-[2px] border border-hairline-strong bg-surface px-2 py-1 whitespace-nowrap">
        {token.id}&nbsp;&nbsp;&quot;{formatTokenTooltipText(token.text)}&quot;
      </div>
    </div>
  );
}

interface EditablePromptSectionProps {
  text: string;
  tokens: PromptToken[];
  onTextChange: (text: string) => void;
  offset?: boolean;
  onHeightChange?: (height: number) => void;
}

export function EditablePromptSection({
  text,
  tokens,
  onTextChange,
  offset,
  onHeightChange,
}: EditablePromptSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredToken, setHoveredToken] = useState<HoveredToken | null>(null);

  const syncHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
    if (onHeightChange && rootRef.current) {
      onHeightChange(rootRef.current.offsetHeight);
    }
  }, [onHeightChange]);

  useLayoutEffect(() => {
    syncHeight();
  }, [text, tokens, syncHeight]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !onHeightChange) return;
    const observer = new ResizeObserver(() => {
      onHeightChange(root.offsetHeight);
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [onHeightChange]);

  const resolveTokenAtPoint = useCallback(
    (clientX: number, clientY: number) => {
      const textarea = textareaRef.current;
      const layer = layerRef.current;
      if (!textarea || !layer) return;

      const previous = textarea.style.pointerEvents;
      textarea.style.pointerEvents = "none";
      const target = document.elementFromPoint(clientX, clientY);
      textarea.style.pointerEvents = previous;

      const span = target?.closest<HTMLElement>("[data-token-index]");
      if (!span || !layer.contains(span)) {
        setHoveredIndex(null);
        setHoveredToken(null);
        return;
      }

      const index = Number(span.dataset.tokenIndex);
      if (Number.isNaN(index) || !tokens[index]) {
        setHoveredIndex(null);
        setHoveredToken(null);
        return;
      }

      const token = tokens[index];
      const rect = span.getBoundingClientRect();
      setHoveredIndex(index);
      setHoveredToken({
        id: token.id,
        text: token.text,
        top: rect.top,
        left: rect.left,
        width: rect.width,
      });
    },
    [tokens],
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLTextAreaElement>) => {
      resolveTokenAtPoint(event.clientX, event.clientY);
    },
    [resolveTokenAtPoint],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
    setHoveredToken(null);
  }, []);

  return (
    <div ref={rootRef} className={offset ? "pt-8" : undefined}>
      <div className="grid">
        <TokenLayer
          tokens={tokens}
          hoveredIndex={hoveredIndex}
          layerRef={layerRef}
        />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          spellCheck={false}
          aria-label="Prompt section"
          className={`${DOCUMENT_CLASS} col-start-1 row-start-1 z-10 block min-h-0 w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-transparent caret-text-2 outline-none`}
          style={{ WebkitTextFillColor: "transparent" }}
        />
      </div>
      {hoveredToken ? <TokenTooltip token={hoveredToken} anchor={hoveredToken} /> : null}
    </div>
  );
}

export function PromptFooter({ total }: { total: number }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <p className="pb-8 pt-16 text-center font-mono text-[11px] text-faint">
      {prefersReducedMotion ? (
        <>
          {total} tokens · {encodingName}
        </>
      ) : (
        <>
          <NumberFlow value={total} willChange /> tokens · {encodingName}
        </>
      )}
    </p>
  );
}