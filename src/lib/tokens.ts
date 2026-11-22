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

function tokensJoined(tokens: { text: string }[]): string {
  return tokens.map((token) => token.text).join("");
}

function sliceTokensByCharRange(
  tokens: { text: string }[],
  start: number,
  end: number,
): { text: string }[] {
  if (end <= start) return [];
  const out: { text: string }[] = [];
  let pos = 0;
  for (const token of tokens) {
    const next = pos + token.text.length;
    if (next <= start) {
      pos = next;
      continue;
    }
    if (pos >= end) break;
    const localStart = Math.max(0, start - pos);
    const localEnd = Math.min(token.text.length, end - pos);
    out.push({ text: token.text.slice(localStart, localEnd) });
    pos = next;
  }
  return out;
}

/**
 * Overlay text that tracks the textarea immediately, reusing token word bounds for
 * unchanged prefix/suffix while edits are in flight.
 */
export function mergeTextWithTokens(
  text: string,
  tokens: { text: string }[],
): TokenPiece[] {
  if (!text) return [{ kind: "gap", text: "" }];
  if (tokens.length === 0) return [{ kind: "gap", text }];

  const stable = tokensJoined(tokens);
  if (stable === text) return segmentTokens(tokens);

  let prefixLen = 0;
  const maxPrefix = Math.min(stable.length, text.length);
  while (prefixLen < maxPrefix && stable[prefixLen] === text[prefixLen]) {
    prefixLen++;
  }

  let suffixLen = 0;
  const maxSuffix = Math.min(
    stable.length - prefixLen,
    text.length - prefixLen,
  );
  while (
    suffixLen < maxSuffix &&
    stable[stable.length - 1 - suffixLen] === text[text.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  const pieces: TokenPiece[] = [];

  if (prefixLen > 0) {
    pieces.push(...segmentTokens(sliceTokensByCharRange(tokens, 0, prefixLen)));
  }

  const middleEnd = text.length - suffixLen;
  if (middleEnd > prefixLen) {
    pieces.push({ kind: "gap", text: text.slice(prefixLen, middleEnd) });
  }

  if (suffixLen > 0) {
    pieces.push(
      ...segmentTokens(
        sliceTokensByCharRange(tokens, stable.length - suffixLen, stable.length),
      ),
    );
  }

  if (pieces.length === 0) return [{ kind: "gap", text }];
  return pieces;
}