import { draftsFromConfig, draftsToConfig, whenFieldsBefore } from '../logic/questionEditorState';
import { field } from './helpers';

const fields = [
  field({ internalName: 'Title', title: 'Title', required: true }),
  field({ internalName: 'Category', title: 'Category', kind: 'choice', required: true, choices: ['Incident', 'Request', 'Question'] }),
  field({ internalName: 'Impact', title: 'Impact', required: true }),
  field({ internalName: 'Urgency', title: 'Urgency', kind: 'choice', choices: ['Low', 'Normal', 'High'] }),
  field({ internalName: 'OnTrack', title: 'Is this on track?', kind: 'yesno', required: true, choices: ['Yes', 'No'] })
];

describe('question editor state', () => {
  it('reads existing JSON question texts, examples and skip rules into cards', () => {
    const drafts = draftsFromConfig(
      fields,
      { Impact: "Thanks, {{firstName}}. What's the impact of {{Title}}?" },
      { Impact: 'Night shifts lose about twenty minutes.' },
      [{ show: 'Urgency', when: 'Category', equals: 'Incident' }]
    );
    const impact = drafts.find((d) => d.internalName === 'Impact');
    const urgency = drafts.find((d) => d.internalName === 'Urgency');
    expect(impact && impact.questionText).toBe("Thanks, {{firstName}}. What's the impact of {{Title}}?");
    expect(impact && impact.example).toBe('Night shifts lose about twenty minutes.');
    expect(urgency && urgency.conditions).toEqual([{ when: 'Category', op: 'is', values: ['Incident'] }]);
    expect(drafts.find((d) => d.internalName === 'OnTrack') && drafts.find((d) => d.internalName === 'OnTrack')!.choices).toEqual(['Yes', 'No']);
  });

  it('writes only overrides back to the same JSON shape, and supports is-any-of', () => {
    const drafts = draftsFromConfig(fields, {}, {}, []);
    drafts[2].questionText = "What's the impact of {{Title}}?";
    drafts[2].example = 'The report is unreadable.';
    drafts[3].conditions = [{ when: 'Category', op: 'any', values: ['Incident', 'Request'] }];
    const next = draftsToConfig(drafts, fields);
    expect(next.questionTexts).toEqual({ Impact: "What's the impact of {{Title}}?" });
    expect(next.fieldExamples).toEqual({ Impact: 'The report is unreadable.' });
    expect(next.skipLogic).toEqual([{ show: 'Urgency', when: 'Category', in: ['Incident', 'Request'] }]);
    // Default question text equal to the column title is not written.
    expect(next.questionTexts.Title).toBeUndefined();
  });

  it('round-trips a saved config back into cards', () => {
    const saved = draftsToConfig(
      draftsFromConfig(
        fields,
        { Impact: "What's the impact of {{Title}}?" },
        { Impact: 'Example' },
        [{ show: 'Urgency', when: 'Category', in: ['Incident', 'Request'] }]
      ),
      fields
    );
    const again = draftsFromConfig(fields, saved.questionTexts, saved.fieldExamples, saved.skipLogic);
    expect(again[2].questionText).toBe("What's the impact of {{Title}}?");
    expect(again[3].conditions).toEqual([{ when: 'Category', op: 'any', values: ['Incident', 'Request'] }]);
  });

  it('lists only earlier Choice, MultiChoice and Yes/No fields as skip-when options, not Title or other text', () => {
    expect(whenFieldsBefore(fields, 'Title').map((f) => f.internalName)).toEqual([]);
    expect(whenFieldsBefore(fields, 'Category').map((f) => f.internalName)).toEqual([]);
    expect(whenFieldsBefore(fields, 'Impact').map((f) => f.internalName)).toEqual(['Category']);
    expect(whenFieldsBefore(fields, 'Urgency').map((f) => f.internalName)).toEqual(['Category']);
    expect(whenFieldsBefore(fields, 'OnTrack').map((f) => f.internalName)).toEqual(['Category', 'Urgency']);
    expect(whenFieldsBefore(fields, 'OnTrack').every((f) => f.kind === 'choice' || f.kind === 'multichoice' || f.kind === 'yesno')).toBe(true);
  });

  it('drops incomplete conditions on save and ignores empty or invalid conditions in saved JSON', () => {
    const drafts = draftsFromConfig(fields, {}, {}, []);
    drafts[3].conditions = [
      { when: 'Category', op: 'is', values: [] },
      { when: 'Title', op: 'is', values: ['anything'] },
      { when: 'Category', op: 'is', values: ['Incident'] },
      { when: 'Category', op: 'any', values: [] }
    ];
    expect(draftsToConfig(drafts, fields).skipLogic).toEqual([{ show: 'Urgency', when: 'Category', equals: 'Incident' }]);

    const loaded = draftsFromConfig(fields, {}, {}, [
      { show: 'Urgency', when: 'Category', equals: '' },
      { show: 'Urgency', when: 'Title', equals: 'x' },
      { show: 'Urgency', when: 'Category', equals: 'Incident' },
      { show: 'Urgency', when: 'Category', in: [] }
    ]);
    expect(loaded[3].conditions).toEqual([{ when: 'Category', op: 'is', values: ['Incident'] }]);
  });

  it('round-trips is not and is answered, and presets Email when the column name contains email', () => {
    const withEmail = fields.concat([
      field({ internalName: 'ContactEmail', title: 'Work email', required: false }),
      field({ internalName: 'Website', title: 'Website', kind: 'hyperlink' })
    ]);
    const drafts2 = draftsFromConfig(
      withEmail,
      {},
      {},
      [
        { show: 'Urgency', when: 'Category', notEquals: 'Question' },
        { show: 'OnTrack', when: 'Category', answered: true }
      ]
    );
    expect(drafts2.find((d) => d.internalName === 'Urgency')!.conditions).toEqual([{ when: 'Category', op: 'not', values: ['Question'] }]);
    expect(drafts2.find((d) => d.internalName === 'OnTrack')!.conditions).toEqual([{ when: 'Category', op: 'answered', values: [] }]);
    expect(drafts2.find((d) => d.internalName === 'ContactEmail')!.answerCheck).toBe('email');
    expect(drafts2.find((d) => d.internalName === 'Website')!.answerCheck).toBe('url');
    const saved = draftsToConfig(drafts2, withEmail);
    expect(saved.skipLogic).toEqual([
      { show: 'Urgency', when: 'Category', notEquals: 'Question' },
      { show: 'OnTrack', when: 'Category', answered: true }
    ]);
    // Presets are not written; an author setting None on an email column is.
    expect(saved.answerChecks.ContactEmail).toBeUndefined();
    drafts2.find((d) => d.internalName === 'ContactEmail')!.answerCheck = 'none';
    expect(draftsToConfig(drafts2, withEmail).answerChecks).toEqual({ ContactEmail: 'none' });
  });
});
