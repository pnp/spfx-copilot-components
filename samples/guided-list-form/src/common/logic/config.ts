import { DEFAULT_TEXTS, type IWizardTexts } from '../models';
import { parseAnswerChecks, type AnswerCheck } from './answerCheck';
import { normalizeHex } from './color';
import { parseSkipRules, parseStringMap, type ISkipRule } from './jsonProps';
import { MAX_PREFILL_LENGTH } from './prefill';
import { submittedStatus } from './copilotStatus';
import { parseFieldList, resolveListTitle, resolveSiteUrl } from './siteUrl';

export const MAX_TITLE_LENGTH = 80;
export const MAX_TEXT_LENGTH = 500;
export const DEFAULT_LOADING_MESSAGE = 'Loading the form\u2026';

export function resolveLoadingMessage(raw: unknown): string {
  return sanitizePlainText(raw, MAX_TITLE_LENGTH) || DEFAULT_LOADING_MESSAGE;
}

/** Plain text only: no control characters, collapsed whitespace, hard length cap. React escapes it on render. */
export function sanitizePlainText(value: unknown, max: number, keepNewlines: boolean = false): string {
  if (typeof value !== 'string') {
    return '';
  }
  // eslint-disable-next-line no-control-regex
  const cleaned = value.replace(keepNewlines ? /[\u0000-\u0009\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, ' ');
  const collapsed = keepNewlines
    ? cleaned.split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim()
    : cleaned.replace(/\s+/g, ' ').trim();
  return collapsed.length > max ? `${collapsed.slice(0, max - 1).replace(/\s+$/, '')}\u2026` : collapsed;
}

export interface IResolvedConfig {
  /** True when a usable list title is set. */
  configured: boolean;
  siteUrl: string;
  listTitle: string;
  /** Normalised comma list for buildFormSchema, '' for "all supported columns". */
  fields: string;
  texts: IWizardTexts;
  showReview: boolean;
  animations: boolean;
  accentColor: string;
  showGreeting: boolean;
  questionTexts: Record<string, string>;
  fieldExamples: Record<string, string>;
  skipRules: ISkipRule[];
  answerChecks: Record<string, AnswerCheck>;
  loadingMessage: string;
  highlightColor: string;
  notices: string[];
}

export interface IWebPartSettings {
  siteUrl?: string;
  listName?: string;
  fields?: string;
  formTitle?: string;
  introText?: string;
  thankYouText?: string;
  showReview?: boolean;
  animations?: boolean;
  accentColor?: string;
  showGreeting?: boolean;
  questionTexts?: string;
  fieldExamples?: string;
  skipLogic?: string;
  answerChecks?: string;
  loadingMessage?: string;
  highlightColor?: string;
}

export interface ICopilotSettings {
  siteUrl?: unknown;
  listName?: unknown;
  fields?: unknown;
  prefill?: unknown;
  formTitle?: unknown;
  fieldExamples?: unknown;
  loadingMessage?: unknown;
  highlightColor?: unknown;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function base(siteUrl: unknown, listName: unknown, fields: unknown, allowedOrigin: string, currentWebUrl: string): Pick<IResolvedConfig, 'configured' | 'siteUrl' | 'listTitle' | 'fields' | 'notices'> {
  const notices: string[] = [];
  const site = resolveSiteUrl(str(siteUrl), allowedOrigin, currentWebUrl);
  if (site.rejected) {
    notices.push('The site address wasn\u2019t a SharePoint site on this tenant, so the current site is used.');
  }
  const rawList = str(listName).trim();
  const listTitle = resolveListTitle(rawList);
  if (rawList && !listTitle) {
    notices.push('The list name contains characters that aren\u2019t allowed, so it was ignored.');
  }
  return {
    configured: !!listTitle && !!site.siteUrl,
    siteUrl: site.siteUrl,
    listTitle,
    fields: parseFieldList(str(fields)).join(','),
    notices
  };
}

function appendNotice(notices: string[], message: string): void {
  if (message && notices.indexOf(message) < 0) {
    notices.push(message);
  }
}

function extras(questionTexts: unknown, fieldExamples: unknown, skipLogic: unknown, showGreeting?: boolean, answerChecks?: unknown): Pick<IResolvedConfig, 'showGreeting' | 'questionTexts' | 'fieldExamples' | 'skipRules' | 'answerChecks' | 'notices'> {
  const questions = parseStringMap(questionTexts);
  const examples = parseStringMap(fieldExamples);
  const rules = parseSkipRules(skipLogic);
  const checks = parseAnswerChecks(answerChecks);
  const notices: string[] = [];
  appendNotice(notices, questions.error ? `${questions.error} Question text was ignored.` : questions.notice);
  appendNotice(notices, examples.error ? `${examples.error} Field examples were ignored.` : examples.notice);
  appendNotice(notices, rules.error ? `${rules.error} Skip rules were ignored.` : rules.notice);
  appendNotice(notices, checks.error ? `${checks.error} Answer checks were ignored.` : checks.notice);
  return {
    showGreeting: showGreeting === true,
    questionTexts: questions.value,
    fieldExamples: examples.value,
    skipRules: rules.value,
    answerChecks: checks.value,
    notices
  };
}

/** Page web part: values come from the property pane (an editor on this site). */
export function resolveWebPartConfig(p: IWebPartSettings, allowedOrigin: string, currentWebUrl: string): IResolvedConfig {
  const core = base(p.siteUrl, p.listName, p.fields, allowedOrigin, currentWebUrl);
  const extra = extras(p.questionTexts, p.fieldExamples, p.skipLogic, p.showGreeting, p.answerChecks);
  return {
    ...core,
    texts: {
      formTitle: sanitizePlainText(p.formTitle, MAX_TITLE_LENGTH),
      introText: sanitizePlainText(p.introText, MAX_TEXT_LENGTH, true),
      thankYouText: sanitizePlainText(p.thankYouText, MAX_TITLE_LENGTH * 2) || DEFAULT_TEXTS.thankYouText
    },
    showReview: p.showReview !== false,
    animations: p.animations !== false,
    accentColor: normalizeHex(p.accentColor),
    highlightColor: normalizeHex(p.highlightColor),
    loadingMessage: resolveLoadingMessage(p.loadingMessage),
    showGreeting: extra.showGreeting,
    questionTexts: extra.questionTexts,
    fieldExamples: extra.fieldExamples,
    skipRules: extra.skipRules,
    answerChecks: extra.answerChecks,
    notices: core.notices.concat(extra.notices)
  };
}

/** Copilot tool: every argument is model output and untrusted. No colours, no custom thank-you text, review always on. */
export function resolveCopilotConfig(p: ICopilotSettings, allowedOrigin: string, currentWebUrl: string): IResolvedConfig & { prefill: unknown } {
  const prefill = p.prefill;
  const prefillOk = (typeof prefill === 'string' && prefill.length <= MAX_PREFILL_LENGTH) || (typeof prefill === 'object' && prefill !== null && !Array.isArray(prefill));
  const core = base(p.siteUrl, p.listName, p.fields, allowedOrigin, currentWebUrl);
  const extra = extras(undefined, p.fieldExamples, undefined, true);
  return {
    ...core,
    texts: { ...DEFAULT_TEXTS, formTitle: sanitizePlainText(p.formTitle, MAX_TITLE_LENGTH) },
    showReview: true,
    animations: true,
    accentColor: '',
    highlightColor: normalizeHex(typeof p.highlightColor === 'string' ? p.highlightColor : ''),
    loadingMessage: resolveLoadingMessage(p.loadingMessage),
    showGreeting: true,
    questionTexts: extra.questionTexts,
    fieldExamples: extra.fieldExamples,
    skipRules: extra.skipRules,
    answerChecks: extra.answerChecks,
    notices: core.notices.concat(extra.notices),
    prefill: prefillOk ? prefill : undefined
  };
}

/** The only text sent back to Copilot after a submit: a status line, never the answers. */
export function submittedFollowUp(listTitle: string): string {
  return submittedStatus(listTitle);
}
