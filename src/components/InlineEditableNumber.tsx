"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type InlineEditableNumberProps = {
  value: number;
  onCommit: (value: number) => void;
  clamp: (value: number) => number;
  format: (value: number) => string;
  className?: string;
  inputClassName?: string;
  ariaLabel: string;
};

export function InlineEditableNumber({
  value,
  onCommit,
  clamp,
  format,
  className = "",
  inputClassName = "",
  ariaLabel,
}: InlineEditableNumberProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = useCallback(() => {
    const parsed = Number(draft.replace(/,/g, ""));
    const next = clamp(Number.isFinite(parsed) ? parsed : value);
    onCommit(next);
    setEditing(false);
  }, [clamp, draft, onCommit, value]);

  const cancel = useCallback(() => {
    setDraft(String(value));
    setEditing(false);
  }, [value]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          } else if (event.key === "Escape") {
            event.preventDefault();
            cancel();
          }
        }}
        aria-label={ariaLabel}
        className={`w-[7ch] min-w-[4ch] border-0 border-b border-hairline bg-transparent p-0 font-mono text-[11px] text-muted outline-none ${inputClassName}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      aria-label={`Edit ${ariaLabel}`}
      className={`cursor-text border-0 bg-transparent p-0 font-mono text-[11px] text-muted underline decoration-transparent underline-offset-2 transition-colors hover:decoration-hairline ${className}`}
    >
      {format(value)}
    </button>
  );
}