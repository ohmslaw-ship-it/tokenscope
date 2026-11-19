import { encodingName, totalTokens } from "@/data/placeholder";

interface PromptSectionProps {
  text: string;
  offset?: boolean;
}

export function PromptSection({ text, offset }: PromptSectionProps) {
  return (
    <p
      className={`w-[680px] max-w-full font-mono text-[13px] leading-[1.75] text-text-2 ${
        offset ? "pt-8" : ""
      }`}
    >
      {text}
    </p>
  );
}

export function PromptFooter() {
  return (
    <p className="pb-8 pt-16 text-center font-mono text-[11px] text-faint">
      {totalTokens} tokens · {encodingName}
    </p>
  );
}