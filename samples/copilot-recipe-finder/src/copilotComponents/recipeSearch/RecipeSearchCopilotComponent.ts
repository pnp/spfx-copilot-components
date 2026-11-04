import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { IRecipeSearchCopilotComponentProperties } from './RecipeSearchCopilotComponentProperties';
import type { IRecipe } from './RecipeModels';
import { createRecipeProvider } from './RecipeProviderFactory';
import { RecipeSearchView } from './RecipeSearchView';

export default class RecipeSearchCopilotComponent extends BaseCopilotComponent<IRecipeSearchCopilotComponentProperties> {
  private readonly _provider = createRecipeProvider();
  private readonly _checked = new Set<string>();
  private _query: string | undefined;
  private _hostQuery: string | undefined;
  private _localQuery: string | undefined;
  private _recipes: IRecipe[] = [];
  private _selectedId: string | undefined;
  private _activeTab: 'ingredients' | 'method' = 'ingredients';
  private _loading = false;
  private _error = '';
  private _displayError = '';
  private _disposed = false;
  private _root: Root | undefined;
  private _requestId = 0;

  protected render(): void {
    if (this._disposed) return;
    if (this.properties.query !== this._hostQuery) {
      this._hostQuery = this.properties.query;
      this._localQuery = undefined;
    }
    const query = this._localQuery ?? this.properties.query ?? '';
    if (query !== this._query) {
      this._query = query;
      this._selectedId = undefined;
      this._recipes = [];
      this._checked.clear();
      this._loading = true;
      this._error = '';
      this._load(query, ++this._requestId).catch(() => undefined);
    }
    if (!this._root) this._root = createRoot(this.context.domElement);
    this._root.render(React.createElement(RecipeSearchView, {
      targetDocument: this.context.domElement.ownerDocument,
      hostContext: this.hostContext,
      providerInfo: this._provider.info,
      query,
      recipes: this._recipes,
      selectedId: this._selectedId,
      activeTab: this._activeTab,
      checked: this._checked,
      loading: this._loading,
      error: this._error,
      displayError: this._displayError,
      onSearch: (value: string) => {
        this._localQuery = value;
        this.render();
      },
      onSelect: (id: string | undefined) => {
        this._selectedId = id;
        this._activeTab = 'ingredients';
        this.render();
      },
      onTab: (tab: 'ingredients' | 'method') => {
        this._activeTab = tab;
        this.render();
      },
      onCheck: (key: string, checked: boolean) => {
        if (checked) this._checked.add(key);
        else this._checked.delete(key);
        this.render();
      },
      onRetry: () => {
        this._query = undefined;
        this.render();
      },
      onDisplayMode: () => { this._changeDisplayMode().catch(() => undefined); }
    }));
  }

  private async _changeDisplayMode(): Promise<void> {
    const mode = this.hostContext.displayMode === 'fullscreen' ? 'inline' : 'fullscreen';
    this._displayError = '';
    try {
      const result = await this.requestDisplayModeAsync(mode);
      if (result.mode !== mode) throw new Error('Display mode declined.');
    } catch {
      this._displayError = 'The host could not change display mode. You can continue here.';
    }
    if (!this._disposed) this.render();
  }

  private async _load(query: string, requestId: number): Promise<void> {
    try {
      const recipes = await this._provider.search(query);
      if (requestId === this._requestId) this._recipes = recipes;
    } catch (error) {
      if (requestId === this._requestId) this._error = error instanceof Error ? error.message : 'Recipe search failed. Try again.';
    } finally {
      if (!this._disposed && requestId === this._requestId) {
        this._loading = false;
        this.render();
      }
    }
  }

  protected async onTeardown(reason: string | undefined): Promise<void> {
    this.onDispose();
    await super.onTeardown(reason);
  }

  protected onDispose(): void {
    this._disposed = true;
    this._root?.unmount();
    this._root = undefined;
  }
}
