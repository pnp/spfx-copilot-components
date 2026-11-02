import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import RevenueApp, { type IModelContextSnapshot } from './RevenueApp';
import RevenueThemeProvider from './RevenueThemeProvider';
import { getIntent, type IRevenueProperties, type RevenueIntentKey } from './catalog';
import { getDealStore } from './dealWorkflow';
import { contextRecord } from './copilot';
import { workflowFor, resolveScope } from './operations';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
describe('scoped fullscreen workspace journeys', () => {
  let container: HTMLDivElement;
  let root: Root;
  const publish = jest.fn<Promise<void>, [IModelContextSnapshot]>(() => Promise.resolve());
  const followUp = jest.fn<Promise<boolean>, [string, IModelContextSnapshot]>(() => Promise.resolve(true));
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    publish.mockClear();
    followUp.mockClear();
    getDealStore().reset();
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
  async function render(key: RevenueIntentKey, properties: IRevenueProperties = {}, mode = 'fullscreen'): Promise<void> {
    await act(async () => root.render(<RevenueThemeProvider targetDocument={document}><RevenueApp definition={getIntent(key)} properties={properties} currentUserName="Megan Bowen" displayMode={mode} onUpdateModelContext={publish} onSendFollowUp={followUp}/></RevenueThemeProvider>));
  }
  function visible(element: Element): boolean {
    for (let current: Element | null = element; current; current = current.parentElement) {
      if (current instanceof HTMLElement && (current.hidden || getComputedStyle(current).display === 'none')) return false;
    }
    return true;
  }
  function control(label: string): HTMLButtonElement {
    const result = Array.from(container.querySelectorAll('button')).find(button => visible(button) && (button.getAttribute('aria-label') === label || button.textContent === label));
    if (!result) throw new Error(`Missing visible control ${label}`);
    return result;
  }
  async function click(label: string): Promise<void> { await act(async () => control(label).click()); }
  async function set(label: string, value: string): Promise<void> {
    const input = Array.from(container.querySelectorAll('input')).find(item => item.getAttribute('aria-label') === label && visible(item));
    if (!input) throw new Error(`Missing visible input ${label}`);
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (!setter) throw new Error('Input value setter unavailable');
    await act(async () => { setter.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); });
  }
  function latest(): IModelContextSnapshot { return publish.mock.calls[publish.mock.calls.length - 1][0]; }

  test('success planning expands into its deal room and never follows navigation into My Deals', async () => {
    const properties = { opportunityId: 'ZDR-2043' };
    await render('PlanCustomerSuccessHandoff', properties, 'inline');
    await render('PlanCustomerSuccessHandoff', properties);
    expect(container.querySelector('h1')?.textContent).toBe('Deal Room');
    expect(latest().intent).toBe('PlanCustomerSuccessHandoff');
    expect(contextRecord(latest().resolvedScope).opportunityId).toBe('ZDR-2043');
    await click('My Deals');
    expect(latest().intent).toBe('GetMyRevenuePriorities');
    expect(latest().workflowStage).toBe('workspace-home');
    const oldTask = container.querySelector('[data-layout="PlanCustomerSuccessHandoff-business-draft"]');
    if (!oldTask) throw new Error('The origin draft should remain mounted for explicit resume');
    expect(visible(oldTask)).toBe(false);
    expect(container.textContent).not.toContain('Your Copilot task');
    expect(container.textContent).not.toContain('Opened from');
    await click('Open Contoso Global Expansion');
    expect(latest().intent).toBe('BuildAccountBrief');
    expect(contextRecord(latest().resolvedScope).opportunityId).toBe('ZDR-2042');
  });

  test('edited draft values survive expansion, workspace navigation and explicit resume', async () => {
    const properties = { opportunityId: 'ZDR-2042' };
    const workflow = workflowFor('BuildValueCase', resolveScope(properties));
    if (!workflow) throw new Error('Value-case workflow unavailable');
    await render('BuildValueCase', properties, 'inline');
    await click('Edit business fields');
    await set(workflow.fields[0].label, '12345');
    await render('BuildValueCase', properties);
    expect(contextRecord(latest().draft)[workflow.fields[0].name]).toBe('12345');
    await click('My Deals');
    expect(latest().workflowStage).toBe('workspace-home');
    await click('Deal Room');
    await click('Resume Value case / ZDR-2042');
    expect(contextRecord(latest().draft)[workflow.fields[0].name]).toBe('12345');
    expect(contextRecord(latest().workspaceState)).toMatchObject({ lens: 'deal-room', task: 'BuildValueCase', view: 'focused-work' });
  });

  test('commercial continuation opens an intake with the exact edited scenario, not a copied reference offer', async () => {
    const properties = { opportunityId: 'ZDR-2043', quantity: 1000, termMonths: 24, discount: 8, services: 150000, probability: .65 };
    await render('SimulateCommercialOffer', properties, 'inline');
    await set('Licensed users', '2000');
    await render('SimulateCommercialOffer', properties);
    expect(contextRecord(contextRecord(latest().commercial).inputs).quantity).toBe('2000');
    await click('Continue to Submit a deal');
    expect(latest().intent).toBe('SubmitDealRequest');
    expect(contextRecord(contextRecord(latest().inlineDealWorkflow).draft)).toMatchObject({ accountId: 'ACC-002', quantity: '2000', termMonths: '24', discount: '8', services: '150000', probability: '0.65' });
    expect(contextRecord(latest().workspaceState).lens).toBe('my-deals');
    expect(getDealStore().getSnapshot().requests).toHaveLength(2);
  });

  test.each([
    ['DiscoverAccountOpportunity', 'my-deals', 'countryMap'],
    ['ExplorePipelineQuality', 'revenue-command', 'countryMap'],
    ['ExplorePipelineFlow', 'revenue-command', 'revenueFlow'],
    ['ExploreApprovalFlow', 'commercial-desk', 'revenueFlow']
  ] satisfies [RevenueIntentKey, string, string][])('%s has its actual graphic in the matching fullscreen workspace', async (key, lens, state) => {
    await render(key, key === 'ExplorePipelineQuality' ? { mapMetric: 'spend' } : {});
    expect(contextRecord(latest().workspaceState).lens).toBe(lens);
    expect(latest()[state]).toBeDefined();
    expect(container.querySelectorAll('svg path').length).toBeGreaterThan(0);
    expect(contextRecord(latest().resolvedScope)).not.toHaveProperty('opportunityId');
  });

  test('commercial landing shows a queue, then opens the exact independent request without deciding it', async () => {
    await render('PlanCustomerSuccessHandoff', { opportunityId: 'ZDR-2043' });
    await click('Commercial Desk');
    expect(latest().workflowStage).toBe('workspace-home');
    expect(latest().visibleRecords).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'ZM-1001' }), expect.objectContaining({ id: 'ZM-1002' })]));
    await click('Review ZM-1002');
    expect(latest().intent).toBe('ReviewDealApproval');
    expect(contextRecord(contextRecord(latest().inlineDealWorkflow).selectedRequest).id).toBe('ZM-1002');
    const label = Array.from(container.querySelectorAll('label')).find(item => visible(item) && item.textContent?.indexOf('Simulated reviewer role') === 0);
    const reviewer = document.getElementById(label?.htmlFor || '');
    if (!(reviewer instanceof HTMLSelectElement)) throw new Error('Missing independent reviewer control');
    expect(reviewer.value).toBe('Sales manager');
    expect(getDealStore().getSnapshot().requests.find(item => item.id === 'ZM-1002')?.status).toBe('pending');
    expect(Array.from(container.querySelectorAll('button')).some(item => visible(item) && item.textContent === 'Continue to My priorities')).toBe(false);
  });
});
