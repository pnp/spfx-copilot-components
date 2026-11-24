import { MAX_TITLE_LENGTH, resolveCopilotConfig, resolveWebPartConfig, sanitizePlainText, submittedFollowUp } from '../logic/config';

const ORIGIN = 'https://fabrikam.sharepoint.com';
const WEB = 'https://fabrikam.sharepoint.com/sites/it';

describe('web part configuration', () => {
  it('uses the current site by default and is unconfigured without a list', () => {
    const c = resolveWebPartConfig({}, ORIGIN, WEB);
    expect(c).toMatchObject({ configured: false, siteUrl: WEB, listTitle: '', fields: '', showReview: true, animations: true, accentColor: '' });
    expect(c.texts.thankYouText).toBe('Thanks, your answers were submitted.');
  });

  it('sanitises every property-pane value', () => {
    const c = resolveWebPartConfig(
      { siteUrl: 'https://evil.example.com', listName: 'IT Requests/../_api', fields: 'Title, <x>, Category', formTitle: '<b>Hi</b>\u0007', introText: 'Line 1\n\n\n\nLine 2', accentColor: 'red', showReview: false, animations: false },
      ORIGIN,
      WEB
    );
    expect(c.siteUrl).toBe(WEB);
    expect(c.listTitle).toBe('');
    expect(c.configured).toBe(false);
    expect(c.notices).toHaveLength(2);
    expect(c.fields).toBe('Title,Category');
    expect(c.texts.formTitle).toBe('<b>Hi</b>');
    expect(c.texts.introText).toBe('Line 1\n\nLine 2');
    expect(c.accentColor).toBe('');
    expect(c.showReview).toBe(false);
    expect(c.animations).toBe(false);
  });

  it('accepts a valid configuration', () => {
    const c = resolveWebPartConfig({ siteUrl: `${ORIGIN}/sites/hr/`, listName: 'Leave requests', accentColor: '#0F6CBD' }, ORIGIN, WEB);
    expect(c).toMatchObject({ configured: true, siteUrl: `${ORIGIN}/sites/hr`, listTitle: 'Leave requests', accentColor: '#0f6cbd', notices: [] });
  });
});

describe('Copilot tool configuration', () => {
  it('treats every argument as untrusted and keeps review on', () => {
    const c = resolveCopilotConfig({ siteUrl: 42, listName: ['x'], fields: {}, formTitle: 'x'.repeat(200), prefill: '{"Title":"a"}' }, ORIGIN, WEB);
    expect(c.siteUrl).toBe(WEB);
    expect(c.listTitle).toBe('');
    expect(c.fields).toBe('');
    expect(c.texts.formTitle.length).toBe(MAX_TITLE_LENGTH);
    expect(c.showReview).toBe(true);
    expect(c.accentColor).toBe('');
    expect(c.prefill).toBe('{"Title":"a"}');
  });

  it('drops oversize or non-object prefill', () => {
    expect(resolveCopilotConfig({ prefill: 'x'.repeat(9000) }, ORIGIN, WEB).prefill).toBeUndefined();
    expect(resolveCopilotConfig({ prefill: [1] }, ORIGIN, WEB).prefill).toBeUndefined();
    expect(resolveCopilotConfig({ prefill: { Title: 'a' } }, ORIGIN, WEB).prefill).toEqual({ Title: 'a' });
  });

  it('is configured with a plain list name on this tenant', () => {
    expect(resolveCopilotConfig({ listName: 'IT Requests' }, ORIGIN, WEB)).toMatchObject({ configured: true, siteUrl: WEB, listTitle: 'IT Requests' });
  });

  it('sends a status line only, never answers', () => {
    expect(submittedFollowUp('IT Requests')).toBe('The guided form added a new item to the IT Requests list.');
    expect(submittedFollowUp('<script>')).toBe('The guided form added a new list item.');
  });

  it('strips control characters from plain text', () => {
    expect(sanitizePlainText('a\u0000b\tc', 10)).toBe('a b c');
    expect(sanitizePlainText(5, 10)).toBe('');
  });
});

describe('v1.3 JSON properties', () => {
  it('parses question text, examples, skip rules and the greeting toggle', () => {
    const c = resolveWebPartConfig(
      {
        listName: 'IT Requests',
        showGreeting: true,
        questionTexts: '{"Title":"Thanks, {{firstName}}. What do you need?"}',
        fieldExamples: '{"Title":"New laptop"}',
        skipLogic: '[{"show":"Urgency","when":"Category","equals":"Incident"}]'
      },
      ORIGIN,
      WEB
    );
    expect(c.showGreeting).toBe(true);
    expect(c.questionTexts.Title).toContain('{{firstName}}');
    expect(c.fieldExamples.Title).toBe('New laptop');
    expect(c.skipRules).toEqual([{ show: 'Urgency', when: 'Category', equals: 'Incident' }]);
    expect(c.notices).toEqual([]);
  });

  it('ignores invalid JSON with a notice and still configures the list', () => {
    const c = resolveWebPartConfig({ listName: 'IT Requests', questionTexts: '{bad', skipLogic: '{bad', fieldExamples: '{bad' }, ORIGIN, WEB);
    expect(c.configured).toBe(true);
    expect(c.questionTexts).toEqual({});
    expect(c.skipRules).toEqual([]);
    expect(c.notices.length).toBeGreaterThan(0);
  });

  it('lets Copilot pass field examples as a JSON string', () => {
    const c = resolveCopilotConfig({ listName: 'IT Requests', fieldExamples: '{"Title":"Monitor flickers"}' }, ORIGIN, WEB);
    expect(c.fieldExamples.Title).toBe('Monitor flickers');
    expect(c.showGreeting).toBe(true);
  });
});

describe('loading message and highlight colour', () => {
  it('defaults the loading message and accepts a custom one', () => {
    const empty = resolveWebPartConfig({ listName: 'IT Requests' }, ORIGIN, WEB);
    expect(empty.loadingMessage).toBe('Loading the form\u2026');
    expect(empty.highlightColor).toBe('');
    const custom = resolveWebPartConfig(
      { listName: 'IT Requests', loadingMessage: '  Please wait  ', highlightColor: '#FFB000' },
      ORIGIN,
      WEB
    );
    expect(custom.loadingMessage).toBe('Please wait');
    expect(custom.highlightColor).toBe('#ffb000');
    expect(resolveWebPartConfig({ listName: 'IT Requests', highlightColor: 'red' }, ORIGIN, WEB).highlightColor).toBe('');
  });

  it('accepts a hex highlight and loading message from Copilot, and ignores non-hex colour', () => {
    const c = resolveCopilotConfig({ listName: 'IT Requests', highlightColor: '#4DA3FF', loadingMessage: 'Hang on' }, ORIGIN, WEB);
    expect(c.highlightColor).toBe('#4da3ff');
    expect(c.loadingMessage).toBe('Hang on');
    expect(resolveCopilotConfig({ listName: 'IT Requests', highlightColor: 'expression(alert(1))' }, ORIGIN, WEB).highlightColor).toBe('');
  });
});
