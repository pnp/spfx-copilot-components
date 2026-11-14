import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import MyDayApp from './MyDayApp';
import type { IMyDayCopilotComponentProperties } from '../MyDayCopilotComponentProperties';
import { planMyDay } from '../services/planMyDay';
import { MockMyDayDataService } from '../services/MockMyDayDataService';

type Focus = NonNullable<IMyDayCopilotComponentProperties['focus']>;
describe('My Day focused React 18 experience', () => {
  let container: HTMLDivElement;
  let root: Root;
  const render = (focus: Focus = 'summary', mode: 'inline' | 'fullscreen' = 'inline', dark = false): void => {
    act(() => root.render(<MyDayApp key={focus} focus={focus} displayMode={mode} theme={dark ? 'dark' : 'light'} targetDocument={document} />));
  };
  beforeEach(() => {
    sessionStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  test.each<Focus>(['summary', 'meetings', 'tasks', 'news', 'mail', 'plan'])('%s focus opens the actual matching visible facet', focus => {
    render(focus);
    expect(container.querySelector('[data-my-day-view]')?.getAttribute('data-my-day-view')).toBe(focus);
    expect(container.textContent?.length).toBeGreaterThan(50);
    if (focus === 'plan') {
      expect(container.textContent).toContain('Plan my day');
      expect(container.textContent).toContain('Read-only briefing generated locally');
    }
  });
  test('retains task check state and selected focus across theme and host-mode changes', () => {
    render('tasks');
    const first = container.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if (!first) throw new Error('Expected a task checkbox.');
    const label = first.getAttribute('aria-label');
    act(() => first.click());
    const checked = first.checked;
    render('tasks', 'inline', true);
    expect(container.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked).toBe(checked);
    render('tasks', 'fullscreen', true);
    render('tasks');
    const restored = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')).find(input => input.getAttribute('aria-label') === label);
    expect(restored?.checked).toBe(checked);
    expect(container.querySelector('[data-my-day-view]')?.getAttribute('data-my-day-view')).toBe('tasks');
  });
  test('a fresh focused invocation does not keep an unrelated previous drill-down', () => {
    render('meetings');
    render('mail');
    expect(container.querySelector('[data-my-day-view]')?.getAttribute('data-my-day-view')).toBe('mail');
  });
  test('focus planning is deterministic and never mutates source tasks', () => {
    const now = new Date(2026, 9, 20, 9);
    const data = new MockMyDayDataService().getMyDay(now);
    const before = data.tasks.map(task => task.completed);
    expect(planMyDay(data, now)).toEqual(planMyDay(data, now));
    expect(data.tasks.map(task => task.completed)).toEqual(before);
  });
});
