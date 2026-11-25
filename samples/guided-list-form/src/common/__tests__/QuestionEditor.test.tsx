import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act as legacyAct } from 'react-dom/test-utils';
import { QuestionEditor } from '../components/QuestionEditor';
import { field } from './helpers';
import type { ISkipRule } from '../logic/jsonProps';

const act = ((React as unknown as { act?: typeof legacyAct }).act || legacyAct) as typeof legacyAct;
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class StubResizeObserver {
  public observe(): void {}
  public unobserve(): void {}
  public disconnect(): void {}
}
(window as unknown as { ResizeObserver: unknown }).ResizeObserver = StubResizeObserver;

const fields = [
  field({ internalName: 'Title', title: 'Title', required: true }),
  field({ internalName: 'Category', title: 'Category', kind: 'choice', required: true, choices: ['Incident', 'Request', 'Question'] }),
  field({ internalName: 'Impact', title: 'Impact', required: true }),
  field({ internalName: 'Urgency', title: 'Urgency', kind: 'choice', choices: ['Low', 'Normal', 'High'] })
];

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

async function flush(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('QuestionEditor', () => {
  it('loads existing JSON into cards, shows answer pills instead of raw tokens, and saves back to the same shape', async () => {
    const saved: { questionTexts: Record<string, string>; fieldExamples: Record<string, string>; skipLogic: ISkipRule[] }[] = [];
    act(() => {
      root.render(
        <QuestionEditor
          fields={fields}
          questionTexts={{ Impact: "Thanks, {{firstName}}. What's the impact of {{Title}}?" }}
          fieldExamples={{ Impact: 'Night shifts lose about twenty minutes.' }}
          skipRules={[{ show: 'Urgency', when: 'Category', equals: 'Incident' }]}
          firstName="Alex"
          openName="Impact"
          onSave={(next) => saved.push(next)}
          onCancel={() => undefined}
        />
      );
    });
    await flush();
    expect(container.querySelector('[data-testid="wiz-question-editor"]')).not.toBeNull();
    const impact = container.querySelector('[data-card="Impact"]') as HTMLElement;
    expect(impact).not.toBeNull();
    expect(impact.textContent || '').toContain('First name');
    expect(impact.querySelector('[data-testid="qe-question"]')!.textContent || '').not.toContain('{{firstName}}');
    const example = impact.querySelector('[data-testid="qe-example"]') as HTMLInputElement | HTMLTextAreaElement;
    expect(example.value).toBe('Night shifts lose about twenty minutes.');
    const proto = example instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = (Object.getOwnPropertyDescriptor(proto, 'value') as PropertyDescriptor).set as (v: string) => void;
    await act(async () => {
      setter.call(example, 'The report is unreadable.');
      example.dispatchEvent(new Event('input', { bubbles: true }));
    });
    // Open Urgency and confirm the existing skip condition is there.
    const urgencyHead = container.querySelector('[data-card="Urgency"] button') as HTMLButtonElement;
    await act(async () => {
      urgencyHead.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flush();
    const condition = container.querySelector('[data-testid="qe-condition"]');
    expect(condition).not.toBeNull();
    await act(async () => {
      (container.querySelector('[data-testid="qe-save"]') as HTMLButtonElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(saved[0].questionTexts.Impact).toContain('{{firstName}}');
    expect(saved[0].fieldExamples.Impact).toBe('The report is unreadable.');
    expect(saved[0].skipLogic).toEqual([{ show: 'Urgency', when: 'Category', equals: 'Incident' }]);
  });

  it('lays out question text inline with pills, supports typing, pill insert, and backspace removing a pill', async () => {
    const saved: { questionTexts: Record<string, string> }[] = [];
    act(() => {
      root.render(
        <QuestionEditor
          fields={fields}
          questionTexts={{ Impact: "Thanks, {{firstName}}. What's the impact of {{Title}}?" }}
          firstName="Alex"
          openName="Impact"
          onSave={(next) => saved.push(next)}
          onCancel={() => undefined}
        />
      );
    });
    await flush();
    const editor = container.querySelector('[data-card="Impact"] [data-testid="qe-question"]') as HTMLElement;
    // inline question text: no <input> segments, editable spans and pill buttons in one flow
    expect(editor.querySelectorAll('input').length).toBe(0);
    const spans = Array.from(editor.querySelectorAll('.qe-text')) as HTMLElement[];
    expect(spans.length).toBe(3);
    expect(spans[1].getAttribute('contenteditable')).toBe('true');
    expect(Array.from(editor.querySelectorAll('.qe-pill')).map((b) => b.textContent)).toEqual(['First name', 'Title']);
    expect(editor.textContent).toBe("Thanks, First name. What's the impact of Title?");

    // Typing into a text run updates the template.
    await act(async () => {
      spans[0].textContent = 'Hi, ';
      spans[0].dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(editor.textContent).toBe("Hi, First name. What's the impact of Title?");

    // Backspace at the start of the text after the First name pill removes that pill.
    const afterFirst = editor.querySelectorAll('.qe-text')[1] as HTMLElement;
    afterFirst.focus();
    const range = document.createRange();
    range.selectNodeContents(afterFirst);
    range.collapse(true);
    const sel = window.getSelection() as Selection;
    sel.removeAllRanges();
    sel.addRange(range);
    await act(async () => {
      afterFirst.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
    });
    await flush();
    expect(Array.from(editor.querySelectorAll('.qe-pill')).map((b) => b.textContent)).toEqual(['Title']);
    expect(editor.textContent).toBe("Hi, . What's the impact of Title?");

    // Inserting a pill from the chips adds it inline.
    const chip = Array.from(container.querySelectorAll('[data-card="Impact"] .qe-chip')).find((b) => (b.textContent || '').indexOf('First name') >= 0) as HTMLButtonElement;
    await act(async () => {
      chip.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(Array.from(editor.querySelectorAll('.qe-pill')).map((b) => b.textContent)).toEqual(['Title', 'First name']);

    await act(async () => {
      (container.querySelector('[data-testid="qe-save"]') as HTMLButtonElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(saved[0].questionTexts.Impact).toBe("Hi, . What's the impact of {{Title}}?{{firstName}}");
  });

  it('filters the when dropdown to earlier Choice/Yes/No fields, can remove a condition, and never summarises empty "is ;" rows', async () => {
    const saved: { skipLogic: ISkipRule[] }[] = [];
    act(() => {
      root.render(
        <QuestionEditor
          fields={fields}
          skipRules={[
            { show: 'Impact', when: 'Title', equals: 'x' },
            { show: 'Impact', when: 'Category', equals: '' }
          ]}
          firstName="Alex"
          openName="Impact"
          onSave={(next) => saved.push(next)}
          onCancel={() => undefined}
        />
      );
    });
    await flush();
    const impact = container.querySelector('[data-card="Impact"]') as HTMLElement;
    expect(impact.querySelector('[data-testid="qe-condition"]')).toBeNull();
    expect((impact.querySelector('.qe-meta') as HTMLElement).textContent || '').toContain('Always show');
    expect((impact.textContent || '')).not.toContain('is ;');

    await act(async () => {
      (impact.querySelector('[data-testid="qe-add-condition"]') as HTMLButtonElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flush();
    const row = impact.querySelector('[data-testid="qe-condition"]') as HTMLElement;
    expect(row).not.toBeNull();
    const column = row.querySelector('select[aria-label="Column"]') as HTMLSelectElement;
    expect(Array.from(column.options).map((o) => o.value)).toEqual(['Category']);
    expect(Array.from(column.options).map((o) => o.textContent)).not.toContain('Title');
    expect(row.querySelector('[data-testid="qe-remove-condition"]')).not.toBeNull();
    expect((row.querySelector('[data-testid="qe-remove-condition"]') as HTMLButtonElement).getAttribute('aria-label')).toBe('Remove condition');
    expect((impact.querySelector('.qe-meta') as HTMLElement).textContent || '').toContain('When Category is Incident');
    expect((impact.textContent || '')).not.toMatch(/is ;/);

    await act(async () => {
      (row.querySelector('[data-testid="qe-remove-condition"]') as HTMLButtonElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flush();
    expect(impact.querySelector('[data-testid="qe-condition"]')).toBeNull();
    expect(impact.querySelector('.qe-always')).not.toBeNull();
    expect((impact.querySelector('.qe-meta') as HTMLElement).textContent || '').toContain('Always show');

    await act(async () => {
      (container.querySelector('[data-testid="qe-save"]') as HTMLButtonElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(saved[0].skipLogic).toEqual([]);
  });

  it('labels the answer pills, keeps them visible with a plus, and offers is not and is answered', async () => {
    const saved: { skipLogic: ISkipRule[] }[] = [];
    act(() => {
      root.render(
        <QuestionEditor
          fields={fields}
          firstName="Alex"
          openName="Impact"
          onSave={(next) => saved.push(next)}
          onCancel={() => undefined}
        />
      );
    });
    await flush();
    const impact = container.querySelector('[data-card="Impact"]') as HTMLElement;
    expect((impact.textContent || '')).toContain('Personalize with an answer');
    expect((impact.textContent || '')).toContain('Add a reply from an earlier question, for example: Thanks, {First name}.');
    expect(impact.querySelector('[data-testid="qe-chips"]')).not.toBeNull();
    const chips = Array.from(impact.querySelectorAll('.qe-chip')).map((b) => (b.textContent || '').replace(/\s+/g, ' ').trim());
    expect(chips.some((c) => c.indexOf('+') >= 0 && c.indexOf('First name') >= 0)).toBe(true);
    expect((impact.textContent || '').toLowerCase()).not.toContain('show more');
    expect(impact.querySelector('[data-testid="qe-answer-check"]')).not.toBeNull();

    await act(async () => {
      (impact.querySelector('[data-testid="qe-add-condition"]') as HTMLButtonElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flush();
    const op = impact.querySelector('select[aria-label="Operator"]') as HTMLSelectElement;
    expect(Array.from(op.options).map((o) => o.value)).toEqual(['is', 'not', 'any', 'answered']);
    await act(async () => {
      op.value = 'not';
      op.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await flush();
    expect((impact.querySelector('.qe-meta') as HTMLElement).textContent || '').toContain('is not');

    await act(async () => {
      op.value = 'answered';
      op.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await flush();
    expect((impact.querySelector('.qe-meta') as HTMLElement).textContent || '').toContain('is answered');
    expect(impact.querySelector('select[aria-label="Value"]')).toBeNull();

    await act(async () => {
      (container.querySelector('[data-testid="qe-save"]') as HTMLButtonElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(saved[0].skipLogic).toEqual([{ show: 'Impact', when: 'Category', answered: true }]);
  });

  it('hides Personalize with an answer on the first question and does not offer First name there', async () => {
    act(() => {
      root.render(
        <QuestionEditor
          fields={fields}
          firstName="Alex"
          openName="Title"
          onSave={() => undefined}
          onCancel={() => undefined}
        />
      );
    });
    await flush();
    const title = container.querySelector('[data-card="Title"]') as HTMLElement;
    expect(title).not.toBeNull();
    expect(title.querySelector('[data-testid="qe-personalize"]')).toBeNull();
    expect(title.querySelector('[data-testid="qe-chips"]')).toBeNull();
    expect((title.textContent || '')).not.toContain('Personalize with an answer');
    expect((title.textContent || '')).not.toContain('+ First name');
    expect((title.textContent || '').indexOf('First name')).toBe(-1);
  });

  it('offers only earlier questions plus First name on a later question, in form order', async () => {
    act(() => {
      root.render(
        <QuestionEditor
          fields={fields}
          firstName="Alex"
          openName="Impact"
          onSave={() => undefined}
          onCancel={() => undefined}
        />
      );
    });
    await flush();
    const impact = container.querySelector('[data-card="Impact"]') as HTMLElement;
    expect(impact.querySelector('[data-testid="qe-personalize"]')).not.toBeNull();
    const chips = Array.from(impact.querySelectorAll('.qe-chip')).map((b) => (b.textContent || '').replace(/\s+/g, ' ').trim());
    expect(chips.map((c) => c.replace(/^\+\s*/, '').trim())).toEqual(['First name', 'Title', 'Category']);
    expect(chips.some((c) => c.indexOf('Urgency') >= 0)).toBe(false);
  });

});
