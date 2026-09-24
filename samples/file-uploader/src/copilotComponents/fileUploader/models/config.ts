/**
 * Neutral configuration shared by the mock and the live store.
 *
 * This module exists to close the one place the mock boundary was not clean
 * (AGENTS.md R8): `logic/destination.ts` used to import `LIBRARY_NAME` from
 * `models/seeds.ts`, so shared logic reached into mock data. The layering is
 * models <- logic <- services, so the constant lives here rather than in
 * `services/sharePointConfig.ts`, which imports it in turn.
 *
 * Nothing here is mock data and nothing here is tenant-specific credentials —
 * it is the name of the library the destination is rooted at, which is the same
 * string whether the store is the mock or SharePoint.
 */

/** First segment of every resolved destination. Matches the provisioned library. */
export const LIBRARY_NAME: string = 'Records';

/**
 * Largest document total accepted. Shared by the Zod tool input and
 * `logic/validation.ts`, so a prompt and a typed value meet the same limit
 * (todo.md Phase 8.1, H3/M2).
 */
export const MAX_AMOUNT: number = 1_000_000_000;
