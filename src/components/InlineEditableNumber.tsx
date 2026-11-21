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

const look =
  "inline border-0 bg-transparent p-0 text-inherit underline decoration-dotted decoration-transparent underline-offset-[3px] hover:decoration-current/50";

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
        style={{ width: `${Math.max(draft.length, 1) + 0.5}ch` }}
        className={`${look} decoration-current/50 outline-none ${className} ${inputClassName}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(String(value));
        setEditing(true);
      }}
      aria-label={`Edit ${ariaLabel}`}
      className={`${look} cursor-text ${className}`}
    >
      {format(value)}
    </button>
  );
}
