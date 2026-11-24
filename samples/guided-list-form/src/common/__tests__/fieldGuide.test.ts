import { fieldGuideFor } from '../logic/fieldGuide';
import { field } from './helpers';
import { defaultAnswerCheck } from '../logic/answerCheck';

describe('field guide source', () => {
  const impact = field({
    internalName: 'Impact',
    title: 'Impact',
    description: 'Describe how this issue affects the team or a deadline.'
  });

  it('uses the SharePoint description as the hint and an optional example', () => {
    expect(fieldGuideFor(impact, { Impact: 'Night shifts lose about twenty minutes.' })).toEqual({
      hint: 'Describe how this issue affects the team or a deadline.',
      example: 'Night shifts lose about twenty minutes.'
    });
  });

  it('matches examples by display name and hides the card when there is no text', () => {
    expect(fieldGuideFor(impact, { impact: 'Be brief.' })?.example).toBe('Be brief.');
    expect(fieldGuideFor(field({ internalName: 'Title', title: 'Title' }), {})).toBeUndefined();
    expect(fieldGuideFor(field({ internalName: 'Title', title: 'Title', description: '  ' }), { __proto__: 'x' } as Record<string, string>)).toBeUndefined();
  });

  it('shows a built-in hint for email, web link and phone checks even without a column description', () => {
    const email = field({ internalName: 'ContactEmail', title: 'Work email' });
    const link = field({ internalName: 'Website', title: 'Website', kind: 'hyperlink' });
    const phone = field({ internalName: 'Phone', title: 'Phone' });
    expect(defaultAnswerCheck(email)).toBe('email');
    expect(defaultAnswerCheck(link)).toBe('url');
    expect(fieldGuideFor(email, {}, 'email')?.hint).toMatch(/email address/i);
    expect(fieldGuideFor(link, {}, 'url')?.hint).toMatch(/https:\/\//i);
    expect(fieldGuideFor(phone, {}, 'phone')?.hint).toMatch(/phone number/i);
    expect(fieldGuideFor(email, {}, 'email')).toBeDefined();
    expect(fieldGuideFor(field({ internalName: 'Title', title: 'Title' }), {}, 'none')).toBeUndefined();
    // A SharePoint description wins over the built-in hint.
    expect(fieldGuideFor(field({ internalName: 'ContactEmail', title: 'Work email', description: 'Use your work inbox.' }), {}, 'email')?.hint).toBe('Use your work inbox.');
  });
});
