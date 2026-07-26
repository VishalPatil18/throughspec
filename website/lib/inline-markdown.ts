// Zero-dep inline-markdown tokenizer (code/bold/italic/links); JSX render in InlineMarkdown.tsx.

export type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'code'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'link'; value: string; href: string };

// Order: code first (keeps its contents literal), links before bold/italic.
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
