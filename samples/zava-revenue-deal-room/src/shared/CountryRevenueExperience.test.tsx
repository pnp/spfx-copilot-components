import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import CountryRevenueExperience, { type ICountryRevenueExperienceProps } from './CountryRevenueExperience';
import { OPPORTUNITIES } from './domain';
import { DEMO_COUNTRY_EXPENSES, countryMoney, countryRevenueScope } from './countryRevenue';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe('country experience pointer, keyboard and truthful context', () => {
  let container: HTMLDivElement;
  let root: Root;
  let consoleError: jest.SpyInstance;
  const publish = jest.fn<void, [Readonly<Record<string, unknown>>]>();
  const inspect = jest.fn<void, [string]>();
  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error');
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    publish.mockReset(); inspect.mockReset();
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    try { expect(consoleError).not.toHaveBeenCalled(); } finally { consoleError.mockRestore(); }
  });
  async function render(overrides: Partial<ICountryRevenueExperienceProps> = {}): Promise<void> {
    await act(async () => root.render(<CountryRevenueExperience opportunities={OPPORTUNITIES} period="current" region="all" compact onStateChange={publish} onInspectOpportunity={inspect} {...overrides} />));
  }
  const latest = (): Readonly<Record<string, unknown>> => publish.mock.calls[publish.mock.calls.length - 1][0];
  async function click(label: string): Promise<void> {
    const button = Array.from(container.querySelectorAll('button')).find(item => item.textContent === label);
    if (!button) throw new Error(`Missing button ${label}`);
    await act(async () => button.click());
  }

  it('renders ID-less and no-data land without key warnings across scope and metric changes', async () => {
    for (const region of ['all', 'North America', 'EMEA', 'Asia Pacific', 'Latin America']) {
      await render({ region });
      expect(container.querySelectorAll('svg > path[aria-hidden="true"]').length).toBeGreaterThan(100);
      await click('Recorded spend');
      await click('Opportunity');
    }
    await render({ period: 'next', initialMetric: 'spend' });
    expect(container.querySelectorAll('svg circle')).toHaveLength(0);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('changes between a country choropleth and spending bubbles with no geometry in bounded context', async () => {
    await render();
    expect(latest().stage).toBe('country-overview');
    expect(container.querySelectorAll('svg')).toHaveLength(1);
    expect(JSON.stringify(latest().chart)).toContain('country-choropleth');
    expect(JSON.stringify(latest())).not.toMatch(/coordinates|geometries|arcs/);
    expect(JSON.stringify(latest()).length).toBeLessThan(14000);
    await click('Recorded spend');
    expect(latest().metric).toBe('spend');
    expect(JSON.stringify(latest().chart)).toContain('country-spend-bubbles');
    expect(JSON.stringify(latest().scopedTotals)).toContain('3400000');
    expect(container.querySelectorAll('svg')).toHaveLength(1);
    expect(container.textContent).toContain('Separate recorded expense ledger, not investment or ROI');
  });

  it('presents top-country values as a boxed ranked inset, never geographic annotations', async () => {
    await render();
    const inset = container.querySelector('svg g[aria-label="Top countries"]');
    expect(inset).not.toBeNull();
    expect(inset?.querySelector('rect')).not.toBeNull();
    expect(inset?.querySelector('text')?.textContent).toBe('Top countries');
    expect(inset?.querySelector('title')?.textContent).toContain('ranked summary, not map locations');
    expect(inset?.querySelectorAll('path')).toHaveLength(0);
    await click('Recorded spend');
    expect(container.querySelector('svg g[aria-label="Top countries"] title')?.textContent).toContain('Recorded spend');
  });

  it('selects real country geometry with the keyboard, replaces the overview and inspects only visible original IDs', async () => {
    await render();
    const country = Array.from(container.querySelectorAll<SVGGElement>('svg g[role="button"]')).find(item => item.getAttribute('aria-label')?.startsWith('Open United States:'));
    if (!country) throw new Error('No United States map control');
    await act(async () => country.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(latest().stage).toBe('country-detail');
    expect(latest().selectedCountryId).toBe('US');
    expect(container.querySelectorAll('svg')).toHaveLength(1);
    expect(container.querySelectorAll('article')).toHaveLength(2);
    const visibleIds = latest().visibleOpportunityIds;
    if (!Array.isArray(visibleIds) || typeof visibleIds[0] !== 'string') throw new Error('No visible opportunity IDs');
    await click(`Inspect ${visibleIds[0]}`);
    expect(inspect).toHaveBeenCalledWith(visibleIds[0]);
    const original = OPPORTUNITIES.find(item => item.id === visibleIds[0]);
    expect(original).toBeDefined();
    expect(container.textContent).toContain(original?.name);
    await click('Next');
    expect(latest().page).toBe(2);
    expect(latest().visibleOpportunityIds).not.toEqual(visibleIds);
    await click('All countries');
    expect(latest().stage).toBe('country-overview');
    expect(latest().selectedCountryId).toBeNull();
    expect(latest().visibleOpportunityIds).toEqual([]);
  });

  it('keeps noncompact two-entry recorded expense details without deal-inspection substitutions', async () => {
    await render({ initialMetric: 'spend', compact: false });
    await click('United States');
    expect(latest().selectedCountryId).toBe('US');
    expect(latest().pageCount).toBe(2);
    expect(latest().visibleSpendIds).toEqual(['EXP-US-1', 'EXP-US-2']);
    expect(latest().visibleOpportunityIds).toEqual([]);
    expect(container.querySelectorAll('article')).toHaveLength(2);
    expect(container.textContent).toContain('$480,000');
    await click('Next');
    expect(latest().visibleSpendIds).toEqual(['EXP-US-3']);
    expect(container.querySelectorAll('article')).toHaveLength(1);
    expect(inspect).not.toHaveBeenCalled();
  });

  it('discloses every compact expense one at a time with stable totals, original counts and pager metadata', async () => {
    await render({ initialMetric: 'spend', initialCountryId: 'US' });
    const countryDetail = latest().selectedCountryDetail;
    const totals = latest().scopedTotals;
    const expenseIds = ['EXP-US-1', 'EXP-US-2', 'EXP-US-3'];
    for (let index = 0; index < expenseIds.length; index += 1) {
      const original = DEMO_COUNTRY_EXPENSES.find(item => item.id === expenseIds[index]);
      if (!original) throw new Error(`Missing original expense ${expenseIds[index]}`);
      expect(latest().stage).toBe('country-detail');
      expect(latest().page).toBe(index + 1);
      expect(latest().pageCount).toBe(3);
      expect(latest().visibleRecordOriginalCount).toBe(3);
      expect(latest().visibleSpendIds).toEqual([original.id]);
      expect(latest().visibleExpenses).toEqual([original]);
      expect(latest().visibleOpportunityIds).toEqual([]);
      expect(latest().visibleFields).toContain('one-record detail page');
      expect(latest().selectedCountryDetail).toEqual(countryDetail);
      expect(latest().scopedTotals).toEqual(totals);
      expect(container.querySelectorAll('article')).toHaveLength(1);
      expect(container.textContent).toContain(countryMoney(original.amount));
      expect(container.textContent).toContain('$1,030,000');
      if (index + 1 < expenseIds.length) await click('Next');
    }
    expect(Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Next')?.disabled).toBe(true);
    await click('Previous');
    expect(latest().page).toBe(2);
    expect(latest().visibleSpendIds).toEqual(['EXP-US-2']);
    await click('Opportunity');
    expect(latest().page).toBe(1);
    expect(latest().visibleFields).toContain('two-record detail page');
    expect(container.querySelectorAll('article')).toHaveLength(2);
    expect(inspect).not.toHaveBeenCalled();
  });

  it('shows an honest empty next-quarter recorded-spend state with no bubbles or fictitious ledger rows', async () => {
    await render({ period: 'next', initialMetric: 'spend', initialCountryId: 'GB' });
    expect(container.textContent).toContain('No next-quarter recorded expenses exist');
    expect(latest().stage).toBe('empty-spend');
    expect(latest().chart).toBeNull();
    expect(container.querySelectorAll('svg')).toHaveLength(0);
    expect(container.querySelectorAll('table')).toHaveLength(0);
    expect(container.querySelectorAll('article')).toHaveLength(0);
    expect(latest().visibleSpendIds).toEqual([]);
    expect(latest().visibleRecordOriginalCount).toBe(0);
    expect(latest().pageCount).toBe(1);
    await click('All countries');
    expect(container.textContent).toContain('No recorded spend');
    expect(latest().stage).toBe('empty-spend');
    expect(latest().selectedCountryId).toBeNull();
    expect(container.querySelectorAll('svg')).toHaveLength(0);
  });

  it('keeps opportunity totals and bounded country data when the empty spend overview has no chart', async () => {
    await render({ period: 'next', initialMetric: 'spend' });
    const expected = countryRevenueScope(OPPORTUNITIES, 'next', 'all');
    const totals = latest().scopedTotals;
    expect(latest().stage).toBe('empty-spend');
    expect(latest().selectedCountryId).toBeNull();
    expect(latest().chart).toBeNull();
    expect(latest().page).toBe(1);
    expect(latest().pageCount).toBe(1);
    expect(container.querySelectorAll('svg, table, article')).toHaveLength(0);
    expect(Array.from(container.querySelectorAll('button')).some(button => button.textContent === 'Next')).toBe(false);
    expect(container.textContent).toContain(countryMoney(expected.opportunityValue));
    expect(latest().opportunitySummary).toEqual({
      unit: 'USD', value: expected.opportunityValue, originalRecordCount: expected.opportunities.length,
      countryTotals: expected.countries.map(country => ({
        countryId: country.id, countryName: country.name,
        opportunityValue: country.opportunityValue, opportunityCount: country.opportunityCount
      }))
    });
    expect(latest().visibleOpportunityIds).toEqual([]);
    expect(latest().visibleSpendIds).toEqual([]);
    await click('View opportunities');
    expect(latest().metric).toBe('opportunity');
    expect(latest().stage).toBe('country-overview');
    expect(latest().scopedTotals).toEqual(totals);
    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });

  it('requests parent-controlled current-quarter scope without secretly overriding an unchanged parent period', async () => {
    const changeScope = jest.fn<void, [string, string]>();
    await render({ period: 'next', region: 'EMEA', initialMetric: 'spend', onScopeChange: changeScope });
    await click('Use current quarter');
    expect(changeScope).toHaveBeenCalledWith('current', 'EMEA');
    expect(latest().stage).toBe('empty-spend');
    expect(latest().chart).toBeNull();
    expect(latest().requestedScope).toEqual({ period: 'next', region: 'EMEA' });
    expect(latest().scope).toEqual({ period: 'next', region: 'EMEA', recoveredExplicitly: false, valid: true });
    expect(latest().scopeControl).toBe('parent-controlled');
    expect(latest().scopeChangeRequest).toEqual({ period: 'current', region: 'EMEA' });
    await render({ period: 'current', region: 'EMEA', initialMetric: 'spend', onScopeChange: changeScope });
    expect(latest().stage).toBe('country-overview');
    expect(latest().requestedScope).toEqual({ period: 'current', region: 'EMEA' });
    expect(latest().scope).toEqual({ period: 'current', region: 'EMEA', recoveredExplicitly: false, valid: true });
    expect(latest().scopeChangeRequest).toBeNull();
    expect(container.textContent).toContain('$1,120,000');
  });

  it('allows explicit local current-quarter recovery only without the optional parent callback', async () => {
    await render({ period: 'next', region: 'EMEA', initialMetric: 'spend' });
    await click('Use current quarter');
    expect(latest().scopeControl).toBe('internal-recovery');
    expect(latest().requestedScope).toEqual({ period: 'next', region: 'EMEA' });
    expect(latest().scope).toEqual({ period: 'current', region: 'EMEA', recoveredExplicitly: true, valid: true });
    expect(container.textContent).toContain('$1,120,000');
    await render({ period: 'next', region: 'EMEA', initialMetric: 'spend', onScopeChange: jest.fn() });
    expect(latest().stage).toBe('empty-spend');
    expect(latest().scope).toEqual({ period: 'next', region: 'EMEA', recoveredExplicitly: false, valid: true });
  });

  it('routes unknown-scope recovery through the parent callback instead of an internal current/all override', async () => {
    const changeScope = jest.fn<void, [string, string]>();
    await render({ period: 'bad', region: 'bad', onScopeChange: changeScope });
    await click('Use current quarter / all regions');
    expect(changeScope).toHaveBeenCalledWith('current', 'all');
    expect(latest().stage).toBe('recovery');
    expect(latest().chart).toBeNull();
    expect(latest().requestedScope).toEqual({ period: 'bad', region: 'bad' });
    expect(latest().scope).toEqual({ period: 'bad', region: 'bad', recoveredExplicitly: false, valid: false });
    expect(latest().scopeChangeRequest).toEqual({ period: 'current', region: 'all' });
  });

  it.each(['ZZ', 'us'])('requires explicit recovery for unknown ISO2 country %s', async countryId => {
    await render({ initialCountryId: countryId });
    expect(latest().stage).toBe('recovery');
    expect(latest().selectedCountryId).toBe(countryId);
    expect(container.querySelectorAll('svg')).toHaveLength(0);
    expect(container.textContent).toContain('No substitute country has been selected');
    await click('Show country overview');
    expect(latest().stage).toBe('country-overview');
    expect(latest().selectedCountryId).toBeNull();
  });

  it('does not substitute a country when region changes and offers explicit scope recovery', async () => {
    await render({ initialCountryId: 'DE', region: 'North America' });
    expect(latest().stage).toBe('recovery');
    expect(latest().selectedCountryId).toBe('DE');
    await render({ period: 'bad', region: 'bad' });
    expect(latest().stage).toBe('recovery');
    expect(container.querySelector('[aria-label="Recovery period"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Recovery region"]')).not.toBeNull();
    await click('Use current quarter / all regions');
    expect(latest().stage).toBe('country-overview');
    expect(latest().scope).toEqual({ period: 'current', region: 'all', recoveredExplicitly: true, valid: true });
  });

  it('deduplicates identical context when the parent rerenders with a new callback', async () => {
    await render();
    const calls = publish.mock.calls.length;
    await render({ onStateChange: state => publish(state) });
    expect(publish.mock.calls.length).toBe(calls);
  });
});
