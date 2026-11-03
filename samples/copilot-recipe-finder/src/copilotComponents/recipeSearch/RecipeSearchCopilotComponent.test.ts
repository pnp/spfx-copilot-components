const mockSearch = jest.fn();
const mockDisplayMode = jest.fn();

jest.mock('@microsoft/sp-copilot-component', () => ({ BaseCopilotComponent: class {
  protected async onTeardown(): Promise<void> { return undefined; }
  protected requestDisplayModeAsync(mode: string): Promise<{ mode: string }> { return mockDisplayMode(mode); }
} }));
jest.mock('./RecipeSearchCopilotComponent.module.scss', () => ({
  recipeSearch: 'recipe', header: 'header', brand: 'brand',
  search: 'search', results: 'results', card: 'card', cardBody: 'card-body',
  photo: 'photo', photoFallback: 'photo-fallback', detail: 'detail', cookTabs: 'tabs',
  cardTitle: 'card-title', muted: 'muted', completed: 'completed', searchControls: 'search-controls',
  searchButton: 'search-button', status: 'status', errorBody: 'error-body', recipeHeading: 'recipe-heading',
  cookLayout: 'cook-layout', recipeSummary: 'recipe-summary', checklist: 'checklist', footer: 'footer'
}));
jest.mock('./RecipeProviderFactory', () => ({ createRecipeProvider: jest.fn().mockImplementation(() => ({
  info: { name: 'Sample recipes', attribution: 'Sample recipe data for local testing' },
  search: mockSearch
})) }));

import { act } from 'react';
import { webDarkTheme } from '@fluentui/react-components';
import RecipeSearchCopilotComponent from './RecipeSearchCopilotComponent';
import toolPropertiesSchema from './RecipeSearchCopilotComponentProperties';
import type { IRecipe } from './RecipeModels';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
Object.defineProperty(window, 'ResizeObserver', { writable: true, value: class {
  public observe(): void { return; }
  public unobserve(): void { return; }
  public disconnect(): void { return; }
} });

const recipe: IRecipe = {
  id: '52771', title: 'Penne <script>bad()</script>', sourceUrl: 'https://recipes.example.test/recipe/52771',
  image: { alt: 'Penne', rightsConfirmed: false },
  ingredients: [{ name: 'Pasta', measure: '1 cup' }], instructions: ['Boil pasta.', 'Add sauce.'], dietaryLabels: []
};

class TestComponent extends RecipeSearchCopilotComponent {
  public paint(): void { this.render(); }
  public cleanup(): void { this.onDispose(); }
  public teardown(): Promise<void> { return this.onTeardown('test'); }
  public get query(): string { return this.properties.query; }
}

describe('recipe cook experience', () => {
  let component: TestComponent;
  let root: HTMLDivElement;
  let host: { theme: string; displayMode: string; availableDisplayModes?: string[] };

  beforeEach(() => {
    mockSearch.mockReset().mockResolvedValue([recipe]);
    mockDisplayMode.mockReset().mockImplementation((mode: string) => Promise.resolve({ mode }));
    component = new TestComponent();
    root = document.createElement('div');
    document.body.appendChild(root);
    host = { theme: 'light', displayMode: 'inline' };
    Object.defineProperty(component, 'context', { value: { domElement: root } });
    Object.defineProperty(component, 'hostContext', { value: host });
    Object.defineProperty(component, 'properties', { value: { query: 'Arrabiata' } });
  });

  afterEach(() => {
    act(() => component.cleanup());
    root.remove();
  });

  async function load(): Promise<void> {
    await act(async () => { component.paint(); });
  }

  function click(selector: string): void {
    act(() => { root.querySelector<HTMLElement>(selector)!.click(); });
  }

  function editQuery(value: string): void {
    act(() => {
      const input = root.querySelector<HTMLInputElement>('[name="query"]')!;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  it('exports a Copilot-compatible query schema without min/max bounds', () => {
    expect(toolPropertiesSchema).toMatchObject({ type: 'object', required: ['query'] });
    const schema = toolPropertiesSchema as { properties: { query: Record<string, unknown> } };
    expect(schema.properties.query).toEqual({ type: 'string', description: expect.any(String) });
  });

  it('renders provider text safely and withholds unconfirmed images', async () => {
    await load();
    expect(root.textContent).toContain(recipe.title);
    expect(root.textContent).toContain('Sample recipe data for local testing');
    expect(root.textContent).not.toContain('TheMealDB');
    expect(root.querySelector('script')).toBeNull();
    expect(root.querySelector('img')).toBeNull();
    expect(root.textContent).toContain('Photo unavailable');
    click('[data-recipe]');
    expect(root.textContent).toContain('View recipe on Sample recipes');
  });

  it('shows development-authorized provider photos in search results and cook view without CC metadata', async () => {
    const url = 'https://images.example.test/test.jpg';
    mockSearch.mockResolvedValue([{ ...recipe, image: {
      url, alt: 'Penne', rightsConfirmed: true, permissionBasis: 'provider-terms'
    } }]);
    await load();
    expect(root.querySelector<HTMLImageElement>('[role="article"] img')!.src).toBe(url);
    expect(root.textContent).not.toContain('Photo unavailable');
    click('[data-recipe]');
    expect(root.querySelector<HTMLImageElement>('article img')!.src).toBe(url);
    expect(root.querySelector<HTMLImageElement>('article img')!.alt).toBe('Penne');
    expect(root.textContent).toContain('Sample recipe data for local testing');
  });

  it('preserves ingredient and step checks across navigation and host theme changes', async () => {
    await load();
    click('[data-recipe]');
    click('[data-check]');
    click('[data-tab="method"]');
    click('[data-check*="step"]');
    click('[data-action="back"]');
    click('[data-recipe]');
    host.theme = 'dark';
    host.displayMode = 'fullscreen';
    act(() => component.paint());
    expect(root.querySelector<HTMLInputElement>('[data-check]')!.checked).toBe(true);
    expect(root.querySelector<HTMLInputElement>('[data-check*="step"]')!.checked).toBe(true);
    expect(getComputedStyle(root.querySelector<HTMLElement>('.fui-FluentProvider')!).getPropertyValue('--colorNeutralBackground1').trim()).toBe(webDarkTheme.colorNeutralBackground1);
    expect(mockSearch).toHaveBeenCalledTimes(1);
  });

  it('shows only the selected panel and preserves checks when switching tabs', async () => {
    await load();
    click('[data-recipe]');
    expect(root.querySelector<HTMLElement>('[id$="-ingredients-panel"]')!.hidden).toBe(false);
    expect(root.querySelector<HTMLElement>('[id$="-method-panel"]')!.hidden).toBe(true);
    click('[data-check]');
    click('[data-tab="method"]');
    expect(root.querySelector<HTMLElement>('[id$="-ingredients-panel"]')!.hidden).toBe(true);
    expect(root.querySelector<HTMLElement>('[id$="-method-panel"]')!.hidden).toBe(false);
    expect(root.querySelector('[data-tab="method"]')!.getAttribute('aria-selected')).toBe('true');
    click('[data-check*="step"]');
    click('[data-tab="ingredients"]');
    expect(root.querySelector<HTMLInputElement>('[data-check]')!.checked).toBe(true);
    click('[data-tab="method"]');
    expect(root.querySelector<HTMLInputElement>('[data-check*="step"]')!.checked).toBe(true);
    host.theme = 'dark';
    act(() => component.paint());
    expect(root.querySelector<HTMLElement>('[id$="-ingredients-panel"]')!.hidden).toBe(true);
    expect(root.querySelector<HTMLElement>('[id$="-method-panel"]')!.hidden).toBe(false);
    expect(mockSearch).toHaveBeenCalledTimes(1);
  });

  it('selects Fluent tabs on focus and connects them to their panels', async () => {
    await load();
    click('[data-recipe]');
    for (const expected of ['method', 'ingredients']) {
      const selected = root.querySelector<HTMLButtonElement>(`[data-tab="${expected}"]`)!;
      act(() => { selected.focus(); });
      expect(selected.getAttribute('aria-selected')).toBe('true');
      expect(document.activeElement).toBe(selected);
      const panel = document.getElementById(selected.getAttribute('aria-controls')!)!;
      expect(panel.hidden).toBe(false);
      expect(panel.getAttribute('aria-labelledby')).toBe(selected.id);
      expect(root.querySelectorAll('[role="tab"][aria-selected="true"]')).toHaveLength(1);
    }
  });

  it('supports a local search without mutating tool inputs', async () => {
    await load();
    editQuery('Curry');
    await act(async () => {
      root.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(mockSearch).toHaveBeenLastCalledWith('Curry');
    expect(component.query).toBe('Arrabiata');
  });

  it('renders empty results honestly', async () => {
    mockSearch.mockResolvedValue([]);
    await load();
    expect(root.textContent).toContain('No recipes found');
    expect(root.querySelector('[data-recipe]')).toBeNull();
  });

  it('shows an accessible error and retries the request', async () => {
    mockSearch.mockRejectedValueOnce(new Error('Recipe service is unavailable.'));
    await load();
    expect(root.querySelector('[role="alert"]')!.textContent).toContain('unavailable');
    await act(async () => { root.querySelector<HTMLButtonElement>('[data-action="retry"]')!.click(); });
    expect(mockSearch).toHaveBeenCalledTimes(2);
    expect(root.querySelector('[data-recipe]')).not.toBeNull();
  });

  it('replaces an authorized image with a placeholder when loading fails', async () => {
    mockSearch.mockResolvedValue([{ ...recipe, image: { url: 'https://images.example.test/test.jpg', alt: 'Penne', rightsConfirmed: true } }]);
    await load();
    const image = root.querySelector('img')!;
    act(() => { image.dispatchEvent(new Event('error')); });
    expect(root.querySelector('img')).toBeNull();
    expect(root.textContent).toContain('Photo unavailable');
  });

  it('does not re-render after disposal while a request is pending', async () => {
    let resolveSearch: (value: IRecipe[]) => void = () => undefined;
    mockSearch.mockReturnValue(new Promise<IRecipe[]>(resolve => { resolveSearch = resolve; }));
    act(() => component.paint());
    act(() => component.cleanup());
    await act(async () => { resolveSearch([recipe]); });
    expect(root.childElementCount).toBe(0);
    expect(root.querySelector('[data-recipe]')).toBeNull();
  });

  it('uses a labelled Fluent input and a dedicated Search button', async () => {
    await load();
    const input = root.querySelector<HTMLInputElement>('[name="query"]')!;
    expect(root.querySelector(`label[for="${input.id}"]`)!.textContent).toContain('Recipe name');
    const search = root.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(search.textContent).toBe('Search');
    expect(search.classList.contains('search-button')).toBe(true);
    expect(root.querySelector('.fui-Input')).not.toBeNull();
  });

  it('moves focus to the recipe heading and restores the selected result on return', async () => {
    await load();
    click('[data-recipe]');
    expect(document.activeElement).toBe(root.querySelector('[data-heading]'));
    click('[data-action="back"]');
    expect(document.activeElement).toBe(root.querySelector('[data-recipe]'));
  });

  it('preserves a search draft and input focus across host updates', async () => {
    await load();
    const input = root.querySelector<HTMLInputElement>('[name="query"]')!;
    editQuery('Curry');
    act(() => input.focus());
    host.theme = 'dark';
    act(() => component.paint());
    expect(root.querySelector('[name="query"]')).toBe(input);
    expect(input.value).toBe('Curry');
    expect(document.activeElement).toBe(input);
  });

  it('only offers supported display modes and handles host refusal without losing results', async () => {
    await load();
    expect(root.querySelector('[data-action="expand"]')).toBeNull();
    host.availableDisplayModes = ['inline', 'fullscreen'];
    act(() => component.paint());
    expect(root.querySelector('[data-action="expand"]')!.getAttribute('aria-label')).toBe('Expand cook view');
    mockDisplayMode.mockResolvedValue({ mode: 'inline' });
    await act(async () => { root.querySelector<HTMLButtonElement>('[data-action="expand"]')!.click(); });
    expect(mockDisplayMode).toHaveBeenCalledWith('fullscreen');
    expect(root.textContent).toContain('The host could not change display mode');
    expect(root.querySelector('[data-recipe]')).not.toBeNull();
    expect(mockSearch).toHaveBeenCalledTimes(1);
  });

  it('unmounts on teardown and tolerates subsequent disposal', async () => {
    await load();
    await act(async () => { await component.teardown(); });
    expect(root.childElementCount).toBe(0);
    act(() => component.cleanup());
    act(() => component.paint());
    expect(root.childElementCount).toBe(0);
  });

  it('uses unique IDs for separate component instances', async () => {
    await load();
    const second = new TestComponent();
    const secondRoot = document.createElement('div');
    document.body.appendChild(secondRoot);
    Object.defineProperty(second, 'context', { value: { domElement: secondRoot } });
    Object.defineProperty(second, 'hostContext', { value: host });
    Object.defineProperty(second, 'properties', { value: { query: 'Arrabiata' } });
    try {
      await act(async () => { second.paint(); });
      const ids = Array.from(document.querySelectorAll<HTMLElement>('[id]')).map(element => element.id);
      expect(new Set(ids).size).toBe(ids.length);
    } finally {
      act(() => second.cleanup());
      secondRoot.remove();
    }
  });
});