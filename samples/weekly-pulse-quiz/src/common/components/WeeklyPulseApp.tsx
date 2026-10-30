import * as React from 'react';
import { Dialog, DialogFooter, DialogType } from '@fluentui/react/lib/Dialog';

import type { IBrandColors } from '../brand';
import { brandCssVariables } from '../brand';
import type { IFeedback } from '../logic/feedback';
import { evaluateAnswer, isMotionEnabled, JUSTIFICATION_DELAY_MS, justificationPresentation, prefersReducedMotion } from '../logic/feedback';
import type { IIsoWeek } from '../logic/isoWeek';
import { formatWeekLabel, getIsoWeek } from '../logic/isoWeek';
import type { ChoiceKey, HostKind, IPulseSettings, IQuizQuestion } from '../models';
import { QUIZ_TIME_ZONE } from '../models';
import type { IPulseDataSource } from '../services/IPulseDataSource';
import { PulseError } from '../services/IPulseDataSource';
import { ensureStyles } from '../styles';
import { JustificationText } from './JustificationText';
import { ResultIcon } from './ResultIcon';
import { SetupLists } from './SetupLists';
import type { IListSetup } from '../setup/IListSetup';

export interface IWeeklyPulseAppProps {
  dataSource: IPulseDataSource;
  settings: IPulseSettings;
  colors: IBrandColors;
  host: HostKind;
  isEditMode?: boolean;
  /** "Set up lists" (edit mode only; the button itself also needs Full Control on the site). */
  listSetup?: IListSetup;
  /** Test/preview hooks */
  now?: () => Date;
  reducedMotion?: boolean;
  justificationDelayMs?: number;
  targetDocument?: Document;
}

type Phase = 'loading' | 'error' | 'no-quiz' | 'ready' | 'submitting' | 'answered';

interface IState {
  phase: Phase;
  week?: IIsoWeek;
  question?: IQuizQuestion;
  isCarryOver: boolean;
  sameWeekCount: number;
  selected?: ChoiceKey;
  feedback?: IFeedback;
  /** True right after this visit's submit (animate + announce); false when restoring an earlier answer. */
  fresh: boolean;
  loadError?: PulseError;
  responsesWarning?: PulseError;
  saveError?: string;
}

const INITIAL: IState = { phase: 'loading', isCarryOver: false, sameWeekCount: 0, fresh: false };

function asPulseError(error: unknown): PulseError {
  return error instanceof PulseError ? error : new PulseError('failed', error instanceof Error ? error.message : String(error));
}

/** " 2 questions have no week yet." (with a leading space), or nothing. */
export function unscheduledHint(count: number): string {
  if (count <= 0) return '';
  const n = count >= 100 ? '100+' : String(count);
  return ` ${n} ${count === 1 ? 'question has' : 'questions have'} no week yet.`;
}

export function provisioningCommand(settings: IPulseSettings): string {
  const responses = settings.responsesSiteUrl && settings.responsesSiteUrl !== settings.questionsSiteUrl ? ` -ResponsesSiteUrl "${settings.responsesSiteUrl}"` : '';
  return `./provisioning/Provision-WeeklyPulse.ps1 -SiteUrl "${settings.questionsSiteUrl}"${responses}`;
}

export function WeeklyPulseApp(props: IWeeklyPulseAppProps): React.ReactElement {
  const { dataSource, settings, host } = props;
  const [state, setState] = React.useState<IState>(INITIAL);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [whyOpen, setWhyOpen] = React.useState(false);
  const [announcement, setAnnouncement] = React.useState('');
  const [unscheduled, setUnscheduled] = React.useState(0);
  const timer = React.useRef<number | undefined>(undefined);
  const mounted = React.useRef(true);
  const idBase = React.useRef(`wpq-${Math.random().toString(36).slice(2, 8)}`).current;

  const doc = props.targetDocument || (typeof document !== 'undefined' ? document : undefined);
  const reduced = props.reducedMotion !== undefined ? props.reducedMotion : prefersReducedMotion(doc?.defaultView || undefined);
  const motion = isMotionEnabled(settings.animations, reduced);
  const delay = props.justificationDelayMs !== undefined ? props.justificationDelayMs : JUSTIFICATION_DELAY_MS;
  const settingsKey = JSON.stringify(settings);
  const feedbackOptions = { showCorrectAnswer: settings.showCorrectAnswer, showJustification: settings.showJustification };

  React.useEffect(() => ensureStyles(doc), [doc]);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current !== undefined) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  const load = React.useCallback(async (): Promise<void> => {
    setState(INITIAL);
    setDialogOpen(false);
    setWhyOpen(false);
    setAnnouncement('');
    const week = getIsoWeek(props.now ? props.now() : new Date());
    try {
      const selection = await dataSource.loadQuestion(week);
      if (!mounted.current) return;
      if (!selection.question) {
        setState({ ...INITIAL, phase: 'no-quiz', week });
        return;
      }
      const question = selection.question;
      let responsesWarning: PulseError | undefined;
      let existing;
      try {
        existing = await dataSource.getMyResponse(question);
      } catch (error) {
        responsesWarning = asPulseError(error);
      }
      if (!mounted.current) return;
      const base = { ...INITIAL, week, question, isCarryOver: selection.isCarryOver, sameWeekCount: selection.sameWeekCount, responsesWarning };
      if (existing) {
        setState({ ...base, phase: 'answered', selected: existing.choice, feedback: evaluateAnswer(question, existing.choice, feedbackOptions) });
      } else {
        setState({ ...base, phase: 'ready' });
      }
    } catch (error) {
      if (mounted.current) {
        setState({ ...INITIAL, phase: 'error', week, loadError: asPulseError(error) });
      }
    }
  }, [dataSource, settingsKey]);

  React.useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  // Editors only, and only when this week has no question: count questions that have no week yet.
  const needsWeekHint = !!props.isEditMode && (state.phase === 'no-quiz' || state.isCarryOver);
  React.useEffect(() => {
    setUnscheduled(0);
    if (!needsWeekHint || !dataSource.countUnscheduled) {
      return;
    }
    dataSource
      .countUnscheduled()
      .then((n) => {
        if (mounted.current) setUnscheduled(n);
      })
      .catch(() => undefined);
  }, [needsWeekHint, dataSource, settingsKey]);

  const submit = async (): Promise<void> => {
    const { question, selected } = state;
    if (!question || !selected || state.phase !== 'ready') return;
    const feedback = evaluateAnswer(question, selected, feedbackOptions);
    setState((s) => ({ ...s, phase: 'submitting', saveError: undefined }));
    setAnnouncement('');
    try {
      await dataSource.submitResponse(question, feedback);
    } catch {
      // Never show feedback for an answer that was not saved.
      if (mounted.current) {
        setState((s) => ({ ...s, phase: 'ready', saveError: "Your answer couldn't be saved. Please try again." }));
      }
      return;
    }
    if (!mounted.current) return;
    setState((s) => ({ ...s, phase: 'answered', feedback, fresh: true }));
    setAnnouncement(feedback.announcement);
    const presentation = justificationPresentation(feedback, host);
    if (presentation !== 'none') {
      timer.current = window.setTimeout(() => {
        if (!mounted.current) return;
        if (presentation === 'dialog') setDialogOpen(true);
        else setWhyOpen(true);
      }, delay);
    }
  };

  const { phase, question, feedback, week } = state;
  const answered = phase === 'answered' && !!feedback;
  const presentation = justificationPresentation(feedback, host);
  const style = brandCssVariables(props.colors) as React.CSSProperties;
  const rootClass = `wpq ${motion ? 'wpq--motion' : 'wpq--static'}`;
  const weekLabel = question ? formatWeekLabel(question.year, question.week) : week ? week.label : '';
  const edit = !!props.isEditMode;

  const optionClass = (key: ChoiceKey): string => {
    const classes = ['wpq__option'];
    if (phase === 'answered' || phase === 'submitting') classes.push('wpq__option--locked');
    if (answered && feedback) {
      if (feedback.revealChoice === key) classes.push('wpq__option--correct');
      else if (feedback.chosen === key && feedback.outcome === 'incorrect') classes.push('wpq__option--wrong');
      else if (feedback.chosen === key) classes.push('wpq__option--selected');
    } else if (state.selected === key) {
      classes.push('wpq__option--selected');
    }
    return classes.join(' ');
  };

  const optionTag = (key: ChoiceKey): string => {
    if (!answered || !feedback) return '';
    if (feedback.outcome === 'poll') return feedback.chosen === key ? 'Your answer' : '';
    if (feedback.chosen === key && feedback.revealChoice === key) return 'Your answer \u2013 correct';
    if (feedback.chosen === key) return 'Your answer';
    if (feedback.revealChoice === key) return 'Correct answer';
    return '';
  };

  const notices: React.ReactNode[] = [];
  if (dataSource.isDemo) {
    notices.push(<p key="demo" className="wpq__notice">Preview data &ndash; nothing is saved. Connect it to SharePoint by adding the web part to a page.</p>);
  }
  const setupAvailable = edit && !!props.listSetup;
  if (setupAvailable && props.listSetup) {
    notices.push(
      <SetupLists
        key="setup"
        setup={props.listSetup}
        scriptCommand={provisioningCommand(settings)}
        onComplete={() => {
          load().catch(() => undefined);
        }}
        style={style}
        motionClass={motion ? 'wpq--motion' : 'wpq--static'}
      />
    );
  }
  if (edit && state.isCarryOver && week && question) {
    notices.push(
      <p key="carry" className="wpq__notice">
        Editor note: there is no question for {week.label} yet, so {weekLabel}&rsquo;s question is still showing. Set QuizYear {week.year} and
        WeekNumber {week.week} on a question in &ldquo;{settings.questionsListTitle}&rdquo; (the current ISO week in {QUIZ_TIME_ZONE}).
        {unscheduledHint(unscheduled)}
      </p>
    );
  }
  if (edit && state.sameWeekCount > 1) {
    notices.push(
      <p key="dupe" className="wpq__notice">
        Editor note: {state.sameWeekCount} active questions are scheduled for {weekLabel}. The newest one is shown; set IsActive = No on the others.
      </p>
    );
  }
  if (edit && state.responsesWarning && !(setupAvailable && state.responsesWarning.kind === 'responses-list-missing')) {
    notices.push(
      <p key="resp" className="wpq__notice">
        Editor note: the Responses list &ldquo;{settings.responsesListTitle}&rdquo; can&rsquo;t be reached on {settings.responsesSiteUrl}. Answers can&rsquo;t be saved until it exists. Ask a site owner to run:{' '}
        <code>{provisioningCommand(settings)}</code>
      </p>
    );
  }

  const header = (
    <div className="wpq__banner">
      <div>
        <h2 className="wpq__title">{settings.bannerTitle}</h2>
        {settings.introText && <p className="wpq__intro">{settings.introText}</p>}
      </div>
      {weekLabel && <span className="wpq__week">Week {weekLabel.split('-W')[1].replace(/^0/, '')}</span>}
    </div>
  );

  // View mode and Copilot (never edit mode): a list is missing, so there's nothing anyone but a site owner can do.
  const notSetUp =
    !edit &&
    ((phase === 'error' && state.loadError?.kind === 'questions-list-missing') ||
      (!!question && (phase === 'ready' || phase === 'answered') && state.responsesWarning?.kind === 'responses-list-missing'));

  let body: React.ReactNode;
  if (notSetUp) {
    body = (
      <div className="wpq__setup wpq__notSetUp" data-testid="wpq-not-set-up">
        <h3 className="wpq__setupTitle">Weekly Pulse isn&rsquo;t set up yet</h3>
        <p>Your internal communications team or a site owner needs to set it up before you can take the quiz. Check back soon.</p>
      </div>
    );
  } else if (phase === 'loading') {
    body = <p className="wpq__muted">Loading this week&rsquo;s question&hellip;</p>;
  } else if (phase === 'error') {
    const missing = state.loadError && state.loadError.kind === 'questions-list-missing';
    body = (
      <div>
        <p className="wpq__empty">The Weekly Pulse isn&rsquo;t available right now.</p>
        {edit && !(missing && setupAvailable) && (
          <p className="wpq__notice">
            Editor note: {missing ? `the list "${settings.questionsListTitle}" was not found on ${settings.questionsSiteUrl}. Ask a site owner to run: ` : state.loadError?.message}
            {missing && <code>{provisioningCommand(settings)}</code>}
          </p>
        )}
        <div className="wpq__actions">
          <button type="button" className="wpq__button wpq__button--secondary" onClick={() => load()}>Try again</button>
        </div>
      </div>
    );
  } else if (phase === 'no-quiz' || !question) {
    body = (
      <div>
        <p className="wpq__empty" data-testid="wpq-no-quiz">{settings.noQuizText}</p>
        {edit && week && (
          <p className="wpq__notice" data-testid="wpq-week-note">
            Editor note: Set QuizYear {week.year} and WeekNumber {week.week} on a question in &ldquo;{settings.questionsListTitle}&rdquo; (the current ISO
            week in {QUIZ_TIME_ZONE}).
            {unscheduledHint(unscheduled)}
          </p>
        )}
      </div>
    );
  } else {
    const locked = phase !== 'ready';
    body = (
      <div>
        <fieldset className="wpq__fieldset" aria-describedby={`${idBase}-privacy`}>
          <legend className="wpq__question">{question.title}</legend>
          <div className="wpq__options">
            {question.choices.map((c) => (
              <label key={c.key} className={optionClass(c.key)} data-choice={c.key}>
                <input
                  type="radio"
                  name={`${idBase}-choice`}
                  value={c.key}
                  checked={(answered ? feedback?.chosen : state.selected) === c.key}
                  disabled={locked}
                  onChange={() => setState((s) => ({ ...s, selected: c.key, saveError: undefined }))}
                />
                <span className="wpq__letter" aria-hidden="true">{c.key}</span>
                <span className="wpq__optionText">
                  <span className="wpq__sr">{c.key}. </span>
                  {c.text}
                </span>
                {optionTag(c.key) && <span className="wpq__tag">{optionTag(c.key)}</span>}
              </label>
            ))}
          </div>
        </fieldset>

        {!answered && (
          <div className="wpq__actions">
            <button type="button" className="wpq__button" disabled={!state.selected || phase === 'submitting'} onClick={() => submit()}>
              {phase === 'submitting' ? 'Saving\u2026' : 'Submit'}
            </button>
            <p className="wpq__privacy" id={`${idBase}-privacy`}>
              {settings.anonymityMode === 'Named' ? 'Your name is saved with your answer.' : "Your answer isn't shown to colleagues."}
            </p>
          </div>
        )}
        {state.saveError && (
          <div className="wpq__error" role="alert">
            {state.saveError}
          </div>
        )}

        {answered && feedback && (
          <div className="wpq__result" data-testid="wpq-result" data-outcome={feedback.outcome}>
            <ResultIcon outcome={feedback.outcome} />
            <div className="wpq__resultText">
              <p className="wpq__headline">{state.fresh ? feedback.headline : `You answered this week \u2013 ${feedback.headline.toLowerCase()}`}</p>
              {feedback.revealText && <p className="wpq__reveal">{feedback.revealText}</p>}
              {feedback.outcome === 'poll' && <p className="wpq__reveal">Your answer was saved. Results are shared by the quiz master.</p>}
              {presentation !== 'none' && (
                <p className="wpq__reveal">
                  <button
                    type="button"
                    className="wpq__link"
                    aria-expanded={presentation === 'inline' ? whyOpen : undefined}
                    aria-controls={presentation === 'inline' ? `${idBase}-why` : undefined}
                    onClick={() => (presentation === 'dialog' ? setDialogOpen(true) : setWhyOpen(!whyOpen))}
                  >
                    {presentation === 'inline' && whyOpen ? 'Hide explanation' : `${feedback.justificationTitle}?`}
                  </button>
                </p>
              )}
            </div>
          </div>
        )}

        {answered && feedback && presentation === 'inline' && whyOpen && (
          <section className="wpq__why" id={`${idBase}-why`} aria-label={feedback.justificationTitle} data-testid="wpq-why-panel">
            <p className="wpq__whyTitle">{feedback.justificationTitle}</p>
            <JustificationText text={feedback.justification} id={`${idBase}-why-text`} />
          </section>
        )}
      </div>
    );
  }

  return (
    <div className={rootClass} style={style} data-host={host}>
      {header}
      <div className="wpq__body">
        {notices}
        {body}
      </div>
      <div className="wpq__sr" role="status" aria-live="polite" aria-atomic="true" data-testid="wpq-live">
        {announcement}
      </div>
      {presentation === 'dialog' && feedback && (
        <Dialog
          hidden={!dialogOpen}
          onDismiss={() => setDialogOpen(false)}
          dialogContentProps={{ type: DialogType.normal, title: feedback.justificationTitle }}
          modalProps={{ isBlocking: false, className: `${motion ? 'wpq--motion' : 'wpq--static'}` }}
        >
          <div className="wpq__dialogBody" style={style} data-testid="wpq-dialog">
            <JustificationText text={feedback.justification} id={`${idBase}-dialog-text`} />
          </div>
          <DialogFooter>
            <button type="button" className="wpq__button" style={style} onClick={() => setDialogOpen(false)}>
              Close
            </button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
}
