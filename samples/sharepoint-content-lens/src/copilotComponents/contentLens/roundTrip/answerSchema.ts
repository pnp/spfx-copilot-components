import { z } from 'zod';

/**
 * One answer to one request. `review` holds one compact verdict per supplied segment, e.g. `s1:r:i@1,a?@1;s2:r:-`:
 * r = reviewed, n = not reviewed, `-` = no flags; a flag is a one-letter check code (checks.ts), `?` for uncertain
 * context, and `@` with a passage ID or range. `note1` and `note2` explain the flags of s1 and s2.
 * The limits keep an answer small and completely checkable; packing.ts sizes a request so that any valid answer fits.
 */
export const reviewAnswerSchema = z.object({
  requestId: z.string().uuid(),
  review: z.string().min(1).max(176).regex(/^[a-z0-9@?:;,.-]+$/),
  note1: z.string().max(48),
  note2: z.string().max(48)
}).strict();

export type ReviewAnswer = z.infer<typeof reviewAnswerSchema>;
