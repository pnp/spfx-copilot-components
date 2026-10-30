/** In-web-part "Set up lists": the same one-time setup as provisioning/Provision-WeeklyPulse.ps1. */

export type SetupStepStatus = 'pending' | 'running' | 'done' | 'skipped' | 'failed';

export interface ISetupStep {
  id: string;
  label: string;
  siteUrl: string;
  status: SetupStepStatus;
  /** What happened ("Added 11 columns", "Already exists") or, for a failed step, the error. */
  detail?: string;
}

/** One site in the confirm dialog: what will be created there. */
export interface ISetupSitePlan {
  siteUrl: string;
  items: string[];
}

export interface ISiteAccess {
  siteUrl: string;
  canManageLists: boolean;
  canManagePermissions: boolean;
  canManageWeb: boolean;
}

export interface IMissingList {
  title: string;
  siteUrl: string;
}

export interface ISetupInspection {
  missingLists: IMissingList[];
  sites: ISiteAccess[];
  /** Edit mode + ManageLists and ManagePermissions on every target site. */
  canSetUp: boolean;
}

export interface ISetupResult {
  ok: boolean;
  steps: ISetupStep[];
  /** Plain-language error for the failed step, e.g. "Couldn't break permissions on ...: you need Full Control on ...". */
  error?: string;
  warnings: string[];
}

export interface IListSetup {
  describe(): ISetupSitePlan[];
  inspect(): Promise<ISetupInspection>;
  run(onProgress: (steps: ISetupStep[]) => void): Promise<ISetupResult>;
}
