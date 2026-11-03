import * as React from 'react';
import type { ICopilotComponentHostContext } from '@microsoft/sp-copilot-component';
import {
  Button, Card, Checkbox, Field, FluentProvider, Input, Link,
  MessageBar, MessageBarBody, RendererProvider, Spinner, Tab, TabList,
  Text, Tooltip, createDOMRenderer, webDarkTheme, webLightTheme
} from '@fluentui/react-components';
import {
  ArrowExpand20Regular, ArrowLeft20Regular, ArrowMinimize20Regular,
  ArrowRight20Regular, ArrowClockwise20Regular, Food20Regular,
  ImageOff24Regular, Open20Regular, Search20Regular
} from '@fluentui/react-icons';
import type { IRecipe, IRecipeProviderInfo } from './RecipeModels';
import styles from './RecipeSearchCopilotComponent.module.scss';

export interface IRecipeSearchViewProps {
  targetDocument: Document;
  hostContext: ICopilotComponentHostContext;
  providerInfo: IRecipeProviderInfo;
  query: string;
  recipes: IRecipe[];
  selectedId: string | undefined;
  activeTab: 'ingredients' | 'method';
  checked: ReadonlySet<string>;
  loading: boolean;
  error: string;
  displayError: string;
  onSearch: (query: string) => void;
  onSelect: (id: string | undefined) => void;
  onTab: (tab: 'ingredients' | 'method') => void;
  onCheck: (key: string, checked: boolean) => void;
  onRetry: () => void;
  onDisplayMode: () => void;
}

interface IRecipeCardProps {
  recipe: IRecipe;
  onSelect: (id: string) => void;
}

function RecipePhoto({ recipe }: { recipe: IRecipe }): React.ReactElement {
  const [failedUrl, setFailedUrl] = React.useState<string>();
  const display = recipe.image.rightsConfirmed && recipe.image.url && recipe.image.url !== failedUrl;
  return (
    <figure className={styles.photo}>
      {display ? <img src={recipe.image.url} alt={recipe.image.alt} loading="lazy"
        onError={() => setFailedUrl(recipe.image.url)} /> :
        <div className={styles.photoFallback}><ImageOff24Regular aria-hidden="true" /><Text>Photo unavailable</Text></div>}
    </figure>
  );
}

function RecipeCard({ recipe, onSelect }: IRecipeCardProps): React.ReactElement {
  const titleId = React.useId();
  return (
    <Card role="article" className={styles.card} aria-labelledby={titleId}>
      <RecipePhoto recipe={recipe} />
      <div className={styles.cardBody}>
        <Text as="h3" id={titleId} size={400} weight="semibold" className={styles.cardTitle}>
          {recipe.sourceUrl
            ? <Link href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">{recipe.title}</Link>
            : <Text>{recipe.title}</Text>}
        </Text>
        <Text className={styles.muted} size={200}>{recipe.ingredients.length} ingredients</Text>
        <Button data-recipe={recipe.id} icon={<ArrowRight20Regular />} iconPosition="after"
          onClick={() => onSelect(recipe.id)}>Cook recipe</Button>
      </div>
    </Card>
  );
}

function RecipeBody(props: IRecipeSearchViewProps): React.ReactElement {
  const { query, recipes, selectedId, activeTab, checked, loading, hostContext } = props;
  const [draft, setDraft] = React.useState(query);
  const selected = recipes.find(recipe => recipe.id === selectedId);
  const prefix = React.useId();
  const rootRef = React.useRef<HTMLElement>(null);
  const previousSelection = React.useRef<string>();
  const fullscreen = hostContext.displayMode === 'fullscreen';
  const targetMode = fullscreen ? 'inline' : 'fullscreen';
  const canChangeMode = (hostContext.availableDisplayModes ?? []).indexOf(targetMode) !== -1;
  const displayLabel = fullscreen ? 'Return to conversation' : 'Expand cook view';

  React.useEffect(() => { setDraft(query); }, [query]);

  React.useEffect(() => {
    if (selectedId !== previousSelection.current) {
      if (selectedId) rootRef.current?.querySelector<HTMLElement>('[data-heading]')?.focus();
      else if (previousSelection.current) {
        const previousId = previousSelection.current;
        const buttons = rootRef.current?.querySelectorAll<HTMLButtonElement>('[data-recipe]');
        buttons?.forEach(button => { if (button.dataset.recipe === previousId) button.focus(); });
      }
      previousSelection.current = selectedId;
    }
  }, [selectedId]);

  const checklist = (recipe: IRecipe, kind: 'ingredient' | 'step', labels: string[]): React.ReactElement[] =>
    labels.map((label, index) => {
      const key = `${recipe.id}-${kind}-${index}`;
      return <li key={key} className={checked.has(key) ? styles.completed : undefined}>
        <Checkbox className={styles.checkItem} label={label} checked={checked.has(key)} input={{ type: 'checkbox', ...{ 'data-check': key } }}
          onChange={(_, data) => props.onCheck(key, data.checked === true)} />
      </li>;
    });

  return (
    <section ref={rootRef} className={styles.recipeSearch} data-display-mode={fullscreen ? 'fullscreen' : 'inline'}
      aria-label="Recipe search" aria-busy={loading}>
      <header className={styles.header}>
        <div className={styles.brand}><Food20Regular aria-hidden="true" />
          <Text as="h2" size={500} weight="semibold">Recipe Kitchen</Text></div>
        {canChangeMode && <Tooltip content={displayLabel} relationship="label">
          <Button appearance="subtle" data-action="expand" aria-label={displayLabel}
            icon={fullscreen ? <ArrowMinimize20Regular /> : <ArrowExpand20Regular />} onClick={props.onDisplayMode} />
        </Tooltip>}
      </header>
      <form className={styles.search} onSubmit={event => {
        event.preventDefault();
        const input = event.currentTarget.elements.namedItem('query') as HTMLInputElement;
        if (input.value.trim()) props.onSearch(input.value.trim());
      }}>
        <Field label={{ children: 'Recipe name', htmlFor: `${prefix}-query` }}>
          <div className={styles.searchControls}>
            <Input id={`${prefix}-query`} name="query" value={draft} onChange={(_, data) => setDraft(data.value)} required maxLength={120}
              autoComplete="off" contentBefore={<Search20Regular aria-hidden="true" />} size="large" />
            <Button type="submit" appearance="primary" size="large" icon={<Search20Regular />}
              className={styles.searchButton} disabled={loading}>Search</Button>
          </div>
        </Field>
      </form>
      {loading && <div className={styles.status} role="status"><Spinner size="small" label="Finding recipes..." /></div>}
      {props.error && <MessageBar intent="error" role="alert"><MessageBarBody>
        <div className={styles.errorBody}><Text>{props.error}</Text>
          <Button data-action="retry" icon={<ArrowClockwise20Regular />} onClick={props.onRetry}>Try again</Button>
        </div>
      </MessageBarBody></MessageBar>}
      {props.displayError && <MessageBar intent="warning" role="alert"><MessageBarBody>{props.displayError}</MessageBarBody></MessageBar>}
      {!loading && !props.error && !recipes.length && <div className={styles.status} role="status">
        <Search20Regular aria-hidden="true" /><Text>No recipes found. Try another dish name.</Text>
      </div>}
      {selected ? <article className={styles.detail}>
        <Button appearance="subtle" icon={<ArrowLeft20Regular />} data-action="back" onClick={() => props.onSelect(undefined)}>
          Back to results
        </Button>
        <div className={styles.recipeHeading}>
          <Text as="h3" size={600} weight="semibold" tabIndex={-1} data-heading>{selected.title}</Text>
          {selected.sourceUrl && <Link href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">
            View recipe on {props.providerInfo.name} <Open20Regular aria-hidden="true" />
          </Link>}
          {selected.originalSourceUrl && <Link href={selected.originalSourceUrl} target="_blank" rel="noopener noreferrer">
            Original recipe source <Open20Regular aria-hidden="true" />
          </Link>}
        </div>
        <div className={styles.cookLayout}>
          <div className={styles.recipeSummary}>
            <RecipePhoto key={selected.id} recipe={selected} />
            <Text size={200} className={styles.muted}>{selected.ingredients.length} ingredients</Text>
            <Text size={200} className={styles.muted}>Servings and preparation time unavailable.</Text>
          </div>
          <div className={styles.checklist}>
            <TabList selectTabOnFocus selectedValue={activeTab} onTabSelect={(_, data) => props.onTab(data.value === 'method' ? 'method' : 'ingredients')}
              className={styles.cookTabs} aria-label="Recipe details">
              <Tab id={`${prefix}-ingredients-tab`} value="ingredients" data-tab="ingredients" aria-controls={`${prefix}-ingredients-panel`}>Ingredients</Tab>
              <Tab id={`${prefix}-method-tab`} value="method" data-tab="method" aria-controls={`${prefix}-method-panel`}>Method</Tab>
            </TabList>
            <section role="tabpanel" id={`${prefix}-ingredients-panel`} aria-labelledby={`${prefix}-ingredients-tab`}
              tabIndex={0} hidden={activeTab !== 'ingredients'}>
              <ul>{checklist(selected, 'ingredient', selected.ingredients.map(ingredient => `${ingredient.measure} ${ingredient.name}`.trim()))}</ul>
              {!selected.ingredients.length && <Text>Ingredients unavailable. Check the source recipe.</Text>}
            </section>
            <section role="tabpanel" id={`${prefix}-method-panel`} aria-labelledby={`${prefix}-method-tab`}
              tabIndex={0} hidden={activeTab !== 'method'}>
              <ol>{checklist(selected, 'step', selected.instructions)}</ol>
              {!selected.instructions.length && <Text>Instructions unavailable. Check the source recipe.</Text>}
            </section>
          </div>
        </div>
      </article> : <div className={styles.results}>
        {recipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} onSelect={props.onSelect} />)}
      </div>}
      <footer className={styles.footer}>
        {props.providerInfo.attributionUrl
          ? <Link href={props.providerInfo.attributionUrl} target="_blank" rel="noopener noreferrer">{props.providerInfo.attribution}</Link>
          : <Text>{props.providerInfo.attribution}</Text>}
        <Text as="p" size={200}>Dietary and allergy safety is not verified. Check ingredient labels and cross-contamination risks.</Text>
      </footer>
    </section>
  );
}

export function RecipeSearchView(props: IRecipeSearchViewProps): React.ReactElement {
  const [renderer] = React.useState(() => createDOMRenderer(props.targetDocument));
  return <RendererProvider renderer={renderer} targetDocument={props.targetDocument}>
    <FluentProvider targetDocument={props.targetDocument}
      theme={props.hostContext.theme === 'dark' ? webDarkTheme : webLightTheme}>
      <RecipeBody {...props} />
    </FluentProvider>
  </RendererProvider>;
}