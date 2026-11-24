import { resolveListTitle } from './siteUrl';

function listName(listTitle: string): string {
  return resolveListTitle(listTitle);
}

/** Status only: never includes answers, field values or list items. */
export function openedFollowUp(listTitle: string): string {
  const safe = listName(listTitle);
  return safe
    ? `The guided form opened the ${safe} list. The person is filling it in; it has not been submitted.`
    : 'The guided form opened. The person is filling it in; it has not been submitted.';
}

export function loadFailedFollowUp(listTitle: string, reason: 'notFound' | 'accessDenied' | 'notAList' | 'network' | 'server' | 'empty' | string): string {
  const safe = listName(listTitle);
  const target = safe ? `the list \u201c${safe}\u201d` : 'a list';
  switch (reason) {
    case 'notFound':
      return `The guided form couldn\u2019t open ${target}. The list was not found. The person must choose a site and a list in the form. Nothing has been filled in or submitted.`;
    case 'accessDenied':
      return `The guided form couldn\u2019t open ${target}. The person doesn\u2019t have access. It has not been prefilled or submitted.`;
    case 'notAList':
      return `The guided form couldn\u2019t open ${target} because it isn\u2019t a SharePoint list. It has not been prefilled or submitted.`;
    case 'network':
      return `The guided form couldn\u2019t reach SharePoint, so ${target} was not opened. It has not been prefilled or submitted.`;
    case 'empty':
      return 'The guided form needs a SharePoint list. The person can pick a site and list in the form. Nothing has been prefilled or submitted.';
    default:
      return `The guided form couldn\u2019t open ${target}. Something went wrong while loading. It has not been prefilled or submitted.`;
  }
}

export function pickedListFollowUp(listTitle: string): string {
  const safe = listName(listTitle);
  return safe
    ? `The guided form is now using the ${safe} list. The person is filling it in; it has not been submitted.`
    : 'The guided form is now using a chosen list. The person is filling it in; it has not been submitted.';
}

export { PREFERRED_FILL as COPILOT_INLINE_HEIGHT_PX } from './hostHeight';

export type CopilotStatusKind = 'opened' | 'failed' | 'empty' | 'chosen' | 'submitted' | 'notSubmitted' | 'unknown';
export type CopilotStatusChannel = 'modelContext' | 'followUp';

/** Chosen or opened lists stay in model context so a remount can reopen the same list. Chat follow-ups are reserved for submit results and save failures. */
export function statusChannel(kind: CopilotStatusKind): CopilotStatusChannel {
  // Chat follow-ups are reserved for a real submit or a failed save. Chosen, opened, empty and
  // load failures (including while the person is still picking a list) stay in model context.
  return kind === 'submitted' || kind === 'notSubmitted' || kind === 'unknown' ? 'followUp' : 'modelContext';
}

/** Every status, including submitted, must refresh model context so a prior "opened" state cannot linger. */
export function writesModelContext(_kind: CopilotStatusKind): boolean {
  return true;
}

/** Machine-readable context for the model. Includes siteUrl and listName when known so the next tool call can open the same list. Status only: no answers. */
export function listModelContext(opts: { siteUrl?: string; listName?: string; status: string; errorKind?: string }): Record<string, string> {
  const out: Record<string, string> = { status: opts.status };
  const siteUrl = (opts.siteUrl || '').trim();
  const name = listName(opts.listName || '');
  const errorKind = (opts.errorKind || '').trim();
  if (siteUrl) {
    out.siteUrl = siteUrl;
  }
  if (name) {
    out.listName = name;
  }
  if (errorKind) {
    out.errorKind = errorKind;
  }
  return out;
}

/** Status only: list name and that an item was added. Never includes answers or the item. */
export function submittedStatus(listTitle: string): string {
  const safe = listName(listTitle);
  return safe ? `The guided form added a new item to the ${safe} list.` : 'The guided form added a new list item.';
}

/** Status only: a save was sent but the outcome is not confirmed yet. Never says it was not submitted. */
export function submitUnknownStatus(listTitle: string): string {
  const safe = listName(listTitle);
  const target = safe ? `the ${safe} list` : 'the list';
  return `The guided form sent a save to ${target}. SharePoint took too long to respond. The outcome is not confirmed yet.`;
}

/** Status only: the save did not complete. Names the error kind, never answers or the item. */
export function submitFailedStatus(listTitle: string, reason: string): string {
  const safe = listName(listTitle);
  const target = safe ? `the ${safe} list` : 'the list';
  switch (reason) {
    case 'accessDenied':
      return `The guided form did not add an item to ${target}. The person does not have permission. It was not submitted.`;
    case 'notFound':
      return `The guided form did not add an item to ${target}. The list was not found. It was not submitted.`;
    case 'network':
      return `The guided form did not add an item to ${target}. SharePoint could not be reached. It was not submitted.`;
    case 'timeout':
      return `The guided form sent a save to ${target}. SharePoint took too long to respond. The outcome is not confirmed yet.`;
    case 'validation':
      return `The guided form did not add an item to ${target}. Some answers were not accepted. It was not submitted.`;
    default:
      return `The guided form did not add an item to ${target}. Something went wrong while saving. It was not submitted.`;
  }
}
