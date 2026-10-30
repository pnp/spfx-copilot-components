import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act as legacyAct } from 'react-dom/test-utils';
import { initializeIcons } from '@fluentui/react/lib/Icons';

import { resolveBrandColors } from '../brand';
import { WeeklyPulseApp, provisioningCommand, unscheduledHint } from '../components/WeeklyPulseApp';
import type { HostKind, IPulseSettings } from '../models';
import { DEFAULT_SETTINGS } from '../models';
import type { DemoScenario } from '../services/DemoPulseDataSource';
import { DemoPulseDataSource } from '../services/DemoPulseDataSource';
import type { IPulseDataSource } from '../services/IPulseDataSource';
import { PulseError } from '../services/IPulseDataSource';
import type { DemoSetupRole, IDemoSetupState } from '../setup/DemoListSetup';
import { DemoListSetup } from '../setup/DemoListSetup';
import type { IListSetup } from '../setup/IListSetup';

// React 18.3 exposes act on React itself; @types/react 18.2 doesn't declare it yet.
const act = ((React as unknown as { act?: typeof legacyAct }).act || legacyAct) as typeof legacyAct;

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
initializeIcons(undefined, { disableWarnings: true });

const NOT_SET_UP_TITLE = 'Weekly Pulse isn\u2019t set up yet';
const NOT_SET_UP_TEXT = 'Your internal communications team or a site owner needs to set it up before you can take the quiz. Check back soon.';
const NOW = (): Date => new Date('2026-10-29T09:00:00Z');
const settings: IPulseSettings = { ...DEFAULT_SETTINGS, questionsSiteUrl: 'https://fabrikam.sharepoint.com', responsesSiteUrl: 'https://fabrikam.sharepoint.com' };

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = '';
  jest.useRealTimers();
});

async function flush(ms: number = 0): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function render(opts: { scenario?: DemoScenario; host?: HostKind; s?: Partial<IPulseSettings>; reducedMotion?: boolean; dataSource?: IPulseDataSource; edit?: boolean; delay?: number; listSetup?: IListSetup } = {}): Promise<void> {
  const dataSource = opts.dataSource || new DemoPulseDataSource(opts.scenario || 'quiz', 0);
  act(() => {
    root.render(
      <WeeklyPulseApp
        dataSource={dataSource}
        settings={{ ...settings, ...opts.s }}
        colors={resolveBrandColors(undefined)}
        host={opts.host || 'WebPart'}
        now={NOW}
        isEditMode={opts.edit}
        listSetup={opts.listSetup}
        reducedMotion={opts.reducedMotion === undefined ? false : opts.reducedMotion}
        justificationDelayMs={opts.delay === undefined ? 20 : opts.delay}
      />
    );
  });
  await flush();
  await flush();
}

const q = (sel: string): HTMLElement | undefined => document.querySelector<HTMLElement>(sel) || undefined;
const text = (): string => document.body.textContent || '';

async function answer(key: string): Promise<void> {
  const input = container.querySelector(`input[value="${key}"]`) as HTMLInputElement;
  act(() => input.click());
  const submit = Array.prototype.filter.call(container.querySelectorAll('button'), (b: HTMLButtonElement) => b.textContent === 'Submit')[0] as HTMLButtonElement;
  act(() => submit.click());
  await flush();
  await flush();
}

describe('WeeklyPulseApp', () => {
  it('shows the question, week number, privacy line and no result yet', async () => {
    await render();
    expect(text()).toContain('How often is the company-wide newsletter sent out?');
    expect(q('.wpq__week')?.textContent).toBe('Week 44');
    expect(text()).toContain("Your answer isn't shown to colleagues.");
    expect(q('[data-testid="wpq-result"]')).toBeUndefined();
    expect(q('.wpq')?.className).toContain('wpq--motion');
  });

  it('correct answer: check icon, chosen option filled, announcement, then the dialog after the delay', async () => {
    await render({ delay: 400 });
    await answer('C');
    expect(q('[data-testid="wpq-result"]')?.getAttribute('data-outcome')).toBe('correct');
    expect(q('.wpq__check')).toBeDefined();
    expect(q('[data-choice="C"]')?.className).toContain('wpq__option--correct');
    expect(q('[data-testid="wpq-live"]')?.textContent).toBe('Correct. C. Every Thursday.');
    expect(q('[data-testid="wpq-dialog"]')).toBeUndefined();
    await flush(450);
    expect(q('[data-testid="wpq-dialog"]')).toBeDefined();
    expect(text()).toContain('Why C is right');
    expect(q('[data-testid="wpq-justification"]')?.textContent).toContain('every Thursday at 09:00');
  });

  it('wrong answer: calm X, right option highlighted, "Correct answer: C. ..." shown', async () => {
    await render();
    await answer('A');
    expect(q('[data-testid="wpq-result"]')?.getAttribute('data-outcome')).toBe('incorrect');
    expect(q('.wpq__x')).toBeDefined();
    expect(q('[data-choice="C"]')?.className).toContain('wpq__option--correct');
    expect(q('[data-choice="A"]')?.className).toContain('wpq__option--wrong');
    expect(text()).toContain('Correct answer: C. Every Thursday');
    expect(q('[data-testid="wpq-live"]')?.textContent).toBe('Not quite. Correct answer: C. Every Thursday.');
  });

  it('wrong answer with reveal off: no correct option and no dialog', async () => {
    await render({ s: { showCorrectAnswer: false } });
    await answer('A');
    expect(q('[data-choice="C"]')?.className).not.toContain('wpq__option--correct');
    expect(text()).not.toContain('Correct answer:');
    await flush(40);
    expect(q('[data-testid="wpq-dialog"]')).toBeUndefined();
  });

  it('no justification: no dialog and no "Why" link', async () => {
    await render({ scenario: 'no-justification' });
    await answer('B');
    await flush(40);
    expect(q('[data-testid="wpq-dialog"]')).toBeUndefined();
    expect(text()).not.toContain('is right?');
  });

  it('poll: thanks, no right/wrong marks', async () => {
    await render({ scenario: 'poll' });
    await answer('A');
    expect(q('[data-testid="wpq-result"]')?.getAttribute('data-outcome')).toBe('poll');
    expect(q('.wpq__option--correct')).toBeUndefined();
    expect(text()).toContain('Thanks for answering');
  });

  it('no quiz this week', async () => {
    await render({ scenario: 'no-quiz' });
    expect(q('[data-testid="wpq-no-quiz"]')?.textContent).toBe(DEFAULT_SETTINGS.noQuizText);
    expect(q('[data-testid="wpq-week-note"]')).toBeUndefined();
  });

  it('no quiz, edit mode: tells the editor which QuizYear and WeekNumber to set, and how many questions have no week', async () => {
    await render({ scenario: 'no-quiz', edit: true });
    await flush();
    expect(q('[data-testid="wpq-week-note"]')?.textContent).toBe(
      'Editor note: Set QuizYear 2026 and WeekNumber 44 on a question in \u201cWeekly Pulse Questions\u201d (the current ISO week in UTC). 2 questions have no week yet.'
    );
  });

  it('unscheduledHint wording', () => {
    expect(unscheduledHint(0)).toBe('');
    expect(unscheduledHint(1)).toBe(' 1 question has no week yet.');
    expect(unscheduledHint(100)).toBe(' 100+ questions have no week yet.');
  });

  it('save error: an alert, no feedback, the answer can be retried', async () => {
    await render({ scenario: 'save-error' });
    await answer('C');
    expect(q('[role="alert"]')?.textContent).toContain("couldn't be saved");
    expect(q('[data-testid="wpq-result"]')).toBeUndefined();
    expect(q('[data-testid="wpq-live"]')?.textContent).toBe('');
    expect((container.querySelector('input[value="C"]') as HTMLInputElement).disabled).toBe(false);
  });

  it('already answered: restores the result without animation or pop-up', async () => {
    await render({ scenario: 'answered' });
    expect(text()).toContain('You answered this week');
    expect(q('[data-choice="B"]')?.className).toContain('wpq__option--wrong');
    await flush(40);
    expect(q('[data-testid="wpq-dialog"]')).toBeUndefined();
    expect(q('[data-testid="wpq-live"]')?.textContent).toBe('');
  });

  it('Copilot: an inline "Why?" panel instead of a dialog', async () => {
    await render({ host: 'Copilot' });
    await answer('C');
    await flush(40);
    expect(q('[data-testid="wpq-dialog"]')).toBeUndefined();
    const panel = q('[data-testid="wpq-why-panel"]');
    expect(panel).toBeDefined();
    expect(panel?.textContent).toContain('Why C is right');
  });

  it('Read more / Show less for long justifications', async () => {
    const long = 'The newsletter is sent every Thursday morning so it reaches everyone before the Friday meetings. '.repeat(4);
    const base = new DemoPulseDataSource('quiz', 0);
    const ds: IPulseDataSource = {
      isDemo: true,
      loadQuestion: async (w) => {
        const sel = await base.loadQuestion(w);
        return { ...sel, question: sel.question ? { ...sel.question, justification: long.trim() } : undefined };
      },
      getMyResponse: async () => undefined,
      submitResponse: async () => undefined
    };
    await render({ host: 'Copilot', dataSource: ds });
    await answer('C');
    await flush(40);
    const justification = q('[data-testid="wpq-justification"]') as HTMLElement;
    expect(justification.textContent?.length).toBeLessThanOrEqual(201);
    const toggle = Array.prototype.filter.call(document.querySelectorAll('button'), (b: HTMLButtonElement) => b.textContent === 'Read more')[0] as HTMLButtonElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    act(() => toggle.click());
    expect(justification.textContent).toBe(long.trim());
    expect(toggle.textContent).toBe('Show less');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('reduced motion or the Animations toggle switch motion off', async () => {
    await render({ reducedMotion: true });
    expect(q('.wpq')?.className).toContain('wpq--static');
    act(() => root.unmount());
    root = createRoot(container);
    await render({ s: { animations: false } });
    expect(q('.wpq')?.className).toContain('wpq--static');
  });

  it('edit mode: missing Responses list shows the script command', async () => {
    const base = new DemoPulseDataSource('quiz', 0);
    const ds: IPulseDataSource = {
      isDemo: false,
      loadQuestion: (w) => base.loadQuestion(w),
      getMyResponse: async () => {
        throw new PulseError('responses-list-missing', 'missing');
      },
      submitResponse: async () => undefined
    };
    await render({ dataSource: ds, edit: true, s: { responsesSiteUrl: 'https://fabrikam.sharepoint.com/sites/pulse' } });
    expect(text()).toContain('./provisioning/Provision-WeeklyPulse.ps1 -SiteUrl "https://fabrikam.sharepoint.com" -ResponsesSiteUrl "https://fabrikam.sharepoint.com/sites/pulse"');
  });

  describe('not set up yet (view mode and Copilot)', () => {
    const tryAgain = (): HTMLButtonElement | undefined =>
      Array.prototype.filter.call(document.querySelectorAll('button'), (b: HTMLButtonElement) => b.textContent === 'Try again')[0] as HTMLButtonElement | undefined;
    const failing = (kind: 'questions-list-missing' | 'forbidden' | 'failed'): IPulseDataSource => ({
      isDemo: false,
      loadQuestion: async () => {
        throw new PulseError(kind, 'raw error');
      },
      getMyResponse: async () => undefined,
      submitResponse: async () => undefined
    });
    const responsesMissing = (): IPulseDataSource => {
      const base = new DemoPulseDataSource('quiz', 0);
      return {
        isDemo: false,
        loadQuestion: (w) => base.loadQuestion(w),
        getMyResponse: async () => {
          throw new PulseError('responses-list-missing', 'raw error');
        },
        submitResponse: async () => undefined
      };
    };

    it('web part view mode, Questions list missing: friendly notice, no Try again', async () => {
      await render({ dataSource: failing('questions-list-missing') });
      const notice = q('[data-testid="wpq-not-set-up"]')!;
      expect(notice.querySelector('h3')?.textContent).toBe(NOT_SET_UP_TITLE);
      expect(notice.textContent).toContain(NOT_SET_UP_TEXT);
      expect(tryAgain()).toBeUndefined();
      expect(text()).not.toContain('raw error');
      expect(text()).not.toContain("isn\u2019t available right now");
    });

    it('Copilot component, Questions list missing: the same notice', async () => {
      await render({ host: 'Copilot', dataSource: failing('questions-list-missing') });
      expect(q('[data-host="Copilot"] [data-testid="wpq-not-set-up"]')?.textContent).toBe(NOT_SET_UP_TITLE + NOT_SET_UP_TEXT);
      expect(tryAgain()).toBeUndefined();
    });

    it('Responses list missing in view mode or Copilot: the notice instead of a question that can\'t be saved', async () => {
      await render({ dataSource: responsesMissing() });
      expect(q('[data-testid="wpq-not-set-up"]')).toBeDefined();
      expect(container.querySelector('input[type="radio"]')).toBeNull();
      act(() => root.unmount());
      root = createRoot(container);
      await render({ host: 'Copilot', dataSource: responsesMissing() });
      expect(q('[data-testid="wpq-not-set-up"]')).toBeDefined();
      expect(text()).not.toContain('raw error');
    });

    it('other errors keep the old message and Try again', async () => {
      for (const kind of ['forbidden', 'failed'] as const) {
        act(() => root.unmount());
        root = createRoot(container);
        await render({ dataSource: failing(kind), host: kind === 'failed' ? 'Copilot' : 'WebPart' });
        expect(text()).toContain("The Weekly Pulse isn\u2019t available right now.");
        expect(tryAgain()).toBeDefined();
        expect(q('[data-testid="wpq-not-set-up"]')).toBeUndefined();
      }
    });
  });

  it('provisioningCommand omits -ResponsesSiteUrl when both lists share a site', () => {
    expect(provisioningCommand(settings)).toBe('./provisioning/Provision-WeeklyPulse.ps1 -SiteUrl "https://fabrikam.sharepoint.com"');
  });

  describe('Set up lists', () => {
    const SITE = 'https://fabrikam.sharepoint.com';
    const button = (label: string): HTMLButtonElement | undefined =>
      Array.prototype.filter.call(document.querySelectorAll('button'), (b: HTMLButtonElement) => b.textContent === label)[0] as HTMLButtonElement | undefined;

    async function renderNotSetUp(role: DemoSetupRole, edit: boolean): Promise<{ state: IDemoSetupState; setup: DemoListSetup }> {
      const state: IDemoSetupState = { ready: false };
      const setup = new DemoListSetup(role, state, SITE, 0);
      await render({ dataSource: new DemoPulseDataSource('not-set-up', 0, state), edit, listSetup: setup });
      return { state, setup };
    }

    it('site owner in edit mode: button, confirm dialog with the site, progress, success, quiz reloads', async () => {
      const { state } = await renderNotSetUp('owner', true);
      expect(text()).toContain("The Weekly Pulse isn\u2019t available right now.");
      expect(q('[data-testid="wpq-setup-button"]')).toBeDefined();
      expect(text()).toContain('Prefer a script? Run ./provisioning/Provision-WeeklyPulse.ps1');

      act(() => q('[data-testid="wpq-setup-button"]')!.click());
      await flush();
      const plan = q('[data-testid="wpq-setup-plan"]')!;
      expect(plan.textContent).toContain(`On ${SITE}`);
      expect(plan.textContent).toContain('"Weekly Pulse Responses" list');
      expect(plan.textContent).toContain('nothing is deleted');
      expect(state.ready).toBe(false);

      act(() => q('[data-testid="wpq-setup-confirm"]')!.click());
      await flush(20);
      await flush();
      expect(state.ready).toBe(true);
      expect(q('[data-testid="wpq-setup-done"]')?.textContent).toContain('The lists are ready.');
      expect(document.querySelectorAll('[data-testid="wpq-setup-steps"] [data-status="done"]').length).toBe(13);
      // Reloaded: this week's question shows and the setup panel is gone.
      expect(text()).toContain('How often is the company-wide newsletter sent out?');
      expect(q('[data-testid="wpq-setup-button"]')).toBeUndefined();

      act(() => q('[data-testid="wpq-setup-close"]')!.click());
      await flush();
      expect(q('[data-testid="wpq-setup-dialog"]')).toBeUndefined();
    });

    it('cancel closes the confirm dialog without running anything', async () => {
      const { state } = await renderNotSetUp('owner', true);
      act(() => q('[data-testid="wpq-setup-button"]')!.click());
      await flush();
      act(() => button('Cancel')!.click());
      await flush();
      expect(q('[data-testid="wpq-setup-dialog"]')).toBeUndefined();
      expect(state.ready).toBe(false);
    });

    it('member without Full Control in edit mode: no button, a short note instead', async () => {
      await renderNotSetUp('member', true);
      expect(q('[data-testid="wpq-setup-button"]')).toBeUndefined();
      expect(q('[data-testid="wpq-setup-noaccess"]')?.textContent).toContain('needs Full Control (Manage lists and Manage permissions)');
    });

    it('reader in view mode: the friendly message only, no button, no permission check', async () => {
      const state: IDemoSetupState = { ready: false };
      const setup = new DemoListSetup('reader', state, SITE, 0);
      const inspect = jest.spyOn(setup, 'inspect');
      await render({ dataSource: new DemoPulseDataSource('not-set-up', 0, state), edit: false, listSetup: setup });
      expect(q('[data-testid="wpq-not-set-up"]')?.textContent).toBe(NOT_SET_UP_TITLE + NOT_SET_UP_TEXT);
      expect(text()).not.toContain("The Weekly Pulse isn\u2019t available right now.");
      expect(button('Try again')).toBeUndefined();
      expect(q('[data-testid="wpq-setup"]')).toBeUndefined();
      expect(q('[data-testid="wpq-setup-noaccess"]')).toBeUndefined();
      expect(text()).not.toContain('Provision-WeeklyPulse');
      expect(inspect).not.toHaveBeenCalled();
    });

    it('owner in view mode: no button either', async () => {
      await renderNotSetUp('owner', false);
      expect(q('[data-testid="wpq-setup-button"]')).toBeUndefined();
      expect(q('[data-testid="wpq-not-set-up"]')).toBeDefined();
    });

    it('edit mode keeps the setup panel and the old message, not the viewer notice', async () => {
      await renderNotSetUp('owner', true);
      expect(q('[data-testid="wpq-not-set-up"]')).toBeUndefined();
      expect(text()).toContain("The Weekly Pulse isn\u2019t available right now.");
      expect(button('Try again')).toBeDefined();
    });

    it('a failed step shows the error and Try again', async () => {
      const failing: IListSetup = {
        describe: () => [{ siteUrl: SITE, items: ['x'] }],
        inspect: async () => ({ missingLists: [{ title: 'Weekly Pulse Responses', siteUrl: SITE }], sites: [{ siteUrl: SITE, canManageLists: true, canManagePermissions: true, canManageWeb: true }], canSetUp: true }),
        run: async () => ({
          ok: false,
          steps: [{ id: 'responses-break', label: 'Unique permissions', siteUrl: SITE, status: 'failed', detail: 'you need Full Control' }],
          error: `Couldn't break permissions on "Weekly Pulse Responses": you need Full Control on ${SITE}`,
          warnings: []
        })
      };
      await render({ edit: true, listSetup: failing });
      act(() => q('[data-testid="wpq-setup-button"]')!.click());
      await flush();
      act(() => q('[data-testid="wpq-setup-confirm"]')!.click());
      await flush();
      expect(q('[data-testid="wpq-setup-error"]')?.textContent).toContain("Couldn't break permissions on \"Weekly Pulse Responses\": you need Full Control");
      expect(q('[data-testid="wpq-setup-retry"]')).toBeDefined();
    });

    it('nothing missing: no setup panel in edit mode', async () => {
      await render({ edit: true, listSetup: new DemoListSetup('owner', { ready: true }, SITE, 0) });
      expect(q('[data-testid="wpq-setup"]')).toBeUndefined();
      expect(text()).toContain('How often is the company-wide newsletter sent out?');
    });
  });
});
