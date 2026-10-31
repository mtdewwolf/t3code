import "@t3tools/client-runtime/assembly-highlighting";
import {
  getFiletypeFromFileName,
  setCustomExtension,
} from "@pierre/diffs/utils/getFiletypeFromFileName";

import { HIGHLIGHTS_LANGUAGE_IDS } from "./highlights.generated";

// Highlights has no lexer for these dialects, so they use their base language's.
const DIALECT_BASE_LANGUAGES = new Map([
  ["luau", "lua"],
  ["xsl", "xml"],
  ["xslt", "xml"],
]);
for (const [dialect, base] of DIALECT_BASE_LANGUAGES) setCustomExtension(dialect, base);

/** The native lexer ID for a @pierre/highlights language name, or 0 (plain text). */
export function highlightLanguageId(language: string): number {
  return Object.hasOwn(HIGHLIGHTS_LANGUAGE_IDS, language) ? HIGHLIGHTS_LANGUAGE_IDS[language]! : 0;
}

/** A @pierre/highlights language for a fence language or file path, or `text`. */
export function resolveHighlightLanguage(input: {
  readonly language?: string | null;
  readonly path?: string;
}): string {
  const rawHint = input.language?.trim().toLowerCase();
  const hinted = rawHint ? (DIALECT_BASE_LANGUAGES.get(rawHint) ?? rawHint) : undefined;
  if (hinted && highlightLanguageId(hinted) !== 0) return hinted;
  const detected = input.path ? getFiletypeFromFileName(input.path)?.toLowerCase() : undefined;
  if (detected && highlightLanguageId(detected) !== 0) return detected;
  return "text";
}
