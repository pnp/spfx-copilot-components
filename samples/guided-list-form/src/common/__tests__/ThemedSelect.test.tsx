import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act as legacyAct } from 'react-dom/test-utils';
import { ThemedSelect } from '../components/ThemedSelect';
import { MENU_FONT_SIZE, MENU_LINE_HEIGHT } from '../logic/themedSelectMenu';

const act = ((React as unknown as { act?: typeof legacyAct }).act || legacyAct) as typeof legacyAct;
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

const options = [
  { value: 'IT Requests', label: 'IT Requests' },
  { value: 'Annual Processes', label: 'Annual Processes' },
  { value: 'Event Feedback', label: 'Event Feedback' }
];

function renderSelect(value: string = '', onChange: (v: string) => void = () => undefined): void {
  act(() => {
    root.render(
      <ThemedSelect
        id="wiz-list-select"
        value={value}
        options={options}
        placeholder="Select a list"
        data-testid="wiz-list-select"
        onChange={onChange}
      />
    );
  });
}

function trigger(): HTMLButtonElement {
  return document.getElementById('wiz-list-select') as HTMLButtonElement;
}

describe('ThemedSelect', () => {
  it('opens a themed listbox, selects an option, and shows a check on the chosen list', async () => {
    const values: string[] = [];
    renderSelect('', (v) => values.push(v));
    const button = trigger();
    expect(button.getAttribute('role')).toBe('combobox');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.tagName).toBe('BUTTON');
    expect(document.querySelector('select')).toBeNull();

    await act(async () => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flush();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    const menu = document.querySelector('[data-testid="wiz-list-menu"]') as HTMLElement;
    expect(menu).not.toBeNull();
    expect(menu.getAttribute('role')).toBe('listbox');
    const items = Array.from(document.querySelectorAll('[data-testid="wiz-list-option"]')) as HTMLElement[];
    expect(items.map((i) => i.textContent)).toEqual(['IT Requests', 'Annual Processes', 'Event Feedback']);

    await act(async () => {
      items[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flush();
    expect(values).toEqual(['Annual Processes']);

    renderSelect('Annual Processes');
    await act(async () => {
      trigger().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flush();
    const chosen = Array.from(document.querySelectorAll('[data-testid="wiz-list-option"]')).find((i) => (i.textContent || '').indexOf('Annual Processes') >= 0) as HTMLElement;
    expect(chosen.getAttribute('aria-selected')).toBe('true');
    expect(chosen.querySelector('[data-testid="wiz-list-check"]')).not.toBeNull();
    expect(trigger().textContent).toContain('Annual Processes');
  });

  it('moves with arrow keys, commits with Enter, and closes on Escape', async () => {
    const values: string[] = [];
    renderSelect('', (v) => values.push(v));
    const button = trigger();
    button.focus();
    await act(async () => {
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    });
    await flush();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    await act(async () => {
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    });
    await flush();
    await act(async () => {
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    });
    await flush();
    expect(values).toEqual(['Annual Processes']);
    expect(button.getAttribute('aria-expanded')).toBe('false');

    renderSelect('Annual Processes', (v) => values.push(v));
    const again = trigger();
    again.focus();
    await act(async () => {
      again.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    });
    await flush();
    expect(again.getAttribute('aria-expanded')).toBe('true');
    await act(async () => {
      again.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    });
    await flush();
    expect(again.getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('[data-testid="wiz-list-menu"]')).toBeNull();
  });

  it('jumps to a matching option on type-ahead', async () => {
    const values: string[] = [];
    renderSelect('', (v) => values.push(v));
    const button = trigger();
    button.focus();
    await act(async () => {
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'E', bubbles: true, cancelable: true }));
    });
    await flush();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    await act(async () => {
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    });
    await flush();
    expect(values).toEqual(['Event Feedback']);
  });

  it('sets an explicit card font on the portaled menu and its options', async () => {
    renderSelect();
    await act(async () => {
      trigger().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flush();
    const menu = document.querySelector('[data-testid="wiz-list-menu"]') as HTMLElement;
    expect(menu).not.toBeNull();
    expect(menu.style.position).toBe('fixed');
    expect(menu.style.fontFamily).toContain('Segoe UI');
    expect(menu.style.fontFamily).toContain('Segoe UI Web (West European)');
    expect(menu.style.fontFamily).toContain('sans-serif');
    expect(menu.style.fontSize).toBe(MENU_FONT_SIZE);
    expect(menu.style.lineHeight).toBe(MENU_LINE_HEIGHT);
    expect(menu.style.boxSizing).toBe('border-box');
    const option = menu.querySelector('[data-testid="wiz-list-option"]') as HTMLElement;
    expect(option.style.fontFamily).toContain('Segoe UI');
    expect(option.style.fontSize).toBe(MENU_FONT_SIZE);
    expect(option.style.lineHeight).toBe(MENU_LINE_HEIGHT);
    expect(option.style.boxSizing).toBe('border-box');
  });
});
