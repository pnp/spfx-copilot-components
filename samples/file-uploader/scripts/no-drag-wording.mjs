/**
 * No drag or drop in anything the model or the user reads (todo.md 8.8 L10,
 * Kurt's ruling: an action the host does not support is not shown). In
 * Copilot a file dragged onto the component becomes a chat attachment.
 *
 * The rendered views are checked in loop 1 (`NoDragWording.test.tsx`). This is
 * the same rule for the text the build ships to the model, which a view test
 * cannot see: the component manifest's tool description (copied into
 * ai-plugin.json twice), `copilot/instruction.txt`, and the generated
 * ai-plugin.json and declarativeAgent.json. The tool description said
 * "The user drops the file" after L10 had cleaned every screen, and it is
 * what Copilot reads to decide the call (L10 review, R39).
 *
 * Used by `gen-copilot-assets.mjs --check` (sources, before the build) and
 * `validate-agent-package.mjs` (the built ZIP, after it).
 */

export const FORBIDDEN = /\b(drag|drop)/i;

/**
 * The one sentence allowed to say it: `instruction.txt` telling the model
 * never to ask for a drag. Matched whitespace-insensitively (the file is
 * wrapped) and exactly, so rewording it re-arms the check.
 */
export const ALLOWED_PROHIBITION =
  'Never ask them to drag or drop it: a file dragged into Copilot is attached to the chat, not to the form.';

const squash = s => s.replace(/\s+/g, ' ');

/**
 * Returns a readable excerpt around the first forbidden word, or undefined.
 * `allow` lists exact sentences to remove first — each at most once.
 */
export function findDragWording(text, allow = []) {
  let t = squash(text);
  for (const sentence of allow) {
    t = t.replace(squash(sentence), ' ');
  }
  const m = FORBIDDEN.exec(t);
  return m ? '"…' + t.slice(Math.max(0, m.index - 40), m.index + 30).trim() + '…"' : undefined;
}

/** Every string value in a JSON document, keys included, one per line. */
export function jsonStrings(value) {
  const out = [];
  const walk = v => {
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      for (const [k, x] of Object.entries(v)) {
        out.push(k);
        walk(x);
      }
    }
  };
  walk(value);
  return out.join('\n');
}
