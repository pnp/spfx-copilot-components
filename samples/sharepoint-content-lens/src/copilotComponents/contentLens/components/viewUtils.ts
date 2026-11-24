import * as React from 'react';
import type { CategoryId, ReviewSource } from '../domain/contracts';
import { guidelineSlots, maxGuidelineChars } from '../domain/contracts';

/** Entries per page in every list. */
export const itemsPerPage = 5;

export function toggle<T>(values: T[], value: T): T[] {
  return values.indexOf(value) >= 0 ? values.filter(item => item !== value) : [...values, value];
}

export function unique<T>(values: T[]): T[] {
  return values.filter((value, index) => values.indexOf(value) === index);
}

export function sourceKey(source: Pick<ReviewSource, 'id' | 'chunkId'>): string {
  return JSON.stringify([source.id, source.chunkId]);
}

/** Replaces `{0}`, `{1}` and so on in a localized string. */
export function format(template: string, ...values: Array<string | number>): string {
  return values.reduce<string>((text, value, index) => text.replace('{' + index + '}', String(value)), template);
}

/** Like format, but values can be elements, e.g. a number set in bold inside a sentence. */
export function formatNodes(template: string, ...values: React.ReactNode[]): React.ReactNode[] {
  return template.split(/(\{\d\})/).map((part, index) => {
    const match = /^\{(\d)\}$/.exec(part);
    return React.createElement(React.Fragment, { key: index }, match ? values[Number(match[1])] : part);
  });
}

/** The requested page, clamped to the list, and the entries on it. */
export function pageOf<T>(
  items: T[],
  requested: number,
  pageSize: number = itemsPerPage
): { page: number; visible: T[] } {
  const lastPage = Math.max(0, Math.ceil(items.length / pageSize) - 1);
  const page = Math.min(requested, lastPage);
  return { page, visible: items.slice(page * pageSize, (page + 1) * pageSize) };
}

export function checkLabels(s: IContentLensStrings): Record<CategoryId, string> {
  return {
    profanity: s.Profanity,
    insult: s.Insult,
    hate: s.Hate,
    sexual: s.Sexual,
    threat: s.Threat,
    aggressive: s.Aggressive,
    rule1: format(s.RuleLabel, 1),
    rule2: format(s.RuleLabel, 2),
    rule3: format(s.RuleLabel, 3),
    rule4: format(s.RuleLabel, 4),
    rule5: format(s.RuleLabel, 5)
  };
}

/**
 * What each check covers. The text describes the check itself, so it can stand in when a finding has no
 * explanation. A rule's description is the rule's own text, so a rule finding names the rule it broke.
 */
export function checkDescriptions(s: IContentLensStrings, rules: string[]): Record<CategoryId, string> {
  const rule = (index: number): string => rules[index] ? format(s.RuleDescription, rules[index]) : '';
  return {
    profanity: s.ProfanityDescription,
    insult: s.InsultDescription,
    hate: s.HateDescription,
    sexual: s.SexualDescription,
    threat: s.ThreatDescription,
    aggressive: s.AggressiveDescription,
    rule1: rule(0),
    rule2: rule(1),
    rule3: rule(2),
    rule4: rule(3),
    rule5: rule(4)
  };
}

/** The guidelines in the text box, as the slots a check sends. Too long a text keeps the check from starting. */
export function parseRules(text: string): { rules: string[]; tooLong: boolean } {
  const tooLong = text.trim().length > maxGuidelineChars;
  return { rules: tooLong ? [] : guidelineSlots(text), tooLong };
}
