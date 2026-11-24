import * as React from 'react';
import {
  Button,
  FluentProvider,
  IdPrefixProvider,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  mergeClasses,
  webDarkTheme,
  type Theme
} from '@fluentui/react-components';
import {
  ArrowCounterclockwise20Regular,
  ArrowRight16Regular,
  Checkmark20Regular,
  ChevronDown20Regular,
  ChevronUp20Regular,
  Clock16Regular,
  Edit16Regular,
  ErrorCircle16Regular,
  FormNew48Regular,
  FullScreenMaximize20Regular,
  Open16Regular,
  Sparkle16Regular
} from '@fluentui/react-icons';

import type { Answers, AnswerValue, HostKind, IFormSchema, ISubmitResult, IWizardField, IWizardTexts } from '../models';
import { describeColumns } from '../logic/fieldTypes';
import { motionEnabled, prefersReducedMotion, CHOICE_AUTO_ADVANCE_MS } from '../logic/motion';
import { DEFAULT_LOADING_MESSAGE } from '../logic/config';
import { answerCheckFor, checkAnswerFormat, type AnswerCheck } from '../logic/answerCheck';
import { gradientBackground, gradientFor, highlightCssVars, isDarkTheme, onGradientTheme } from '../logic/surface';
import { canRetrySave, initialWizardState, isSaveUnconfirmed, progressValue, screenKey, visibleFor, wizardReducer, type IWizardState, type WizardAction } from '../logic/navigation';
import { finishSummary, formatAnswer } from '../logic/payload';
import { asHyperlink, validatedHttpsUrl } from '../logic/hyperlink';
import { parsePrefill } from '../logic/prefill';
import { sameAnswer } from '../logic/answers';
import { validateValue } from '../logic/validation';
import { fieldGuideFor } from '../logic/fieldGuide';
import { type ISkipRule } from '../logic/jsonProps';
import { greetingText, questionParts, resolveQuestionTemplate } from '../logic/questionText';
import { LIVE_CHECK_DEBOUNCE_MS, liveCheck } from '../logic/liveCheck';
import { clearDraft, hasMeaningfulAnswers, readDraft, storageAvailable, writeDraft, type IDraftKeyParts, type IFormDraft } from '../logic/draft';
import { isSafeListFormUrl } from '../logic/siteUrl';
import { pastDateWarning } from '../logic/pastDate';
import { loadFailedFollowUp, openedFollowUp, submitFailedStatus, submitUnknownStatus, type CopilotStatusKind } from '../logic/copilotStatus';
import { asText } from '../logic/answers';
import { SUBMIT_TIMEOUT_MS, SUBMIT_TIMEOUT_MESSAGE, watchWithTimeout } from '../logic/sharePointWriteError';
import { SAVE_CHECK_FAILED_MESSAGE, SAVE_NOT_FOUND_MESSAGE } from '../logic/reconcileSubmit';
import { errorKindOf, ListFormError, type IListFormService } from '../services/IListFormService';
import { FieldGuideCard } from './FieldGuide';
import { FinishCheck } from './FinishCheck';
import { StepField } from './StepField';
import { useStepTransition } from './useStepTransition';
import { useWizardStyles } from './styles';
import { SiteListPicker } from './SiteListPicker';
import { HostLink } from './HostLink';
import type { ISiteDirectory } from '../services/sites';
import type { ListFormErrorKind } from '../services/IListFormService';

export interface IWizardAppProps {
  /** Undefined when no list is configured yet: shows emptyState. */
  service: IListFormService | undefined;
  /** List title used in load error messages. */
  listTitle?: string;
  host: HostKind;
  /** Copilot inline canvas: compact, fixed-height stage. */
  inline?: boolean;
  theme: Theme;
  /** Optional web part accent (hex). Replaces the default forest-to-teal gradient; white text stays readable. */
  accentColor?: string;
  texts: IWizardTexts;
  showReview: boolean;
  animations: boolean;
  /** Optional hex highlight for the progress bar, finish badge and focus ring. Empty keeps the current default. */
  highlightColor?: string;
  /** Spinner label while the list is loading. Defaults to "Loading the form…". */
  loadingMessage?: string;
  /** Per-question format checks (email, web link, phone). Presets still apply when a key is omitted. */
  answerChecks?: Record<string, AnswerCheck>;
  /** Copilot only: answers from the conversation (JSON string or object). Never auto-submitted. */
  prefill?: unknown;
  emptyState?: { title: string; body: string };
  notices?: string[];
  /** Overrides the prefers-reduced-motion media query (tests and preview). */
  reducedMotion?: boolean;
  idPrefix?: string;
  targetDocument?: Document;
  locale?: string;
  onExpand?: () => void;
  onSubmitted?: (result: ISubmitResult, listTitle: string) => void;
  onMeasured?: (width: number, height: number) => void;
  showGreeting?: boolean;
  firstName?: string;
  userId?: string;
  instanceId?: string;
  siteUrl?: string;
  /** Current tenant origin; used to decide whether an item link is safe to render. */
  allowedOrigin?: string;
  questionTexts?: Record<string, string>;
  fieldExamples?: Record<string, string>;
  skipRules?: ISkipRule[];
  /** Injected storage (tests). Defaults to localStorage when available. */
  storage?: Storage;
  now?: () => number;
  /** Copilot: discover a same-tenant site and a custom list when none was given or the list was not found. */
  directory?: ISiteDirectory;
  onPickList?: (siteUrl: string, listTitle: string) => void;
  /** Status-only line for Copilot (no answers or list content). */
  onStatus?: (message: string, kind: CopilotStatusKind, errorKind?: string) => void;
  /** Re-apply Copilot host height after the form layout changes. */
  onHostLayout?: () => void;
  /** True when the person chose this list in the picker (not from a tool argument). */
  listChosenInForm?: boolean;
  /** Page web part explicit height. Auto keeps the current default. */
  formHeight?: 'auto' | '480' | '600' | '800';
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string; kind: ListFormErrorKind }
  | { status: 'ready'; schema: IFormSchema };

export function loadErrorMessage(error: unknown, listTitle: string): string {
  switch (errorKindOf(error)) {
    case 'notFound':
      return `We couldn\u2019t find the list \u201c${listTitle}\u201d on this site. Check the list name and site address.`;
    case 'accessDenied':
      return 'You don\u2019t have access to this list. Ask the site owner for access.';
    case 'notAList':
      return `\u201c${listTitle}\u201d isn\u2019t a list. This form works with SharePoint lists, not document libraries.`;
    case 'network':
      return 'SharePoint couldn\u2019t be reached. Check your connection and try again.';
    default:
      return 'Something went wrong while loading the form. Please try again.';
  }
}

export function submitErrorMessage(error: unknown): string {
  switch (errorKindOf(error)) {
    case 'accessDenied':
      return 'You don\u2019t have permission to add items to this list. Ask the site owner for Contribute access.';
    case 'notFound':
      return 'The list wasn\u2019t found any more. It may have been renamed or deleted.';
    case 'network':
      return 'SharePoint couldn\u2019t be reached. Your answers are still here; try again.';
    case 'timeout':
      return SUBMIT_TIMEOUT_MESSAGE;
    case 'validation': {
      const message = error instanceof ListFormError ? error.message.trim() : '';
      return message || 'Please check your answers and try again.';
    }
    default:
      return 'SharePoint couldn\u2019t save the item. Your answers are still here; try again.';
  }
}

export function estimateMinutes(questionCount: number): number {
  return Math.max(1, Math.ceil((questionCount * 15) / 60));
}

/** One-question-at-a-time SharePoint list form. Shared by the page web part and the Copilot component. */

function reviewAnswer(field: IWizardField, value: AnswerValue | undefined, shown: string, styles: { reviewLink: string; notAnswered: string }, host: HostKind): React.ReactElement | string {
  if (field.kind === 'hyperlink') {
    const link = asHyperlink(value);
    const href = validatedHttpsUrl(link.url);
    if (!href) {
      return <span className={styles.notAnswered}>Not answered</span>;
    }
    const label = link.description.trim() || href;
    return (
      <HostLink
        host={host}
        href={href}
        openLabel={label}
        copyLabel={label}
        className={styles.reviewLink}
        testId="wiz-review-link"
      />
    );
  }
  return shown || <span className={styles.notAnswered}>Not answered</span>;
}


export function WizardApp(props: IWizardAppProps): React.ReactElement {
  // Everything sits on the gradient panel, so Fluent pieces use white-on-gradient tokens (host font kept).
  const panelTheme = React.useMemo(() => onGradientTheme(props.theme, webDarkTheme), [props.theme]);
  return (
    <IdPrefixProvider value={props.idPrefix ? `${props.idPrefix}-` : 'wizard-'}>
      <FluentProvider theme={panelTheme} targetDocument={props.targetDocument} style={{ backgroundColor: 'transparent', color: 'inherit', ...(props.inline ? { height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' } : {}) }}>
        <WizardShell {...props} />
      </FluentProvider>
    </IdPrefixProvider>
  );
}

function WizardShell(props: IWizardAppProps): React.ReactElement {
  const styles = useWizardStyles();
  const { service } = props;
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = React.useState(0);
  const [wideGuide, setWideGuide] = React.useState(false);
  const [load, setLoad] = React.useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = React.useState(0);
  const [pickingList, setPickingList] = React.useState(false);
  const [confirmChange, setConfirmChange] = React.useState(false);
  const [hasTypedAnswers, setHasTypedAnswers] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    if (!service) {
      return undefined;
    }
    setLoad({ status: 'loading' });
    service.loadSchema().then(
      (schema) => !cancelled && setLoad({ status: 'ready', schema }),
      (error: unknown) => !cancelled && setLoad({ status: 'error', message: loadErrorMessage(error, props.listTitle || 'this list'), kind: errorKindOf(error) })
    );
    return () => {
      cancelled = true;
    };
  }, [service, attempt, props.listTitle]);

  React.useEffect(() => {
    setPickingList(false);
    setConfirmChange(false);
    setHasTypedAnswers(false);
  }, [service, props.listTitle, props.siteUrl]);

  const onStatus = props.onStatus;
  const statusKey = !service ? 'empty' : load.status === 'error' ? `error:${load.kind}:${props.listTitle || ''}` : load.status === 'ready' ? `ready:${load.schema.listTitle}` : '';
  React.useEffect(() => {
    if (!onStatus || !statusKey) {
      return undefined;
    }
    if (!service) {
      onStatus(loadFailedFollowUp(props.listTitle || '', 'empty'), 'empty');
      return undefined;
    }
    if (load.status === 'error') {
      const showPicker = !!(props.directory && props.onPickList);
      const softMiss = showPicker && !props.listChosenInForm && load.kind === 'notFound';
      onStatus(loadFailedFollowUp(softMiss ? '' : (props.listTitle || ''), softMiss ? 'empty' : load.kind), softMiss ? 'empty' : 'failed');
      return undefined;
    }
    if (load.status === 'ready') {
      onStatus(openedFollowUp(load.schema.listTitle), 'opened');
    }
    return undefined;
  }, [onStatus, statusKey, service, load, props.listTitle]);

  const onHostLayout = props.onHostLayout;
  React.useEffect(() => {
    if (onHostLayout) {
      onHostLayout();
    }
  }, [onHostLayout, load.status, service, props.listTitle, pickingList, confirmChange]);

  const onMeasured = props.onMeasured;
  React.useEffect(() => {
    const el = rootRef.current;
    const RO = typeof window !== 'undefined' ? (window as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver : undefined;
    if (!el || !RO) {
      return undefined;
    }
    const observer = new RO((entries) => {
      const rect = entries[0] && entries[0].contentRect;
      if (rect) {
        setWidth(Math.round(rect.width));
        if (onMeasured) {
          onMeasured(Math.round(el.offsetWidth), Math.round(el.offsetHeight));
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [onMeasured]);

  const compact = !!props.inline || (width > 0 && width < 480);
  const dark = isDarkTheme(props.theme);
  const panel = !props.inline;
  const narrow = width > 0 && width < 480;
  const heightClass = props.formHeight === '480' ? styles.pageHeight480 : props.formHeight === '600' ? styles.pageHeight600 : props.formHeight === '800' ? styles.pageHeight800 : undefined;
  const className = mergeClasses(styles.root, panel && styles.page, panel && dark && styles.pageDark, panel && narrow && styles.pageNarrow, props.inline && styles.compact, panel && heightClass);
  const surface = React.useMemo(() => {
    const g = gradientFor(props.accentColor, dark);
    // Solid start colour first as a fallback, then the gradient layers.
    return {
      backgroundColor: g.start,
      backgroundImage: gradientBackground(g),
      ...highlightCssVars(props.highlightColor, g.start)
    };
  }, [props.accentColor, props.highlightColor, dark]);

  const canChangeList = props.host === 'Copilot' && !!props.directory && !!props.onPickList;
  const requestChangeList = (): void => {
    if (hasTypedAnswers) {
      setConfirmChange(true);
    } else {
      setPickingList(true);
      setConfirmChange(false);
    }
  };

  let body: React.ReactElement;
  if (!service) {
    const empty = props.emptyState || { title: 'This form isn\u2019t set up yet', body: 'Choose a SharePoint list for the form.' };
    body = (
      <div className={mergeClasses(styles.centered, props.directory && props.onPickList && styles.centeredFill)} data-testid="wiz-empty">
        {props.directory && props.onPickList ? (
          <SiteListPicker directory={props.directory} preferredSiteUrl={props.siteUrl} onPick={props.onPickList} />
        ) : (
          <>
            <FormNew48Regular className={styles.emptyIcon} aria-hidden="true" />
            <h2 className={styles.introTitle}>{empty.title}</h2>
            <p className={styles.description}>{empty.body}</p>
          </>
        )}
      </div>
    );
  } else if (load.status === 'loading') {
    body = (
      <div className={styles.centered} data-testid="wiz-loading">
        <Spinner size="small" appearance="inverted" label={props.loadingMessage || DEFAULT_LOADING_MESSAGE} />
      </div>
    );
  } else if (load.status === 'error') {
    const showPicker = !!(props.directory && props.onPickList);
    const softMiss = showPicker && !props.listChosenInForm && load.kind === 'notFound';
    body = (
      <div className={mergeClasses(styles.centered, showPicker && styles.centeredFill)} data-testid={softMiss ? 'wiz-empty' : 'wiz-load-error'}>
        {softMiss ? null : (
          <MessageBar intent="error" layout="multiline" className={styles.loadError}>
            <MessageBarBody className={styles.loadError}>{load.message}</MessageBarBody>
          </MessageBar>
        )}
        {showPicker ? (
          <SiteListPicker
            directory={props.directory as ISiteDirectory}
            preferredSiteUrl={props.siteUrl}
            errorMessage={softMiss ? 'That list wasn\u2019t found. Pick a site and a list below.' : ''}
            onPick={props.onPickList as (siteUrl: string, listTitle: string) => void}
          />
        ) : (
          <button type="button" className={styles.pill} onClick={() => setAttempt((a) => a + 1)}>
            Try again
            <ArrowCounterclockwise20Regular aria-hidden="true" />
          </button>
        )}
      </div>
    );
  } else if (load.schema.blocking.length > 0) {
    const listUrl = load.schema.listUrl ? isSafeListFormUrl(`${load.schema.listUrl.replace(/\/+$/, '')}/NewForm.aspx`, props.allowedOrigin || '') : '';
    body = (
      <div className={styles.centered} data-testid="wiz-blocked">
        <MessageBar intent="warning" layout="multiline">
          <MessageBarBody>
            <MessageBarTitle>This list needs answers this form can’t collect</MessageBarTitle>
            {`Required: ${describeColumns(load.schema.blocking)}. Use the list\u2019s own form instead.`}
          </MessageBarBody>
        </MessageBar>
        {listUrl ? (
          <HostLink
            host={props.host}
            href={listUrl}
            openLabel={"Open the list's own form"}
            copyLabel={"Copy link to the list's form"}
            className={styles.link}
            testId="wiz-list-form-link"
            openIcon={<Open16Regular />}
          />
        ) : null}
      </div>
    );
  } else if (load.schema.fields.length === 0) {
    body = (
      <div className={styles.centered} data-testid="wiz-no-fields">
        <MessageBar intent="info">
          <MessageBarBody>This list has no columns this form can fill (single line of text, multiple lines of text, choice or date).</MessageBarBody>
        </MessageBar>
      </div>
    );
  } else {
    body = <Wizard {...props} schema={load.schema} service={service} compact={compact} allowSideGuide={!props.inline && width >= 900} onWideGuide={setWideGuide} onAnswersChange={setHasTypedAnswers} />;
  }

  const alreadyPicking = pickingList || !service;
  if (pickingList && props.directory && props.onPickList) {
    body = (
      <div className={mergeClasses(styles.centered, styles.centeredFill)} data-testid="wiz-empty">
        <SiteListPicker directory={props.directory} preferredSiteUrl={props.siteUrl} onPick={props.onPickList} />
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={className}
      style={surface}
      data-testid="wiz-root"
      data-host={props.host}
      data-compact={compact ? 'true' : 'false'}
      data-dark={dark ? 'true' : 'false'}
    >
      <div className={mergeClasses(styles.column, wideGuide && styles.columnWide, compact && styles.columnCompact)}>
        {canChangeList && !alreadyPicking ? (
          <div className={styles.changeListBar}>
            <button type="button" className={styles.changeList} onClick={requestChangeList} data-testid="wiz-change-list">
              Change list
            </button>
          </div>
        ) : null}
        {props.notices && props.notices.length > 0 ? (
          <div className={styles.notices}>
            {props.notices.map((n) => (
              <MessageBar key={n} intent="info">
                <MessageBarBody>{n}</MessageBarBody>
              </MessageBar>
            ))}
          </div>
        ) : null}
        {body}
      </div>
      {confirmChange ? (
        <div className={styles.confirmMask} role="dialog" aria-modal="true" aria-labelledby="wiz-change-list-title" data-testid="wiz-change-list-confirm">
          <div className={styles.confirmCard}>
            <p className={styles.confirmTitle} id="wiz-change-list-title">Change list?</p>
            <p className={styles.confirmBody}>The answers you have typed will not be kept.</p>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.confirmGhost} onClick={() => setConfirmChange(false)} data-testid="wiz-change-list-cancel">
                Cancel
              </button>
              <button
                type="button"
                className={styles.pill}
                onClick={() => {
                  setConfirmChange(false);
                  setHasTypedAnswers(false);
                  setPickingList(true);
                }}
                data-testid="wiz-change-list-ok"
              >
                Change list
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface IWizardProps extends IWizardAppProps {
  schema: IFormSchema;
  service: IListFormService;
  compact: boolean;
  allowSideGuide?: boolean;
  onWideGuide?: (wide: boolean) => void;
  onAnswersChange?: (hasAnswers: boolean) => void;
}

function Wizard(props: IWizardProps): React.ReactElement {
  const styles = useWizardStyles();
  const { schema, service, compact, texts, showReview } = props;
  const fields = schema.fields;
  const skipRules = props.skipRules || [];
  const win = props.targetDocument ? props.targetDocument.defaultView || undefined : typeof window !== 'undefined' ? window : undefined;
  const reduced = props.reducedMotion !== undefined ? props.reducedMotion : prefersReducedMotion(win);
  const motionOn = motionEnabled(props.animations, reduced);
  const firstName = props.firstName || '';
  const hello = greetingText(!!props.showGreeting, firstName);

  const prefill = React.useMemo(() => parsePrefill(props.prefill, fields), [props.prefill, fields]);
  const answerChecks = props.answerChecks;
  const config = React.useMemo(() => ({ fields, showReview, skipRules, answerChecks }), [fields, showReview, skipRules, answerChecks]);
  const [state, dispatch] = React.useReducer(
    (s: IWizardState, a: WizardAction) => wizardReducer(s, a, config),
    prefill.answers,
    initialWizardState
  );
  const stateRef = React.useRef(state);
  stateRef.current = state;
  const visible = visibleFor(config, state.answers);
  const total = visible.length;
  const onAnswersChange = props.onAnswersChange;
  React.useEffect(() => {
    if (onAnswersChange) {
      onAnswersChange(hasMeaningfulAnswers(state.answers, fields));
    }
  }, [onAnswersChange, state.answers, fields]);
  const draftParts: IDraftKeyParts | undefined = props.instanceId
    ? {
        siteUrl: props.siteUrl || '',
        listTitle: schema.listTitle,
        userId: props.userId || '',
        instanceId: props.instanceId
      }
    : undefined;
  const canStore = !!draftParts && storageAvailable(props.storage);

  const transition = useStepTransition(motionOn, compact, win);
  const focusRef = React.useRef<HTMLElement | null>(null);
  const [announcement, setAnnouncement] = React.useState('');
  const [guideVisible, setGuideVisible] = React.useState(!motionOn);
  const [liveMessage, setLiveMessage] = React.useState('');
  const [interacted, setInteracted] = React.useState(false);
  const [draftOffer, setDraftOffer] = React.useState<IFormDraft | undefined>(undefined);
  const key = screenKey(state);
  const firstRender = React.useRef(true);
  const autoAdvance = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = React.useRef(true);
  const inFlightRef = React.useRef<
    | {
        work: Promise<ISubmitResult>;
        answers: Answers;
        submittedAt: number;
        schema: IFormSchema;
      }
    | undefined
  >(undefined);

  React.useEffect(() => () => {
    if (autoAdvance.current) {
      clearTimeout(autoAdvance.current);
    }
  }, []);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (!canStore || !draftParts) {
      return undefined;
    }
    const existing = readDraft(draftParts, props.storage, props.now ? props.now() : undefined);
    if (existing && hasMeaningfulAnswers(existing.answers, fields) && !hasMeaningfulAnswers(prefill.answers, fields)) {
      setDraftOffer(existing);
    }
    return undefined;
    // Offer once when the wizard first opens, not on every answer change.
  }, []);

  React.useEffect(() => {
    if (!canStore || !draftParts) {
      return undefined;
    }
    if (state.phase === 'done' || state.submitting) {
      return undefined;
    }
    if (!hasMeaningfulAnswers(state.answers, fields)) {
      return undefined;
    }
    const handle = win ? win.setTimeout : setTimeout;
    const clear = win ? win.clearTimeout : clearTimeout;
    const id = handle(() => {
      writeDraft(draftParts, { answers: stateRef.current.answers, phase: stateRef.current.phase, index: stateRef.current.index }, props.storage, props.now ? props.now() : undefined);
    }, 400);
    return () => clear(id);
  }, [state.answers, state.phase, state.index, canStore, draftParts, fields, props.storage, props.now, win]);

  const currentField = state.phase === 'step' ? visible[state.index] : undefined;
  React.useEffect(() => {
    setInteracted(false);
    setLiveMessage('');
    if (!motionOn) {
      setGuideVisible(true);
      return undefined;
    }
    setGuideVisible(false);
    const raf = win && win.requestAnimationFrame ? win.requestAnimationFrame.bind(win) : (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (cb: FrameRequestCallback) => setTimeout(cb, 16) as unknown as number);
    const cancel = win && win.cancelAnimationFrame ? win.cancelAnimationFrame.bind(win) : (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : clearTimeout);
    let inner = 0;
    const outer = raf(() => {
      inner = raf(() => setGuideVisible(true));
    });
    return () => {
      cancel(outer);
      cancel(inner);
    };
  }, [key, motionOn, win]);

  React.useEffect(() => {
    const useSide = !!(props.allowSideGuide && currentField && fieldGuideFor(currentField, props.fieldExamples, answerCheckFor(currentField, props.answerChecks)));
    if (props.onWideGuide) {
      props.onWideGuide(useSide);
    }
    return () => {
      if (props.onWideGuide) {
        props.onWideGuide(false);
      }
    };
  }, [props.allowSideGuide, currentField, props.fieldExamples, props.onWideGuide]);

  React.useEffect(() => {
    if (!currentField) {
      setLiveMessage('');
      return undefined;
    }
    const handle = win ? win.setTimeout : setTimeout;
    const clear = win ? win.clearTimeout : clearTimeout;
    const id = handle(() => {
      const message = liveCheck(currentField, state.answers[currentField.internalName], { interacted }) || '';
      setLiveMessage(message);
      if (message) {
        setAnnouncement(message);
      }
    }, LIVE_CHECK_DEBOUNCE_MS);
    return () => clear(id);
  }, [currentField, state.answers, interacted, win]);

  // Focus management: after every screen change, focus the new screen's control and announce it.
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const el = focusRef.current;
    if (el && typeof el.focus === 'function') {
      el.focus({ preventScroll: true });
    }
    if (state.phase === 'step') {
      const f = visible[state.index];
      setAnnouncement(f ? `Question ${state.index + 1} of ${total}: ${f.title}${f.required ? ', required' : ''}` : '');
    } else if (state.phase === 'review') {
      setAnnouncement('Review your answers before you submit.');
    } else if (state.phase === 'done') {
      setAnnouncement(`Saved to ${schema.listTitle}.`);
    } else {
      setAnnouncement('');
    }
  }, [key]);

  const onSubmitted = props.onSubmitted;
  const onStatus = props.onStatus;

  const applySaveSuccess = React.useCallback((token: { work: Promise<ISubmitResult> }, result: ISubmitResult): void => {
    if (!inFlightRef.current || inFlightRef.current.work !== token.work) {
      return;
    }
    inFlightRef.current = undefined;
    if (!mountedRef.current) {
      return;
    }
    if (canStore && draftParts) {
      clearDraft(draftParts, props.storage);
    }
    transition.run('forward', () => dispatch({ type: 'submitSuccess', result }));
    if (onSubmitted) {
      try {
        onSubmitted(result, schema.listTitle);
      } catch {
        /* Status follow-up must not leave the form stuck after a successful save. */
      }
    }
  }, [canStore, draftParts, props.storage, transition, onSubmitted, schema.listTitle]);

  const applySaveFailure = React.useCallback((token: { work: Promise<ISubmitResult> }, error: unknown): void => {
    if (inFlightRef.current && inFlightRef.current.work !== token.work) {
      return;
    }
    inFlightRef.current = undefined;
    if (!mountedRef.current) {
      return;
    }
    dispatch({ type: 'submitFailure', message: submitErrorMessage(error) });
    if (onStatus) {
      const kind = errorKindOf(error);
      onStatus(submitFailedStatus(schema.listTitle, kind), 'notSubmitted', kind);
    }
  }, [onStatus, schema.listTitle]);

  React.useEffect(() => {
    if (state.submitRequested) {
      dispatch({ type: 'submitStart' });
    }
  }, [state.submitRequested]);

  React.useEffect(() => {
    if (!state.submitting) {
      return undefined;
    }
    const answers = { ...stateRef.current.answers };
    const visibleNow = visibleFor(config, answers);
    const submittedSchema = { ...schema, fields: visibleNow };
    const submittedAt = props.now ? props.now() : Date.now();
    const work = service.submit(submittedSchema, answers);
    const token = { work, answers, submittedAt, schema: submittedSchema };
    inFlightRef.current = token;
    const watched = watchWithTimeout(work, SUBMIT_TIMEOUT_MS, SUBMIT_TIMEOUT_MESSAGE);
    const succeed = (result: ISubmitResult): void => applySaveSuccess(token, result);
    const fail = (error: unknown): void => applySaveFailure(token, error);
    watched.first.then(succeed, (error: unknown) => {
      if (inFlightRef.current !== token) {
        return;
      }
      if (errorKindOf(error) === 'timeout') {
        if (mountedRef.current) {
          dispatch({ type: 'submitUnknown', message: SUBMIT_TIMEOUT_MESSAGE });
          if (onStatus) {
            onStatus(submitUnknownStatus(schema.listTitle), 'unknown', 'timeout');
          }
        }
        work.then(succeed, fail);
        return;
      }
      fail(error);
    });
    return undefined;
  }, [state.submitting]);

  const checkIfSaved = React.useCallback((): void => {
    const token = inFlightRef.current;
    if (!token || stateRef.current.saveOutcome !== 'unknown') {
      return;
    }
    dispatch({ type: 'submitCheckStart' });
    service.findSubmittedItem(token.schema, token.answers, token.submittedAt).then(
      (found) => {
        if (inFlightRef.current !== token || !mountedRef.current) {
          return;
        }
        if (found) {
          applySaveSuccess(token, found);
          return;
        }
        dispatch({ type: 'submitRetryAllowed', message: SAVE_NOT_FOUND_MESSAGE });
      },
      () => {
        if (inFlightRef.current !== token || !mountedRef.current) {
          return;
        }
        dispatch({ type: 'submitCheckFailed', message: SAVE_CHECK_FAILED_MESSAGE });
      }
    );
  }, [service, applySaveSuccess]);

  const goNext = React.useCallback((): void => {
    if (transition.isBusy()) {
      return;
    }
    const s = stateRef.current;
    if (s.phase === 'intro') {
      transition.run('forward', () => dispatch({ type: 'start' }));
      return;
    }
    if (s.phase !== 'step') {
      return;
    }
    const visibleNow = visibleFor(config, s.answers);
    const field = visibleNow[s.index];
    const invalid = field ? validateValue(field, s.answers[field.internalName], answerCheckFor(field, answerChecks)) : undefined;
    const isLast = s.index === visibleNow.length - 1;
    if (invalid || (isLast && !showReview && !s.returnToReview)) {
      dispatch({ type: 'next' });
      return;
    }
    transition.run('forward', () => dispatch({ type: 'next' }));
  }, [config, showReview, transition, answerChecks]);

  const goBack = React.useCallback((): void => {
    if (transition.isBusy() || stateRef.current.submitting) {
      return;
    }
    const s = stateRef.current;
    if (s.phase === 'step' || s.phase === 'review') {
      transition.run('back', () => dispatch({ type: 'back' }));
    }
  }, [transition]);

  const edit = (index: number): void => {
    if (!transition.isBusy()) {
      transition.run('back', () => dispatch({ type: 'edit', index }));
    }
  };

  const onPicked = (): void => {
    if (!motionOn) {
      return;
    }
    if (autoAdvance.current) {
      clearTimeout(autoAdvance.current);
    }
    autoAdvance.current = setTimeout(goNext, CHOICE_AUTO_ADVANCE_MS);
  };

  const title = texts.formTitle || schema.listTitle;
  const narrow = compact && !props.inline;
  React.useEffect(() => {
    if (props.onHostLayout) {
      props.onHostLayout();
    }
  }, [props.onHostLayout, state.phase, state.index]);

  const screenClass = mergeClasses(styles.screen, motionOn && styles.stagger);
  const pillClass = mergeClasses(styles.pill, motionOn && styles.pillMotion, compact && styles.pillCompact);
  const descClass = mergeClasses(styles.description, compact && styles.descriptionCompact);
  const backLink = (
    <button type="button" className={styles.textLink} onClick={goBack} data-testid="wiz-back-link">
      Back
    </button>
  );
  const enterHint = (
    <span className={styles.hint} aria-hidden="true">
      press <strong>Enter</strong> &#x21b5;
    </span>
  );

  let screen: React.ReactElement;
  if (state.phase === 'intro') {
    screen = (
      <div className={mergeClasses(screenClass, compact && styles.screenFill)} data-testid="wiz-intro">
        <div className={compact ? styles.scrollArea : undefined} data-testid={compact ? 'wiz-scroll' : undefined}>
        <div className={styles.introHead}>
        {hello && !draftOffer ? (
          <p className={mergeClasses(styles.greeting, compact && styles.questionCompact)} data-testid="wiz-greeting">
            {hello}
          </p>
        ) : null}
        <h2 className={mergeClasses(styles.introTitle, compact && styles.questionCompact)}>{title}</h2>
        {texts.introText ? <p className={descClass}>{texts.introText}</p> : null}
        <span className={mergeClasses(styles.meta, styles.introMeta)}>
          <Clock16Regular aria-hidden="true" />
          {`${total} ${total === 1 ? 'question' : 'questions'} \u00b7 about ${estimateMinutes(total)} min`}
        </span>
        </div>
        {prefill.applied.length > 0 ? (
          <span className={styles.prefilled} data-testid="wiz-prefill-note">
            <Sparkle16Regular aria-hidden="true" />
            {`${prefill.applied.length} ${prefill.applied.length === 1 ? 'answer is' : 'answers are'} filled in from your conversation. You can change them.`}
          </span>
        ) : null}
        {schema.skipped.length > 0 ? (
          <MessageBar intent="info" layout="multiline" data-testid="wiz-skipped">
            <MessageBarBody>{`Not asked here (this form can\u2019t fill them): ${describeColumns(schema.skipped)}.`}</MessageBarBody>
          </MessageBar>
        ) : null}
        </div>
        <div className={mergeClasses(styles.actions, compact && styles.actionsPinned)} data-testid={compact ? 'wiz-footer' : undefined}>
          {draftOffer ? (
            <div className={styles.resume} data-testid="wiz-resume">
              <p className={styles.resumePrompt}>Pick up where you left off?</p>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={pillClass}
                  ref={(el: HTMLButtonElement | null) => {
                    focusRef.current = el;
                  }}
                  onClick={() => {
                    const draft = draftOffer;
                    setDraftOffer(undefined);
                    transition.run('forward', () => dispatch({ type: 'restore', answers: draft.answers, phase: draft.phase, index: draft.index }));
                  }}
                  data-testid="wiz-resume-yes"
                >
                  Resume
                </button>
                <button
                  type="button"
                  className={styles.textLink}
                  onClick={() => {
                    setDraftOffer(undefined);
                    if (canStore && draftParts) {
                      clearDraft(draftParts, props.storage);
                    }
                  }}
                  data-testid="wiz-resume-no"
                >
                  Start over
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                className={pillClass}
                ref={(el: HTMLButtonElement | null) => {
                  focusRef.current = el;
                }}
                onClick={goNext}
                data-testid="wiz-start"
              >
                Start
                <ArrowRight16Regular aria-hidden="true" />
              </button>
              {enterHint}
            </>
          )}
        </div>
      </div>
    );
  } else if (state.phase === 'step') {
    const field = visible[state.index] || fields[state.index];
    const base = `${props.idPrefix ? `${props.idPrefix}-` : ''}wiz-${field.internalName}`;
    const check = answerCheckFor(field, answerChecks);
    const formatError = checkAnswerFormat(check, state.answers[field.internalName]);
    const error = state.errors[field.internalName] || formatError;
    const isLast = state.index === total - 1;
    const isMulti = field.kind === 'multichoice';
    const guide = fieldGuideFor(field, props.fieldExamples, check);
    const guideId = guide ? `${base}-guide` : '';
    const liveId = liveMessage ? `${base}-live` : '';
    const answerText = asText(state.answers[field.internalName]);
    const pastWarn = !error && (field.kind === 'date' || field.kind === 'datetime')
      ? pastDateWarning(field.kind, answerText, props.now ? new Date(props.now()) : undefined)
      : undefined;
    const pastId = pastWarn ? `${base}-past` : '';
    const describedBy = [guideId, isMulti ? `${base}-multi` : '', error ? `${base}-err` : '', liveId, pastId].filter(Boolean).join(' ');
    const fromConversation = prefill.applied.indexOf(field.internalName) >= 0 && sameAnswer(state.answers[field.internalName], prefill.answers[field.internalName]);
    // Grouped steps (option lists, date + time) are labelled by aria-labelledby, not a <label for>.
    const grouped = field.kind === 'choice' || isMulti || field.kind === 'datetime' || field.kind === 'yesno' || field.kind === 'hyperlink';
    const LabelTag = grouped ? 'div' : 'label';
    const template = resolveQuestionTemplate(field, props.questionTexts);
    const parts = questionParts(template, field, fields, state.answers, firstName);
    const stackedGuide = !props.allowSideGuide;
    const stepMain = (
      <>
        <span className={styles.questionNumber} aria-hidden="true" data-testid="wiz-question-label">
          {`Question ${state.index + 1} of ${total}`}
        </span>
        <LabelTag id={`${base}-label`} htmlFor={grouped ? undefined : `${base}-input`} className={mergeClasses(styles.question, compact && styles.questionCompact)}>
          {parts.map((part, i) => (part.emphasize ? <em key={i} className={styles.questionEm}>{part.text}</em> : <React.Fragment key={i}>{part.text}</React.Fragment>))}
          {field.required ? (
            <span className={styles.requiredMark} aria-hidden="true">
              *
            </span>
          ) : null}
        </LabelTag>
        {isMulti ? (
          <p id={`${base}-multi`} className={styles.hint} data-testid="wiz-multi-hint">
            Choose as many as you like
          </p>
        ) : null}
        {fromConversation ? (
          <span className={styles.prefilled}>
            <Sparkle16Regular aria-hidden="true" />
            From your conversation
          </span>
        ) : null}
        <StepField
          key={field.internalName}
          field={field}
          value={state.answers[field.internalName] || (isMulti ? [] : field.kind === 'hyperlink' ? { url: '', description: '' } : '')}
          inputId={`${base}-input`}
          labelId={`${base}-label`}
          describedBy={describedBy}
          invalid={!!error}
          compact={compact}
          motion={motionOn}
          focusRef={focusRef}
          onChange={(value) => {
            setInteracted(true);
            dispatch({ type: 'setAnswer', name: field.internalName, value });
          }}
          onSubmitStep={goNext}
          onPicked={onPicked}
        />
        {error ? (
          <div id={`${base}-err`} role="alert" className={styles.error} data-testid="wiz-error">
            <ErrorCircle16Regular aria-hidden="true" />
            {error}
          </div>
        ) : liveMessage ? (
          <div id={`${base}-live`} className={styles.liveCheck} data-testid="wiz-live-check">
            <span className={styles.liveDot} aria-hidden="true" />
            {liveMessage}
          </div>
        ) : pastWarn ? (
          <div id={`${base}-past`} className={styles.pastWarn} data-testid="wiz-past-date">
            {pastWarn}
          </div>
        ) : null}
        {guide && stackedGuide ? (
          <FieldGuideCard
            key={`${field.internalName}-guide`}
            guide={guide}
            stacked={true}
            motionOn={motionOn}
            visible={guideVisible}
            collapsible={true}
            defaultOpen={!props.inline}
            id={guideId}
          />
        ) : null}
      </>
    );
    const stepActions = (
      <>
        <div className={mergeClasses(styles.actions, compact && styles.actionsPinned)}>
          {backLink}
          <button type="button" className={pillClass} onClick={goNext} data-testid="wiz-ok" disabled={!!formatError}>
            {state.returnToReview && showReview ? 'Back to review' : isLast && !showReview ? 'Submit' : 'OK'}
            <Checkmark20Regular aria-hidden="true" />
          </button>
          {field.kind === 'note' ? (
            <span className={styles.hint} aria-hidden="true">
              press <strong>Ctrl + Enter</strong> &#x21b5;
            </span>
          ) : (
            enterHint
          )}
        </div>
        {state.submitError ? (
          <MessageBar intent={isSaveUnconfirmed(state) || state.saveOutcome === 'retryable' ? 'warning' : 'error'} data-testid="wiz-submit-error">
            <MessageBarBody>{state.submitError}</MessageBarBody>
          </MessageBar>
        ) : null}
        {isSaveUnconfirmed(state) ? (
          <div className={styles.actions}>
            <button
              type="button"
              className={mergeClasses(pillClass, state.saveOutcome === 'checking' && styles.pillBusy)}
              aria-disabled={state.saveOutcome === 'checking' || undefined}
              onClick={() => {
                if (stateRef.current.saveOutcome === 'unknown') {
                  checkIfSaved();
                }
              }}
              data-testid="wiz-check-saved"
            >
              {state.saveOutcome === 'checking' ? 'Checking\u2026' : 'Check if saved'}
              {state.saveOutcome === 'checking' ? <Spinner size="tiny" /> : <Clock16Regular aria-hidden="true" />}
            </button>
          </div>
        ) : null}
      </>
    );
    const stepBody = compact ? (
      <>
        <div className={styles.stepMain} data-testid="wiz-scroll">{stepMain}</div>
        <div data-testid="wiz-footer">{stepActions}</div>
      </>
    ) : (
      <>
        {stepMain}
        {stepActions}
      </>
    );
    screen = (
      <div className={mergeClasses(screenClass, compact && styles.screenFill)} data-testid="wiz-step" data-field={field.internalName}>
        {guide && !stackedGuide ? (
          <div className={styles.split}>
            <div className={styles.questionCol}>{stepBody}</div>
            <FieldGuideCard guide={guide} stacked={false} motionOn={motionOn} visible={guideVisible} id={guideId} />
          </div>
        ) : (
          stepBody
        )}
      </div>
    );
  } else if (state.phase === 'review') {
    screen = (
      <div className={mergeClasses(screenClass, styles.review, compact && styles.screenFill)} data-testid="wiz-review">
        <div className={compact ? styles.scrollArea : undefined} data-testid={compact ? 'wiz-scroll' : undefined}>
        <h2
          className={mergeClasses(styles.introTitle, compact && styles.questionCompact)}
          tabIndex={-1}
          ref={(el) => {
            focusRef.current = el;
          }}
        >
          Review your answers
        </h2>
        <div className={styles.reviewCards}>
          {visible.map((f, i) => {
            const shown = formatAnswer(f, state.answers[f.internalName], props.locale);
            return (
              <div key={f.internalName} className={styles.reviewCard} data-testid="wiz-review-card">
                <p className={styles.reviewCardQ}>{f.title}</p>
                <button
                  type="button"
                  className={styles.reviewCardEdit}
                  aria-label={`Edit answer: ${f.title}`}
                  onClick={() => edit(i)}
                  data-testid="wiz-edit"
                >
                  <Edit16Regular aria-hidden="true" />
                  Edit
                </button>
                <p className={styles.reviewCardA}>{reviewAnswer(f, state.answers[f.internalName], shown, styles, props.host)}</p>
              </div>
            );
          })}
        </div>
        </div>
        {state.submitError ? (
          <MessageBar intent={isSaveUnconfirmed(state) || state.saveOutcome === 'retryable' ? 'warning' : 'error'} data-testid="wiz-submit-error">
            <MessageBarBody>{state.submitError}</MessageBarBody>
          </MessageBar>
        ) : null}
        <div className={mergeClasses(styles.actions, compact && styles.actionsPinned)} data-testid={compact ? 'wiz-footer' : undefined}>
          {backLink}
          {isSaveUnconfirmed(state) ? (
            <button
              type="button"
              className={mergeClasses(pillClass, state.saveOutcome === 'checking' && styles.pillBusy)}
              aria-disabled={state.saveOutcome === 'checking' || undefined}
              onClick={() => {
                if (stateRef.current.saveOutcome === 'unknown') {
                  checkIfSaved();
                }
              }}
              data-testid="wiz-check-saved"
            >
              {state.saveOutcome === 'checking' ? 'Checking\u2026' : 'Check if saved'}
              {state.saveOutcome === 'checking' ? <Spinner size="tiny" /> : <Clock16Regular aria-hidden="true" />}
            </button>
          ) : null}
          <button
            type="button"
            className={mergeClasses(pillClass, state.submitting && styles.pillBusy)}
            aria-disabled={state.submitting || !canRetrySave(state) || undefined}
            onClick={() => {
              if (canRetrySave(stateRef.current)) {
                dispatch({ type: 'submitStart' });
              }
            }}
            data-testid="wiz-submit"
          >
            {state.submitting ? 'Submitting\u2026' : isSaveUnconfirmed(state) ? 'Submit' : state.submitError ? 'Try again' : 'Submit'}
            {state.submitting ? <Spinner size="tiny" /> : <Checkmark20Regular aria-hidden="true" />}
          </button>
        </div>
      </div>
    );
  } else {
    const result = state.result;
    const itemUrl = result && result.itemUrl ? isSafeListFormUrl(result.itemUrl, props.allowedOrigin || '') : '';
    const summary = finishSummary(visible, state.answers, props.locale);
    screen = (
      <div className={mergeClasses(screenClass, styles.done)} data-testid="wiz-done">
        <FinishCheck motionOn={motionOn} />
        <h2
          className={mergeClasses(styles.introTitle, compact && styles.questionCompact)}
          tabIndex={-1}
          ref={(el) => {
            focusRef.current = el;
          }}
        >
          {`Saved to ${schema.listTitle}`}
        </h2>
        {summary ? <p className={styles.doneSummary} data-testid="wiz-finish-summary">{summary}</p> : null}
        {result && result.demo ? <p className={descClass}>Preview mode: nothing was saved to SharePoint.</p> : null}
        {texts.thankYouText && texts.thankYouText !== 'Thanks, your answers were submitted.' ? <p className={descClass}>{texts.thankYouText}</p> : null}
        <div className={styles.actions}>
          <button type="button" className={pillClass} onClick={() => transition.run('forward', () => dispatch({ type: 'reset' }))} data-testid="wiz-another">
            Submit another
          </button>
          {itemUrl ? (
            <HostLink
              host={props.host}
              href={itemUrl}
              openLabel="Open item"
              copyLabel="Copy link to item"
              className={pillClass}
              testId="wiz-open-item"
            />
          ) : null}
        </div>
      </div>
    );
  }


  const canBack = state.phase === 'step' || state.phase === 'review';
  const canNext = state.phase === 'intro' || state.phase === 'step';
  const position = state.phase === 'step' ? state.index + 1 : state.phase === 'intro' ? 0 : total;
  // Visible fill: each question shows partial progress (question 1 of 4 is not an empty bar); review and done are full.
  const progressPercent = state.phase === 'step' ? Math.round(((state.index + 1) / (total + 1)) * 100) : state.phase === 'intro' ? Math.round(progressValue(state, total) * 100) : 100;

  return (
    <>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label="Form progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
        aria-valuetext={state.phase === 'done' ? 'Done' : state.phase === 'review' ? 'Review' : `Question ${position} of ${total}`}
        data-testid="wiz-progress"
      >
        <div className={mergeClasses(styles.progressFill, !motionOn && styles.progressStill)} style={{ width: `${progressPercent}%` }} />
      </div>
      <div className={styles.topBar}>
        <span className={styles.formTitle}>{state.phase === 'intro' ? '' : title}</span>
        {state.phase !== 'done' ? (
          <span className={styles.progressText} data-testid="wiz-progress-text">
            {state.phase === 'review' ? 'Review' : state.phase === 'intro' ? `${total} questions` : `${position} of ${total}`}
          </span>
        ) : null}
        {props.onExpand ? (
          <Button appearance="subtle" size="small" icon={<FullScreenMaximize20Regular />} onClick={props.onExpand} aria-label="Open the form full screen" />
        ) : null}
      </div>
      <div className={mergeClasses(styles.stage, narrow && styles.stageNarrow, props.inline && styles.stageCompact)}>
        <div
          key={key}
          className={mergeClasses(styles.stageInner, props.inline && styles.stageInnerCompact)}
          style={transition.style}
          data-testid="wiz-screen"
          data-screen={key}
        >
          {screen}
        </div>
      </div>
      {state.phase === 'intro' || state.phase === 'step' ? (
        <div className={styles.footer}>
          <div className={styles.arrows}>
            <Button className={styles.arrow} appearance="subtle" icon={<ChevronUp20Regular />} aria-label="Previous question" disabled={!canBack} onClick={goBack} data-testid="wiz-back" />
            <Button className={styles.arrow} appearance="subtle" icon={<ChevronDown20Regular />} aria-label="Next question" disabled={!canNext} onClick={goNext} data-testid="wiz-next" />
          </div>
        </div>
      ) : null}
      <div className={styles.visuallyHidden} aria-live="polite" aria-atomic="true" data-testid="wiz-live">
        {announcement}
      </div>
    </>
  );
}
