import type { AnswerValue, Answers, IWizardField } from '../models';
import type { WizardPhase } from './navigation';
import { isHyperlinkAnswer } from './hyperlink';
import { isValidInternalName } from './siteUrl';

export const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const DRAFT_KEY_PREFIX = 'te-step-form:v1:';
const MAX_DRAFT_CHARS = 20000;
const MAX_ANSWER_KEYS = 50;
const MAX_ANSWER_CHARS = 64000;

export interface IFormDraft {
  answers: Answers;
  phase: WizardPhase;
  index: number;
  savedAt: number;
}

export interface IDraftKeyParts {
  siteUrl: string;
  listTitle: string;
  userId: string;
  instanceId: string;
}

const BAD = /^(?:__proto__|constructor|prototype)$/i;

export function draftKey(parts: IDraftKeyParts): string {
  const safe = (v: string): string => encodeURIComponent((v || '').trim() || '-');
  return `${DRAFT_KEY_PREFIX}${safe(parts.siteUrl)}:${safe(parts.listTitle)}:${safe(parts.userId)}:${safe(parts.instanceId)}`;
}

export function storageAvailable(storage?: Storage | undefined): boolean {
  try {
    const s = storage || (typeof localStorage !== 'undefined' ? localStorage : undefined);
    if (!s) {
      return false;
    }
    const probe = `${DRAFT_KEY_PREFIX}probe`;
    s.setItem(probe, '1');
    s.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function resolveStorage(storage?: Storage | undefined): Storage | undefined {
  if (storage) {
    return storage;
  }
  try {
    return typeof localStorage !== 'undefined' ? localStorage : undefined;
  } catch {
    return undefined;
  }
}

function cleanAnswer(value: unknown): AnswerValue | undefined {
  if (Array.isArray(value)) {
    const list = value.filter((v): v is string => typeof v === 'string').map((v) => v.slice(0, 255)).slice(0, 50);
    return list;
  }
  if (typeof value === 'string') {
    return value.length > MAX_ANSWER_CHARS ? value.slice(0, MAX_ANSWER_CHARS) : value;
  }
  if (isHyperlinkAnswer(value)) {
    return {
      url: value.url.slice(0, 255),
      description: (typeof value.description === 'string' ? value.description : '').slice(0, 255)
    };
  }
  return undefined;
}

function cleanAnswers(raw: unknown): Answers {
  const out: Answers = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return out;
  }
  const rec = raw as Record<string, unknown>;
  Object.keys(rec).forEach((key) => {
    if (BAD.test(key) || !isValidInternalName(key) || Object.keys(out).length >= MAX_ANSWER_KEYS) {
      return;
    }
    const value = cleanAnswer(rec[key]);
    if (value !== undefined) {
      out[key] = value;
    }
  });
  return out;
}

function cleanPhase(value: unknown): WizardPhase {
  return value === 'step' || value === 'review' || value === 'intro' ? value : 'intro';
}

export function parseDraft(raw: string, now: number = Date.now()): IFormDraft | undefined {
  if (!raw || raw.length > MAX_DRAFT_CHARS) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return undefined;
    }
    const rec = parsed as Record<string, unknown>;
    if (Object.keys(rec).some((k) => BAD.test(k))) {
      return undefined;
    }
    const savedAt = typeof rec.savedAt === 'number' && isFinite(rec.savedAt) ? rec.savedAt : 0;
    if (!savedAt || now - savedAt > DRAFT_TTL_MS || now < savedAt - 60 * 1000) {
      return undefined;
    }
    const index = typeof rec.index === 'number' && isFinite(rec.index) && rec.index >= 0 ? Math.floor(rec.index) : 0;
    return {
      answers: cleanAnswers(rec.answers),
      phase: cleanPhase(rec.phase),
      index,
      savedAt
    };
  } catch {
    return undefined;
  }
}

export function hasMeaningfulAnswers(answers: Answers, fields: IWizardField[]): boolean {
  return fields.some((f) => {
    const v = answers[f.internalName];
    if (Array.isArray(v)) {
      return v.length > 0;
    }
    if (isHyperlinkAnswer(v)) {
      return v.url.trim().length > 0;
    }
    return typeof v === 'string' && v.trim().length > 0;
  });
}

export function readDraft(parts: IDraftKeyParts, storage?: Storage, now?: number): IFormDraft | undefined {
  const s = resolveStorage(storage);
  if (!s) {
    return undefined;
  }
  try {
    const raw = s.getItem(draftKey(parts));
    if (!raw) {
      return undefined;
    }
    const draft = parseDraft(raw, now !== undefined ? now : Date.now());
    if (!draft) {
      s.removeItem(draftKey(parts));
    }
    return draft;
  } catch {
    return undefined;
  }
}

export function writeDraft(parts: IDraftKeyParts, draft: Omit<IFormDraft, 'savedAt'> & { savedAt?: number }, storage?: Storage, now?: number): boolean {
  const s = resolveStorage(storage);
  if (!s) {
    return false;
  }
  const savedAt = draft.savedAt !== undefined ? draft.savedAt : now !== undefined ? now : Date.now();
  const body: IFormDraft = { answers: cleanAnswers(draft.answers), phase: cleanPhase(draft.phase), index: Math.max(0, Math.floor(draft.index) || 0), savedAt };
  try {
    const text = JSON.stringify(body);
    if (text.length > MAX_DRAFT_CHARS) {
      return false;
    }
    s.setItem(draftKey(parts), text);
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(parts: IDraftKeyParts, storage?: Storage): void {
  const s = resolveStorage(storage);
  if (!s) {
    return;
  }
  try {
    s.removeItem(draftKey(parts));
  } catch {
    /* ignore quota / access errors */
  }
}
