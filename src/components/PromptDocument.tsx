"use client";

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";

import type { PromptToken } from "@/lib/tokens";
import { mergeTextWithTokens } from "@/lib/tokens";

type EditorTone = "prompt" | "user";
type EditorMode = "fill" | "clip";

const TONE_CLASS: Record<EditorTone, string> = {
  prompt: "font-mono text-[12px] leading-5 text-prompt",
  user: "font-mono text-[12.5px] leading-[21px] text-text-hi",
};

const SHARED = "whitespace-pre-wrap break-words";

type HoverTip = {
  text: string;
  count: number;
  top: number;
  left: number;
};

function caretOffset(textarea: HTMLTextAreaElement): { top: number; height: number } {
  const cs = getComputedStyle(textarea);
  const probe = document.createElement("div");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.whiteSpace = "pre-wrap";
  probe.style.overflowWrap = "break-word";
  probe.style.wordBreak = "break-word";
  probe.style.boxSizing = "border-box";
  probe.style.width = `${textarea.clientWidth}px`;
  probe.style.font = cs.font;
  probe.style.letterSpacing = cs.letterSpacing;
  probe.style.lineHeight = cs.lineHeight;
  probe.style.padding = "0";
  const caret = textarea.selectionStart ?? textarea.value.length;
  probe.textContent = textarea.value.slice(0, caret);
  const marker = document.createElement("span");
  marker.textContent = textarea.value.slice(caret, caret + 1) || "\u200b";
  probe.appendChild(marker);
  document.body.appendChild(probe);
  const top = marker.offsetTop;
  const height = marker.offsetHeight || parseFloat(cs.lineHeight) || 20;
  probe.remove();
  return { top, height };
}

interface EditablePromptSectionProps {
  text: string;
  tokens: PromptToken[];
  onTextChange: (text: string) => void;
  trimHighlightIndices?: number[];
  tone?: EditorTone;
  mode?: EditorMode;
  placeholder?: string;
  ariaLabel: string;
  fadeTo?: string;
  bleed?: boolean;
  onFocusChange?: (focused: boolean) => void;
}

export function EditablePromptSection({
  text,
  tokens,
  onTextChange,
  trimHighlightIndices,
  tone = "prompt",
  mode = "fill",
  placeholder,
  ariaLabel,
  fadeTo = "#0F1A33",
  bleed = false,
  onFocusChange,
}: EditablePromptSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const hoverElRef = useRef<HTMLElement | null>(null);
  const [focused, setFocused] = useState(false);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [overflowing, setOverflowing] = useState(false);
  const [hoveredWord, setHoveredWord] = useState<number | null>(null);
  const [tip, setTip] = useState<HoverTip | null>(null);

  const pieces = useMemo(
    () => mergeTextWithTokens(text, tokens),
    [text, tokens],
  );
  const highlightIndices = useMemo(
    () => new Set(trimHighlightIndices ?? []),
    [trimHighlightIndices],
  );
  const typeClass = `${TONE_CLASS[tone]} ${SHARED}`;

  const syncHeight = useCallback(() => {
    const textarea = textareaRef.current;
    const scroller = scrollerRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    const natural = textarea.scrollHeight;
    const filled =
      mode === "fill" && scroller
        ? Math.max(natural, scroller.clientHeight)
        : natural;
    textarea.style.height = `${filled}px`;
    setNaturalHeight(natural);
    if (scroller && mode === "fill") {
      setOverflowing(natural > scroller.clientHeight + 2);
    }
  }, [mode]);

  const revealCaret = useCallback(() => {
    const textarea = textareaRef.current;
    const scroller = scrollerRef.current;
    if (!textarea || !scroller || document.activeElement !== textarea) return;
    if (mode === "clip") return;
    const { top, height } = caretOffset(textarea);
    const viewTop = scroller.scrollTop;
    const viewBottom = viewTop + scroller.clientHeight;
    const pad = 16;
    if (top < viewTop + pad) {
      scroller.scrollTop = Math.max(0, top - pad);
    } else if (top + height > viewBottom - pad) {
      scroller.scrollTop = top + height - scroller.clientHeight + pad;
    }
  }, [mode]);

  useLayoutEffect(() => {
    syncHeight();
    if (focused) revealCaret();
  }, [text, tokens, focused, syncHeight, revealCaret]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const observer = new ResizeObserver(() => syncHeight());
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [syncHeight]);

  const positionTip = useCallback((el: HTMLElement, index: number) => {
    const piece = pieces[index];
    if (!piece || piece.kind !== "word") return;
    const rect = el.getBoundingClientRect();
    setHoveredWord(index);
    setTip({
      text: piece.text,
      count: piece.indices.length,
      top: rect.top,
      left: rect.left + rect.width / 2,
    });
  }, [pieces]);

  useLayoutEffect(() => {
    const el = hoverElRef.current;
    if (!el || hoveredWord == null) return;
    const reposition = () => {
      if (!hoverElRef.current) return;
      positionTip(hoverElRef.current, hoveredWord);
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [hoveredWord, positionTip]);

  const clearHover = useCallback(() => {
    hoverElRef.current = null;
    setHoveredWord(null);
    setTip(null);
  }, []);

  const resolveTokenAtPoint = useCallback(
    (clientX: number, clientY: number) => {
      const textarea = textareaRef.current;
      const layer = layerRef.current;
      if (!textarea || !layer) return;

      const previous = textarea.style.pointerEvents;
      textarea.style.pointerEvents = "none";
      const target = document.elementFromPoint(clientX, clientY);
      textarea.style.pointerEvents = previous;

      const word = target?.closest<HTMLElement>("[data-word-index]");
      if (!word || !layer.contains(word)) {
        clearHover();
        return;
      }
      const index = Number(word.dataset.wordIndex);
      if (Number.isNaN(index)) {
        clearHover();
        return;
      }
      hoverElRef.current = word;
      positionTip(word, index);
    },
    [clearHover, positionTip],
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLTextAreaElement>) => {
      resolveTokenAtPoint(event.clientX, event.clientY);
    },
    [resolveTokenAtPoint],
  );

  const setFocus = (next: boolean) => {
    setFocused(next);
    onFocusChange?.(next);
    if (!next) clearHover();
  };

  const clipped = mode === "clip" && !focused && naturalHeight > 100;
  const showFade = mode === "fill" && !focused && overflowing;

  const scrollerClass = [
    bleed ? "px-6" : "",
    mode === "clip"
      ? clipped
        ? "max-h-[100px] overflow-hidden [mask-image:linear-gradient(#000_50%,transparent)] [-webkit-mask-image:linear-gradient(#000_50%,transparent)]"
        : focused
          ? "ink-scroll max-h-[280px] overflow-y-auto"
          : ""
      : focused
        ? "ink-scroll h-full overflow-y-auto"
        : "h-full overflow-hidden",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={mode === "fill" ? "relative h-full min-h-[48px]" : "relative"}>
      <div ref={scrollerRef} className={scrollerClass}>
        <div className={`grid ${focused ? "pb-4" : ""}`}>
          <div
            ref={layerRef}
            className={`${typeClass} col-start-1 row-start-1 pointer-events-none`}
            aria-hidden
          >
            {pieces.map((piece, index) => {
              if (piece.kind === "gap") {
                return <span key={`g-${index}`}>{piece.text}</span>;
              }
              const hot =
                hoveredWord === index ||
                piece.indices.some((tokenIndex) => highlightIndices.has(tokenIndex));
              return (
                <span
                  key={`w-${index}`}
                  data-word-index={index}
                  className={`pointer-events-auto ${hot ? "token-word--hot" : ""}`}
                >
                  {piece.text}
                </span>
              );
            })}
          </div>
          <textarea
            ref={textareaRef}
            value={text}
            placeholder={placeholder}
            onChange={(event) => onTextChange(event.target.value)}
            onMouseMove={handleMouseMove}
            onMouseLeave={clearHover}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            onKeyUp={revealCaret}
            onClick={revealCaret}
            spellCheck={false}
            aria-label={ariaLabel}
            className={`prompt-editor ${typeClass} col-start-1 row-start-1 z-10 block w-full resize-none overflow-hidden border-0 p-0 outline-none`}
          />
        </div>
      </div>
      {showFade ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[90px]"
          style={{
            background: `linear-gradient(to bottom, transparent, ${fadeTo})`,
          }}
        />
      ) : null}
      {tip
        ? createPortal(
            <div
              role="tooltip"
              className="pointer-events-none fixed z-[80] -translate-x-1/2 -translate-y-full font-mono text-[11px] leading-none"
              style={{ left: tip.left, top: tip.top - 8 }}
            >
              <div className="rounded-[7px] bg-[#1C2C4F] px-[9px] py-[6px] whitespace-nowrap text-text shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.4)]">
                <span className="text-text-hi">&quot;{tip.text}&quot;</span>
                {"  "}
                {tip.count} {tip.count === 1 ? "token" : "tokens"}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
