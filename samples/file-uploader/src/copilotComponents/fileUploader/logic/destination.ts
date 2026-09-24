import type { IFilingDraft } from '../models/filing';
import type { IDepartment, IDocumentKindDefinition } from '../models/sources';
import { LIBRARY_NAME } from '../models/config';
import { parseIsoDate } from './dates';

/** Path segments — the destination as structured data, joined by the caller. */
export interface IDestination {
  segments: string[];
}

/**
 * Destination is a function of metadata (README non-goal: no folder browsing).
 * `<Library> / Finance / <kind folder> / <Department> / <year>` where the year
 * comes from the document date when present, else from `now`.
 * Returns undefined until both kind and department are known.
 *
 * `LIBRARY_NAME` comes from `models/config.ts`, not `models/seeds.ts` — shared
 * logic must not reach into mock data (AGENTS.md R8). That import was the one
 * unclean spot in the mock boundary and is closed as of the live swap.
 */
export function resolveDestination(
  draft: Pick<IFilingDraft, 'documentKind' | 'department' | 'documentDate'>,
  kinds: IDocumentKindDefinition[],
  departments: IDepartment[],
  now: Date
): IDestination | undefined {
  if (!draft.documentKind || !draft.department) {
    return undefined;
  }
  const kind: IDocumentKindDefinition | undefined = kinds.filter(k => k.key === draft.documentKind)[0];
  const dept: IDepartment | undefined = departments.filter(d => d.key === draft.department)[0];
  if (!kind || !dept) {
    return undefined;
  }
  const dated: Date | undefined = draft.documentDate ? parseIsoDate(draft.documentDate) : undefined;
  const year: number = (dated || now).getFullYear();
  return { segments: [LIBRARY_NAME, 'Finance', kind.folder, dept.label, String(year)] };
}

/** "Records / Finance / Invoices / Programs / 2026" */
export function formatDestination(dest: IDestination, separator: string = ' / '): string {
  return dest.segments.join(separator);
}

/** Short form for the footer line: "Finance › Invoices › Programs". */
export function formatDestinationShort(dest: IDestination): string {
  return dest.segments.slice(1, 4).join(' › ');
}
