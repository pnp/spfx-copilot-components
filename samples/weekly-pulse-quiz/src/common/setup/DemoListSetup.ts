import type { IListSetup, ISetupInspection, ISetupResult, ISetupSitePlan, ISetupStep } from './IListSetup';

export type DemoSetupRole = 'owner' | 'member' | 'reader';

/** Shared with DemoPulseDataSource('not-set-up'): the quiz works once `ready` is true. */
export interface IDemoSetupState {
  ready: boolean;
}

const STEPS: [string, string, 'q' | 'r'][] = [
  ['questions-list', 'List "Weekly Pulse Questions"', 'q'],
  ['questions-columns', 'Columns on "Weekly Pulse Questions"', 'q'],
  ['questions-view', 'Views on "Weekly Pulse Questions"', 'q'],
  ['config-list', 'List "Weekly Pulse Config"', 'q'],
  ['config-columns', 'Columns on "Weekly Pulse Config"', 'q'],
  ['config-row', 'Settings row', 'q'],
  ['responses-list', 'List "Weekly Pulse Responses"', 'r'],
  ['responses-columns', 'Columns on "Weekly Pulse Responses"', 'r'],
  ['responses-security', 'Item-level security (read own, edit own); versioning and attachments off; excluded from search', 'r'],
  ['responses-break', 'Unique permissions (not copied from the site)', 'r'],
  ['responses-owners', 'Site owners: Full Control', 'r'],
  ['responses-everyone', 'Everyone except external users: Contribute', 'r'],
  ['responses-view', 'Default view shows no Created By / Modified By', 'r']
];

const DETAIL: { [id: string]: string } = {
  'questions-list': 'Created',
  'questions-columns': 'Added 11 columns, indexed 3',
  'questions-view': 'Created 1, updated 1',
  'config-list': 'Created',
  'config-columns': 'Added 10 columns',
  'config-row': 'Added',
  'responses-list': 'Created',
  'responses-columns': 'Added 6 columns, indexed 3',
  'responses-security': 'Set',
  'responses-break': 'Done',
  'responses-owners': '"Contoso Owners"',
  'responses-everyone': 'Granted',
  'responses-view': '6 columns'
};

/** Preview / local workbench only. Nothing leaves the browser. */
export class DemoListSetup implements IListSetup {
  public constructor(
    private readonly _role: DemoSetupRole,
    private readonly _state: IDemoSetupState,
    private readonly _siteUrl: string,
    private readonly _stepMs: number = 120
  ) {}

  public describe(): ISetupSitePlan[] {
    return [
      {
        siteUrl: this._siteUrl,
        items: [
          '"Weekly Pulse Questions" list with 11 columns, the "Upcoming weeks" view, and QuizYear and WeekNumber in the default view',
          '"Weekly Pulse Config" list with one settings row (used by the Copilot component)',
          '"Weekly Pulse Responses" list: people see and edit only their own answers; unique permissions (site owners: Full Control, everyone except external users: Contribute); no versioning, no attachments, excluded from search'
        ]
      }
    ];
  }

  public async inspect(): Promise<ISetupInspection> {
    const owner = this._role === 'owner';
    const member = this._role === 'member';
    return {
      missingLists: this._state.ready
        ? []
        : ['Weekly Pulse Questions', 'Weekly Pulse Config', 'Weekly Pulse Responses'].map((title) => ({ title, siteUrl: this._siteUrl })),
      sites: [{ siteUrl: this._siteUrl, canManageLists: owner || member, canManagePermissions: owner, canManageWeb: owner }],
      canSetUp: owner
    };
  }

  public async run(onProgress: (steps: ISetupStep[]) => void): Promise<ISetupResult> {
    const steps: ISetupStep[] = STEPS.map(([id, label]) => ({ id, label, siteUrl: this._siteUrl, status: 'pending' }));
    onProgress(steps.map((s) => ({ ...s })));
    for (const step of steps) {
      step.status = 'running';
      onProgress(steps.map((s) => ({ ...s })));
      await new Promise((resolve) => setTimeout(resolve, this._stepMs));
      step.status = 'done';
      step.detail = DETAIL[step.id];
    }
    this._state.ready = true;
    onProgress(steps.map((s) => ({ ...s })));
    return { ok: true, steps: steps.map((s) => ({ ...s })), warnings: [] };
  }
}
