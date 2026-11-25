import { canCheckSaved, canRetrySave, initialWizardState, isSaveAgainAnyway, isSaveUnconfirmed, progressValue, screenKey, wizardReducer, type IWizardConfig, type IWizardState, type WizardAction } from '../logic/navigation';
import { FIELDS, V11_FIELDS, field } from './helpers';

const withReview: IWizardConfig = { fields: FIELDS, showReview: true };
const noReview: IWizardConfig = { fields: FIELDS, showReview: false };

function run(actions: WizardAction[], config: IWizardConfig = withReview, start: IWizardState = initialWizardState()): IWizardState {
  return actions.reduce((s, a) => wizardReducer(s, a, config), start);
}

const fillAll: WizardAction[] = [
  { type: 'start' },
  { type: 'setAnswer', name: 'Title', value: 'Laptop' },
  { type: 'next' },
  { type: 'setAnswer', name: 'Category', value: 'Hardware' },
  { type: 'next' },
  { type: 'next' },
  { type: 'next' }
];

describe('wizard navigation', () => {
  it('starts on the intro and Start opens step 1', () => {
    const s = run([{ type: 'start' }]);
    expect(s.phase).toBe('step');
    expect(s.index).toBe(0);
    expect(screenKey(s)).toBe('step-0');
  });

  it('Next does not advance past an invalid required step and shows the error', () => {
    const s = run([{ type: 'start' }, { type: 'next' }]);
    expect(s.index).toBe(0);
    expect(s.errors.Title).toBe('Please fill this in.');
  });

  it('typing clears the step error', () => {
    const s = run([{ type: 'start' }, { type: 'next' }, { type: 'setAnswer', name: 'Title', value: 'x' }]);
    expect(s.errors.Title).toBeUndefined();
  });

  it('optional steps can be skipped with Next', () => {
    const s = run(fillAll.slice(0, 6));
    expect(s.index).toBe(3);
    expect(s.direction).toBe('forward');
  });

  it('the last step goes to review, then Submit starts submitting', () => {
    const s = run(fillAll);
    expect(s.phase).toBe('review');
    expect(progressValue(s, FIELDS.length)).toBe(1);
    const submitting = run([{ type: 'submitStart' }], withReview, s);
    expect(submitting.submitting).toBe(true);
  });

  it('Back walks back through steps to the intro, and from review to the last step', () => {
    const review = run(fillAll);
    const last = run([{ type: 'back' }], withReview, review);
    expect(last).toMatchObject({ phase: 'step', index: 3, direction: 'back' });
    const intro = run([{ type: 'back' }, { type: 'back' }, { type: 'back' }, { type: 'back' }], withReview, last);
    expect(intro.phase).toBe('intro');
    expect(intro.answers.Title).toBe('Laptop');
  });

  it('Edit from review returns to review after Next', () => {
    const review = run(fillAll);
    const editing = run([{ type: 'edit', index: 1 }], withReview, review);
    expect(editing).toMatchObject({ phase: 'step', index: 1, returnToReview: true });
    const back = run([{ type: 'setAnswer', name: 'Category', value: 'Software' }, { type: 'next' }], withReview, editing);
    expect(back).toMatchObject({ phase: 'review', returnToReview: false });
    expect(back.answers.Category).toBe('Software');
  });

  it('Edit is ignored outside review and for out-of-range steps', () => {
    const step = run([{ type: 'start' }]);
    expect(run([{ type: 'edit', index: 2 }], withReview, step)).toBe(step);
    const review = run(fillAll);
    expect(run([{ type: 'edit', index: 9 }], withReview, review)).toBe(review);
  });

  it('without a review step, Next on the last step requests submit', () => {
    const s = run(fillAll, noReview);
    expect(s.phase).toBe('step');
    expect(s.submitRequested).toBe(true);
    expect(run([{ type: 'submitStart' }], noReview, s).submitting).toBe(true);
  });

  it('blocks submit from review when required fields are empty and does not start submitting', () => {
    const emptyReview: IWizardState = { ...initialWizardState(), phase: 'review' };
    const s = run([{ type: 'submitStart' }], withReview, emptyReview);
    expect(s.submitting).toBe(false);
    expect(s.phase).toBe('step');
    expect(s.index).toBe(0);
    expect(s.errors.Title).toBe('Please fill this in.');
    expect(s.submitError).toBe('');
  });

  it('submit revalidates and jumps to the first invalid step (e.g. prefill changed)', () => {
    const review = run(fillAll);
    const broken: IWizardState = { ...review, answers: { ...review.answers, Category: 'Gone' } };
    const s = run([{ type: 'submitStart' }], withReview, broken);
    expect(s).toMatchObject({ phase: 'step', index: 1, submitting: false, returnToReview: true });
    expect(s.errors.Category).toBe('Please pick one of the options.');
  });

  it('ignores navigation while submitting; success shows done, failure keeps answers', () => {
    const submitting = run([...fillAll, { type: 'submitStart' }]);
    expect(run([{ type: 'back' }, { type: 'setAnswer', name: 'Title', value: 'z' }], withReview, submitting)).toBe(submitting);
    const failed = run([{ type: 'submitFailure', message: 'Nope' }], withReview, submitting);
    expect(failed).toMatchObject({ phase: 'review', submitting: false, submitError: 'Nope' });
    expect(failed.answers.Title).toBe('Laptop');
    const done = run([{ type: 'submitSuccess', result: { id: 7, itemUrl: '', demo: true } }], withReview, submitting);
    expect(done.phase).toBe('done');
    expect(done.result && done.result.id).toBe(7);
  });

  it('treats a timeout as an unknown outcome and blocks retry until a check finds no item', () => {
    const submitting = run([...fillAll, { type: 'submitStart' }]);
    const unknown = run([{ type: 'submitUnknown', message: 'Not confirmed yet.' }], withReview, submitting);
    expect(unknown).toMatchObject({ phase: 'review', submitting: false, saveOutcome: 'unknown', submitError: 'Not confirmed yet.' });
    expect(isSaveUnconfirmed(unknown)).toBe(true);
    expect(canRetrySave(unknown)).toBe(false);
    expect(run([{ type: 'submitStart' }], withReview, unknown)).toBe(unknown);
    const checking = run([{ type: 'submitCheckStart' }], withReview, unknown);
    expect(checking.saveOutcome).toBe('checking');
    expect(canRetrySave(checking)).toBe(false);
    expect(run([{ type: 'submitStart' }], withReview, checking)).toBe(checking);
    // The original POST is still pending: an empty check can never allow a retry.
    expect(run([{ type: 'submitRetryAllowed', message: 'x' }], withReview, checking)).toBe(checking);
    const notYet = run([{ type: 'submitCheckDone', message: 'Not found yet.' }], withReview, checking);
    expect(notYet).toMatchObject({ saveOutcome: 'unknown', saveSettled: false, submitError: 'Not found yet.' });
    expect(canRetrySave(notYet)).toBe(false);
    const settled = run([{ type: 'submitSettled', message: 'Stopped responding.' }], withReview, notYet);
    expect(settled).toMatchObject({ saveOutcome: 'unknown', saveSettled: true, submitting: false });
    expect(canRetrySave(settled)).toBe(false);
    const checkingAfter = run([{ type: 'submitCheckStart' }], withReview, settled);
    const retryable = run([{ type: 'submitRetryAllowed', message: 'No matching item was found in the list.' }], withReview, checkingAfter);
    expect(retryable.saveOutcome).toBe('retryable');
    expect(isSaveAgainAnyway(retryable)).toBe(true);
    expect(canCheckSaved(retryable)).toBe(true);
    expect(canRetrySave(retryable)).toBe(true);
    const retrying = run([{ type: 'submitStart' }], withReview, retryable);
    expect(retrying.submitting).toBe(true);
    expect(retrying.saveOutcome).toBe('none');
    expect(retrying.saveSettled).toBe(false);
  });

  it('keeps an ambiguous settlement unconfirmed straight from submitting', () => {
    const submitting = run([...fillAll, { type: 'submitStart' }]);
    const settled = run([{ type: 'submitSettled', message: 'Stopped responding.' }], withReview, submitting);
    expect(settled).toMatchObject({ submitting: false, saveOutcome: 'unknown', saveSettled: true, submitError: 'Stopped responding.' });
    expect(isSaveUnconfirmed(settled)).toBe(true);
    expect(run([{ type: 'submitStart' }], withReview, settled)).toBe(settled);
    const multiple = run([{ type: 'submitCheckStart' }, { type: 'submitCheckDone', message: 'More than one.' }], withReview, settled);
    expect(multiple).toMatchObject({ saveOutcome: 'unknown', saveSettled: true });
    expect(canRetrySave(multiple)).toBe(false);
  });

  it('moves an unknown save to done when a late success arrives', () => {
    const unknown = run([...fillAll, { type: 'submitStart' }, { type: 'submitUnknown', message: 'Not confirmed yet.' }]);
    const done = run([{ type: 'submitSuccess', result: { id: 42, itemUrl: '', demo: false } }], withReview, unknown);
    expect(done).toMatchObject({ phase: 'done', saveOutcome: 'none', submitError: '' });
    expect(done.result && done.result.id).toBe(42);
  });

  it('submitStart is ignored on a normal step', () => {
    const step = run([{ type: 'start' }]);
    expect(run([{ type: 'submitStart' }], withReview, step)).toBe(step);
  });

  it('reset starts over with optional answers', () => {
    const done = run([...fillAll, { type: 'submitStart' }, { type: 'submitSuccess', result: { id: 1, itemUrl: '', demo: true } }]);
    expect(run([{ type: 'reset' }], withReview, done)).toEqual(initialWizardState());
  });

  it('prefilled answers survive into the steps', () => {
    const s = run([{ type: 'start' }, { type: 'next' }], withReview, initialWizardState({ Title: 'From chat' }));
    expect(s.index).toBe(1);
  });

  it('progress shows position, not answered count', () => {
    expect(progressValue(initialWizardState(), 4)).toBe(0);
    expect(progressValue(run([{ type: 'start' }]), 4)).toBe(0);
    expect(progressValue(run(fillAll.slice(0, 3)), 4)).toBe(0.25);
    expect(progressValue(run(fillAll.slice(0, 3)), 0)).toBe(0);
  });
});

describe('wizard navigation v1.1', () => {
  const config: IWizardConfig = { fields: V11_FIELDS, showReview: true };

  it('blocks Next on an empty required multichoice and an incomplete date + time', () => {
    let s = run([{ type: 'start' }, { type: 'setAnswer', name: 'Title', value: 'x' }, { type: 'next' }, { type: 'next' }], config);
    expect(s.index).toBe(1);
    expect(s.errors.Devices).toBe('Please pick at least one option.');
    s = run([{ type: 'setAnswer', name: 'Devices', value: ['Phone', 'Monitor'] }, { type: 'next' }, { type: 'setAnswer', name: 'StartedAt', value: '2026-11-16T' }, { type: 'next' }], config, s);
    expect(s.index).toBe(2);
    expect(s.errors.StartedAt).toBe('Please enter both a date and a time.');
    s = run([{ type: 'setAnswer', name: 'StartedAt', value: '2026-11-16T09:15' }, { type: 'next' }, { type: 'next' }, { type: 'next' }], config, s);
    expect(s.phase).toBe('review');
    expect(s.answers).toMatchObject({ Devices: ['Phone', 'Monitor'], StartedAt: '2026-11-16T09:15' });
  });
});

describe('skip logic navigation and submit', () => {
  const fields = [
    field({ internalName: 'Title', title: 'Title', required: true }),
    field({ internalName: 'Category', title: 'Category', kind: 'choice', required: true, choices: ['Incident', 'Request'] }),
    field({ internalName: 'Urgency', title: 'Urgency', kind: 'choice', required: true, choices: ['Low', 'High'] })
  ];
  const rules = [{ show: 'Urgency', when: 'Category', equals: 'Incident' }];
  const config: IWizardConfig = { fields, showReview: true, skipRules: rules };

  it('skips a hidden question, even when that question is required', () => {
    const s = run(
      [
        { type: 'start' },
        { type: 'setAnswer', name: 'Title', value: 'Outage' },
        { type: 'next' },
        { type: 'setAnswer', name: 'Category', value: 'Request' },
        { type: 'next' }
      ],
      config
    );
    expect(s.phase).toBe('review');
    expect(s.index).toBe(1);
  });

  it('asks the hidden question once the condition matches, and going back stays on visible steps', () => {
    let s = run(
      [
        { type: 'start' },
        { type: 'setAnswer', name: 'Title', value: 'Outage' },
        { type: 'next' },
        { type: 'setAnswer', name: 'Category', value: 'Incident' },
        { type: 'next' }
      ],
      config
    );
    expect(s).toMatchObject({ phase: 'step', index: 2 });
    s = run([{ type: 'setAnswer', name: 'Urgency', value: 'High' }, { type: 'next' }], config, s);
    expect(s.phase).toBe('review');
  });

  it('does not block submit when a hidden required field is empty, and restore clamps the index', () => {
    const filled = run(
      [
        { type: 'start' },
        { type: 'setAnswer', name: 'Title', value: 'Outage' },
        { type: 'next' },
        { type: 'setAnswer', name: 'Category', value: 'Request' },
        { type: 'next' },
        { type: 'submitStart' }
      ],
      config
    );
    expect(filled).toMatchObject({ submitting: true, submitError: '' });
    expect(filled.errors).toEqual({});
    const restored = run([{ type: 'restore', answers: { Title: 'Outage', Category: 'Incident' }, phase: 'step', index: 9 }], config);
    expect(restored).toMatchObject({ phase: 'step', index: 2, answers: { Title: 'Outage', Category: 'Incident' } });
  });
});
