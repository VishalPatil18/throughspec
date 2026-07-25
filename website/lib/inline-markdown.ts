// Zero-dependency inline-markdown tokenizer for short strings (changelog notes,
// upcoming items). Handles `code`, **bold**, _italic_, and [text](url) - the
// markdown the project actually uses in bullets. Pure: returns tokens; the JSX
// rendering lives in components/InlineMarkdown.tsx. A full markdown lib would be
// heavy for one-line snippets and the site ships none by design.

export type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'code'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'link'; value: string; href: string };

// Order matters: `code` first so markdown inside a code span stays literal;
// links before bold/italic so bracket/paren syntax wins.
const INLINE_RE = /`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|_([^_\n]+)_/g;

/** Tokenize a short markdown string into inline tokens. */
export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  INLINE_RE.lastIndex = 0;
  let last = 0;
  for (let m = INLINE_RE.exec(text); m !== null; m = INLINE_RE.exec(text)) {
    if (m.index > last) tokens.push({ type: 'text', value: text.slice(last, m.index) });
    if (m[1] !== undefined) tokens.push({ type: 'code', value: m[1] });
    else if (m[2] !== undefined) tokens.push({ type: 'link', value: m[2], href: m[3]! });
    else if (m[4] !== undefined) tokens.push({ type: 'bold', value: m[4] });
    else if (m[5] !== undefined) tokens.push({ type: 'italic', value: m[5] });
    last = m.index + m[0].length;
  }
  if (last < text.length) tokens.push({ type: 'text', value: text.slice(last) });
  return tokens;
}
