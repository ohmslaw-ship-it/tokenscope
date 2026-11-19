export interface PromptToken {
  id: number;
  text: string;
}

export function formatTokenTooltipText(text: string): string {
  return text.replace(/ /g, "·");
}