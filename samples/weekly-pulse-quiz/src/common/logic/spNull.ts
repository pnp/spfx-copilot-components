/**
 * SharePoint REST returns null for empty fields. This alias is the one place where
 * null is described, as the rushstack lint rule allows for legacy APIs.
 */
// eslint-disable-next-line @rushstack/no-new-null
export type SpValue<T> = T | null | undefined;
