// A small, dependency-free allowlist sanitizer for the rich text page editor.
// Not a general-purpose HTML sanitizer — scoped to exactly what the editor's
// toolbar can produce, plus safe defaults for anything else that sneaks in.

const ALLOWED_TAGS = new Set([
  "p", "br", "b", "strong", "i", "em", "u", "s",
  "h1", "h2", "h3",
  "ul", "ol", "li",
  "a", "img", "blockquote", "span", "div",
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "target", "rel"],
  img: ["src", "alt"],
};

function isSafeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function sanitizeHtml(input: unknown): string {
  if (typeof input !== "string") return "";
  if (input.length > 200000) return ""; // guard against absurd payloads

  // Strip script/style blocks (and their content) outright.
  let html = input.replace(/<\/?(script|style|iframe|object|embed|form)[^>]*>/gi, "");

  html = html.replace(
    /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*\/?>/g,
    (full, tagName: string, attrString: string) => {
      const tag = tagName.toLowerCase();
      const isClosing = full.startsWith("</");
      if (!ALLOWED_TAGS.has(tag)) return "";

      if (isClosing) return `</${tag}>`;

      const allowed = ALLOWED_ATTRS[tag] || [];
      const keptAttrs: string[] = [];
      const attrRegex = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
      let m: RegExpExecArray | null;
      while ((m = attrRegex.exec(attrString))) {
        const attrName = m[1].toLowerCase();
        const value = (m[2] ?? m[3] ?? m[4] ?? "").trim();
        if (!allowed.includes(attrName)) continue;
        if ((attrName === "href" || attrName === "src") && !isSafeUrl(value)) continue;
        if (attrName === "target" && value !== "_blank") continue;
        keptAttrs.push(`${attrName}="${value.replace(/"/g, "&quot;")}"`);
      }
      if (tag === "a") keptAttrs.push('rel="noopener noreferrer"');

      const selfClosing = tag === "img" || tag === "br";
      return `<${tag}${keptAttrs.length ? " " + keptAttrs.join(" ") : ""}${selfClosing ? " /" : ""}>`;
    },
  );

  return html;
}
