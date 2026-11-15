import * as React from 'react';
import { Button, Checkbox, Radio, RadioGroup, Select } from '@fluentui/react-components';
import { ChevronDown16Regular, ChevronRight16Regular } from '@fluentui/react-icons';
import { maxGuidelineChars, type ScanRequest, type SourceMode } from '../domain/contracts';
import type { IContentLensDiscovery, PageChoice, SiteChoice } from '../services/discovery';
import { PageCombobox, SitePicker } from './ContentPickers';
import { checkGroups, type CheckGroup } from '../domain/checkCatalog';
import { checkGroupLabel, checkRule, groupChecks } from './checkRules';
import { GuidelinesBox } from './GuidelinesBox';
import { InfoPopover } from './InfoPopover';
import { useContentLensStyles } from './ContentLens.styles';
import { format } from './viewUtils';

const lookbackChoices = [7, 14, 30] as const;
const pageKindChoices = ['page', 'news', 'both'] as const;

export interface IStartViewProps {
  strings: IContentLensStrings;
  demo: boolean;
  discovery?: IContentLensDiscovery;
  demoPages: readonly PageChoice[];
  demoSites: readonly SiteChoice[];
  mode: SourceMode;
  /** Both tabs look at one site. */
  site?: SiteChoice;
  initialSiteQuery?: string;
  // Page tab
  page?: PageChoice;
  guidelines: string;
  /** The checks without AI that are on. */
  groups: readonly CheckGroup[];
  onToggleGroup(group: CheckGroup): void;
  rulesDemoNotice: boolean;
  // Comments tab
  lookback: 7 | 14 | 30;
  pageKind: ScanRequest['pageKind'];
  limitPage?: PageChoice;
  harmful: boolean;
  /** Reading or reviewing is in progress. */
  busy: boolean;
  coolingDown: boolean;
  /** Content Lens runs outside Microsoft 365 and the example is off, so nothing can be read. */
  unavailable: boolean;
  canStart: boolean;
  hasResults: boolean;
  onSiteChange(site: SiteChoice | undefined): void;
  onPageChange(page: (PageChoice & { site?: SiteChoice }) | undefined): void;
  onGuidelinesChange(value: string): void;
  onLookbackChange(days: 7 | 14 | 30): void;
  onPageKindChange(kind: ScanRequest['pageKind']): void;
  onLimitPageChange(page: PageChoice | undefined): void;
  onToggleHarmful(): void;
  onStart(): void;
  onDemo(enabled: boolean): void;
  onDemoScenario(pageItemId: number, days: 7 | 30): void;
  onReturnToResults(): void;
}

/**
 * Choose a site and a page with its guidelines, or a site and the period of its comments.
 * Content is read only when the reviewer presses the primary button.
 */
export function StartView(props: IStartViewProps): React.ReactElement {
  const { strings: s, demo, mode } = props;
  const styles = useContentLensStyles();
  const ids = { title: React.useId(), period: React.useId(), kind: React.useId(), checks: React.useId() };
  const discovery = demo ? undefined : props.discovery;
  const blocked = props.busy || props.coolingDown;
  // The guidelines are optional, so their box starts folded; its summary line says how many guidelines a check uses.
  // A text that is too long keeps the box open, so its error message stays visible.
  const [guidelinesOpen, setGuidelinesOpen] = React.useState(false);
  const [scenario, setScenario] = React.useState('');
  React.useEffect(() => setScenario(''), [mode, demo]);
  const scenarioPages = mode === 'page' ? [17, 42, 18] : [42, 42, 18];
  // A scenario stays selected while its page is the chosen one.
  const scenarioPage = mode === 'page' ? props.page : props.limitPage;
  const selectedScenario = scenario && scenarioPage?.pageItemId === scenarioPages[Number(scenario) - 1] ? scenario : '';

  const guidelineCount = props.guidelines.split('\n').filter(line => line.trim()).length;
  const guidelinesTooLong = props.guidelines.trim().length > maxGuidelineChars;
  const guidelinesMeta = guidelineCount === 0 ? s.GuidelinesOptional
    : guidelineCount === 1 ? s.GuidelinesCountOne
    : format(s.GuidelinesCount, guidelineCount);
  const foldOpen = guidelinesOpen || guidelinesTooLong;
  // A new key remounts a picker with fresh state when the example, the site or the page kind changes.
  const pickerKey = demo ? 'demo' : 'live';
  const pagePickerKey = pickerKey + ':' + (props.site?.url || '');
  const demoButtonLabel = demo ? s.LeaveDemo : mode === 'comments' ? s.Demo.tryComments : s.EnableDemo;
  const action = <div className={styles.primaryRow}>
    <Button className={styles.primary} appearance="primary" disabled={blocked || !props.canStart} onClick={props.onStart}>
      {mode === 'page' ? s.CheckPage : s.FindIssues}</Button>
    <span className={styles.meta}>{props.unavailable ? s.LiveUnavailable : s.ReadOnlyHint}</span>
  </div>;
  const settings = <>
    <SitePicker key={pickerKey} discovery={discovery} demoSites={demo ? props.demoSites : undefined} value={props.site} strings={s}
      initialQuery={demo ? undefined : props.initialSiteQuery} disabled={blocked} onSelect={props.onSiteChange} />
    {mode === 'page' ? <>
      <PageCombobox key={pagePickerKey} discovery={discovery} demoPages={demo ? props.demoPages : undefined}
        site={props.site} value={props.page} disabled={blocked} strings={s} onSelect={props.onPageChange} />
      {/* Every check is a toggle with an explanation: what Copilot reads for, and what is checked on the page without AI. */}
      <div className={styles.field} data-testid="also-check">
        <span id={ids.checks} className={styles.label}>{s.AlsoCheck}</span>
        <div role="group" aria-labelledby={ids.checks} className={styles.checksGrid}>
          <div className={styles.toggleRow}>
            <Checkbox disabled={props.busy} checked={props.harmful} onChange={props.onToggleHarmful} label={s.HarmfulWordingShort} />
            <InfoPopover label={format(s.AboutCheck, s.HarmfulWordingShort)}>
              <p className={styles.label}>{s.HarmfulWordingShort}</p><p>{s.CheckInfoCopilot}</p>
            </InfoPopover>
          </div>
          {checkGroups.map(group => <div key={group} className={styles.toggleRow}>
            <Checkbox disabled={props.busy} checked={props.groups.indexOf(group) >= 0} onChange={() => props.onToggleGroup(group)}
              label={<span>{checkGroupLabel(s, group)} · {s.AutomaticCheckShort}</span>} />
            <InfoPopover label={format(s.AboutCheck, checkGroupLabel(s, group))}>
              <p className={styles.label}>{checkGroupLabel(s, group)}</p>
              <p>{s.CheckInfoNoAI}</p>
              <ul>
                {groupChecks(group).map(check => <li key={check.id}>
                  {checkRule(s, check)}
                  {check.newsOnly ? ' (' + s.ChecksNewsOnly + ')' : ''}
                </li>)}
              </ul>
              {group === 'a11y' && <p>{s.ChecksScopeA11y}</p>}
              {group === 'layout' && <p>{s.ChecksScopeLayout}</p>}
            </InfoPopover>
          </div>)}
        </div>
      </div>
      <details className={styles.fold} open={foldOpen} onToggle={event => setGuidelinesOpen(event.currentTarget.open)}
        data-testid="guidelines-fold">
        <summary data-testid="guidelines-summary">
          {foldOpen ? <ChevronDown16Regular aria-hidden="true" /> : <ChevronRight16Regular aria-hidden="true" />}
          <span className={styles.label}>{s.RulesHeading}</span>
          <span className={styles.meta}>{guidelinesMeta}</span>
        </summary>
        <GuidelinesBox strings={s} text={props.guidelines} disabled={props.busy}
          demoNotice={props.rulesDemoNotice} onTextChange={props.onGuidelinesChange} />
      </details>
      {!props.canStart && !blocked && props.page && <p className={styles.meta}>{s.SelectChecksHint}</p>}
    </> : <>
      <div className={styles.field}>
        <span id={ids.period} className={styles.label}>{s.Lookback}</span>
        <RadioGroup layout="horizontal" value={String(props.lookback)} aria-labelledby={ids.period} disabled={blocked}
          onChange={(_event, data) => props.onLookbackChange(Number(data.value) as 7 | 14 | 30)}>
          {lookbackChoices.map(days => <Radio key={days} value={String(days)} label={format(s.LastDays, days)} />)}
        </RadioGroup>
      </div>
      <div className={styles.field}>
        <span id={ids.kind} className={styles.label}>{s.PageKind}</span>
        <RadioGroup layout="horizontal" value={props.pageKind} aria-labelledby={ids.kind} disabled={blocked}
          onChange={(_event, data) => props.onPageKindChange(data.value as ScanRequest['pageKind'])}>
          {pageKindChoices.map(kind => <Radio key={kind} value={kind}
            label={kind === 'page' ? s.Pages : kind === 'news' ? s.News : s.Both} />)}
        </RadioGroup>
      </div>
      <details className={styles.details}>
        <summary>{props.limitPage ? props.limitPage.title : s.LimitPage}</summary>
        <p className={styles.meta}>{s.LimitPageHelp}</p>
        <PageCombobox key={pagePickerKey + ':' + props.pageKind} discovery={discovery}
          demoPages={demo ? props.demoPages : undefined} site={props.site} value={props.limitPage} strings={s}
          pageKind={props.pageKind} disabled={!props.site || blocked} onSelect={props.onLimitPageChange} />
      </details>
    </>}
  </>;
  return <section className={styles.stack} aria-labelledby={ids.title}>
    <div className={styles.tight}>
      <h1 id={ids.title} className={styles.startTitle}>{mode === 'comments' ? s.FindIssues : s.StartTitle}</h1>
      <p className={styles.sub}>{mode === 'comments' ? s.Preview.commentHint : s.StartSubtitle}</p>
    </div>
    {demo && <div className={styles.field} data-testid="demo-scenarios">
      <label className={styles.label} htmlFor={ids.title + '-demo'}>{s.Demo.choose}</label>
      <Select id={ids.title + '-demo'} value={selectedScenario} disabled={blocked} onChange={(_event, data) => {
        setScenario(data.value);
        if (data.value) {
          // The second comments scenario looks back 30 days; every other scenario 7.
          const days = mode === 'comments' && data.value === '2' ? 30 : 7;
          props.onDemoScenario(scenarioPages[Number(data.value) - 1], days);
        }
      }}>
        <option value="">{s.Demo.choose}</option>
        {[1, 2, 3].map(scenarioNumber => <option key={scenarioNumber} value={String(scenarioNumber)}>
          {s.Demo[mode + scenarioNumber + 'Title']}
        </option>)}
      </Select>
      <p className={styles.meta}>{s.Demo.prepared}</p>
      {selectedScenario && <p className={styles.sub}>{s.Demo[mode + selectedScenario + 'Task']}</p>}
    </div>}
    {demo && selectedScenario
      ? <details className={styles.details}><summary>{s.Demo.settings}</summary>{settings}</details>
      : settings}
    {action}
    <div className={styles.actions}>
      <Button className={styles.secondary} appearance="secondary" onClick={() => props.onDemo(!demo)}>{demoButtonLabel}</Button>
      {props.hasResults && <Button className={styles.secondary} appearance="secondary" onClick={props.onReturnToResults}>
        {s.ReturnToResults}
      </Button>}
    </div>
  </section>;
}
