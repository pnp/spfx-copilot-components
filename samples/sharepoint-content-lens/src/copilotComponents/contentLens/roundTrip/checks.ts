// A leaf module: the component manifest's tool schemas load it as Node ESM, so it has no relative imports.

/** The checks Copilot can flag: six kinds of harmful wording, and up to five writing rules of the reviewer's own. */
export const categoryIds = [
  'profanity', 'insult', 'hate', 'sexual', 'threat', 'aggressive',
  'rule1', 'rule2', 'rule3', 'rule4', 'rule5'
] as const;
export type CategoryId = typeof categoryIds[number];
/** The standard wording checks; the launcher can prefill only these. */
export const standardCheckIds = ['profanity', 'insult', 'hate', 'sexual', 'threat', 'aggressive'] as const;
/** The reviewer's own writing rules: rule N exists while the Nth rule has text. */
export const ruleIds = ['rule1', 'rule2', 'rule3', 'rule4', 'rule5'] as const;
export const maxRules = ruleIds.length;
/** All rule texts together stay within this many characters. */
export const maxRuleChars = 1000;

export function isRuleId(id: CategoryId): boolean {
  return (ruleIds as readonly string[]).indexOf(id) >= 0;
}

/** Rule N is selected exactly when the Nth rule has text, and all rules together stay within the limit. */
export function rulesMatchCategories(categories: readonly string[], rules: string[]): boolean {
  const selected = categories.filter(id => (ruleIds as readonly string[]).indexOf(id) >= 0);
  return JSON.stringify(selected) === JSON.stringify(ruleIds.slice(0, rules.length)) &&
    rules.every(rule => !!rule.trim()) &&
    rules.reduce((total, rule) => total + rule.length, 0) <= maxRuleChars;
}

/** One letter per check: the alphabet of the compact review Copilot returns. */
export const categoryCodes: Record<CategoryId, string> = {
  profanity: 'p', insult: 'i', hate: 'h', sexual: 's', threat: 't', aggressive: 'a',
  rule1: 'v', rule2: 'w', rule3: 'x', rule4: 'y', rule5: 'z'
};
/**
 * One flag: a check code, an optional "?" for uncertain context, and a passage or contiguous range.
 * A writing rule (v-z) may add up to three more single passages after dots, so every place that breaks
 * the rule is marked: v@3-4.9.12. The code class lists every value of categoryCodes.
 */
export const flagPattern: RegExp = /^([pihstavwxyz])(\?)?@([1-9]\d?)(?:-([1-9]\d?))?((?:\.[1-9]\d?){0,3})$/;
