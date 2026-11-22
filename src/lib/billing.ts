/** When the prompt has no input tokens, monthly cost UI shows zero (no request sent). */
export function billableOutputTokens(
  inputTokens: number,
  outputTokens: number,
): number {
  return inputTokens === 0 ? 0 : outputTokens;
}