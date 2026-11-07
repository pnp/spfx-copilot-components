import type { Expert } from '../models/Expert';
import { normalizeText } from './skills';

export interface ExpertFilters { name: string; department: string; role: string; }
export const emptyFilters: ExpertFilters = { name: '', department: '', role: '' };

export function filterExperts(experts: Expert[], filters: ExpertFilters): Expert[] {
  const name = normalizeText(filters.name);
  return experts.filter(expert => normalizeText(expert.displayName).indexOf(name) === 0
    && (!filters.department || normalizeText(expert.department) === normalizeText(filters.department))
    && (!filters.role || normalizeText(expert.jobTitle) === normalizeText(filters.role)));
}

export function filterOptions(values: string[]): string[] {
  const seen = new Set<string>();
  return values.map(value => value.trim().replace(/\s+/g, ' ')).filter(value => {
    const key = normalizeText(value);
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  }).sort((a, b) => a.localeCompare(b));
}
