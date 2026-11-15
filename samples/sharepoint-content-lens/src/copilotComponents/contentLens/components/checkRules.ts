import { checkCatalog, type CheckDefinition, type CheckGroup } from '../domain/checkCatalog';
import { format } from './viewUtils';

/** Each check's rule in plain words, with the thresholds the code uses. */
export function checkRule(s: IContentLensStrings, check: CheckDefinition): string {
  const rules: Record<CheckDefinition['id'], string> = {
    headingOrder: s.CheckRuleHeadingOrder,
    linkText: s.CheckRuleLinkText,
    linkName: s.CheckRuleLinkName,
    imageAlt: s.CheckRuleImageAlt,
    tableHeader: s.CheckRuleTableHeader,
    longBlock: s.CheckRuleLongBlock,
    longParagraph: s.CheckRuleLongParagraph,
    emptySpace: s.CheckRuleEmptySpace,
    repeatedWebParts: s.CheckRuleRepeatedWebParts,
    newsFacts: s.CheckRuleNewsFacts,
    datesPassed: s.CheckRuleDatesPassed,
    lastSaved: s.CheckRuleLastSaved
  };
  return format(rules[check.id], ...check.values.map(value => value.toLocaleString()));
}

export function checkGroupLabel(s: IContentLensStrings, group: CheckGroup): string {
  if (group === 'a11y') return s.A11yLabel;
  if (group === 'layout') return s.LayoutLabel;
  return s.FreshnessLabel;
}

/** The checks of one group. The news check is included for news posts only, or when `news` is undefined to list every check. */
export function groupChecks(group: CheckGroup, news?: boolean): CheckDefinition[] {
  return checkCatalog.filter(check => check.group === group && (news === undefined || !check.newsOnly || news));
}
