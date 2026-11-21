export interface PromptToken {
  id: number;
  text: string;
}

export function formatTokenTooltipText(text: string): string {
  return text.replace(/ /g, "·");
}

export type TokenPiece =
  | { kind: "gap"; text: string }
  | { kind: "word"; text: string; indices: number[] };

/** Group tokenizer segments into whitespace-delimited words. */
export function segmentTokens(tokens: { text: string }[]): TokenPiece[] {
  const pieces: TokenPiece[] = [];
  let gap = "";
  let word = "";
  let indices: number[] = [];

  const flushGap = () => {
    if (!gap) return;
    pieces.push({ kind: "gap", text: gap });
    gap = "";
  };

  const flushWord = () => {
    if (!word) return;
    pieces.push({ kind: "word", text: word, indices });
    word = "";
    indices = [];
  };

  tokens.forEach((token, index) => {
    const runs = token.text.match(/\s+|\S+/g) ?? [];
    for (const run of runs) {
      if (/^\s+$/.test(run)) {
        flushWord();
        gap += run;
      } else {
        flushGap();
        if (indices[indices.length - 1] !== index) indices.push(index);
        word += run;
      }
    }
  });

  flushWord();
  flushGap();
  return pieces;
}