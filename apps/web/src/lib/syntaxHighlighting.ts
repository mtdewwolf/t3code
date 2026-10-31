import "@t3tools/client-runtime/assembly-highlighting";
import {
  getSharedHighlighter,
  setCustomExtension,
  type DiffsHighlighter,
  type HighlighterTypes,
  type SupportedLanguages,
} from "@pierre/diffs";

import { DIFF_THEME_NAMES } from "./diffRendering";

// Highlights has no lexer for these dialects, so they use their base language's.
const DIALECT_BASE_LANGUAGES = new Map([
  ["luau", "lua"],
  ["xsl", "xml"],
  ["xslt", "xml"],
]);
for (const [dialect, base] of DIALECT_BASE_LANGUAGES) setCustomExtension(dialect, base);

export function highlightLanguageForFence(language: string): string {
  return DIALECT_BASE_LANGUAGES.get(language.toLowerCase()) ?? language;
}

/**
 * Highlights' hand-written WASM lexers tokenize large files 10-40x faster than
 * Shiki and never backtrack like Shiki's JS regex engine. Only one highlighter
 * type can be active per thread, so every creation site must pass this value.
 */
export const PREFERRED_HIGHLIGHTER: HighlighterTypes = "highlights";

const highlighterPromiseCache = new Map<string, Promise<DiffsHighlighter>>();

export function getSyntaxHighlighterPromise(language: string): Promise<DiffsHighlighter> {
  const cached = highlighterPromiseCache.get(language);
  if (cached) return cached;

  const promise = getSharedHighlighter({
    // Both palettes, so switching appearance never needs a new highlighter.
    themes: Object.values(DIFF_THEME_NAMES),
    langs: [language as SupportedLanguages],
    preferredHighlighter: PREFERRED_HIGHLIGHTER,
  }).catch((error) => {
    if (language === "text") {
      highlighterPromiseCache.delete(language);
      throw error;
    }
    return getSyntaxHighlighterPromise("text");
  });
  highlighterPromiseCache.set(language, promise);
  return promise;
}
