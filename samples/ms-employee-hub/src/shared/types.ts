export type Workspace = 'company' | 'hr' | 'tech' | 'business';
export type HubInputs = Readonly<Record<string, string | number | boolean | undefined>>;
export interface HubActor {
  id: string;
  displayName: string;
  commercial: boolean;
  planner: boolean;
  reviewer: boolean;
}
export interface HubSession {
  now: Date;
  clock?: () => Date;
  locale?: string;
  viewerZone?: string;
  actor: HubActor;
  memory: Map<string, unknown>;
}
export interface SurfaceProps {
  id: number;
  mode: 'inline' | 'full';
  inputs: HubInputs;
  session: HubSession;
  navigate: (id: number, inputs?: HubInputs) => void;
  onExpand?: () => void;
  restoredSelection?: string;
  canSwitchWorkspaces?: boolean;
}
