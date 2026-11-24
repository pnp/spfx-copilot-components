import { checkCatalog, checkOf, layoutLimits } from '../checkCatalog';
import { accessibilityKinds, layoutKinds } from '../contracts';
import { staleAfterMonths } from '../freshness';

describe('Checks without AI', () => {
  it('names every kind of note the code produces, each in exactly one check', () => {
    const kinds = [...accessibilityKinds, ...layoutKinds, 'newsDescription', 'newsBanner', 'datePassed', 'stale'] as const;
    for (const kind of kinds) expect(checkCatalog.filter(check => check.kinds.indexOf(kind) >= 0)).toHaveLength(1);
    expect(([] as string[]).concat(...checkCatalog.map(check => check.kinds as unknown as string[])).sort()).toEqual([...kinds].sort());
    expect(checkOf('linkEmpty').id).toBe('linkName');
  });

  it('takes the thresholds in its rules from the constants the checks use', () => {
    const values = (id: string): readonly number[] => checkCatalog.filter(check => check.id === id)[0].values;
    expect(values('longBlock')).toEqual([layoutLimits.blockWords, layoutLimits.headingBlockWords]);
    expect(values('longParagraph')).toEqual([layoutLimits.paragraphWords]);
    expect(values('repeatedWebParts')).toEqual([layoutLimits.repeatedWebParts]);
    expect(values('lastSaved')).toEqual([staleAfterMonths]);
  });
});
