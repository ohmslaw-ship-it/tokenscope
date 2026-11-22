import { encode } from "gpt-tokenizer/encoding/o200k_base";

import type { PromptSection, SectionId } from "@/data/sample";

export type TrimRange = { start: number; end: number };

export type SuggestionKind =
  | "wordy"
  | "repeat"
  | "redundant-example"
  | "optional-cut-example";

export type Suggestion = {
  id: string;
  sectionId: SectionId;
  kind: SuggestionKind;
  label: string;
  ranges: TrimRange[];
  replacement: string;
  tokensSaved: number;
  /** Wordy phrase matched in the source (lowercase normalised). */
  phrase?: string;
  /** Earlier section label for repeat suggestions. */
  repeatFromLabel?: string;
};

const MIN_TOKENS_SAVED = 3;

const WORDY_PHRASES: { pattern: string; replacement: string }[] = [
  { pattern: "in order to", replacement: "to" },
  { pattern: "it is important that you", replacement: "" },
  { pattern: "please make sure to", replacement: "" },
  { pattern: "make sure that", replacement: "ensure" },
  { pattern: "due to the fact that", replacement: "because" },
  { pattern: "at this point in time", replacement: "now" },
  { pattern: "in the event that", replacement: "if" },
  { pattern: "be sure to", replacement: "" },
  { pattern: "you should always", replacement: "always" },
  { pattern: "a large number of", replacement: "many" },
];

const STOPWORDS = new Set(
  [
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "as",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "shall",
    "can",
    "it",
    "its",
    "this",
    "that",
    "these",
    "those",
    "i",
    "you",
    "he",
    "she",
    "we",
    "they",
    "me",
    "him",
    "her",
    "us",
    "them",
    "my",
    "your",
    "his",
    "our",
    "their",
    "if",
    "then",
    "so",
    "not",
    "no",
    "yes",
    "all",
    "any",
    "each",
    "every",
    "both",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "than",
    "too",
    "very",
    "just",
    "about",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "up",
    "down",
    "out",
    "off",
    "over",
    "under",
    "again",
    "further",
    "once",
    "here",
    "there",
    "when",
    "where",
    "why",
    "how",
    "what",
    "which",
    "who",
    "whom",
    "am",
  ].map((w) => w.toLowerCase()),
);

export function countTokens(text: string): number {
  return encode(text).length;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function needsCapitalisation(text: string, start: number): boolean {
  if (start === 0) return true;
  const before = text.slice(0, start).trimEnd();
  if (before.length === 0) return true;
  return /[.!?]$/.test(before);
}

function capitalizeReplacement(text: string, replacement: string): string {
  if (!replacement) return replacement;
  return replacement.charAt(0).toUpperCase() + replacement.slice(1);
}

/** Capitalise the first letter of the word that now starts a sentence. */
function capitalizeFollowingWord(text: string, index: number): string {
  const rest = text.slice(index);
  const match = /^(\s*[^A-Za-z]*)([a-z])/.exec(rest);
  if (!match) return text;
  const at = index + match[1].length;
  return text.slice(0, at) + match[2].toUpperCase() + text.slice(at + 1);
}

function collapseSpaces(text: string): string {
  return text.replace(/  +/g, " ").replace(/^\s+/, "").replace(/\s+$/, "");
}

export function applySuggestionToText(
  text: string,
  ranges: TrimRange[],
  replacement: string,
): string {
  const sorted = [...ranges].sort((a, b) => b.start - a.start);
  let result = text;
  for (const range of sorted) {
    const capNext =
      replacement.trim().length === 0 &&
      needsCapitalisation(result, range.start);
    const before = result.slice(0, range.start);
    const after = result.slice(range.end);
    result = before + replacement + after;
    if (capNext) {
      result = capitalizeFollowingWord(
        result,
        before.length + replacement.length,
      );
    }
  }
  return collapseSpaces(result);
}

function tokensSavedForEdit(
  sectionText: string,
  ranges: TrimRange[],
  replacement: string,
): number {
  const next = applySuggestionToText(sectionText, ranges, replacement);
  const saved = countTokens(sectionText) - countTokens(next);
  return saved;
}

function findWordySuggestions(section: PromptSection): Suggestion[] {
  const out: Suggestion[] = [];
  const text = section.text;

  for (const { pattern, replacement } of WORDY_PHRASES) {
    const re = new RegExp(`\\b${escapeRegExp(pattern)}\\b`, "gi");
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      let repl = replacement;
      if (repl && needsCapitalisation(text, start)) {
        repl = capitalizeReplacement(text, repl);
      }
      const ranges = [{ start, end }];
      const tokensSaved = tokensSavedForEdit(text, ranges, repl);
      if (tokensSaved < MIN_TOKENS_SAVED) continue;

      out.push({
        id: `${section.id}-wordy-${start}`,
        sectionId: section.id,
        kind: "wordy",
        label: "",
        phrase: match[0],
        ranges,
        replacement: repl,
        tokensSaved,
      });
    }
  }

  return out;
}

export type SentenceSpan = { start: number; end: number; text: string };

export function splitSentences(text: string): SentenceSpan[] {
  const spans: SentenceSpan[] = [];
  const re = /[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const raw = match[0];
    const trimmed = raw.trimEnd();
    if (!trimmed) continue;
    const end = match.index + raw.length;
    const start = match.index + raw.indexOf(trimmed);
    spans.push({ start, end, text: trimmed });
  }
  return spans;
}

function normalizeWords(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function wordOverlapRatio(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection += 1;
  }
  const minSize = Math.min(setA.size, setB.size);
  return intersection / minSize;
}

function contentWords(text: string): Set<string> {
  const words = normalizeWords(text);
  return new Set(words.filter((w) => !STOPWORDS.has(w)));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const w of a) {
    if (b.has(w)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function findRepeatSuggestions(sections: PromptSection[]): Suggestion[] {
  const out: Suggestion[] = [];
  const earlierSentences: {
    sectionId: SectionId;
    label: string;
    words: string[];
    text: string;
  }[] = [];

  for (const section of sections) {
    for (const sentence of splitSentences(section.text)) {
      const words = normalizeWords(sentence.text);
      if (words.length < 4) continue;

      let matchedEarlier: (typeof earlierSentences)[number] | null = null;
      for (const earlier of earlierSentences) {
        if (wordOverlapRatio(words, earlier.words) >= 0.8) {
          matchedEarlier = earlier;
          break;
        }
      }

      if (matchedEarlier) {
        const ranges = [{ start: sentence.start, end: sentence.end }];
        const replacement = "";
        const tokensSaved = tokensSavedForEdit(section.text, ranges, replacement);
        if (tokensSaved >= MIN_TOKENS_SAVED) {
          out.push({
            id: `${section.id}-repeat-${sentence.start}`,
            sectionId: section.id,
            kind: "repeat",
            label: `This repeats a line in ${matchedEarlier.label}.`,
            repeatFromLabel: matchedEarlier.label,
            ranges,
            replacement,
            tokensSaved,
          });
        }
      } else {
        earlierSentences.push({
          sectionId: section.id,
          label: section.label,
          words,
          text: sentence.text,
        });
      }
    }
  }

  return out;
}

function isCuttableExample(section: PromptSection): boolean {
  return (
    (section.id === "example1" || section.id === "example2") &&
    section.cuttable === true
  );
}

function findExampleSuggestions(sections: PromptSection[]): Suggestion[] {
  const examples = sections.filter(isCuttableExample);
  if (examples.length < 2) return [];

  const pairs: {
    a: PromptSection;
    b: PromptSection;
    score: number;
  }[] = [];

  for (let i = 0; i < examples.length; i++) {
    for (let j = i + 1; j < examples.length; j++) {
      const a = examples[i];
      const b = examples[j];
      const score = jaccard(contentWords(a.text), contentWords(b.text));
      pairs.push({ a, b, score });
    }
  }

  pairs.sort((x, y) => y.score - x.score);
  const top = pairs[0];
  const second = pairs[1];
  const redundant =
    top &&
    top.score >= 0.2 &&
    (!second || top.score >= second.score + 0.08);

  const out: Suggestion[] = [];

  const makeCutSuggestion = (
    section: PromptSection,
    kind: SuggestionKind,
    optional: boolean,
  ): Suggestion | null => {
    const ranges = [{ start: 0, end: section.text.length }];
    const replacement = "";
    const tokensSaved = tokensSavedForEdit(section.text, ranges, replacement);
    if (tokensSaved < MIN_TOKENS_SAVED) return null;
    return {
      id: `${section.id}-${kind}`,
      sectionId: section.id,
      kind,
      label: optional
        ? "Optional: cut this example if you need a slimmer prompt."
        : "These examples overlap heavily — cut the longer one.",
      ranges,
      replacement,
      tokensSaved,
    };
  };

  if (redundant && top) {
    const tokensA = countTokens(top.a.text);
    const tokensB = countTokens(top.b.text);
    const cut = tokensA >= tokensB ? top.a : top.b;
    const suggestion = makeCutSuggestion(cut, "redundant-example", false);
    if (suggestion) out.push(suggestion);
    return out;
  }

  const longest = [...examples].sort(
    (x, y) => countTokens(y.text) - countTokens(x.text),
  )[0];
  const optional = makeCutSuggestion(longest, "optional-cut-example", true);
  if (optional) out.push(optional);
  return out;
}

export function analyze(sections: PromptSection[]): Suggestion[] {
  const out: Suggestion[] = [];

  for (const section of sections) {
    out.push(...findWordySuggestions(section));
  }

  out.push(...findRepeatSuggestions(sections));
  out.push(...findExampleSuggestions(sections));

  return out
    .filter((s) => s.tokensSaved >= MIN_TOKENS_SAVED)
    .sort((a, b) => b.tokensSaved - a.tokensSaved);
}

export function charRangesToTokenIndices(
  tokens: { text: string }[],
  ranges: TrimRange[],
): number[] {
  if (ranges.length === 0) return [];
  const indices = new Set<number>();
  let offset = 0;

  for (let i = 0; i < tokens.length; i++) {
    const tokenStart = offset;
    const tokenEnd = offset + tokens[i].text.length;
    for (const range of ranges) {
      if (tokenEnd > range.start && tokenStart < range.end) {
        indices.add(i);
      }
    }
    offset = tokenEnd;
  }

  return [...indices];
}