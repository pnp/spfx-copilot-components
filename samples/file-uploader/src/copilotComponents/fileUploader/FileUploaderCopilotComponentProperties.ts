import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

/**
 * The contract between Copilot and this component. `.describe()` text is what
 * Copilot reads to populate each input from the user's prompt (AGENTS.md R5).
 *
 * Lenient in, clean out (§4.1): every field optional, whitespace trimmed,
 * over-long text clamped rather than rejected, unknown keys stripped.
 * Files are never a tool input — the user chooses them in the component's own
 * file picker.
 */

const MAX_TEXT: number = 120;
const MAX_DATE_TEXT: number = 40;
/**
 * Must equal `MAX_AMOUNT` in `models/config.ts`; a test asserts it. It is a
 * literal because the build loads this module on its own, as ES modules, to
 * emit the tool schema — a relative import here fails the manifest step
 * (`docs/GOTCHAS.md`). Package imports only.
 */
const MAX_AMOUNT: number = 1_000_000_000;

/** "1,284.50" or "$1284" from Copilot become 1284.5 / 1284; anything else passes through to fail cleanly. */
const coerceAmount = (v: unknown): unknown => {
  if (typeof v === 'string') {
    const n: number = Number(v.replace(/[$,\s]/g, ''));
    return v.trim() !== '' && !isNaN(n) ? n : v;
  }
  return v;
};

const clampedText = (max: number): z.ZodEffects<z.ZodString, string, string> =>
  z.string().transform(s => s.trim().slice(0, max));

const propertiesSchema = z
  .object({
    intent: z
      .enum(['file', 'recent'])
      .optional()
      .describe(
        'Whether the user wants to file a document ("file") or see what they filed recently ("recent"). Default to "file" when the user mentions uploading, filing or a specific document.'
      ),
    documentKind: z
      .enum(['invoice', 'expenseReport'])
      .optional()
      .describe(
        'The kind of document being filed or filtered: "invoice" for a bill from a vendor or supplier, "expenseReport" for an employee\'s expense claim.'
      ),
    department: z
      .enum(['programs', 'development', 'finance', 'operations'])
      .optional()
      .describe(
        'The department that owns the record: "programs" (program delivery), "development" (fundraising), "finance", or "operations". Only set it if the user named one.'
      ),
    vendor: clampedText(MAX_TEXT)
      .optional()
      .describe('For invoices: the vendor or supplier name exactly as the user said it.'),
    owner: clampedText(MAX_TEXT)
      .optional()
      .describe(
        'For expense reports: the email address of the person whose expenses these are, only if the user gave one. Never guess an address from a name.'
      ),
    documentDate: clampedText(MAX_DATE_TEXT)
      .optional()
      .describe(
        'The document\'s date as the user said it, for example "last Friday", "yesterday", "3 days ago" or "2026-08-29". Leave empty if the user did not mention a date.'
      ),
    amount: z
      .preprocess(coerceAmount, z.number().finite().nonnegative().max(MAX_AMOUNT))
      .optional()
      .describe('The total amount on the document as a plain number without currency symbols, only if the user stated it.'),
    status: z
      .enum(['received', 'pendingReview', 'approved', 'paid', 'returned'])
      .optional()
      .describe('A status to filter recent filings by, only if the user asked for one: "pendingReview" for pending or awaiting review.'),
    period: z
      .enum(['7d', '30d', '90d'])
      .optional()
      .describe('How far back to look for recent filings: "7d" for this week, "30d" for this month, "90d" for this quarter. Default "30d".')
  })
  .strip();

export type IFileUploaderCopilotComponentProperties = z.infer<typeof propertiesSchema>;

/**
 * Runtime parser — normalises whatever Copilot sent. Copilot sends sloppy
 * input: one bad field must not discard the good ones, so on failure each
 * field is parsed on its own and the invalid ones are simply dropped.
 */
export const parseProperties = (input: unknown): IFileUploaderCopilotComponentProperties => {
  const whole = propertiesSchema.safeParse(input);
  if (whole.success) {
    return whole.data;
  }
  if (!input || typeof input !== 'object') {
    return {};
  }
  const out: Record<string, unknown> = {};
  const shape = propertiesSchema.shape;
  const source: Record<string, unknown> = input as Record<string, unknown>;
  for (const key of Object.keys(shape)) {
    if (source[key] === undefined) {
      continue;
    }
    const single = (shape as Record<string, z.ZodTypeAny>)[key].safeParse(source[key]);
    if (single.success && single.data !== undefined) {
      out[key] = single.data;
    }
  }
  return out as IFileUploaderCopilotComponentProperties;
};

export default zodToJsonSchema(propertiesSchema);
