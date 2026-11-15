import { addLine, commonGuidelineIds, hasLine, removeLine } from '../GuidelinesBox';

describe('Common guidelines in the text box', () => {
  it('counts a guideline as present only as a whole line, ignoring case and spacing', () => {
    expect(hasLine('My rule.\n  prefer the  active voice. ', 'Prefer the active voice.')).toBe(true);
    expect(hasLine('Always prefer the active voice. And more.', 'Prefer the active voice.')).toBe(false);
  });

  it('adds a guideline on its own line and removes only that line, keeping the rest as written', () => {
    expect(addLine('', 'Prefer the active voice.')).toBe('Prefer the active voice.');
    expect(addLine('My rule.\n\n', 'Prefer the active voice.')).toBe('My rule.\nPrefer the active voice.');
    expect(removeLine('Prefer the active voice.\nMy rule.\n  Address readers as you.', 'Prefer the active voice.')).toBe('My rule.\n  Address readers as you.');
    expect(removeLine('My rule.', 'Prefer the active voice.')).toBe('My rule.');
  });

  it('has eight common guidelines with stable ids', () => {
    expect(commonGuidelineIds).toHaveLength(8);
    expect(new Set(commonGuidelineIds).size).toBe(8);
  });
});
