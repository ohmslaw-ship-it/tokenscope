"use client";

type ResetSampleLinkProps = {
  onReset: () => void;
  className?: string;
};

export function ResetSampleLink({ onReset, className = "" }: ResetSampleLinkProps) {
  return (
    <button
      type="button"
      onClick={onReset}
      className={`text-[12px] text-faint underline decoration-white/15 underline-offset-[3px] transition-colors hover:text-muted focus-visible:text-muted focus-visible:outline-none ${className}`.trim()}
    >
      Reset to sample
    </button>
  );
}