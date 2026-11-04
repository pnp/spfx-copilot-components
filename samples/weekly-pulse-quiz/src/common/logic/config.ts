import type { SpValue } from './spNull';
import type { AnonymityMode, IPulseSettings } from '../models';
import { DEFAULT_SETTINGS } from '../models';
import { resolveListTitle, resolveSiteUrl } from './siteUrl';

/** One row of the "Weekly Pulse Config" list (all columns optional). */
export interface IConfigRow {
  AnonymityMode?: SpValue<string>;
  ShowCorrectAnswer?: SpValue<boolean>;
  ShowJustification?: SpValue<boolean>;
  Animations?: SpValue<boolean>;
  ResponsesSiteUrl?: SpValue<string>;
  ResponsesListTitle?: SpValue<string>;
  QuestionsListTitle?: SpValue<string>;
  BannerTitle?: SpValue<string>;
  IntroText?: SpValue<string>;
  NoQuizText?: SpValue<string>;
}

export function parseAnonymityMode(value: unknown): AnonymityMode {
  return typeof value === 'string' && value.trim().toLowerCase() === 'named' ? 'Named' : 'Anonymous';
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function text(value: unknown, fallback: string, max: number): string {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : fallback;
}

/**
 * Merge the config-list row (Copilot host) over the built-in defaults.
 * A missing list or row means: defaults, quiz still works.
 */
export function settingsFromConfigRow(row: IConfigRow | undefined, questionsSiteUrl: string, allowedOrigin: string): IPulseSettings {
  const r = row || {};
  return {
    ...DEFAULT_SETTINGS,
    questionsSiteUrl,
    questionsListTitle: resolveListTitle(r.QuestionsListTitle || undefined, DEFAULT_SETTINGS.questionsListTitle),
    responsesSiteUrl: resolveSiteUrl(r.ResponsesSiteUrl || questionsSiteUrl, allowedOrigin),
    responsesListTitle: resolveListTitle(r.ResponsesListTitle || undefined, DEFAULT_SETTINGS.responsesListTitle),
    anonymityMode: parseAnonymityMode(r.AnonymityMode),
    showCorrectAnswer: bool(r.ShowCorrectAnswer, DEFAULT_SETTINGS.showCorrectAnswer),
    showJustification: bool(r.ShowJustification, DEFAULT_SETTINGS.showJustification),
    animations: bool(r.Animations, DEFAULT_SETTINGS.animations),
    bannerTitle: text(r.BannerTitle, DEFAULT_SETTINGS.bannerTitle, 80),
    introText: text(r.IntroText, DEFAULT_SETTINGS.introText, 280),
    noQuizText: text(r.NoQuizText, DEFAULT_SETTINGS.noQuizText, 280)
  };
}
