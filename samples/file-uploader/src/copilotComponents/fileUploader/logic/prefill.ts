import type { IFileUploaderCopilotComponentProperties } from '../FileUploaderCopilotComponentProperties';
import type { IDroppedFile, IFilingDraft, IRecentFilter } from '../models/filing';
import type { FieldKey, IDocumentKindDefinition } from '../models/sources';
import { resolveLooseDate } from './dates';

/**
 * Normalised invocation state (AGENTS.md §3, state class 2): what the prompt
 * said, projected onto a draft. Copilot pre-fills; it never saves (R25). Each
 * pre-filled field is recorded so the UI can mark it "from your prompt".
 */
export function draftFromProperties(
  props: IFileUploaderCopilotComponentProperties,
  file: IDroppedFile,
  kinds: IDocumentKindDefinition[],
  now: Date,
  id: string
): IFilingDraft {
  const prefilled: FieldKey[] = [];
  const draft: IFilingDraft = { id, file, prefilled };

  if (props.documentKind) {
    draft.documentKind = props.documentKind;
    prefilled.push('documentKind');
    const kind: IDocumentKindDefinition | undefined = kinds.filter(k => k.key === props.documentKind)[0];
    if (kind) {
      draft.status = kind.defaultStatus; // a default, not a prompt value — not marked prefilled
    }
  }
  if (props.department) {
    draft.department = props.department;
    prefilled.push('department');
  }
  if (props.vendor) {
    draft.vendor = props.vendor;
    prefilled.push('vendor');
  }
  if (props.owner) {
    draft.owner = props.owner;
    prefilled.push('owner');
  }
  if (props.documentDate) {
    draft.documentDateText = props.documentDate;
    const iso: string | undefined = resolveLooseDate(props.documentDate, now);
    if (iso) {
      draft.documentDate = iso;
      prefilled.push('documentDate');
    }
  }
  if (typeof props.amount === 'number' && Number.isFinite(props.amount)) {
    draft.amount = props.amount;
    draft.amountText = String(props.amount);
    prefilled.push('amount');
  }
  return draft;
}

/** Applies a kind change to a draft: status falls back to the kind's default if not valid for it. */
export function applyKind(draft: IFilingDraft, kind: IDocumentKindDefinition): IFilingDraft {
  const status = draft.status && kind.statuses.indexOf(draft.status) >= 0 ? draft.status : kind.defaultStatus;
  return { ...draft, documentKind: kind.key, status };
}

export function filterFromProperties(props: IFileUploaderCopilotComponentProperties): IRecentFilter {
  return {
    documentKind: props.documentKind,
    department: props.department,
    status: props.status,
    period: props.period || '30d'
  };
}

/** The view a fresh invocation opens on. */
export function intentFromProperties(props: IFileUploaderCopilotComponentProperties): 'file' | 'recent' {
  return props.intent === 'recent' ? 'recent' : 'file';
}
