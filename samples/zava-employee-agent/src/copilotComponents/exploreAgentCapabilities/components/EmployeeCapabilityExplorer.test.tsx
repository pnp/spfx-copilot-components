import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import EmployeeCapabilityExplorer from './EmployeeCapabilityExplorer';
import { EMPLOYEE_CAPABILITIES, findEmployeeCapabilities } from '../../shared/experiences/employeeCapabilities';
import HomeThemeProvider from '../../getMyHrDashboard/components/HomeThemeProvider';

describe('employee feature discovery', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const changeSearch = (value: string): void => {
    const input = container.querySelector('input');
    if (!input) throw new Error('Missing feature search input.');
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (!setter) throw new Error('Missing native input setter.');
      setter.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };
  test('indexes exactly 20 distinct operational tools without leaking personal HR facts', () => {
    expect(EMPLOYEE_CAPABILITIES).toHaveLength(20);
    expect(new Set(EMPLOYEE_CAPABILITIES.map(item => item.tool)).size).toBe(20);
    act(() => root.render(<EmployeeCapabilityExplorer />));
    expect(container.querySelectorAll('article')).toHaveLength(20);
    expect(container.textContent).not.toMatch(/5,126|184,000|EUR 248/);
    expect(Array.from(container.querySelectorAll('button')).some(button => /approve|submit|confirm/i.test(button.textContent || ''))).toBe(false);
  });
  test('query and family filters produce the actual owning scenarios', () => {
    expect(findEmployeeCapabilities('dental').map(item => item.tool)).toEqual(['CompareBenefitPlans']);
    expect(findEmployeeCapabilities('', 'team').map(item => item.tool)).toEqual(['GetApprovalInbox', 'GetTeamAbsenceCalendar']);
    act(() => root.render(<EmployeeCapabilityExplorer query="dental" />));
    expect(container.querySelectorAll('article')).toHaveLength(1);
    changeSearch('nothing-matches-this');
    expect(container.querySelectorAll('article')).toHaveLength(0);
    expect(container.textContent).toContain('No scenario matches');
  });
  test('retains search while host theme changes', () => {
    const render = (theme: 'light' | 'dark'): void => {
      act(() => root.render(<HomeThemeProvider targetDocument={document} theme={theme}><EmployeeCapabilityExplorer /></HomeThemeProvider>));
    };
    render('light'); changeSearch('dental'); render('dark');
    expect(container.querySelector('input')?.value).toBe('dental');
    expect(container.querySelectorAll('article')).toHaveLength(1);
  });
  test('does not launch a scenario until the user explicitly selects its prompt', async () => {
    const send = jest.fn<Promise<void>, [string]>(() => Promise.resolve());
    act(() => root.render(<EmployeeCapabilityExplorer query="dental" onSendPrompt={send} />));
    expect(send).not.toHaveBeenCalled();
    const button = container.querySelector('button');
    if (!button) throw new Error('Missing scenario prompt action.');
    await act(async () => { button.click(); });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(EMPLOYEE_CAPABILITIES.find(item => item.tool === 'CompareBenefitPlans')?.prompt);
    expect(container.textContent).toContain('Prompt sent to Copilot');
  });
  test('shows host rejection instead of reporting successful launch', async () => {
    const send = jest.fn<Promise<void>, [string]>(() => Promise.reject(new Error('Host rejected')));
    act(() => root.render(<EmployeeCapabilityExplorer query="dental" onSendPrompt={send} />));
    const button = container.querySelector('button');
    if (!button) throw new Error('Missing scenario prompt action.');
    await act(async () => { button.click(); });
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Host rejected');
    expect(container.textContent).not.toContain('Prompt sent to Copilot.');
  });
  test('publishes bounded discovery context for the actual visible tools', () => {
    const update = jest.fn<Promise<void>, [unknown]>(() => Promise.resolve());
    act(() => root.render(<EmployeeCapabilityExplorer onUpdateContext={update} />));
    expect(update).toHaveBeenLastCalledWith(expect.objectContaining({ intent: 'ExploreAgentCapabilitiesTool', visibleTools: EMPLOYEE_CAPABILITIES.map(item => item.tool) }));
    changeSearch('dental');
    expect(update).toHaveBeenLastCalledWith(expect.objectContaining({ query: 'dental', visibleTools: ['CompareBenefitPlans'] }));
    expect(JSON.stringify(update.mock.calls)).not.toMatch(/salary|5,126|184,000/);
  });
  test('surfaces model-context host errors', async () => {
    const update = jest.fn<Promise<void>, [unknown]>(() => Promise.reject(new Error('Context denied')));
    await act(async () => { root.render(<EmployeeCapabilityExplorer onUpdateContext={update} />); });
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Context denied');
  });
});
