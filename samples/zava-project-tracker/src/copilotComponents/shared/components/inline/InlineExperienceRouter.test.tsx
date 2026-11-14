import * as React from 'react';
import { createRoot } from 'react-dom/client';

import { PROJECT_INTENT_CATALOG } from '../../mockData/intentCatalog';
import { getInlineOperation } from '../../models/intentOperations';
import type { IIntentTransientState } from '../../models/intentInvocation';
import type { IProjectIntentProperties } from '../../models/projectPortfolio';
import { InformationErrorBoundary } from './InformationInlineExperiences';
import InlineExperienceRouter from './InlineExperienceRouter';
import CapabilityPreview from '../../capabilityExplorer/CapabilityPreview';
import { CapabilityExplorerErrorBoundary } from '../../capabilityExplorer/CapabilityExplorer';
import { getSessionActionReceipts, resetSessionActions } from '../../services/SessionActionStore';

const { act } = React;

const clickButton = (container: HTMLElement, label: string): void => {
  const button = Array.from(container.querySelectorAll('button')).find((item) => item.textContent?.trim() === label);
  if (!button) {
    throw new Error(`Button not found: ${label}`);
  }
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};

const clickButtonByLabel = (container: HTMLElement, label: string): void => {
  const button = container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
  if (!button) {
    throw new Error(`Labeled button not found: ${label}`);
  }
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};

const setInputValue = (input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string): void => {
  act(() => {
    const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : input instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
};

const renderIntent = (intentKey: string, properties:IProjectIntentProperties = {}, displayMode = 'inline', onTransientStateChange?: (state: IIntentTransientState) => void): { container: HTMLDivElement; cleanup: () => void } => {
  const definition = PROJECT_INTENT_CATALOG.find((item) => item.key === intentKey);
  if (!definition) {
    throw new Error(`Unknown intent: ${intentKey}`);
  }
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => {
    root.render(
      <InlineExperienceRouter
        definition={definition}
        properties={properties}
        currentUserName="Megan Bowen"
        containerWidth={760}
        displayMode={displayMode}
        compact={false}
        onTransientStateChange={onTransientStateChange}
      />
    );
  });
  return {
    container,
    cleanup: () => act(() => {
      root.unmount();
    })
  };
};

describe('InlineExperienceRouter', () => {
  beforeEach(() => resetSessionActions());

  test('records a confirmed submission in the shared session receipt store', () => {
    const rendered = renderIntent('SubmitWeeklyUpdate');
    clickButton(rendered.container, 'Review submission');
    clickButton(rendered.container, 'Publish weekly update');
    expect(getSessionActionReceipts()).toEqual([
      expect.objectContaining({ intentKey: 'SubmitWeeklyUpdate', kind: 'submission', status: 'submitted' })
    ]);
    rendered.cleanup();
  });

  test('emits transient snapshots for information, review, and submit interactions', () => {
    const informationState = jest.fn<void, [IIntentTransientState]>();
    const information = renderIntent('GetMyWorkSummary', {}, 'inline', informationState);
    setInputValue(information.container.querySelector<HTMLSelectElement>('select[aria-label="Priority filter"]') as HTMLSelectElement, 'critical');
    expect(informationState).toHaveBeenLastCalledWith(expect.objectContaining({ information: { filter: 'critical', selectedId: 'Evaluation review' } }));
    information.cleanup();

    const reviewState = jest.fn<void, [IIntentTransientState]>();
    const review = renderIntent('ReviewResourceAssignment', {}, 'inline', reviewState);
    clickButton(review.container, 'Review');
    expect(reviewState).toHaveBeenLastCalledWith(expect.objectContaining({ review: expect.objectContaining({ selectedId: expect.any(String), statusFilter: 'all' }) }));
    review.cleanup();

    const submitState = jest.fn<void, [IIntentTransientState]>();
    const submit = renderIntent('SubmitWeeklyUpdate', {}, 'inline', submitState);
    setInputValue(submit.container.querySelector<HTMLTextAreaElement>('textarea') as HTMLTextAreaElement, 'Completed accessibility and package validation.');
    clickButton(submit.container, 'Review submission');
    expect(submitState).toHaveBeenLastCalledWith(expect.objectContaining({ submit: expect.objectContaining({ stage: 'review', values: expect.objectContaining({ accomplishments: 'Completed accessibility and package validation.' }) }) }));
    submit.cleanup();
  });

  test('renders a unique purpose-designed layout for every catalog intent', () => {
    const layouts: string[] = [];
    PROJECT_INTENT_CATALOG.forEach((definition) => {
      const rendered = renderIntent(definition.key);
      const layout = rendered.container.querySelector<HTMLElement>('[data-layout]')?.dataset.layout;
      expect(layout).toBeTruthy();
      layouts.push(String(layout));
      rendered.cleanup();
    });
    expect(new Set(layouts).size).toBe(31);
  });

  test('completes the resource assignment review through confirmation and receipt', () => {
    const rendered = renderIntent('ReviewResourceAssignment');
    expect(rendered.container.querySelector('[data-layout="ReviewResourceAssignment-queue"]')).not.toBeNull();
    expect(rendered.container.querySelectorAll('[data-layout="ReviewResourceAssignment-queue"] button')).toHaveLength(3);
    clickButton(rendered.container, 'Review');
    expect(rendered.container.querySelector('[data-layout="ReviewResourceAssignment-review"]')).not.toBeNull();
    const allocation = rendered.container.querySelector<HTMLInputElement>('input[aria-label="Proposed allocation"]');
    expect(allocation).not.toBeNull();
    setInputValue(allocation as HTMLInputElement, '20');
    clickButton(rendered.container, 'Approve');
    expect(rendered.container.querySelector('[data-layout="ReviewResourceAssignment-confirm"]')).not.toBeNull();
    clickButton(rendered.container, 'Confirm decision');
    expect(rendered.container.querySelector('[data-layout="ReviewResourceAssignment-receipt"]')).not.toBeNull();
    clickButton(rendered.container, 'Back to queue');
    expect(rendered.container.querySelector('[data-layout="ReviewResourceAssignment-queue"]')).not.toBeNull();
    expect(rendered.container.textContent).toContain('approved');
    rendered.cleanup();
  });

  test.each([
    ['GetApprovalInbox', 4],
    ['ReviewProjectRequest', 3],
    ['ReviewProjectBudget', 3],
    ['ReviewResourceAssignment', 3],
    ['ReviewStageGate', 3]
  ])('starts %s with a review queue containing %s items', (intentKey, itemCount) => {
    const rendered = renderIntent(String(intentKey));
    const queue = rendered.container.querySelector(`[data-layout="${intentKey}-queue"]`);
    expect(queue).not.toBeNull();
    expect(queue?.querySelectorAll('button')).toHaveLength(Number(itemCount));
    rendered.cleanup();
  });

  test('blocks gate approval and supports return with confirmation', () => {
    const rendered = renderIntent('ReviewStageGate');
    clickButton(rendered.container, 'Review');
    const approve = Array.from(rendered.container.querySelectorAll('button')).find((item) => item.textContent?.trim() === 'Approve');
    expect(approve?.disabled).toBe(true);
    clickButton(rendered.container, 'Return');
    expect(rendered.container.querySelector('[data-layout="ReviewStageGate-confirm"]')).not.toBeNull();
    const rationale = rendered.container.querySelector<HTMLTextAreaElement>('textarea[aria-label="Decision rationale"]');
    expect(rationale).not.toBeNull();
    setInputValue(rationale as HTMLTextAreaElement, 'Complete the Responsible AI evidence and resubmit.');
    clickButton(rendered.container, 'Confirm decision');
    expect(rendered.container.querySelector('[data-layout="ReviewStageGate-receipt"]')).not.toBeNull();
    rendered.cleanup();
  });

  test('completes the AI budget request through review and receipt', () => {
    const rendered = renderIntent('RequestAiBudget');
    expect(rendered.container.querySelector('[data-layout="ai-budget-request-form"]')).not.toBeNull();
    clickButton(rendered.container, 'Review request');
    expect(rendered.container.querySelector('[data-layout="ai-budget-request-review"]')).not.toBeNull();
    clickButton(rendered.container, 'Submit request');
    expect(rendered.container.querySelector('[data-layout="ai-budget-request-receipt"]')).not.toBeNull();
    rendered.cleanup();
  });

  test('disables project request navigation at the first and last steps', () => {
    const rendered = renderIntent('SubmitProjectRequest');
    const buttons = (): HTMLButtonElement[] => Array.from(rendered.container.querySelectorAll('button'));
    expect(buttons().find((button) => button.textContent === 'Back')?.disabled).toBe(true);
    expect(buttons().find((button) => button.textContent === 'Next')?.disabled).toBe(false);
    clickButton(rendered.container, '3. Investment & AI');
    expect(buttons().find((button) => button.textContent === 'Back')?.disabled).toBe(false);
    expect(buttons().find((button) => button.textContent === 'Next')?.disabled).toBe(true);
    rendered.cleanup();
  });

  test('changes project dimension statuses independently and preserves them in review', () => {
    const rendered = renderIntent('SubmitProjectStatus');
    expect(rendered.container.querySelectorAll('[role="group"][aria-label$=" status"]')).toHaveLength(5);
    clickButtonByLabel(rendered.container, 'Delivery: green - On track');
    clickButtonByLabel(rendered.container, 'Budget: red - Off track');
    expect(rendered.container.querySelector('button[aria-label="Delivery: green - On track"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(rendered.container.querySelector('button[aria-label="Budget: red - Off track"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(rendered.container.querySelector('button[aria-label="Risk: red - Off track"]')?.getAttribute('aria-pressed')).toBe('true');
    clickButton(rendered.container, 'Review submission');
    expect(rendered.container.querySelector('[data-layout="SubmitProjectStatus-review"]')).not.toBeNull();
    expect(rendered.container.querySelectorAll('[data-status="green"]')).toHaveLength(3);
    expect(rendered.container.querySelectorAll('[data-status="red"]')).toHaveLength(2);
    rendered.cleanup();
  });

  test.each([
    ['SubmitWeeklyUpdate', 'Review weekly update', ['Overall status', 'Accomplishments', 'Next steps', 'Blocker / help needed'], 'Input tokens', 'Publish weekly update', 'Weekly update published'],
    ['SubmitTimesheet', 'Review weekly timesheet', ['Week ending', 'Weekly total', 'Capacity position', 'Notes'], 'Strategic objective', 'Submit timesheet', 'Timesheet submitted'],
    ['SubmitProjectStatus', 'Review project status report', ['delivery status', 'budget status', 'scope status', 'value status', 'risk status', 'Executive summary'], 'Input tokens', 'Submit status report', 'Project status report submitted'],
    ['SubmitAiUsage', 'Review AI usage record', ['Input tokens', 'Output tokens', 'Estimated cost', 'Data classification', 'Usage purpose'], 'Accomplishments', 'Submit usage record', 'AI usage record submitted'],
    ['SubmitProjectRequest', 'Review project intake request', ['Project title', 'Sponsor', 'Strategic objective', 'Estimated budget', 'Business problem'], 'Weekly total', 'Submit project request', 'Project intake request created']
  ])('renders a matched review and receipt for %s', (intentKey, heading, expectedLabels, irrelevantLabel, confirmLabel, receiptTitle) => {
    const rendered = renderIntent(String(intentKey));
    clickButton(rendered.container, 'Review submission');
    expect(rendered.container.textContent).toContain(String(heading));
    (expectedLabels as string[]).forEach((label) => expect(rendered.container.textContent).toContain(label));
    expect(rendered.container.textContent).not.toContain(String(irrelevantLabel));
    clickButton(rendered.container, String(confirmLabel));
    expect(rendered.container.textContent).toContain(String(receiptTitle));
    rendered.cleanup();
  });

  test('keeps changed selectable form values in their matching reviews', () => {
    const weekly = renderIntent('SubmitWeeklyUpdate');
    setInputValue(weekly.container.querySelector('select') as HTMLSelectElement, 'Contract Intelligence');
    clickButton(weekly.container, 'Review submission');
    expect(weekly.container.textContent).toContain('Contract Intelligence / week ending');
    weekly.cleanup();

    const timesheet = renderIntent('SubmitTimesheet');
    const timesheetSelects = timesheet.container.querySelectorAll('select');
    setInputValue(timesheetSelects[0] as HTMLSelectElement, 'Contract Intelligence');
    setInputValue(timesheetSelects[1] as HTMLSelectElement, 'Delivery');
    clickButton(timesheet.container, 'Review submission');
    expect(timesheet.container.textContent).toContain('Contract Intelligence / Delivery');
    timesheet.cleanup();

    const status = renderIntent('SubmitProjectStatus');
    setInputValue(status.container.querySelector('select') as HTMLSelectElement, 'Contract Intelligence');
    setInputValue(status.container.querySelector('input[type="date"]') as HTMLInputElement, '2026-08-28');
    clickButton(status.container, 'Review submission');
    expect(status.container.textContent).toContain('Contract Intelligence / reporting date 2026-08-28');
    status.cleanup();

    const usage = renderIntent('SubmitAiUsage');
    const usageSelects = usage.container.querySelectorAll('select');
    setInputValue(usageSelects[0] as HTMLSelectElement, 'Contract Intelligence');
    setInputValue(usageSelects[1] as HTMLSelectElement, 'GPT-5 mini');
    setInputValue(usageSelects[2] as HTMLSelectElement, 'Pilot');
    clickButton(usage.container, 'Review submission');
    expect(usage.container.textContent).toContain('Contract Intelligence / GPT-5 mini / Pilot');
    usage.cleanup();

    const request = renderIntent('SubmitProjectRequest');
    clickButton(request.container, '2. Ownership');
    const ownershipSelects = request.container.querySelectorAll('select');
    setInputValue(ownershipSelects[0] as HTMLSelectElement, 'Marco Bell');
    setInputValue(ownershipSelects[1] as HTMLSelectElement, 'Improve customer experience');
    setInputValue(request.container.querySelector('input[type="date"]') as HTMLInputElement, '2026-11-02');
    clickButton(request.container, '3. Investment & AI');
    setInputValue(request.container.querySelector('input[type="number"]') as HTMLInputElement, '725000');
    setInputValue(request.container.querySelector('select') as HTMLSelectElement, 'AI-enabled / public data');
    clickButton(request.container, 'Review submission');
    expect(request.container.textContent).toContain('Marco Bell');
    expect(request.container.textContent).toContain('Improve customer experience');
    expect(request.container.textContent).toContain('2026-11-02');
    expect(request.container.textContent).toContain('$725,000');
    expect(request.container.textContent).toContain('AI-enabled / public data');
    request.cleanup();
  });

  test.each([
    ['SubmitWeeklyUpdate', { projectId:'Contract Intelligence', weekEnding:'2026-09-04', accomplishments:'Prefilled weekly accomplishment.' }, 'textarea', 'Prefilled weekly accomplishment.'],
    ['SubmitTimesheet', { projectId:'Contract Intelligence', notes:'Prefilled timesheet note.' }, 'input:not([type])', 'Prefilled timesheet note.'],
    ['SubmitProjectStatus', { projectId:'Contract Intelligence', reportingDate:'2026-09-05', summary:'Prefilled project status summary.' }, 'textarea', 'Prefilled project status summary.'],
    ['SubmitAiUsage', { model:'GPT-5 mini', environment:'Pilot', purpose:'Prefilled AI usage purpose.' }, 'input:not([type])', 'Prefilled AI usage purpose.'],
    ['SubmitProjectRequest', { title:'Prefilled project request', businessProblem:'Prefilled business problem for intake.' }, 'input:not([type])', 'Prefilled project request'],
    ['RequestAiBudget', { amount:91000, neededBy:'2026-11-15', model:'GPT-5 mini', justification:'Prefilled AI budget justification.' }, 'input[type="number"]', '91000']
  ])('prefills %s from prompt properties', (intentKey, properties, selector, expected) => {
    const rendered=renderIntent(String(intentKey),properties as IProjectIntentProperties);
    const control=rendered.container.querySelector<HTMLInputElement|HTMLTextAreaElement>(String(selector));
    expect(control?.value).toBe(String(expected));
    rendered.cleanup();
  });

  test.each(['SubmitWeeklyUpdate','SubmitTimesheet','SubmitProjectStatus','SubmitAiUsage','SubmitProjectRequest'])('blocks review with an announced validation summary for %s', (intentKey) => {
    const rendered=renderIntent(intentKey);
    if(intentKey==='SubmitWeeklyUpdate'||intentKey==='SubmitProjectStatus'){
      setInputValue(rendered.container.querySelector('textarea') as HTMLTextAreaElement,'');
    }else if(intentKey==='SubmitTimesheet'){
      rendered.container.querySelectorAll<HTMLInputElement>('input[aria-label^="Day "]').forEach((input)=>setInputValue(input,'0'));
    }else if(intentKey==='SubmitAiUsage'){
      setInputValue(rendered.container.querySelector('input[type="number"]') as HTMLInputElement,'0');
    }else{
      setInputValue(rendered.container.querySelector('input:not([type])') as HTMLInputElement,'');
    }
    const review=Array.from(rendered.container.querySelectorAll('button')).find((button)=>button.textContent==='Review submission');
    expect(review?.disabled).toBe(true);
    expect(rendered.container.querySelector('[role="alert"]')?.textContent?.length).toBeGreaterThan(10);
    rendered.cleanup();
  });

  test('blocks invalid AI budget review with an announced validation summary', () => {
    const rendered=renderIntent('RequestAiBudget');
    setInputValue(rendered.container.querySelector('input[type="number"]') as HTMLInputElement,'0');
    const review=Array.from(rendered.container.querySelectorAll('button')).find((button)=>button.textContent==='Review request');
    expect(review?.disabled).toBe(true);
    expect(rendered.container.querySelector('[role="alert"]')?.textContent).toContain('positive amount');
    rendered.cleanup();
  });

  test.each([
    ['SubmitWeeklyUpdate','select','Contract Intelligence','Customer Service Copilot','Publish weekly update'],
    ['SubmitTimesheet','select','Contract Intelligence','Customer Service Copilot','Submit timesheet'],
    ['SubmitProjectStatus','select','Contract Intelligence','Customer Service Copilot','Submit status report'],
    ['SubmitAiUsage','select','Contract Intelligence','Customer Service Copilot','Submit usage record'],
    ['SubmitProjectRequest','input:not([type])','Changed project request','Supply Chain Exception Agent','Submit project request']
  ])('preserves edits and resets %s after receipt', (intentKey, selector, changed, initial, confirmLabel) => {
    const rendered=renderIntent(String(intentKey));
    setInputValue(rendered.container.querySelector(String(selector)) as HTMLInputElement|HTMLSelectElement,String(changed));
    clickButton(rendered.container,'Review submission');
    expect(rendered.container.textContent).toContain(String(changed));
    clickButton(rendered.container,'Edit');
    expect((rendered.container.querySelector(String(selector)) as HTMLInputElement|HTMLSelectElement).value).toBe(String(changed));
    clickButton(rendered.container,'Review submission');
    clickButton(rendered.container,String(confirmLabel));
    expect(rendered.container.querySelector('[role="status"]')).not.toBeNull();
    clickButton(rendered.container,'Create another');
    expect((rendered.container.querySelector(String(selector)) as HTMLInputElement|HTMLSelectElement).value).toBe(String(initial));
    rendered.cleanup();
  });

  test('preserves AI budget edits through review and resets after receipt', () => {
    const rendered=renderIntent('RequestAiBudget');
    const amount=rendered.container.querySelector('input[type="number"]') as HTMLInputElement;
    const model=rendered.container.querySelector('select[aria-label="AI budget model"]') as HTMLSelectElement;
    setInputValue(amount,'91000'); setInputValue(model,'GPT-5 mini');
    clickButton(rendered.container,'Review request');
    expect(rendered.container.textContent).toContain('$91,000'); expect(rendered.container.textContent).toContain('GPT-5 mini');
    clickButton(rendered.container,'Edit');
    expect((rendered.container.querySelector('input[type="number"]') as HTMLInputElement).value).toBe('91000');
    clickButton(rendered.container,'Review request'); clickButton(rendered.container,'Submit request');
    expect(rendered.container.querySelector('[role="status"]')).not.toBeNull();
    clickButton(rendered.container,'Edit another request');
    expect((rendered.container.querySelector('input[type="number"]') as HTMLInputElement).value).toBe('75000');
    expect((rendered.container.querySelector('select[aria-label="AI budget model"]') as HTMLSelectElement).value).toBe('GPT-5');
    rendered.cleanup();
  });

  test('renders goal progress as D3 pies and updates values with the objective', () => {
    const rendered = renderIntent('GetMyGoalContributions');
    expect(rendered.container.querySelectorAll('svg[aria-label$="% complete"]')).toHaveLength(4);
    expect(rendered.container.querySelector('svg[aria-label="Production experiences: 63% complete"]')).not.toBeNull();
    expect(rendered.container.querySelector('svg[aria-label="Pilot exit evidence: 68% complete"]')).not.toBeNull();
    setInputValue(rendered.container.querySelector('select[aria-label="Strategic objective"]') as HTMLSelectElement, 'productivity');
    expect(rendered.container.querySelector('svg[aria-label="Resolution time: 74% complete"]')).not.toBeNull();
    expect(rendered.container.querySelector('svg[aria-label="Adoption review: 46% complete"]')).not.toBeNull();
    expect(rendered.container.querySelectorAll('svg[aria-label$="% complete"] path')).toHaveLength(8);
    rendered.cleanup();
  });

  test('redraws portfolio AI spend charts for each selected metric', () => {
    const rendered = renderIntent('GetPortfolioAiSpend');
    const metric = rendered.container.querySelector('select[aria-label="AI spend metric"]') as HTMLSelectElement;
    expect(rendered.container.querySelector('svg[aria-label="Cost treemap by project"]')).not.toBeNull();
    expect(rendered.container.querySelector('svg[aria-label="Cost trend"]')).not.toBeNull();
    setInputValue(metric, 'tokens');
    expect(rendered.container.querySelector('svg[aria-label="Token volume treemap by project"]')).not.toBeNull();
    expect(rendered.container.querySelector('svg[aria-label="Token volume trend"]')).not.toBeNull();
    expect(rendered.container.textContent).toContain('Customer Service drives token volume');
    setInputValue(metric, 'unit');
    expect(rendered.container.querySelector('svg[aria-label="Unit cost treemap by project"]')).not.toBeNull();
    expect(rendered.container.querySelector('svg[aria-label="Unit cost trend"]')).not.toBeNull();
    expect(rendered.container.textContent).toContain('portfolio unit cost is falling');
    rendered.cleanup();
  });

  test('renders portfolio capacity as a weighted D3 Sankey', () => {
    const rendered = renderIntent('GetPortfolioCapacity');
    const chart = rendered.container.querySelector('svg[aria-label="Portfolio capacity Sankey from available supply through role demand to projects"]');
    expect(chart).not.toBeNull();
    expect(chart?.querySelectorAll('path')).toHaveLength(6);
    expect(chart?.querySelectorAll('rect')).toHaveLength(5);
    expect(rendered.container.textContent).toContain('8.4 FTE available');
    rendered.cleanup();
  });

  test('uses green approved and red declined pills in the approval inbox', () => {
    const rendered = renderIntent('GetApprovalInbox');
    clickButton(rendered.container, 'Review');
    setInputValue(rendered.container.querySelector('input[aria-label="Proposed allocation"]') as HTMLInputElement, '20');
    clickButton(rendered.container, 'Approve');
    expect(rendered.container.querySelector('[data-decision="approved"][data-tone="success"]')).not.toBeNull();
    clickButton(rendered.container, 'Confirm decision');
    clickButton(rendered.container, 'Back to queue');
    expect(rendered.container.querySelector('[data-decision="approved"][data-tone="success"]')).not.toBeNull();
    clickButton(rendered.container, 'Review');
    clickButton(rendered.container, 'Reject');
    expect(rendered.container.querySelector('[data-decision="rejected"][data-tone="danger"]')).not.toBeNull();
    const rationale = rendered.container.querySelector('textarea[aria-label="Decision rationale"]') as HTMLTextAreaElement;
    const confirm = Array.from(rendered.container.querySelectorAll('button')).find((button) => button.textContent === 'Confirm decision');
    expect(confirm?.disabled).toBe(true);
    setInputValue(rationale, 'No');
    expect(confirm?.disabled).toBe(true);
    expect(rendered.container.textContent).toContain('Enter at least 3 characters');
    setInputValue(rationale, 'No fit');
    expect(confirm?.disabled).toBe(false);
    clickButton(rendered.container, 'Confirm decision');
    expect(rendered.container.querySelector('[role="status"][data-decision="rejected"][data-tone="danger"]')).not.toBeNull();
    clickButton(rendered.container, 'Back to queue');
    expect(rendered.container.querySelector('[data-decision="rejected"][data-tone="danger"]')).not.toBeNull();
    rendered.cleanup();
  });

  test.each(PROJECT_INTENT_CATALOG.filter((definition) => getInlineOperation(definition.key) === 'information').map((definition) => [definition.key]))('renders a useful default information state for %s', (intentKey) => {
    const rendered = renderIntent(String(intentKey));
    const layout = rendered.container.querySelector<HTMLElement>('[data-layout]');
    expect(layout).not.toBeNull();
    expect(layout?.textContent?.trim().length || layout?.querySelectorAll('svg, button').length).toBeGreaterThan(0);
    expect(rendered.container.querySelector('[role="alert"]')).toBeNull();
    rendered.cleanup();
  });

  test('changes My Work records, charts, and selected evidence through every retained control', () => {
    const summary = renderIntent('GetMyWorkSummary');
    const weeklyStatus = Array.from(summary.container.querySelectorAll('button')).find((button) => button.textContent?.includes('Weekly status'));
    act(() => { weeklyStatus?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(summary.container.textContent).toContain('Weekly statusSelected evidence');
    setInputValue(summary.container.querySelector('select[aria-label="Priority filter"]') as HTMLSelectElement, 'critical');
    expect(summary.container.textContent).toContain('Evaluation review');
    expect(Array.from(summary.container.querySelectorAll('button')).some((button) => button.textContent?.includes('Weekly status'))).toBe(false);
    summary.cleanup();

    const tasks = renderIntent('GetMyTasks');
    expect(tasks.container.querySelectorAll('[data-task-id]')).toHaveLength(6);
    expect(Array.from(tasks.container.querySelectorAll('[data-task-group]')).map((item)=>item.getAttribute('data-task-group'))).toEqual(['Blocked','In progress','Ready']);
    expect(tasks.container.textContent).toContain('Pradeep Gupta');
    expect(tasks.container.textContent).toContain('Megan Bowen');
    expect(tasks.container.textContent).toContain('Joni Sherman');
    expect(tasks.container.textContent).toContain('Diego Siciliani');
    expect(tasks.container.textContent).toContain('Lee Gu');
    setInputValue(tasks.container.querySelector('select[aria-label="Task grouping"]') as HTMLSelectElement, 'project');
    expect(Array.from(tasks.container.querySelectorAll('[data-task-group]')).map((item)=>item.textContent?.match(/^(.+?) \/ (\d+)/)?.slice(1))).toEqual([['Customer Service Copilot','3'],['Contract Intelligence','2'],['Knowledge Discovery','1']]);
    setInputValue(tasks.container.querySelector('select[aria-label="Task grouping"]') as HTMLSelectElement, 'due');
    expect(Array.from(tasks.container.querySelectorAll('[data-task-group]')).map((item)=>item.textContent?.match(/^(.+?) \/ (\d+)/)?.slice(1))).toEqual([['Overdue','1'],['Today','2'],['This week','2'],['Next week','1']]);
    clickButton(tasks.container, 'Blocked only');
    expect(tasks.container.querySelectorAll('[data-task-id]')).toHaveLength(2);
    expect(tasks.container.textContent).toContain('Resolve evaluation dataset quality');
    expect(tasks.container.textContent).toContain('Close security exception');
    expect(tasks.container.textContent).not.toContain('Draft pilot exit narrative');
    tasks.cleanup();

    const capacity = renderIntent('GetMyCapacity');
    const committedBars = capacity.container.querySelector('svg')?.innerHTML;
    clickButton(capacity.container, 'Forecast');
    expect(capacity.container.querySelector('svg')?.innerHTML).not.toBe(committedBars);
    capacity.cleanup();

    const goals = renderIntent('GetMyGoalContributions');
    clickButton(goals.container, 'Include indirect');
    expect(goals.container.textContent).toContain('Control mentoring');
    goals.cleanup();
  });

  test('changes Project information geometry and evidence through every retained control', () => {
    const health = renderIntent('GetProjectHealth');
    clickButton(health.container, 'risk');
    expect(health.container.textContent).toContain('risk: evaluation readiness');
    health.cleanup();

    const timeline = renderIntent('GetProjectTimeline');
    expect(timeline.container.querySelectorAll('[data-layout="critical-path-gantt"] > div:nth-child(2) > div')).toHaveLength(4);
    clickButton(timeline.container, 'Critical only');
    expect(timeline.container.textContent).not.toContain('Production launch');
    timeline.cleanup();

    const risk = renderIntent('GetProjectRisks');
    clickButtonByLabel(risk.container, 'Risk cell 1');
    expect(risk.container.textContent).toContain('Platform dependency');
    risk.cleanup();

    const budget = renderIntent('GetProjectBudget');
    const defaultWaterfall = budget.container.querySelector('svg')?.innerHTML;
    setInputValue(budget.container.querySelector('select[aria-label="Budget scenario"]') as HTMLSelectElement, 'proposed');
    expect(budget.container.querySelector('svg')?.innerHTML).not.toBe(defaultWaterfall);
    clickButton(budget.container, 'Variance only');
    expect(budget.container.querySelectorAll('svg rect')).toHaveLength(2);
    budget.cleanup();

    const comparison = renderIntent('CompareProjects');
    clickButton(comparison.container, 'capacity');
    expect(comparison.container.textContent).toContain('Highlighted dimension: capacity');
    comparison.cleanup();
  });

  test('changes Portfolio chart data, detail, filters, and no-match state through every retained control', () => {
    const health = renderIntent('GetPortfolioHealth');
    const bubbles = health.container.querySelectorAll('g[role="button"]');
    act(() => { bubbles[2].dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(health.container.textContent).toContain('Contract Intelligence');
    setInputValue(health.container.querySelector('select[aria-label="Portfolio phase"]') as HTMLSelectElement, 'discover');
    expect(health.container.querySelector('[role="status"]')?.textContent).toContain('No projects match');
    health.cleanup();

    const alignment = renderIntent('GetStrategicAlignment');
    clickButton(alignment.container, 'Include unaligned');
    expect(alignment.container.textContent).toContain('Supplier Insights / unaligned');
    alignment.cleanup();

    const spend = renderIntent('GetPortfolioAiSpend');
    clickButton(spend.container, 'By model');
    expect(spend.container.querySelector('svg[aria-label="Cost treemap by model"]')).not.toBeNull();
    spend.cleanup();

    const risks = renderIntent('GetPortfolioRiskExposure');
    expect(risks.container.querySelectorAll('svg line')).toHaveLength(3);
    clickButton(risks.container, 'Dependencies');
    expect(risks.container.querySelectorAll('svg line')).toHaveLength(0);
    risks.cleanup();
  });

  test('shows the shared information error fallback', () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const Broken: React.FunctionComponent = () => { throw new Error('chart failed'); };
    act(() => { root.render(<InformationErrorBoundary><Broken/></InformationErrorBoundary>); });
    expect(container.querySelector('[data-layout="information-error"][role="alert"]')).not.toBeNull();
    expect(container.textContent).toContain('Unable to render this view');
    act(() => { root.unmount(); });
    consoleError.mockRestore();
  });

  test('dynamically explores all thirty operational scenarios by category and search', () => {
    const rendered = renderIntent('ExploreAgentCapabilities');
    expect(rendered.container.querySelector('[data-layout="capability-explorer-inline"]')).not.toBeNull();
    expect(rendered.container.querySelectorAll('[data-scenario-key]')).toHaveLength(30);
    expect(rendered.container.textContent).toContain('My Work (6)');
    expect(rendered.container.textContent).toContain('Project delivery (12)');
    expect(rendered.container.textContent).toContain('Portfolio decisions (7)');
    expect(rendered.container.textContent).toContain('Approvals (5)');
    clickButton(rendered.container, 'Project delivery (12)');
    expect(rendered.container.querySelectorAll('[data-scenario-key]')).toHaveLength(12);
    setInputValue(rendered.container.querySelector('input[aria-label="Search scenarios"]') as HTMLInputElement, 'budget');
    expect(rendered.container.querySelectorAll('[data-scenario-key]')).toHaveLength(2);
    setInputValue(rendered.container.querySelector('input[aria-label="Search scenarios"]') as HTMLInputElement, 'no such outcome');
    expect(rendered.container.querySelector('[role="status"]')?.textContent).toContain('No scenarios match');
    clickButton(rendered.container, 'Reset filters');
    expect(rendered.container.querySelectorAll('[data-scenario-key]')).toHaveLength(30);
    rendered.cleanup();
  });

  test('selects a scenario, copies its prompt, and keeps previews action-safe', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const rendered = renderIntent('ExploreAgentCapabilities', { scenarioKey: 'SubmitWeeklyUpdate' });
    expect(rendered.container.querySelector('[data-scenario-key="SubmitWeeklyUpdate"][aria-current="true"]')).not.toBeNull();
    expect(rendered.container.querySelector('[data-layout="weekly-update-form"]')).not.toBeNull();
    clickButton(rendered.container, 'Review submission');
    expect(rendered.container.querySelector('[data-layout="weekly-update-form"]')).not.toBeNull();
    await act(async () => { clickButton(rendered.container, 'Copy prompt'); });
    expect(writeText).toHaveBeenCalledWith('Draft my weekly update for Customer Service Copilot.');
    expect(rendered.container.textContent).toContain('Prompt copied');
    expect(rendered.container.textContent).toContain('Demo preview - no action applied');
    rendered.cleanup();
  });

  test('shows clipboard fallback guidance when prompt copy is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    const rendered = renderIntent('ExploreAgentCapabilities');
    await act(async () => { clickButton(rendered.container, 'Copy prompt'); });
    expect(rendered.container.querySelector('[role="alert"]')?.textContent).toContain('Clipboard access is unavailable');
    rendered.cleanup();
  });

  test('renders an isolated fullscreen gallery with filters, tour, and previous-next navigation', () => {
    const rendered = renderIntent('ExploreAgentCapabilities', { tour: 'featured' }, 'fullscreen');
    expect(rendered.container.querySelector('[data-layout="capability-explorer-fullscreen"]')).not.toBeNull();
    expect(rendered.container.querySelectorAll('[data-scenario-key]')).toHaveLength(10);
    const initial = rendered.container.querySelector('[data-scenario-key][aria-current="true"]')?.getAttribute('data-scenario-key');
    clickButton(rendered.container, 'Next');
    const next = rendered.container.querySelector('[data-scenario-key][aria-current="true"]')?.getAttribute('data-scenario-key');
    expect(next).not.toBe(initial);
    expect(rendered.container.querySelector('select[aria-label="Filter by audience"]')).not.toBeNull();
    expect(rendered.container.querySelector('[data-layout="capability-preview-viewport"]')).not.toBeNull();
    expect(rendered.container.querySelector('[data-layout="capability-preview"]')).not.toBeNull();
    rendered.cleanup();
  });

  test('ignores full-screen-only tour filtering in inline mode', () => {
    const rendered = renderIntent('ExploreAgentCapabilities', { tour: 'featured' }, 'inline');
    expect(rendered.container.querySelectorAll('[data-scenario-key]')).toHaveLength(30);
    expect(rendered.container.querySelector('select[aria-label="Filter by audience"]')).toBeNull();
    expect(rendered.container.querySelector('[data-layout="capability-preview-viewport"]')).toBeNull();
    rendered.cleanup();
  });

  test.each(PROJECT_INTENT_CATALOG.filter((definition) => definition.education).map((definition) => [definition.key]))('renders a safe catalog preview for %s', (intentKey) => {
    const definition = PROJECT_INTENT_CATALOG.find((item) => item.key === intentKey)!;
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => { root.render(<CapabilityPreview definition={definition} properties={definition.education!.previewProperties} compact={false}/>); });
    expect(container.querySelector('[data-layout="capability-preview"]')).not.toBeNull();
    expect(container.textContent).toContain('Demo preview - no action applied');
    expect(container.querySelector('[data-intent]')).toBeNull();
    expect(container.querySelector('[data-layout]:not([data-layout="capability-preview"])')).not.toBeNull();
    act(() => { root.unmount(); });
  });

  test('shows the capability explorer error fallback', () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const Broken: React.FunctionComponent = () => { throw new Error('explorer failed'); };
    act(() => { root.render(<CapabilityExplorerErrorBoundary><Broken/></CapabilityExplorerErrorBoundary>); });
    expect(container.querySelector('[data-layout="capability-explorer-error"][role="alert"]')).not.toBeNull();
    expect(container.textContent).toContain('Unable to load the scenario guide');
    act(() => { root.unmount(); });
    consoleError.mockRestore();
  });
});
