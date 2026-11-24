import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act as legacyAct } from 'react-dom/test-utils';
import { webLightTheme } from '@fluentui/react-components';

import { WizardApp, estimateMinutes, loadErrorMessage, submitErrorMessage } from '../components/WizardApp';
import { writeDraft, type IDraftKeyParts } from '../logic/draft';
import type { ISkipRule } from '../logic/jsonProps';
import { choiceIndexForKey, choiceKeyLabel } from '../components/StepField';
import { DEFAULT_TEXTS, type HostKind, type ISubmitResult } from '../models';
import { buildFormSchema } from '../logic/fieldTypes';
import { DemoListFormService, type DemoScenario } from '../services/DemoListFormService';
import { createDemoSiteDirectory, type ISiteDirectory } from '../services/sites';
import type { CopilotStatusKind } from '../logic/copilotStatus';
import { ListFormError, type IListFormService } from '../services/IListFormService';
import { SUBMIT_TIMEOUT_MS } from '../logic/sharePointWriteError';
import { SAVE_NOT_FOUND_MESSAGE } from '../logic/reconcileSubmit';

const act = ((React as unknown as { act?: typeof legacyAct }).act || legacyAct) as typeof legacyAct;
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom has no ResizeObserver (Fluent's MessageBar and the wizard both use it).
class StubResizeObserver {
  public observe(): void {}
  public unobserve(): void {}
  public disconnect(): void {}
}
(window as unknown as { ResizeObserver: unknown }).ResizeObserver = StubResizeObserver;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = '';
});

async function flush(ms: number = 0): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

class MemoryStorage implements Storage {
  private readonly _data: Record<string, string> = Object.create(null) as Record<string, string>;
  public get length(): number {
    return Object.keys(this._data).length;
  }
  public clear(): void {
    Object.keys(this._data).forEach((k) => delete this._data[k]);
  }
  // eslint-disable-next-line @rushstack/no-new-null
  public getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(this._data, key) ? this._data[key] : null;
  }
  // eslint-disable-next-line @rushstack/no-new-null
  public key(index: number): string | null {
    return Object.keys(this._data)[index] || null;
  }
  public removeItem(key: string): void {
    delete this._data[key];
  }
  public setItem(key: string, value: string): void {
    this._data[key] = value;
  }
}

interface IRenderOptions {
  service?: IListFormService | undefined;
  scenario?: DemoScenario;
  host?: HostKind;
  showReview?: boolean;
  prefill?: unknown;
  onSubmitted?: (r: ISubmitResult, listTitle: string) => void;
  animations?: boolean;
  reducedMotion?: boolean;
  idPrefix?: string;
  showGreeting?: boolean;
  firstName?: string;
  questionTexts?: Record<string, string>;
  fieldExamples?: Record<string, string>;
  skipRules?: ISkipRule[];
  storage?: Storage;
  instanceId?: string;
  siteUrl?: string;
  userId?: string;
  allowedOrigin?: string;
  now?: () => number;
  inline?: boolean;
  directory?: ISiteDirectory;
  onPickList?: (siteUrl: string, listTitle: string) => void;
  onStatus?: (message: string, kind: CopilotStatusKind, errorKind?: string) => void;
  listChosenInForm?: boolean;
  answerChecks?: Record<string, 'none' | 'email' | 'url' | 'phone'>;
  loadingMessage?: string;
  highlightColor?: string;
}

async function render(o: IRenderOptions = {}): Promise<IListFormService | undefined> {
  const service = 'service' in o ? o.service : new DemoListFormService(o.scenario || 'request');
  act(() => {
    root.render(
      <WizardApp
        service={service}
        listTitle="IT Requests"
        host={o.host || 'WebPart'}
        theme={webLightTheme}
        texts={DEFAULT_TEXTS}
        showReview={o.showReview === undefined ? true : o.showReview}
        animations={o.animations === undefined ? false : o.animations}
        reducedMotion={o.reducedMotion === undefined ? true : o.reducedMotion}
        prefill={o.prefill}
        emptyState={{ title: 'Choose a list', body: 'Edit the web part.' }}
        locale="en-GB"
        idPrefix={o.idPrefix}
        onSubmitted={o.onSubmitted}
        showGreeting={o.showGreeting}
        firstName={o.firstName}
        questionTexts={o.questionTexts}
        fieldExamples={o.fieldExamples}
        skipRules={o.skipRules}
        storage={o.storage}
        instanceId={o.instanceId}
        siteUrl={o.siteUrl}
        userId={o.userId}
        allowedOrigin={o.allowedOrigin}
        now={o.now}
        inline={o.inline}
        directory={o.directory}
        onPickList={o.onPickList}
        onStatus={o.onStatus}
        listChosenInForm={o.listChosenInForm}
        answerChecks={o.answerChecks}
        loadingMessage={o.loadingMessage}
        highlightColor={o.highlightColor}
      />
    );
  });
  await flush();
  return service;
}

// eslint-disable-next-line @rushstack/no-new-null
const q = (id: string): HTMLElement | null => container.querySelector(`[data-testid="${id}"]`);
const text = (id: string): string => (q(id) ? (q(id) as HTMLElement).textContent || '' : '');
const screen = (): string => (q('wiz-screen') as HTMLElement).getAttribute('data-screen') || '';

// eslint-disable-next-line @rushstack/no-new-null
async function click(el: Element | null): Promise<void> {
  if (!el) {
    throw new Error('element not found');
  }
  await act(async () => {
    (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await flush();
}

// eslint-disable-next-line @rushstack/no-new-null
async function key(el: Element | null, k: string, extra: KeyboardEventInit = {}): Promise<void> {
  if (!el) {
    throw new Error('element not found');
  }
  await act(async () => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...extra }));
  });
  await flush();
}

async function type(value: string): Promise<HTMLInputElement | HTMLTextAreaElement> {
  const el = container.querySelector('[data-testid="wiz-step"] input, [data-testid="wiz-step"] textarea') as HTMLInputElement | HTMLTextAreaElement;
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = (Object.getOwnPropertyDescriptor(proto, 'value') as PropertyDescriptor).set as (v: string) => void;
  await act(async () => {
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  return el;
}

async function typeInto(el: HTMLInputElement, value: string): Promise<void> {
  const setter = (Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value') as PropertyDescriptor).set as (v: string) => void;
  await act(async () => {
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

const checkboxes = (): HTMLButtonElement[] => Array.from(container.querySelectorAll('[role="checkbox"]')) as HTMLButtonElement[];
const checked = (): string[] => checkboxes().filter((c) => c.getAttribute('aria-checked') === 'true').map((c) => c.getAttribute('data-choice') || '');

const field = (): string => (q('wiz-step') as HTMLElement).getAttribute('data-field') || '';
const radios = (): HTMLButtonElement[] => Array.from(container.querySelectorAll('[role="radio"]')) as HTMLButtonElement[];

describe('WizardApp', () => {
  it('shows the empty state when no list is configured', async () => {
    await render({ service: undefined });
    expect(text('wiz-empty')).toContain('Choose a list');
  });

  it('opens on an intro with question count and time estimate, focus not stolen on mount', async () => {
    await render();
    expect(screen()).toBe('intro');
    expect(text('wiz-intro')).toContain('4 questions');
    expect(text('wiz-intro')).toContain('about 1 min');
    expect(text('wiz-skipped')).toContain('Owner');
    expect(text('wiz-skipped')).not.toMatch(/Yes\/No|Boolean/i);
    expect(text('wiz-progress-text')).toBe('4 questions');
    expect(document.activeElement).toBe(document.body);
  });

  it('runs the whole flow with Enter, Back, review, edit and submit', async () => {
    const submitted: string[] = [];
    const service = (await render({ onSubmitted: (_r, list) => submitted.push(list) })) as DemoListFormService;
    await click(q('wiz-start'));
    expect(field()).toBe('Title');
    expect(text('wiz-progress-text')).toBe('1 of 4');
    expect(text('wiz-question-label')).toBe('Question 1 of 4');
    expect((q('wiz-progress') as HTMLElement).getAttribute('aria-valuetext')).toBe('Question 1 of 4');
    expect(text('wiz-live')).toBe('Question 1 of 4: What do you need?, required');
    const input = container.querySelector('[data-testid="wiz-step"] input') as HTMLInputElement;
    expect(document.activeElement).toBe(input);

    // Enter on an empty required step shows the error and stays.
    await key(input, 'Enter');
    expect(field()).toBe('Title');
    expect(text('wiz-error')).toBe('Please fill this in.');
    expect(input.getAttribute('aria-invalid')).toBe('true');

    await type('New laptop');
    expect(q('wiz-error')).toBeNull();
    await key(input, 'Enter');
    expect(field()).toBe('Category');
    expect(document.activeElement && document.activeElement.getAttribute('role')).toBe('radio');

    // Letter key picks; with motion off there is no auto-advance.
    await key(radios()[0], 'b');
    expect(radios()[1].getAttribute('aria-checked')).toBe('true');
    expect(field()).toBe('Category');
    await click(q('wiz-ok'));
    expect(field()).toBe('Details');

    // Back keeps answers.
    await click(q('wiz-back'));
    expect(field()).toBe('Category');
    expect(radios()[1].getAttribute('aria-checked')).toBe('true');
    await click(q('wiz-next'));
    expect(field()).toBe('Details');

    // Plain Enter in a multi-line step is a newline; Ctrl+Enter continues.
    const area = await type('Line 1');
    await key(area, 'Enter');
    expect(field()).toBe('Details');
    await key(area, 'Enter', { ctrlKey: true });
    expect(field()).toBe('NeededBy');

    // Optional date can be skipped.
    await click(q('wiz-ok'));
    expect(screen()).toBe('review');
    expect(text('wiz-progress-text')).toBe('Review');
    expect(text('wiz-review')).toContain('New laptop');
    expect(text('wiz-review')).toContain('Software');
    expect(text('wiz-review')).toContain('Not answered');

    // Edit returns to review.
    await click(container.querySelector('[aria-label="Edit answer: Category"]'));
    expect(field()).toBe('Category');
    expect(text('wiz-ok')).toContain('Back to review');
    await key(radios()[1], 'ArrowDown');
    expect(radios()[2].getAttribute('aria-checked')).toBe('true');
    await key(radios()[2], 'Enter');
    expect(screen()).toBe('review');
    expect(text('wiz-review')).toContain('Access and accounts');

    await click(q('wiz-submit'));
    await flush();
    expect(screen()).toBe('done');
    expect(text('wiz-done')).toContain('Preview mode: nothing was saved to SharePoint.');
    expect(service.submitted).toEqual([{ Title: 'New laptop', Category: 'Access and accounts', Details: 'Line 1' }]);
    expect(submitted).toEqual(['IT Requests']);
  });

  it('applies Copilot prefill, labels it, and still requires the user to submit', async () => {
    const service = (await render({ host: 'Copilot', prefill: '{"Title":"Monitor","Category":"hardware","Nope":"x"}' })) as DemoListFormService;
    expect(text('wiz-prefill-note')).toContain('2');
    await click(q('wiz-start'));
    expect((container.querySelector('[data-testid="wiz-step"] input') as HTMLInputElement).value).toBe('Monitor');
    expect(text('wiz-step')).toContain('From your conversation');
    await click(q('wiz-ok'));
    expect(radios()[0].getAttribute('aria-checked')).toBe('true');
    expect(service.submitted).toHaveLength(0);
  });

  it('v1.1: multi-choice and date + time steps, keyboard first, saved in the right shape', async () => {
    const service = (await render({ scenario: 'equipment' })) as DemoListFormService;
    await click(q('wiz-start'));
    await type('Flicker');
    await key(container.querySelector('[data-testid="wiz-step"] input'), 'Enter');

    // Multi-choice: a group of checkboxes, labelled, with a hint and a roving tab stop.
    expect(field()).toBe('Devices');
    const group = container.querySelector('[role="group"]') as HTMLElement;
    expect(group.getAttribute('aria-labelledby')).toBe('wiz-Devices-label');
    expect(group.getAttribute('aria-describedby')).toContain('wiz-Devices-multi');
    expect(group.getAttribute('aria-required')).toBe('true');
    expect(text('wiz-multi-hint')).toBe('Choose as many as you like');
    expect(container.querySelector('label#wiz-Devices-label')).toBeNull();
    expect(checkboxes()).toHaveLength(4);
    expect(document.activeElement).toBe(checkboxes()[0]);
    expect(checkboxes().map((c) => c.tabIndex)).toEqual([0, -1, -1, -1]);

    // Required: Enter with nothing picked shows the error and stays.
    await key(checkboxes()[0], 'Enter');
    expect(field()).toBe('Devices');
    expect(text('wiz-error')).toBe('Please pick at least one option.');

    // Letter keys toggle (no auto-advance), focus follows.
    await key(checkboxes()[0], 'c');
    expect(checked()).toEqual(['Monitor']);
    expect(q('wiz-error')).toBeNull();
    expect(document.activeElement).toBe(checkboxes()[2]);
    expect(checkboxes()[2].tabIndex).toBe(0);
    await key(checkboxes()[2], 'A');
    expect(checked()).toEqual(['Laptop', 'Monitor']);

    // Arrows move focus only; click toggles on and off.
    await key(checkboxes()[0], 'ArrowDown');
    expect(document.activeElement).toBe(checkboxes()[1]);
    expect(checked()).toEqual(['Laptop', 'Monitor']);
    await key(checkboxes()[1], 'End');
    expect(document.activeElement).toBe(checkboxes()[3]);
    await key(checkboxes()[3], 'Home');
    expect(document.activeElement).toBe(checkboxes()[0]);
    await click(checkboxes()[1]);
    expect(checked()).toEqual(['Laptop', 'Phone', 'Monitor']);
    await click(checkboxes()[1]);
    expect(checked()).toEqual(['Laptop', 'Monitor']);
    expect(field()).toBe('Devices');
    await key(checkboxes()[0], 'Enter');

    // Date + time: two labelled inputs in a group, the time zone shown, both halves required.
    expect(field()).toBe('StartedAt');
    const dateInput = container.querySelector('#wiz-StartedAt-input-date') as HTMLInputElement;
    const timeInput = container.querySelector('#wiz-StartedAt-input-time') as HTMLInputElement;
    expect(dateInput.type).toBe('date');
    expect(timeInput.type).toBe('time');
    expect((container.querySelector('label[for="wiz-StartedAt-input-date"]') as HTMLElement).textContent).toBe('Date');
    expect((container.querySelector('label[for="wiz-StartedAt-input-time"]') as HTMLElement).textContent).toBe('Time');
    expect(text('timezone-hint')).toMatch(/Your time zone: .*UTC[+-]\d{2}:\d{2}/);
    expect(document.activeElement).toBe(dateInput);
    await typeInto(dateInput, '2026-11-16');
    await key(dateInput, 'Enter');
    expect(field()).toBe('StartedAt');
    expect(text('wiz-error')).toBe('Please enter both a date and a time.');
    await typeInto(timeInput, '14:30');
    expect(dateInput.value).toBe('2026-11-16');
    await key(timeInput, 'Enter');
    expect(field()).toBe('Urgency');

    // Back keeps both halves.
    await click(q('wiz-back'));
    expect((container.querySelector('#wiz-StartedAt-input-date') as HTMLInputElement).value).toBe('2026-11-16');
    expect((container.querySelector('#wiz-StartedAt-input-time') as HTMLInputElement).value).toBe('14:30');
    await click(q('wiz-next'));
    await click(q('wiz-ok'));

    expect(screen()).toBe('review');
    expect(text('wiz-review')).toContain('Laptop, Monitor');
    expect(text('wiz-review')).toContain('16 November 2026');
    expect(text('wiz-review')).toContain('14:30');
    await click(q('wiz-submit'));
    await flush();
    expect(screen()).toBe('done');
    expect(service.submitted).toEqual([{ Title: 'Flicker', Devices: ['Laptop', 'Monitor'], StartedAt: '2026-11-16T14:30' }]);
  });

  it('v1.1: Copilot prefill fills multi-choice and date + time, labelled, never submitted', async () => {
    const service = (await render({ scenario: 'equipment', host: 'Copilot', prefill: '{"Devices":["headset","Tablet"],"StartedAt":"2026-11-16"}' })) as DemoListFormService;
    expect(text('wiz-prefill-note')).toContain('2');
    await click(q('wiz-start'));
    await type('x');
    await key(container.querySelector('[data-testid="wiz-step"] input'), 'Enter');
    expect(checked()).toEqual(['Headset']);
    expect(text('wiz-step')).toContain('From your conversation');
    expect(document.activeElement).toBe(checkboxes()[3]);
    await key(checkboxes()[3], 'Enter');
    expect(field()).toBe('StartedAt');
    expect((container.querySelector('#wiz-StartedAt-input-date') as HTMLInputElement).value).toBe('2026-11-16');
    expect((container.querySelector('#wiz-StartedAt-input-time') as HTMLInputElement).value).toBe('');
    await click(q('wiz-ok'));
    expect(text('wiz-error')).toBe('Please enter both a date and a time.');
    expect(service.submitted).toHaveLength(0);
  });

  it('without review, the last step submits', async () => {
    const service = (await render({ showReview: false, prefill: { Title: 'x', Category: 'Software' } })) as DemoListFormService;
    await click(q('wiz-start'));
    await click(q('wiz-ok'));
    await click(q('wiz-ok'));
    await click(q('wiz-ok'));
    expect(text('wiz-ok')).toContain('Submit');
    await click(q('wiz-ok'));
    await flush();
    expect(screen()).toBe('done');
    expect(service.submitted).toHaveLength(1);
  });

  it('blocks lists with required unsupported columns and links to the list form', async () => {
    await render({ scenario: 'blocked' });
    expect(text('wiz-blocked')).toContain('Approver (Person or Group)');
    expect(q('wiz-intro')).toBeNull();
  });

  it('explains load errors with a retry', async () => {
    await render({ scenario: 'library' });
    expect(text('wiz-load-error')).toContain('document libraries');
    expect(text('wiz-load-error')).toContain('Try again');
  });

  it('keeps answers on a failed save and offers Try again', async () => {
    const statuses: string[] = [];
    await render({
      scenario: 'save-error',
      prefill: { Title: 'x', Category: 'Software' },
      host: 'Copilot',
      onStatus: (message, kind, errorKind) => statuses.push(`${kind}:${errorKind || ''}:${message}`)
    });
    await click(q('wiz-start'));
    for (let i = 0; i < 4; i++) {
      await click(q('wiz-ok'));
    }
    await click(q('wiz-submit'));
    await flush();
    expect(screen()).toBe('review');
    expect(text('wiz-submit-error')).toContain('permission');
    expect(text('wiz-submit')).toBe('Try again');
    const failed = statuses.find((s) => s.indexOf('notSubmitted:') === 0) || '';
    expect(failed).toContain('notSubmitted:accessDenied:');
    expect(failed).toContain('IT Requests');
    expect(failed).toContain('was not submitted');
    expect(failed).toContain('does not have permission');
    expect(failed).not.toMatch(/New laptop|Hardware|password/i);
  });

  it('with motion on, steps transition and a picked choice auto-advances', async () => {
    await render({ animations: true, reducedMotion: false, prefill: { Title: 'x' } });
    await click(q('wiz-start'));
    expect(screen()).toBe('intro');
    await flush(800);
    expect(field()).toBe('Title');
    await click(q('wiz-ok'));
    await flush(800);
    expect(field()).toBe('Category');
    await click(radios()[0]);
    await flush(1400);
    expect(field()).toBe('Details');
  });

  it('prefers-reduced-motion swaps instantly even with animations on', async () => {
    await render({ animations: true, reducedMotion: true });
    await click(q('wiz-start'));
    expect(field()).toBe('Title');
    expect((q('wiz-screen') as HTMLElement).style.transform).toBe('none');
  });

  it('helpers: messages, estimates and choice keys', () => {
    expect(estimateMinutes(4)).toBe(1);
    expect(estimateMinutes(9)).toBe(3);
    expect(loadErrorMessage(new ListFormError('accessDenied', ''), 'X')).toContain('access');
    expect(submitErrorMessage(new Error('secret value'))).not.toContain('secret value');
    expect(choiceKeyLabel(0)).toBe('A');
    expect(choiceIndexForKey('c', 4)).toBe(2);
    expect(choiceIndexForKey('z', 4)).toBe(-1);
  });
  it('prefixes step element ids with the instance prefix so two forms on one page never clash', async () => {
    await render({ idPrefix: 'wizard-abc' });
    await click(q('wiz-start'));
    expect(container.querySelector('#wizard-abc-wiz-Title-label')).not.toBeNull();
    expect(container.querySelector('#wizard-abc-wiz-Title-input')).not.toBeNull();
    expect(container.querySelector('#wiz-Title-label')).toBeNull();
  });

  it('paints the gradient panel and lets the Back text link step back, keeping answers', async () => {
    await render();
    const root = q('wiz-root') as HTMLElement;
    expect(root.style.backgroundColor).toBe('rgb(24, 58, 53)');
    await click(q('wiz-start'));
    await type('New laptop');
    await key(container.querySelector('[data-testid="wiz-step"] input'), 'Enter');
    expect(field()).toBe('Category');
    await click(q('wiz-back-link'));
    expect(field()).toBe('Title');
    expect((container.querySelector('[data-testid="wiz-step"] input') as HTMLInputElement).value).toBe('New laptop');
    expect(document.activeElement).toBe(container.querySelector('[data-testid="wiz-step"] input'));
    await click(q('wiz-back-link'));
    expect(screen()).toBe('intro');
  });

  it('uses native underline inputs and submits from the review pill', async () => {
    await render();
    await click(q('wiz-start'));
    const input = container.querySelector('[data-testid="wiz-step"] input') as HTMLInputElement;
    expect(input.getAttribute('placeholder')).toBe('Type your answer here\u2026');
    await type('New laptop');
    await key(input, 'Enter');
    await key(radios()[0], 'a');
    await click(q('wiz-ok'));
    await click(q('wiz-ok'));
    await click(q('wiz-ok'));
    expect(screen()).toBe('review');
    await click(q('wiz-submit'));
    expect(screen()).toBe('done');
  });

});

describe('WizardApp v1.3', () => {
  it('greets by first name and recalls an earlier answer in the question, escaped as text', async () => {
    await render({
      showGreeting: true,
      firstName: 'Alex',
      questionTexts: { Title: 'Thanks, {{firstName}}. Log {{Title}}?', Category: 'What is the type of {{Title}}?' },
      prefill: { Title: '<b>Monitor flickers</b>' }
    });
    expect(text('wiz-greeting')).toBe('Hi, Alex');
    await click(q('wiz-start'));
    await type('Monitor flickers');
    await key(container.querySelector('[data-testid="wiz-step"] input'), 'Enter');
    expect(text('wiz-step')).toContain('What is the type of');
    expect(text('wiz-step')).toContain('Monitor flickers');
    expect(container.querySelector('[data-testid="wiz-step"] em')?.textContent).toBe('Monitor flickers');
    expect(container.querySelector('[data-testid="wiz-step"]')?.innerHTML).not.toMatch(/<b>/);
  });

  it('shows a field guide from the column description and an example', async () => {
    await render({ fieldExamples: { Title: 'New laptop' } });
    await click(q('wiz-start'));
    expect(text('wiz-guide')).toContain('What goes here');
    expect(text('wiz-guide')).toContain('A short summary');
    expect(text('wiz-guide')).toContain('Example: New laptop');
    expect(q('wiz-guide-toggle')?.getAttribute('aria-expanded')).toBe('true');
  });

  it('keeps the Copilot inline field guide collapsed so OK stays visible, and expands from the chip', async () => {
    await render({ host: 'Copilot', inline: true, fieldExamples: { Title: 'New laptop' } });
    await click(q('wiz-start'));
    expect(q('wiz-guide-toggle')?.getAttribute('aria-expanded')).toBe('false');
    expect(q('wiz-guide-body')?.getAttribute('aria-hidden')).toBe('true');
    expect(q('wiz-ok')).not.toBeNull();
    expect(text('wiz-ok')).toContain('OK');
    await click(q('wiz-guide-toggle'));
    expect(q('wiz-guide-toggle')?.getAttribute('aria-expanded')).toBe('true');
    expect(q('wiz-guide-body')?.getAttribute('aria-hidden')).toBe('false');
    expect(text('wiz-guide')).toContain('A short summary');
    expect(text('wiz-guide')).toContain('Example: New laptop');
    expect(q('wiz-ok')).not.toBeNull();
  });

  it('shows a gentle live check when the answer is too long, not a red error', async () => {
    const service: IListFormService = {
      demo: true,
      loadSchema: async () =>
        buildFormSchema('IT Requests', '', [
          { InternalName: 'Title', Title: 'What do you need?', TypeAsString: 'Text', Required: true, MaxLength: 40, Description: 'A short summary.' }
        ]),
      submit: async () => ({ id: 1, itemUrl: '', demo: true }),
      findSubmittedItem: async () => undefined
    };
    await render({ service });
    await click(q('wiz-start'));
    await type('x'.repeat(42));
    await flush(350);
    expect(text('wiz-live-check')).toBe('42 of 40 characters, trim a little');
    expect(q('wiz-error')).toBeNull();
    expect(text('wiz-live')).toContain('42 of 40 characters, trim a little');
  });

  it('review cards edit a question and return after OK', async () => {
    await render();
    await click(q('wiz-start'));
    await type('New laptop');
    await key(container.querySelector('[data-testid="wiz-step"] input'), 'Enter');
    await key(radios()[0], 'a');
    await click(q('wiz-ok'));
    await click(q('wiz-ok')); // details
    await click(q('wiz-ok')); // date
    expect(screen()).toBe('review');
    expect(container.querySelectorAll('[data-testid="wiz-review-card"]').length).toBe(4);
    expect(q('wiz-back')).toBeNull();
    expect(q('wiz-next')).toBeNull();
    expect(q('wiz-submit')).not.toBeNull();
    expect(q('wiz-back-link')).not.toBeNull();
    await click(container.querySelector('[aria-label="Edit answer: Category"]'));
    expect(field()).toBe('Category');
    expect(text('wiz-ok')).toContain('Back to review');
    await click(q('wiz-ok'));
    expect(screen()).toBe('review');
  });

  it('shows the finish moment with a summary and a same-tenant Open item pill', async () => {
    const origin = 'https://fabrikam.sharepoint.com';
    const itemUrl = `${origin}/sites/it/Lists/ITRequests/DispForm.aspx?ID=12`;
    await render({
      service: new DemoListFormService('request', 0, undefined, itemUrl),
      allowedOrigin: origin
    });
    await click(q('wiz-start'));
    await type('Monitor flickers');
    await key(container.querySelector('[data-testid="wiz-step"] input'), 'Enter');
    await key(radios()[0], 'a');
    await click(q('wiz-ok'));
    await click(q('wiz-ok'));
    await click(q('wiz-ok'));
    await click(q('wiz-submit'));
    expect(screen()).toBe('done');
    expect(text('wiz-done')).toContain('Saved to IT Requests');
    expect(text('wiz-finish-summary')).toContain('Monitor flickers');
    expect(text('wiz-finish-summary')).toContain('Hardware');
    const open = q('wiz-open-item') as HTMLAnchorElement;
    expect(open.getAttribute('href')).toBe(itemUrl);
    expect(text('wiz-open-item')).toBe('Open item');
  });

  it('does not render an item link on another tenant', async () => {
    await render({
      service: new DemoListFormService('request', 0, undefined, 'https://other.sharepoint.com/sites/it/Lists/IT/DispForm.aspx?ID=1'),
      allowedOrigin: 'https://fabrikam.sharepoint.com'
    });
    await click(q('wiz-start'));
    await type('New laptop');
    await key(container.querySelector('[data-testid="wiz-step"] input'), 'Enter');
    await key(radios()[0], 'a');
    await click(q('wiz-ok'));
    await click(q('wiz-ok'));
    await click(q('wiz-ok'));
    await click(q('wiz-submit'));
    expect(q('wiz-open-item')).toBeNull();
  });

  it('offers to resume a saved draft, and start over clears it', async () => {
    const storage = new MemoryStorage();
    const parts: IDraftKeyParts = { siteUrl: 'https://fabrikam.sharepoint.com/sites/it', listTitle: 'IT Requests', userId: 'alex', instanceId: 'form-1' };
    writeDraft(parts, { answers: { Title: 'Saved laptop' }, phase: 'step', index: 0 }, storage, Date.now());
    await render({ storage, instanceId: 'form-1', userId: 'alex', siteUrl: parts.siteUrl });
    expect(text('wiz-resume')).toContain('Pick up where you left off?');
    await click(q('wiz-resume-yes'));
    expect(screen()).toBe('step-0');
    expect(field()).toBe('Title');
    expect((container.querySelector('[data-testid="wiz-step"] input') as HTMLInputElement).value).toBe('Saved laptop');
  });

  it('start over clears the saved answers and shows the usual start', async () => {
    const storage = new MemoryStorage();
    const parts: IDraftKeyParts = { siteUrl: 'https://fabrikam.sharepoint.com/sites/it', listTitle: 'IT Requests', userId: 'alex', instanceId: 'form-2' };
    writeDraft(parts, { answers: { Title: 'Saved laptop' }, phase: 'step', index: 0 }, storage, Date.now());
    await render({ storage, instanceId: 'form-2', userId: 'alex', siteUrl: parts.siteUrl });
    await click(q('wiz-resume-no'));
    expect(q('wiz-resume')).toBeNull();
    expect(q('wiz-start')).not.toBeNull();
    expect(storage.length).toBe(0);
  });
});

describe('WizardApp v1.4', () => {
  it('lets the person pick Yes or No with the Y and N keys, and shows it on review', async () => {
    await render({ scenario: 'milestones', animations: false, reducedMotion: true });
    await click(q('wiz-start'));
    await type('Ship the form');
    await key(container.querySelector('[data-testid="wiz-step"] input'), 'Enter');
    expect(q('wiz-yesno')).not.toBeNull();
    await key((q('wiz-yesno') as HTMLElement).querySelector('[role="radio"]'), 'y');
    const yes = Array.from((q('wiz-yesno') as HTMLElement).querySelectorAll('[role="radio"]')).find((b) => (b.textContent || '').indexOf('Yes') >= 0) as HTMLElement;
    expect(yes.getAttribute('aria-checked')).toBe('true');
    await click(q('wiz-ok'));
    expect(field()).toBe('EffortDays');
    await click(q('wiz-ok'));
    await typeInto(container.querySelector('#preview-wiz-DueDate-input, [data-testid="wiz-step"] input') as HTMLInputElement, '2026-12-01');
    await key(container.querySelector('[data-testid="wiz-step"] input'), 'Enter');
    expect(screen()).toBe('review');
    expect(container.textContent || '').toContain('Yes');
  });

  it('warns when a required due date is in the past, including a prefilled past date, without blocking OK', async () => {
    await render({
      scenario: 'milestones',
      prefill: { Title: 'Ship the form', OnTrack: 'Yes', DueDate: '2026-11-01' },
      now: () => new Date(2026, 10, 22, 10, 0, 0).getTime()
    });
    await click(q('wiz-start'));
    // Title prefilled; continue through Yes/No and number to the date.
    await key(container.querySelector('[data-testid="wiz-step"] input'), 'Enter');
    expect(q('wiz-yesno')).not.toBeNull();
    await click(q('wiz-ok'));
    await click(q('wiz-ok'));
    expect(text('wiz-past-date')).toContain('in the past');
    await click(q('wiz-ok'));
    expect(screen()).toBe('review');
  });

  it('shows the site then list picker when no list is configured, and reports empty status', async () => {
    const picks: string[] = [];
    const statuses: string[] = [];
    await render({
      service: undefined,
      directory: createDemoSiteDirectory(),
      onPickList: (siteUrl, listTitle) => picks.push(`${siteUrl}|${listTitle}`),
      onStatus: (message, kind) => statuses.push(`${kind}:${message}`),
      host: 'Copilot'
    });
    expect(q('wiz-picker')).not.toBeNull();
    expect(text('wiz-picker')).toContain('Choose a site and list');
    expect(statuses.some((s) => s.indexOf('empty:') === 0)).toBe(true);
    const sites = Array.from(container.querySelectorAll('[data-testid="wiz-site-option"]')) as HTMLButtonElement[];
    expect(sites.length).toBeGreaterThan(0);
    const lumen = sites.find((s) => (s.textContent || '').indexOf('Lumen Team') >= 0) || sites[0];
    await click(lumen);
    await flush();
    const select = q('wiz-list-select') as HTMLButtonElement;
    expect(select).not.toBeNull();
    expect(select.getAttribute('role')).toBe('combobox');
    await click(select);
    await flush();
    const option = Array.from(document.querySelectorAll('[data-testid="wiz-list-option"]')).find((o) => (o.textContent || '') === 'Lumen milestones') as HTMLElement;
    expect(option).not.toBeNull();
    await click(option);
    await flush();
    await click(q('wiz-use-list'));
    expect(picks).toEqual(['https://contoso.sharepoint.com/sites/lumen|Lumen milestones']);
  });

  it('reports a failed load honestly when the list is missing, and still offers the picker', async () => {
    const statuses: string[] = [];
    await render({
      scenario: 'not-found',
      directory: createDemoSiteDirectory(),
      onPickList: () => undefined,
      onStatus: (message, kind) => statuses.push(`${kind}:${message}`),
      host: 'Copilot'
    });
    expect(q('wiz-picker')).not.toBeNull();
    expect(q('wiz-load-error')).toBeNull();
    expect(text('wiz-picker-note')).toMatch(/wasn/);
    expect(text('wiz-picker-note').toLowerCase()).toContain('pick a site and a list');
    const empty = statuses.find((s) => s.indexOf('empty:') === 0) || '';
    expect(empty.toLowerCase()).toContain('pick a site and list');
    expect(empty).not.toContain('IT Requests');
    expect(statuses.some((s) => s.indexOf('failed:') === 0)).toBe(false);
  });

  it('shows the red error banner when a list the person picked in the form is not found', async () => {
    const statuses: string[] = [];
    await render({
      scenario: 'not-found',
      directory: createDemoSiteDirectory(),
      onPickList: () => undefined,
      listChosenInForm: true,
      onStatus: (message, kind) => statuses.push(`${kind}:${message}`),
      host: 'Copilot'
    });
    expect(q('wiz-picker')).not.toBeNull();
    expect(q('wiz-load-error')).not.toBeNull();
    expect(text('wiz-load-error')).toContain('couldn');
    expect(statuses.some((s) => s.indexOf('failed:') === 0)).toBe(true);
  });

  it('keeps a scroll area and a footer so the primary picker button stays reachable', async () => {
    await render({
      service: undefined,
      directory: createDemoSiteDirectory(),
      onPickList: () => undefined,
      host: 'Copilot',
      inline: true
    });
    expect(q('wiz-scroll')).not.toBeNull();
    const sites = Array.from(container.querySelectorAll('[data-testid="wiz-site-option"]')) as HTMLButtonElement[];
    const lumen = sites.find((s) => (s.textContent || '').indexOf('Lumen Team') >= 0) || sites[0];
    await click(lumen);
    await flush();
    expect(q('wiz-footer')).not.toBeNull();
    expect(q('wiz-use-list')).not.toBeNull();
    expect(((q('wiz-use-list') as HTMLElement).textContent || '').trim()).toBe('Open the form');
    expect(q('wiz-scroll')!.contains(q('wiz-footer') as Node)).toBe(false);
    expect(q('wiz-scroll')!.contains(q('wiz-use-list') as Node)).toBe(false);
  });

  it('keeps the intro Start button in a footer next to a scroll area in the compact canvas', async () => {
    await render({ inline: true, host: 'Copilot' });
    expect(q('wiz-intro')).not.toBeNull();
    expect(q('wiz-scroll')).not.toBeNull();
    expect(q('wiz-footer')).not.toBeNull();
    expect(q('wiz-footer')!.contains(q('wiz-start') as Node)).toBe(true);
    expect(q('wiz-scroll')!.contains(q('wiz-start') as Node)).toBe(false);
  });

  it('skips a later question until a Yes/No answer matches, and does not mention Boolean as skipped', async () => {
    await render({
      scenario: 'milestones',
      skipRules: [{ show: 'EffortDays', when: 'OnTrack', equals: 'No' }]
    });
    expect(text('wiz-skipped') || 'none').not.toMatch(/Yes\/No|Boolean/i);
    await click(q('wiz-start'));
    await type('Ship the form');
    await key(container.querySelector('[data-testid="wiz-step"] input'), 'Enter');
    await key((q('wiz-yesno') as HTMLElement).querySelector('[role="radio"]'), 'y');
    await click(q('wiz-ok'));
    // On track = Yes, so EffortDays is hidden and we land on Due date.
    expect(field()).toBe('DueDate');
  });
});

describe('WizardApp v1.4.1', () => {
  it('shows a currency symbol, rejects a non-https hyperlink, and reviews the description as a text-only link', async () => {
    await render({ scenario: 'expenses', animations: false, reducedMotion: true });
    await click(q('wiz-start'));
    await type('Travel to Malmö');
    await key(container.querySelector('[data-testid="wiz-step"] input'), 'Enter');
    expect(q('wiz-currency')).not.toBeNull();
    expect((q('wiz-currency') as HTMLElement).textContent || '').toContain('$');
    await typeInto(container.querySelector('[data-testid="wiz-currency-input"]') as HTMLInputElement, '1250.50');
    await key(container.querySelector('[data-testid="wiz-currency-input"]'), 'Enter');
    expect(q('wiz-hyperlink')).not.toBeNull();
    await typeInto(container.querySelector('[data-testid="wiz-hyperlink-url"]') as HTMLInputElement, 'http://contoso.com/receipt');
    await click(q('wiz-ok'));
    expect(text('wiz-error')).toContain('https://');
    await typeInto(container.querySelector('[data-testid="wiz-hyperlink-url"]') as HTMLInputElement, 'https://contoso.com/receipts/8841');
    await typeInto(container.querySelector('[data-testid="wiz-hyperlink-description"]') as HTMLInputElement, '<b>Hotel receipt</b>');
    await click(q('wiz-ok'));
    expect(screen()).toBe('review');
    expect(text('wiz-review')).toContain('1,250.50');
    const link = q('wiz-review-link') as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('https://contoso.com/receipts/8841');
    expect(link.textContent).toBe('<b>Hotel receipt</b>');
    expect(link.innerHTML).toBe('&lt;b&gt;Hotel receipt&lt;/b&gt;');
  });
});

describe('WizardApp v1.4.2', () => {
  it('shows a custom loading message', async () => {
    const hanging = {
      demo: true,
      loadSchema: () => new Promise(() => undefined),
      submit: async () => ({ id: 1, itemUrl: '', demo: true })
    } as unknown as IListFormService;
    await render({ service: hanging, loadingMessage: 'Please wait a moment' });
    expect(text('wiz-loading')).toContain('Please wait a moment');
  });

  it('blocks OK and shows an inline error when a checked email is invalid', async () => {
    await render({ answerChecks: { Title: 'email' } });
    await click(q('wiz-start'));
    await type('not-an-email');
    await flush();
    expect(text('wiz-error')).toMatch(/valid email address/);
    expect((q('wiz-ok') as HTMLButtonElement).disabled).toBe(true);
    await type('name@example.com');
    await flush();
    expect(q('wiz-error')).toBeNull();
    expect((q('wiz-ok') as HTMLButtonElement).disabled).toBe(false);
  });

  it('applies a highlight colour as a CSS custom property on the panel', async () => {
    await render({ highlightColor: '#FFB000' });
    const rootEl = q('wiz-root') as HTMLElement;
    expect((rootEl.style as CSSStyleDeclaration).getPropertyValue('--wiz-highlight').toLowerCase()).toBe('#ffb000');
  });
});

describe('WizardApp v1.4.6.0', () => {
  const origin = 'https://fabrikam.sharepoint.com';
  const itemUrl = `${origin}/sites/it/Lists/ITRequests/DispForm.aspx?ID=12`;
  const newFormUrl = `${origin}/sites/it/Lists/ITRequests/NewForm.aspx`;

  async function submitToDone(host: HostKind): Promise<void> {
    await render({
      service: new DemoListFormService('request', 0, undefined, itemUrl),
      allowedOrigin: origin,
      host,
      inline: host === 'Copilot'
    });
    await click(q('wiz-start'));
    await type('Monitor flickers');
    await key(container.querySelector('[data-testid="wiz-step"] input'), 'Enter');
    await key(radios()[0], 'a');
    await click(q('wiz-ok'));
    await click(q('wiz-ok'));
    await click(q('wiz-ok'));
    await click(q('wiz-submit'));
    expect(screen()).toBe('done');
  }

  it('keeps Open item as a normal link on the page web part', async () => {
    await submitToDone('WebPart');
    const open = q('wiz-open-item') as HTMLAnchorElement;
    expect(open.tagName).toBe('A');
    expect(open.getAttribute('href')).toBe(itemUrl);
    expect(text('wiz-open-item')).toBe('Open item');
    expect(open.querySelector('[data-testid="wiz-host-copy-icon"]')).toBeNull();
  });

  it('copies the item link in the Copilot host and shows Link copied', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    await submitToDone('Copilot');
    const btn = q('wiz-open-item') as HTMLButtonElement;
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.getAttribute('href')).toBeNull();
    expect(text('wiz-open-item')).toBe('Copy link to item');
    expect(btn.querySelector('[data-testid="wiz-host-copy-icon"]')).not.toBeNull();
    expect(btn.querySelector('[data-testid="wiz-host-open-icon"]')).toBeNull();
    await click(btn);
    expect(writeText).toHaveBeenCalledWith(itemUrl);
    expect(text('wiz-open-item')).toBe('Link copied');
    expect(btn.querySelector('[data-testid="wiz-host-copy-icon"]')).toBeNull();
  });

  it('falls back to execCommand when the Clipboard API is missing', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    const exec = jest.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', { configurable: true, value: exec });
    await submitToDone('Copilot');
    await click(q('wiz-open-item') as HTMLButtonElement);
    expect(exec).toHaveBeenCalledWith('copy');
    expect(text('wiz-open-item')).toBe('Link copied');
  });

  it('keeps Open the list own form as a link on the page, and copies it in Copilot', async () => {
    await render({ scenario: 'blocked', allowedOrigin: origin, host: 'WebPart' });
    const open = q('wiz-list-form-link') as HTMLAnchorElement;
    expect(open.tagName).toBe('A');
    expect(open.getAttribute('href')).toBe(newFormUrl);
    expect(text('wiz-list-form-link')).toContain("Open the list's own form");
    expect(open.querySelector('[data-testid="wiz-host-open-icon"]')).not.toBeNull();
    expect(open.querySelector('[data-testid="wiz-host-copy-icon"]')).toBeNull();

    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    await render({
      scenario: 'blocked',
      allowedOrigin: origin,
      host: 'Copilot',
      inline: true,
      directory: createDemoSiteDirectory(),
      onPickList: () => undefined
    });
    const btn = q('wiz-list-form-link') as HTMLButtonElement;
    expect(btn.tagName).toBe('BUTTON');
    expect(text('wiz-list-form-link')).toBe("Copy link to the list's form");
    expect(btn.querySelector('[data-testid="wiz-host-copy-icon"]')).not.toBeNull();
    expect(btn.querySelector('[data-testid="wiz-host-open-icon"]')).toBeNull();
    await click(btn);
    expect(writeText).toHaveBeenCalledWith(newFormUrl);
    expect(text('wiz-list-form-link')).toBe('Link copied');
    expect(btn.querySelector('[data-testid="wiz-host-copy-icon"]')).toBeNull();
    expect(btn.querySelector('[data-testid="wiz-host-open-icon"]')).toBeNull();
  });

  it('does not show Change list on the page web part', async () => {
    await render({ host: 'WebPart' });
    expect(q('wiz-change-list')).toBeNull();
    expect(q('wiz-change-list-banner')).toBeNull();
  });

  it('returns to the in-card picker from Change list without a confirm when there are no answers', async () => {
    const picks: string[] = [];
    await render({
      host: 'Copilot',
      inline: true,
      siteUrl: 'https://contoso.sharepoint.com/sites/it',
      directory: createDemoSiteDirectory(),
      onPickList: (siteUrl, listTitle) => picks.push(`${siteUrl}|${listTitle}`)
    });
    expect(q('wiz-intro')).not.toBeNull();
    expect(q('wiz-change-list')).not.toBeNull();
    await click(q('wiz-change-list') as HTMLButtonElement);
    expect(q('wiz-change-list-confirm')).toBeNull();
    expect(q('wiz-picker')).not.toBeNull();
    expect(q('wiz-intro')).toBeNull();
    const selected = container.querySelector('[data-testid="wiz-site-option"][aria-selected="true"]') as HTMLButtonElement;
    expect(selected).not.toBeNull();
    expect(selected.getAttribute('title') || '').toContain('/sites/it');
    expect(picks).toEqual([]);
  });

  it('asks to confirm Change list when answers have been typed, and cancel keeps the form', async () => {
    const picks: string[] = [];
    await render({
      host: 'Copilot',
      inline: true,
      siteUrl: 'https://contoso.sharepoint.com/sites/it',
      directory: createDemoSiteDirectory(),
      onPickList: (siteUrl, listTitle) => picks.push(`${siteUrl}|${listTitle}`)
    });
    await click(q('wiz-start'));
    await type('A typed title');
    await click(q('wiz-change-list') as HTMLButtonElement);
    expect(q('wiz-change-list-confirm')).not.toBeNull();
    expect(text('wiz-change-list-confirm')).toContain('will not be kept');
    await click(q('wiz-change-list-cancel') as HTMLButtonElement);
    expect(q('wiz-change-list-confirm')).toBeNull();
    expect(q('wiz-picker')).toBeNull();
    expect((container.querySelector('[data-testid="wiz-step"] input') as HTMLInputElement).value).toBe('A typed title');
    await click(q('wiz-change-list') as HTMLButtonElement);
    await click(q('wiz-change-list-ok') as HTMLButtonElement);
    expect(q('wiz-change-list-confirm')).toBeNull();
    expect(q('wiz-picker')).not.toBeNull();
    expect(q('wiz-step')).toBeNull();
    expect(picks).toEqual([]);
  });

  const changeListButtons = (): HTMLElement[] =>
    Array.from(container.querySelectorAll('[data-testid="wiz-change-list"], [data-testid="wiz-change-list-banner"]')) as HTMLElement[];

  it('shows a single Change list control on the unsupported screen, at the top of the card', async () => {
    await render({
      scenario: 'blocked',
      allowedOrigin: origin,
      host: 'Copilot',
      inline: true,
      siteUrl: `${origin}/sites/it`,
      directory: createDemoSiteDirectory(),
      onPickList: () => undefined
    });
    expect(q('wiz-blocked')).not.toBeNull();
    expect(changeListButtons()).toHaveLength(1);
    expect(q('wiz-change-list')).not.toBeNull();
    expect(q('wiz-change-list-banner')).toBeNull();
    await click(q('wiz-change-list') as HTMLButtonElement);
    expect(q('wiz-picker')).not.toBeNull();
    expect(q('wiz-blocked')).toBeNull();
    expect(changeListButtons()).toHaveLength(0);
  });

  it('shows a single Change list control on the done screen', async () => {
    await render({
      service: new DemoListFormService('request', 0, undefined, itemUrl),
      allowedOrigin: origin,
      host: 'Copilot',
      inline: true,
      siteUrl: `${origin}/sites/it`,
      directory: createDemoSiteDirectory(),
      onPickList: () => undefined
    });
    await click(q('wiz-start'));
    await type('Monitor flickers');
    await key(container.querySelector('[data-testid="wiz-step"] input'), 'Enter');
    await key(radios()[0], 'a');
    await click(q('wiz-ok'));
    await click(q('wiz-ok'));
    await click(q('wiz-ok'));
    await click(q('wiz-submit'));
    expect(screen()).toBe('done');
    expect(changeListButtons()).toHaveLength(1);
    expect(q('wiz-change-list-banner')).toBeNull();
  });

  it('shows a single Change list control on list-not-found when the top link is present', async () => {
    await render({
      scenario: 'not-found',
      host: 'Copilot',
      inline: true,
      siteUrl: 'https://contoso.sharepoint.com/sites/it',
      directory: createDemoSiteDirectory(),
      onPickList: () => undefined,
      listChosenInForm: true
    });
    expect(q('wiz-load-error')).not.toBeNull();
    expect(q('wiz-picker')).not.toBeNull();
    expect(changeListButtons()).toHaveLength(1);
    expect(q('wiz-change-list')).not.toBeNull();
    expect(q('wiz-change-list-banner')).toBeNull();
  });
});

describe('WizardApp timed-out saves', () => {
  function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (error: unknown) => void } {
    const result: { promise: Promise<T>; resolve: (value: T) => void; reject: (error: unknown) => void } = {
      promise: undefined as unknown as Promise<T>,
      resolve: () => undefined,
      reject: () => undefined
    };
    result.promise = new Promise<T>((resolve, reject) => {
      result.resolve = resolve;
      result.reject = reject;
    });
    return result;
  }

  async function goToReview(service: IListFormService, extra: IRenderOptions = {}): Promise<void> {
    await render({
      service,
      prefill: { Title: 'Laptop', Category: 'Software' },
      host: 'Copilot',
      ...extra
    });
    await click(q('wiz-start'));
    for (let i = 0; i < 4; i++) {
      await click(q('wiz-ok'));
    }
    expect(screen()).toBe('review');
  }

  async function submitUntilUnknown(): Promise<void> {
    jest.useFakeTimers();
    await act(async () => {
      (q('wiz-submit') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(text('wiz-submit')).toContain('Submitting');
    await act(async () => {
      await Promise.resolve();
      await jest.advanceTimersByTimeAsync(SUBMIT_TIMEOUT_MS);
      await Promise.resolve();
    });
  }

  afterEach(() => {
    jest.useRealTimers();
  });

  it('treats a late successful response as saved and does not send a second POST', async () => {
    const pending = deferred<ISubmitResult>();
    let posts = 0;
    const service: IListFormService = {
      demo: false,
      loadSchema: async () => new DemoListFormService().loadSchema(),
      submit: () => {
        posts += 1;
        return pending.promise;
      },
      findSubmittedItem: async () => undefined
    };
    const statuses: string[] = [];
    await goToReview(service, {
      onStatus: (message, kind, errorKind) => statuses.push(`${kind}:${errorKind || ''}:${message}`),
      onSubmitted: () => statuses.push('submitted-callback')
    });
    await submitUntilUnknown();
    expect(text('wiz-submit-error')).toContain('not confirmed yet');
    expect(text('wiz-submit-error')).not.toContain('This site');
    expect(text('wiz-submit-error')).not.toMatch(/\bfree\b|\u2013|\u2014/);
    expect(q('wiz-check-saved')).not.toBeNull();
    expect(text('wiz-check-saved')).toBe('Check if saved');
    expect(q('wiz-submit')?.getAttribute('aria-disabled')).toBe('true');
    const unknown = statuses.find((s) => s.indexOf('unknown:') === 0) || '';
    expect(unknown).toContain('unknown:timeout:');
    expect(unknown).toContain('not confirmed yet');
    expect(unknown).not.toContain('was not submitted');
    expect(posts).toBe(1);

    await act(async () => {
      (q('wiz-submit') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(posts).toBe(1);

    await act(async () => {
      pending.resolve({ id: 42, itemUrl: '', demo: false });
    });
    expect(screen()).toBe('done');
    expect(posts).toBe(1);
    expect(statuses).toContain('submitted-callback');
  });

  it('uses Check if saved to move to done when the list already has the item', async () => {
    const pending = deferred<ISubmitResult>();
    let posts = 0;
    const service: IListFormService = {
      demo: false,
      loadSchema: async () => new DemoListFormService().loadSchema(),
      submit: () => {
        posts += 1;
        return pending.promise;
      },
      findSubmittedItem: async () => ({ id: 15, itemUrl: '', demo: false })
    };
    const submitted: number[] = [];
    await goToReview(service, { onSubmitted: (result) => submitted.push(result.id) });
    await submitUntilUnknown();
    jest.useRealTimers();
    await click(q('wiz-check-saved'));
    expect(screen()).toBe('done');
    expect(submitted).toEqual([15]);
    expect(posts).toBe(1);
  });

  it('allows a new save only after Check if saved finds no item', async () => {
    const first = deferred<ISubmitResult>();
    const second = deferred<ISubmitResult>();
    let posts = 0;
    const service: IListFormService = {
      demo: false,
      loadSchema: async () => new DemoListFormService().loadSchema(),
      submit: () => {
        posts += 1;
        return posts === 1 ? first.promise : second.promise;
      },
      findSubmittedItem: async () => undefined
    };
    await goToReview(service);
    await submitUntilUnknown();
    jest.useRealTimers();
    await click(q('wiz-check-saved'));
    expect(text('wiz-submit-error')).toBe(SAVE_NOT_FOUND_MESSAGE);
    expect(text('wiz-submit')).toBe('Try again');
    expect(q('wiz-submit')?.getAttribute('aria-disabled')).not.toBe('true');
    expect(q('wiz-check-saved')).toBeNull();
    expect(posts).toBe(1);
    await click(q('wiz-submit'));
    expect(posts).toBe(2);
    await act(async () => {
      second.resolve({ id: 16, itemUrl: '', demo: false });
    });
    await flush();
    expect(screen()).toBe('done');
  });

  it('moves to a failed save when the original request later rejects', async () => {
    const pending = deferred<ISubmitResult>();
    let posts = 0;
    const service: IListFormService = {
      demo: false,
      loadSchema: async () => new DemoListFormService().loadSchema(),
      submit: () => {
        posts += 1;
        return pending.promise;
      },
      findSubmittedItem: async () => undefined
    };
    const statuses: string[] = [];
    await goToReview(service, {
      onStatus: (message, kind, errorKind) => statuses.push(`${kind}:${errorKind || ''}:${message}`)
    });
    await submitUntilUnknown();
    await act(async () => {
      pending.reject(new ListFormError('validation', "The required field Title cannot be empty."));
    });
    jest.useRealTimers();
    await flush();
    expect(text('wiz-submit-error')).toContain('required field Title');
    expect(text('wiz-submit')).toBe('Try again');
    expect(q('wiz-check-saved')).toBeNull();
    expect(q('wiz-submit')?.getAttribute('aria-disabled')).not.toBe('true');
    const failed = statuses.find((s) => s.indexOf('notSubmitted:') === 0) || '';
    expect(failed).toContain('notSubmitted:validation:');
    expect(failed).toContain('was not submitted');
    expect(posts).toBe(1);
  });
});
