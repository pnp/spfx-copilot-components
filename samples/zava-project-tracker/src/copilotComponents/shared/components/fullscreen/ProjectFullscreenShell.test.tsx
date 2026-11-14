import * as React from 'react';
import { createRoot } from 'react-dom/client';

import { getIntentDefinition } from '../../mockData/intentCatalog';
import type { IIntentTransientState } from '../../models/intentInvocation';
import { getSessionActionReceipts, resetSessionActions } from '../../services/SessionActionStore';
import ProjectFullscreenShell from './ProjectFullscreenShell';

const { act } = React;

const clickButton = (container: HTMLElement, label: string): void => {
  const button = Array.from(container.querySelectorAll('button')).find((item) => item.textContent?.indexOf(label) !== -1 || item.getAttribute('aria-label') === label);
  if (!button) throw new Error(`Button not found: ${label}`);
  act(() => { button.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
};

const setSelectValue = (select: HTMLSelectElement, value: string): void => {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
    setter?.call(select, value);
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
};

const renderShell = (intentKey: string, properties = { projectId: 'PRJ-2601' } as Record<string, unknown>, transientState?: IIntentTransientState, propertiesVersion = 1): { container: HTMLDivElement; rerender: (nextIntentKey: string, nextProperties?: Record<string, unknown>, nextTransientState?: IIntentTransientState) => void; cleanup: () => void } => {
  const container = document.createElement('div');
  let updateInvocation: ((nextIntentKey: string, nextProperties: Record<string, unknown>, nextTransientState?: IIntentTransientState) => void) | undefined;
  const Harness: React.FunctionComponent = () => {
    const [invocation, setInvocation] = React.useState({ intentKey, properties, transientState, propertiesVersion });
    updateInvocation = (nextIntentKey, nextProperties, nextTransientState) => setInvocation((current) => ({ intentKey: nextIntentKey, properties: nextProperties, transientState: nextTransientState, propertiesVersion: current.propertiesVersion + 1 }));
    return <ProjectFullscreenShell initialDefinition={getIntentDefinition(invocation.intentKey)} initialProperties={invocation.properties} propertiesVersion={invocation.propertiesVersion} transientState={invocation.transientState} currentUserName="Megan Bowen" containerWidth={980}/>;
  };
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<Harness/>);
  });
  return {
    container,
    rerender: (nextIntentKey, nextProperties = {}, nextTransientState) => act(() => { updateInvocation?.(nextIntentKey, nextProperties, nextTransientState); }),
    cleanup: () => act(() => {
      root.unmount();
      container.remove();
    })
  };
};

const renderNarrowShell = (): { container: HTMLDivElement; cleanup: () => void } => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<ProjectFullscreenShell initialDefinition={getIntentDefinition('GetMyWorkSummary')} initialProperties={{}} currentUserName="Megan Bowen" containerWidth={340}/>);
  });
  return { container, cleanup: () => act(() => { root.unmount(); container.remove(); }) };
};

describe('ProjectFullscreenShell', () => {
  beforeEach(() => resetSessionActions());

  test('restores processed decisions across shell remounts and resets demo state', () => {
    const first = renderShell('ReviewProjectRequest');
    clickButton(first.container, 'Review');
    clickButton(first.container, 'Approve');
    clickButton(first.container, 'Confirm decision');
    expect(getSessionActionReceipts()).toEqual([
      expect.objectContaining({ kind: 'decision', status: 'approved' })
    ]);
    first.cleanup();

    const second = renderShell('GetApprovalInbox');
    setSelectValue(second.container.querySelector<HTMLSelectElement>('select[aria-label="Filter decisions by status"]') as HTMLSelectElement, 'processed');
    expect(second.container.querySelector('[data-decision="approved"]')).not.toBeNull();
    clickButton(second.container, 'Reset demo decisions');
    expect(getSessionActionReceipts()).toEqual([]);
    expect(second.container.querySelector('[data-decision="approved"]')).toBeNull();
    second.cleanup();
  });

  test('shows continued inline context and clears it for a fresh properties version', () => {
    const rendered = renderShell('GetMyWorkSummary', {}, { information: { filter: 'critical', selectedId: 'Evaluation review' } }, 3);
    const { container } = rendered;
    expect(container.querySelector('[data-layout="project-fullscreen-shell"]')?.getAttribute('data-properties-version')).toBe('3');
    expect(container.querySelector('[data-layout="continued-inline-context"]')?.textContent).toContain('critical / Evaluation review');
    rendered.rerender('GetMyWorkSummary', { period: 'month' });
    expect(container.querySelector('[data-layout="continued-inline-context"]')).toBeNull();
    rendered.cleanup();
  });

  test.each([
    ['GetProjectAiSpend', 'project', 'project/ai-spend', 'Project'],
    ['ReviewResourceAssignment', 'approvals', 'approvals/resource-assignment', 'Decisions']
  ])('lands %s on its exact workspace and route', (intentKey, workspace, route, selectedTab) => {
    const rendered = renderShell(intentKey);
    const { container } = rendered;
    const shell = container.querySelector('[data-layout="project-fullscreen-shell"]');
    expect(shell?.getAttribute('data-workspace')).toBe(workspace);
    expect(shell?.getAttribute('data-route')).toBe(route);
    expect(container.querySelector('[data-intent]')).toBeNull();
    expect(container.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe(selectedTab);
    rendered.cleanup();
  });

  test('reapplies a fresh invoked intent while the full-screen shell remains mounted', () => {
    const rendered = renderShell('ReviewProjectRequest');
    const { container } = rendered;
    expect(container.querySelector('[data-layout="decisions-dashboard"]')).not.toBeNull();
    rendered.rerender('GetMyTasks');
    expect(container.querySelector('[data-layout="project-fullscreen-shell"]')?.getAttribute('data-workspace')).toBe('my-work');
    expect(container.querySelector('[data-layout="my-work-dashboard"]')).not.toBeNull();
    expect(container.querySelector('[data-layout="decisions-dashboard"]')).toBeNull();
    rendered.rerender('GetProjectAiSpend', { projectId: 'PRJ-2601' });
    expect(container.querySelector('[data-layout="project-dashboard"]')).not.toBeNull();
    rendered.rerender('GetPortfolioCapacity');
    expect(container.querySelector('[data-layout="portfolio-dashboard"]')).not.toBeNull();
    rendered.cleanup();
  });

  test('keeps provenance in product chrome and configuration inside settings', () => {
    const rendered = renderShell('GetMyWorkSummary');
    const { container } = rendered;
    expect(container.querySelector('header')?.textContent).toContain('Mock data / offline');
    expect(container.querySelector('[aria-label="Decision Thread"]')).toBeNull();
    expect(container.querySelector('select[aria-label="Demo scenario"]')).toBeNull();
    clickButton(container, 'Settings');
    expect(container.querySelector('select[aria-label="Demo scenario"]')).not.toBeNull();
    rendered.cleanup();
  });

  test('opens and focus-manages session settings', () => {
    const rendered = renderShell('GetProjectHealth');
    const { container } = rendered;
    clickButton(container, 'Settings');
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.activeElement?.textContent).toBe('Workspace settings');
    act(() => { container.querySelector('[role="dialog"]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Settings');
    rendered.cleanup();
  });

  test('supports roving keyboard tabs and focuses the destination heading', () => {
    const rendered = renderShell('GetMyWorkSummary');
    const { container } = rendered;
    const selectedTab = container.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]');
    act(() => { selectedTab?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); });
    expect(container.querySelector('[data-layout="project-fullscreen-shell"]')?.getAttribute('data-workspace')).toBe('project');
    expect(container.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe('Project');
    rendered.cleanup();
  });

  test('renders complete workspace dashboards without a route dropdown', () => {
    const rendered = renderShell('GetMyWorkSummary');
    const { container } = rendered;
    expect(container.querySelector('[data-layout="my-work-dashboard"]')).not.toBeNull();
    expect(container.querySelector('select[aria-label="Workspace view"]')).toBeNull();
    clickButton(container, 'Project');
    expect(container.querySelector('[data-layout="project-dashboard"]')).not.toBeNull();
    clickButton(container, 'Portfolio');
    expect(container.querySelector('[data-layout="portfolio-dashboard"]')).not.toBeNull();
    clickButton(container, 'Decisions');
    expect(container.querySelector('[data-layout="decisions-dashboard"]')).not.toBeNull();
    rendered.cleanup();
  });

  test.each([
    'GetMyTasks',
    'GetProjectAiSpend',
    'GetPortfolioCapacity',
    'ReviewProjectRequest',
    'ReviewResourceAssignment'
  ])('routes %s to its dashboard without opening a side panel or review', (intentKey) => {
    const rendered = renderShell(intentKey);
    const { container } = rendered;
    expect(container.querySelector('[role="dialog"][data-dashboard-focus]')).toBeNull();
    if (String(intentKey).startsWith('Review')) {
      expect(container.querySelector('[data-layout="decisions-dashboard"]')?.getAttribute('data-selected-decision')).toBe('none');
      expect(container.querySelector('[data-layout$="-review"]')).toBeNull();
    }
    rendered.cleanup();
  });

  test('updates the project cockpit from one project selector', () => {
    const rendered = renderShell('GetProjectHealth');
    const { container } = rendered;
    const selector = container.querySelector<HTMLSelectElement>('select[aria-label="Select project"]');
    expect(selector).not.toBeNull();
    setSelectValue(selector as HTMLSelectElement, 'PRJ-2603');
    expect(container.querySelector('[data-layout="project-dashboard"]')?.getAttribute('data-selected-project')).toBe('PRJ-2603');
    expect(container.textContent).toContain('Contract Intelligence');
    expect(container.textContent).toContain('+19 days');
    rendered.cleanup();
  });

  test.each([
    ['Weekly update', 'weekly-update-form'],
    ['Timesheet', 'timesheet-grid'],
    ['Project status', 'project-status-form'],
    ['AI usage', 'ai-usage-form'],
    ['Project request', 'project-request-stepper'],
    ['AI budget request', 'ai-budget-request-form']
  ])('opens the %s inline submission experience in the My Work action panel', (label, layout) => {
    const rendered = renderShell('GetMyWorkSummary');
    const { container } = rendered;
    expect(container.querySelector('[role="dialog"][data-personal-action]')).toBeNull();
    clickButton(container, `Open ${label}`);
    expect(container.querySelector('[role="dialog"][data-personal-action]')).not.toBeNull();
    expect(container.querySelector(`[data-layout="${layout}"]`)).not.toBeNull();
    clickButton(container, 'Close personal action');
    expect(container.querySelector('[role="dialog"][data-personal-action]')).toBeNull();
    rendered.cleanup();
  });

  test('closes the My Work panel after a weekly update is completed', () => {
    const rendered = renderShell('GetMyWorkSummary');
    const { container } = rendered;
    clickButton(container, 'Open Weekly update');
    clickButton(container, 'Review submission');
    clickButton(container, 'Publish weekly update');
    expect(container.querySelector('[role="dialog"][data-personal-action]')).toBeNull();
    expect(container.querySelector('[role="status"]')?.textContent).toContain('Weekly update completed in this session');
    expect(container.querySelector('[data-layout="SubmitWeeklyUpdate-receipt"]')).toBeNull();
    rendered.cleanup();
  });

  test('closes the My Work panel after an AI budget request is completed', () => {
    const rendered = renderShell('GetMyWorkSummary');
    const { container } = rendered;
    clickButton(container, 'Open AI budget request');
    clickButton(container, 'Review request');
    clickButton(container, 'Submit request');
    expect(container.querySelector('[role="dialog"][data-personal-action]')).toBeNull();
    expect(container.querySelector('[role="status"]')?.textContent).toContain('AI budget request completed in this session');
    expect(container.querySelector('[data-layout="ai-budget-request-receipt"]')).toBeNull();
    rendered.cleanup();
  });

  test('keeps a personal action panel inside the narrow My Work dashboard', () => {
    const rendered = renderNarrowShell();
    const { container } = rendered;
    clickButton(container, 'Open Timesheet');
    expect(container.querySelector('[data-layout="timesheet-mobile"]')).not.toBeNull();
    expect(container.querySelector('[role="dialog"][data-personal-action="SubmitTimesheet"]')).not.toBeNull();
    rendered.cleanup();
  });

  test('opens an incoming request in the matching decision workspace', () => {
    const rendered = renderShell('GetApprovalInbox');
    const { container } = rendered;
    expect(container.querySelector('[data-layout="decisions-dashboard"]')?.getAttribute('data-selected-decision')).toBe('none');
    expect(container.querySelector('[data-layout$="-review"]')).toBeNull();
    expect(Array.from(container.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Approve')).toBe(false);
    clickButton(container, 'Review Supply Chain Exception Agent');
    expect(container.querySelector('[data-layout="project-fullscreen-shell"]')?.getAttribute('data-route')).toBe('approvals/project-request');
    expect(container.querySelector('[data-layout="decisions-dashboard"]')?.getAttribute('data-selected-decision')).toBe('PRQ-2606');
    expect(container.querySelector('[data-layout="ReviewProjectRequest-review"]')).not.toBeNull();
    rendered.cleanup();
  });

  test('opens a prompt-derived resource scenario only after explicit Review', () => {
    const rendered = renderShell('ReviewResourceAssignment', { approvalId: 'RES-2601', projectId: 'PRJ-2601', personId: 'pradeep', allocationPercent: 20 });
    const { container } = rendered;
    expect(container.querySelector('[data-layout="ReviewResourceAssignment-review"]')).toBeNull();
    clickButton(container, 'Review Customer Service Copilot / AI review');
    expect(container.querySelector('[data-layout="ReviewResourceAssignment-review"]')).not.toBeNull();
    expect(container.querySelector<HTMLInputElement>('input[aria-label="Proposed allocation"]')?.value).toBe('20');
    expect(container.textContent).toContain('Proposed 98%');
    expect(container.querySelector('[data-tone="warning"]')).not.toBeNull();
    rendered.cleanup();
  });

  test('filters incoming requests and keeps processed receipts in the unified inbox', () => {
    const rendered = renderShell('GetApprovalInbox');
    const { container } = rendered;
    expect(container.textContent).toContain('No decision item selected');
    const typeFilter = container.querySelector<HTMLSelectElement>('select[aria-label="Filter decisions by type"]');
    setSelectValue(typeFilter as HTMLSelectElement, 'project');
    expect(container.querySelectorAll('[data-approval-id]')).toHaveLength(3);
    setSelectValue(typeFilter as HTMLSelectElement, 'all');
    clickButton(container, 'Review Customer Service Copilot / AI review');
    const allocation = container.querySelector<HTMLInputElement>('input[aria-label="Proposed allocation"]');
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(allocation, '20');
      allocation?.dispatchEvent(new Event('input', { bubbles: true }));
      allocation?.dispatchEvent(new Event('change', { bubbles: true }));
    });
    clickButton(container, 'Approve');
    clickButton(container, 'Confirm decision');
    expect(container.querySelector('[data-layout="ReviewResourceAssignment-receipt"]')).not.toBeNull();
    expect(container.querySelector('[data-layout="ReviewResourceAssignment-receipt"]')?.textContent).not.toContain('Back to queue');
    expect(container.querySelector('[data-approval-id="RES-2601"] [data-decision="approved"]')).not.toBeNull();
    const statusFilter = container.querySelector<HTMLSelectElement>('select[aria-label="Filter decisions by status"]');
    setSelectValue(statusFilter as HTMLSelectElement, 'processed');
    expect(container.querySelectorAll('[data-approval-id]')).toHaveLength(1);
    expect(container.querySelector('[data-approval-id="RES-2601"]')).not.toBeNull();
    expect(container.querySelector('[data-layout="ReviewResourceAssignment-receipt"]')).not.toBeNull();
    rendered.cleanup();
  });

  test.each([
    ['ReviewProjectRequest', 'project', ['PRQ-2606', 'PRQ-2609', 'PRQ-2610'], ['Supply Chain Exception Agent', 'Sales Quality Coach', 'Invoice Anomaly Agent']],
    ['ReviewProjectBudget', 'budget', ['BUD-2601', 'BUD-2603', 'BUD-2604'], ['Customer Service Copilot AI budget', 'Contract Intelligence supplier change', 'Knowledge Platform indexing scale']],
    ['ReviewResourceAssignment', 'resource', ['RES-2601', 'RES-2602', 'RES-2605'], ['Customer Service Copilot / AI review', 'Demand Forecasting / data engineering', 'Sales Meeting Assistant / adoption']],
    ['ReviewStageGate', 'gate', ['GATE-2601', 'GATE-2603', 'GATE-2608'], ['Customer Service Copilot / Pilot exit', 'Contract Intelligence / Validate exit', 'Invoice Automation / Closure']]
  ])('auto-filters %s and shows the same pending items as its inline queue', (intentKey, filter, ids, titles) => {
    const rendered = renderShell(String(intentKey));
    const { container } = rendered;
    expect(container.querySelector<HTMLSelectElement>('select[aria-label="Filter decisions by type"]')?.value).toBe(filter);
    expect(Array.from(container.querySelectorAll('[data-approval-id]')).map((item) => item.getAttribute('data-approval-id'))).toEqual(ids);
    titles.forEach((title) => expect(container.textContent).toContain(title));
    expect(container.querySelector('[data-layout="decisions-dashboard"]')?.getAttribute('data-selected-decision')).toBe('none');
    expect(container.querySelector('[data-layout$="-review"]')).toBeNull();
    rendered.cleanup();
  });
});