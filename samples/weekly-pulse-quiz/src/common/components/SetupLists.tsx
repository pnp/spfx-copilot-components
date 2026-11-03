import * as React from 'react';
import { Dialog, DialogFooter, DialogType } from '@fluentui/react/lib/Dialog';

import type { IListSetup, ISetupInspection, ISetupResult, ISetupStep } from '../setup/IListSetup';

export interface ISetupListsProps {
  setup: IListSetup;
  /** The script, offered as the alternative. */
  scriptCommand: string;
  /** Called after a successful run so the quiz reloads. */
  onComplete: () => void;
  /** Brand CSS variables (the dialog renders in a layer outside the web part). */
  style: React.CSSProperties;
  motionClass: string;
}

type DialogStage = 'closed' | 'confirm' | 'running' | 'done' | 'failed';

const MARK: { [status: string]: string } = { done: '\u2713', skipped: '\u2013', running: '\u2026', failed: '\u2715', pending: '\u25CB' };
const STATUS_TEXT: { [status: string]: string } = { done: 'Done', skipped: 'Already there', running: 'In progress', failed: 'Failed', pending: 'Waiting' };

/**
 * Edit-mode panel: "Set up lists" for people with Manage lists + Manage permissions on the target site(s).
 * Everyone else gets a short note (and readers in view mode never see this component).
 */
export function SetupLists(props: ISetupListsProps): React.ReactElement {
  const { setup } = props;
  const [inspection, setInspection] = React.useState<ISetupInspection | undefined>(undefined);
  const [stage, setStage] = React.useState<DialogStage>('closed');
  const [steps, setSteps] = React.useState<ISetupStep[]>([]);
  const [result, setResult] = React.useState<ISetupResult | undefined>(undefined);
  const mounted = React.useRef(true);

  const inspect = React.useCallback(async (): Promise<void> => {
    try {
      const value = await setup.inspect();
      if (mounted.current) setInspection(value);
    } catch {
      if (mounted.current) setInspection(undefined);
    }
  }, [setup]);

  React.useEffect(() => {
    mounted.current = true;
    inspect().catch(() => undefined);
    return () => {
      mounted.current = false;
    };
  }, [inspect]);

  const run = async (): Promise<void> => {
    setStage('running');
    setResult(undefined);
    let outcome: ISetupResult;
    try {
      outcome = await setup.run((s) => mounted.current && setSteps(s));
    } catch (error) {
      outcome = { ok: false, steps, error: error instanceof Error ? error.message : String(error), warnings: [] };
    }
    if (!mounted.current) return;
    setSteps(outcome.steps);
    setResult(outcome);
    setStage(outcome.ok ? 'done' : 'failed');
    if (outcome.ok) {
      props.onComplete();
      inspect().catch(() => undefined);
    }
  };

  const plan = setup.describe();
  const dialogOpen = stage !== 'closed';
  const panelNeeded = !!inspection && inspection.missingLists.length > 0;

  let panel: React.ReactNode = null;
  if (panelNeeded && inspection) {
    const missing = inspection.missingLists.map((m) => `\u201C${m.title}\u201D`).join(', ');
    if (inspection.canSetUp) {
      panel = (
        <div className="wpq__setup" data-testid="wpq-setup">
          <p className="wpq__setupTitle">Weekly Pulse isn&rsquo;t set up on this site yet</p>
          <p>Missing: {missing}. You can create the lists, columns and permissions it needs in one step.</p>
          <div className="wpq__actions">
            <button type="button" className="wpq__button" onClick={() => setStage('confirm')} data-testid="wpq-setup-button">
              Set up lists
            </button>
          </div>
          <p className="wpq__setupAlt" style={{ marginTop: 10 }}>
            Prefer a script? Run <code>{props.scriptCommand}</code>
          </p>
        </div>
      );
    } else {
      const sites = inspection.sites.filter((s) => !(s.canManageLists && s.canManagePermissions)).map((s) => s.siteUrl);
      panel = (
        <div className="wpq__setup" data-testid="wpq-setup-noaccess">
          <p className="wpq__setupTitle">Weekly Pulse isn&rsquo;t set up on this site yet</p>
          <p>
            Missing: {missing}. Setting it up needs Full Control (Manage lists and Manage permissions) on {sites.join(' and ')}. Ask a site owner to open this page in
            edit mode and select <strong>Set up lists</strong>, or to run <code>{props.scriptCommand}</code>
          </p>
        </div>
      );
    }
  }

  const title = stage === 'confirm' ? 'Set up Weekly Pulse lists' : stage === 'running' ? 'Setting up\u2026' : stage === 'done' ? 'Weekly Pulse is set up' : stage === 'failed' ? 'Setup stopped' : '';

  let content: React.ReactNode = null;
  if (stage === 'confirm') {
    content = (
      <div className="wpq__plan" data-testid="wpq-setup-plan">
        <p>This creates:</p>
        {plan.map((site) => (
          <div key={site.siteUrl}>
            <p className="wpq__planSite">On {site.siteUrl}</p>
            <ul>
              {site.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
        <p>Existing lists and columns are kept, and nothing is deleted. It takes about a minute.</p>
      </div>
    );
  } else if (dialogOpen) {
    let lastSite = '';
    content = (
      <div>
        {stage === 'done' && result && (
          <div className="wpq__setupResult" role="status" data-testid="wpq-setup-done">
            <p>
              <strong>The lists are ready.</strong> Next, add this week&rsquo;s question to the Questions list. The quiz has been reloaded.
            </p>
            {result.warnings.map((w) => (
              <p key={w}>Note: {w}</p>
            ))}
          </div>
        )}
        {stage === 'failed' && result && (
          <div className="wpq__setupResult wpq__setupResult--error" role="alert" data-testid="wpq-setup-error">
            <p>
              <strong>{result.error}</strong>
            </p>
            <p>Nothing was deleted. Fix the problem and select Try again: finished steps are skipped.</p>
          </div>
        )}
        <ul className="wpq__steps" aria-label="Setup steps" data-testid="wpq-setup-steps">
          {steps.map((step) => {
            const header = plan.length > 1 && step.siteUrl !== lastSite ? step.siteUrl : '';
            lastSite = step.siteUrl;
            return (
              <React.Fragment key={step.id}>
                {header && <li className="wpq__setupSite">{header}</li>}
                <li className={`wpq__step wpq__step--${step.status}`} data-step={step.id} data-status={step.status}>
                  <span className="wpq__stepMark" aria-hidden="true">
                    {MARK[step.status]}
                  </span>
                  <span className="wpq__stepLabel">
                    {step.label}
                    <span className="wpq__sr"> &ndash; {STATUS_TEXT[step.status]}</span>
                  </span>
                  {step.detail && step.status !== 'failed' && <span className="wpq__stepDetail">{step.status === 'skipped' ? `Already there` : step.detail}</span>}
                </li>
              </React.Fragment>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <>
      {panel}
      {dialogOpen && (
        <Dialog
          hidden={false}
          onDismiss={() => stage !== 'running' && setStage('closed')}
          dialogContentProps={{ type: DialogType.normal, title }}
          modalProps={{ isBlocking: stage === 'running' || stage === 'confirm', className: props.motionClass }}
          minWidth={480}
          maxWidth={640}
        >
          <div className="wpq__dialogBody" style={props.style} data-testid="wpq-setup-dialog">
            {content}
          </div>
          <DialogFooter>
            {stage === 'confirm' && (
              <>
                <button type="button" className="wpq__button" style={props.style} onClick={() => run()} data-testid="wpq-setup-confirm">
                  Set up lists
                </button>
                <button type="button" className="wpq__button wpq__button--secondary" style={props.style} onClick={() => setStage('closed')}>
                  Cancel
                </button>
              </>
            )}
            {stage === 'running' && (
              <button type="button" className="wpq__button" style={props.style} disabled>
                Working&hellip;
              </button>
            )}
            {stage === 'failed' && (
              <>
                <button type="button" className="wpq__button" style={props.style} onClick={() => run()} data-testid="wpq-setup-retry">
                  Try again
                </button>
                <button type="button" className="wpq__button wpq__button--secondary" style={props.style} onClick={() => setStage('closed')}>
                  Close
                </button>
              </>
            )}
            {stage === 'done' && (
              <button type="button" className="wpq__button" style={props.style} onClick={() => setStage('closed')} data-testid="wpq-setup-close">
                Close
              </button>
            )}
          </DialogFooter>
        </Dialog>
      )}
    </>
  );
}
