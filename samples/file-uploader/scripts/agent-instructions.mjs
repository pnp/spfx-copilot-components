/**
 * The two shapes `declarativeAgent.json` `instructions` may take, and when
 * each is allowed (todo.md 8.8 L11, option B; AGENTS.md R34; D17).
 *
 * - **Placeholder** — `$[file('instruction.txt')]`, with instruction.txt beside
 *   it. The default, always. SharePoint resolves it at registration and the
 *   tool binds. But Add to Teams answers 400 for such a package, so the agent
 *   record in the admin centre never takes new instructions (L11).
 * - **Inlined** — the text of instruction.txt itself. Add to Teams accepts it
 *   and the record takes the new instructions, but the tool unbinds (D17).
 *   Allowed only for the first of the two instruction-update deploys, and
 *   only when asked for explicitly: `gen-copilot-assets --inline`,
 *   `validate-agent-package --allow-inline`, `deploy.ps1 -InstructionUpdate`.
 *   The next deploy must be a placeholder package, which rebinds the tool.
 *
 * Pure functions, so both scripts share one rule and it is tested offline
 * (agent-instructions.test.mjs).
 */

export const INSTRUCTION_FILE_NAME = 'instruction.txt';
export const INSTRUCTIONS_PLACEHOLDER = `$[file('${INSTRUCTION_FILE_NAME}')]`;
export const MAX_INSTRUCTIONS = 8000;

/** LF line endings: the ZIP must not depend on the checkout's line endings. */
export const lf = s => s.replace(/\r\n/g, '\n');

/** What `--inline` writes into declarativeAgent.json: instruction.txt, LF. */
export const inlineInstructions = authored => lf(authored);

export const INLINED_MESSAGE =
  'declarativeAgent.json inlines the instructions. SharePoint registers an inlined package with no functions ' +
  `(R34, D17). Keep ${INSTRUCTIONS_PLACEHOLDER}. For the first step of an instruction update (todo.md L11), ` +
  'build with `npm run build:instruction-update` and deploy with `deploy.ps1 -InstructionUpdate`.';

/**
 * Checks a packaged declarativeAgent.json against the authored instructions.
 *
 * @param {object} args
 * @param {unknown} args.instructions  declarativeAgent.json `instructions`
 * @param {string | undefined} args.shipped  instruction.txt as found in the ZIP, if any
 * @param {string} args.authored  copilot/instruction.txt
 * @param {boolean} [args.allowInline]  `--allow-inline`
 * @returns {{ errors: string[], form: 'placeholder' | 'inlined' | 'invalid' }}
 */
export function checkInstructions({ instructions, shipped, authored, allowInline = false }) {
  const errors = [];
  const text = typeof instructions === 'string' ? instructions : '';
  const want = lf(authored);

  if (want.length > MAX_INSTRUCTIONS) {
    errors.push(`instructions are ${want.length} characters; a declarative agent allows ${MAX_INSTRUCTIONS}`);
  }
  if (text.trim() === '') {
    errors.push('declarativeAgent.json has no instructions');
    return { errors, form: 'invalid' };
  }

  if (text.trim() === INSTRUCTIONS_PLACEHOLDER) {
    if (shipped === undefined) {
      errors.push(`${INSTRUCTION_FILE_NAME} is not in the agent package — ${INSTRUCTIONS_PLACEHOLDER} would resolve to nothing`);
    } else if (lf(shipped) !== want) {
      errors.push(`${INSTRUCTION_FILE_NAME} in the agent package differs from copilot/${INSTRUCTION_FILE_NAME} — repackage after editing it`);
    }
    return { errors, form: 'placeholder' };
  }

  if (!allowInline) {
    errors.push(INLINED_MESSAGE);
    return { errors, form: 'inlined' };
  }
  // Inlined on purpose: it must be instruction.txt verbatim, and nothing else
  // may still be a `$[...]` reference (a half-inlined file resolves to nothing).
  if (lf(text) !== want) {
    errors.push(`declarativeAgent.json inlines instructions that differ from copilot/${INSTRUCTION_FILE_NAME} — run \`npm run build:instruction-update\` again`);
  }
  if (text.includes('$[')) {
    errors.push('declarativeAgent.json inlines instructions that still contain a $[...] reference');
  }
  // beta.2 copies instruction.txt into the ZIP either way; if it is there, it must not disagree.
  if (shipped !== undefined && lf(shipped) !== want) {
    errors.push(`${INSTRUCTION_FILE_NAME} in the agent package differs from copilot/${INSTRUCTION_FILE_NAME} — repackage after editing it`);
  }
  return { errors, form: 'inlined' };
}
