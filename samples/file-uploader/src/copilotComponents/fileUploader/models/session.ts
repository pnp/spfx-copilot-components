import type { IFileUploaderCopilotComponentProperties } from '../FileUploaderCopilotComponentProperties';
import type { IFilingDraft, IFilingReceipt, IRecentFilingRow, IRecentFilter, IValidationResult } from './filing';
import { filterFromProperties, intentFromProperties } from '../logic/prefill';

/**
 * Transient interaction state (AGENTS.md §3, state class 3). Lives on the
 * component instance, never in host context and never mirrored from it. It is
 * rebuilt only when the properties-version token changes; a theme flip or
 * resize re-renders with the same session, so in-progress edits survive.
 */

export type Intent = 'file' | 'recent';

export type FilingStage = 'empty' | 'draft' | 'validation' | 'review' | 'saving' | 'receipt' | 'error';

export interface IFilingSession {
  stage: FilingStage;
  drafts: IFilingDraft[];
  /** Which draft the form shows (fullscreen list selection; the only one inline). */
  selectedDraftId?: string;
  /** Per-draft validation from the last "Review and save" attempt. */
  validation: Record<string, IValidationResult>;
  receipts: IFilingReceipt[];
  /** Error message when stage === 'error'. */
  error?: string;
  /** Wall-clock of the last failed attempt, for the "Tried N seconds ago" line. */
  lastAttemptAt?: Date;
}

export type RecentState = 'idle' | 'loading' | 'ready' | 'error';

export interface IRecentSession {
  filter: IRecentFilter;
  state: RecentState;
  rows: IRecentFilingRow[];
  selectedRowId?: string;
  error?: string;
}

export interface ISession {
  /** Properties-version token this session was built for. */
  version: number;
  intent: Intent;
  filing: IFilingSession;
  recent: IRecentSession;
}

export function createSession(props: IFileUploaderCopilotComponentProperties, version: number): ISession {
  return {
    version,
    intent: intentFromProperties(props),
    filing: {
      stage: 'empty',
      drafts: [],
      validation: {},
      receipts: []
    },
    recent: {
      filter: filterFromProperties(props),
      state: 'idle',
      rows: []
    }
  };
}
