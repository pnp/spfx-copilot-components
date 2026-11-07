import type { ExpertSkill } from '../models/Expert';

export const supportedSkills: readonly ExpertSkill[] = ['SPFx', 'Copilot', 'DB', 'Spanish'];

export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function normalizeSkill(value: unknown): ExpertSkill | undefined {
  if (typeof value !== 'string' || value.length > 80) return undefined;
  const normalized = normalizeText(value);
  return supportedSkills.filter(skill => normalizeText(skill) === normalized)[0];
}
