import type { SectionId } from "@/data/sample";
import { sectionTokenCounts } from "@/data/placeholder";
import { sectionGutterColor } from "@/lib/section-colors";

interface MarginGutterProps {
  sectionId: SectionId;
  label: string;
  className?: string;
}

export function MarginGutter({ sectionId, label, className }: MarginGutterProps) {
  const count = sectionTokenCounts[sectionId];
  const barColor = sectionGutterColor[sectionId];

  return (
    <div
      className={`flex h-full min-h-0 items-stretch justify-end gap-3 ${className ?? ""}`}
    >
      <div className="flex flex-col items-end justify-start pt-1 text-right">
        <span className="font-serif text-[13px] italic text-muted">{label}</span>
        <span className="mt-1 font-mono text-[11px] text-faint">
          {count} tokens
        </span>
      </div>
      <div
        className={`w-[3px] shrink-0 self-stretch rounded-full ${barColor}`}
        aria-hidden
      />
    </div>
  );
}