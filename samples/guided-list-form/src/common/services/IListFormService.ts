import type { Answers, IFormSchema, ISubmitResult } from '../models';

export type ListFormErrorKind = 'notFound' | 'accessDenied' | 'notAList' | 'network' | 'server' | 'validation' | 'timeout';

/** Error with a kind the UI can turn into a friendly message. Never carries form values. */
/** Kinds that mean SharePoint refused the write, so no item was created. */
function definitiveByDefault(kind: ListFormErrorKind): boolean {
  return kind === 'validation' || kind === 'accessDenied' || kind === 'notFound' || kind === 'notAList';
}

export class ListFormError extends Error {
  public readonly kind: ListFormErrorKind;
  /**
   * True when it is certain that no list item was created: the request was never sent, or SharePoint
   * answered with a definitive error. False for network errors, aborts, timeouts and gateway or
   * throttling responses (408, 429, 502, 503, 504), where the write may still have committed.
   */
  public readonly definitive: boolean;
  public constructor(kind: ListFormErrorKind, message: string, definitive?: boolean) {
    super(message);
    this.kind = kind;
    this.definitive = typeof definitive === 'boolean' ? definitive : definitiveByDefault(kind);
    this.name = 'ListFormError';
    // Keep instanceof working when compiled to ES5.
    Object.setPrototypeOf(this, ListFormError.prototype);
  }
}

export function errorKindOf(error: unknown): ListFormErrorKind {
  const kind = error && typeof error === 'object' ? (error as { kind?: unknown }).kind : undefined;
  return kind === 'notFound' || kind === 'accessDenied' || kind === 'notAList' || kind === 'network' || kind === 'validation' || kind === 'timeout'
    ? kind
    : 'server';
}

/** True only when the error proves the save did not create an item. Unknown errors are not proof. */
export function isDefinitiveNonCommit(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const flag = (error as { definitive?: unknown }).definitive;
  if (typeof flag === 'boolean') {
    return flag;
  }
  return false;
}

/**
 * Result of looking for a save in the list:
 * - found: exactly one item matches every submitted value
 * - none: no item matches (on its own this never proves a pending save will not commit)
 * - multiple: more than one item matches, so none can be picked
 * - inconclusive: the read could not cover every candidate item
 */
export type ReconcileOutcome =
  | { status: 'found'; result: ISubmitResult }
  | { status: 'none' }
  | { status: 'multiple'; count: number }
  | { status: 'inconclusive' };

export interface IListFormService {
  readonly demo: boolean;
  loadSchema(): Promise<IFormSchema>;
  submit(schema: IFormSchema, answers: Answers): Promise<ISubmitResult>;
  /**
   * Look for items created by the current user at or after submittedAt (less clock skew) whose
   * values match every submitted answer. Read only. Does not change the list schema.
   */
  findSubmittedItem(schema: IFormSchema, answers: Answers, submittedAt: number): Promise<ReconcileOutcome>;
}
