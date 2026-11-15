import { accessibilityKinds, layoutKinds } from './contracts';
import { staleAfterMonths } from './freshness';

/**
 * Layout thresholds. Crossing one gives a suggestion. A heading block of up to headingBlockWords words just above a
 * long block counts as its heading.
 */
export const layoutLimits = { blockWords: 250, headingBlockWords: 12, paragraphWords: 120, repeatedWebParts: 4 } as const;
/**
 * Accessibility and layout notes each stop at this many. Once a group reaches it, a check of that group without notes
 * shows as not counted instead of passed.
 */
export const maxNotesPerGroup = 50;

/** The three groups of checks without AI, in the order the card lists them. */
export const checkGroups = ['a11y', 'layout', 'freshness'] as const;
export type CheckGroup = typeof checkGroups[number];
/** Every kind of note found without AI. */
export type NoteKind =
  typeof accessibilityKinds[number] | typeof layoutKinds[number] | 'newsDescription' | 'newsBanner' | 'datePassed' | 'stale';

export interface CheckDefinition {
  id: 'headingOrder' | 'linkText' | 'linkName' | 'imageAlt' | 'tableHeader' |
    'longBlock' | 'longParagraph' | 'emptySpace' | 'repeatedWebParts' | 'newsFacts' |
    'datesPassed' | 'lastSaved';
  group: CheckGroup;
  kinds: readonly NoteKind[];
  /** Runs on news posts only. */
  newsOnly?: boolean;
  /** The values the rule's text names, from the same constants the check uses. */
  values: readonly number[];
}

/**
 * Every check that needs no AI, in the order the card lists them. The card shows each rule in plain words, before a
 * check and with its result, so the reader sees what is checked.
 */
export const checkCatalog: readonly CheckDefinition[] = [
  { id: 'headingOrder', group: 'a11y', kinds: ['headingSkip', 'headingEmpty', 'headingTitleLevel'], values: [] },
  { id: 'linkText', group: 'a11y', kinds: ['linkText', 'linkUrl', 'linkAmbiguous'], values: [] },
  { id: 'linkName', group: 'a11y', kinds: ['linkEmpty'], values: [] },
  { id: 'imageAlt', group: 'a11y', kinds: ['imageAlt', 'imageWebPartAlt', 'heroImageAlt'], values: [] },
  { id: 'tableHeader', group: 'a11y', kinds: ['tableHeader'], values: [] },
  { id: 'longBlock', group: 'layout', kinds: ['longBlock'], values: [layoutLimits.blockWords, layoutLimits.headingBlockWords] },
  { id: 'longParagraph', group: 'layout', kinds: ['longParagraph'], values: [layoutLimits.paragraphWords] },
  { id: 'emptySpace', group: 'layout', kinds: ['emptySection', 'emptyColumn'], values: [] },
  { id: 'repeatedWebParts', group: 'layout', kinds: ['repeatedWebParts'], values: [layoutLimits.repeatedWebParts] },
  { id: 'newsFacts', group: 'layout', kinds: ['newsDescription', 'newsBanner'], newsOnly: true, values: [] },
  { id: 'datesPassed', group: 'freshness', kinds: ['datePassed'], values: [] },
  { id: 'lastSaved', group: 'freshness', kinds: ['stale'], values: [staleAfterMonths] }
];

/** The check a note kind belongs to. */
export function checkOf(kind: NoteKind): CheckDefinition {
  const found = checkCatalog.filter(check => check.kinds.indexOf(kind) >= 0)[0];
  if (!found) throw new Error('CHECK_KIND_UNKNOWN');
  return found;
}
