import type { SectionId } from "@/data/sample";

interface MarginGutterProps {
  sectionId: SectionId;
  label: string;
  tokenCount: number;
  contentHeight?: number;
  className?: string;
}

export function MarginGutter({
  sectionId,
  label,
  tokenCount,
  contentHeight,
  className,
}: MarginGutterProps) {
  return (
    <div
      className={`flex h-full min-h-0 items-stretch justify-end gap-3 ${className ?? ""}`}
      style={contentHeight ? { minHeight: contentHeight } : undefined}
    >
      <div className="flex flex-col items-end justify-start pt-1 text-right">
        <span className="font-serif text-[13px] italic text-muted">{label}</span>
        <span className="mt-1 font-mono text-[11px] text-faint">
          {tokenCount} tokens
        </span>
      </div>
      <div
        className={`margin-gutter-bar margin-gutter-bar--${sectionId}`}
        aria-hidden
      />
    </div>
  );
}