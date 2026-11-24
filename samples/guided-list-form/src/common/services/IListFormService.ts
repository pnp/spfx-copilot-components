import type { Answers, IFormSchema, ISubmitResult } from '../models';

export type ListFormErrorKind = 'notFound' | 'accessDenied' | 'notAList' | 'network' | 'server' | 'validation' | 'timeout';

/** Error with a kind the UI can turn into a friendly message. Never carries form values. */
export class ListFormError extends Error {
  public readonly kind: ListFormErrorKind;
  public constructor(kind: ListFormErrorKind, message: string) {
    super(message);
    this.kind = kind;
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

export interface IListFormService {
  readonly demo: boolean;
  loadSchema(): Promise<IFormSchema>;
  submit(schema: IFormSchema, answers: Answers): Promise<ISubmitResult>;
  /**
   * Look for an item created by the current user at or after submittedAt that matches the
   * submitted Title (or first comparable field). Does not change the list schema.
   */
  findSubmittedItem(schema: IFormSchema, answers: Answers, submittedAt: number): Promise<ISubmitResult | undefined>;
}
