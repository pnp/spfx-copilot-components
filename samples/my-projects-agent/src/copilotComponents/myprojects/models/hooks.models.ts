import type { IPlannerProjectSummary } from './planner.models';

export interface IUseInlineCopilotContentSizeOptions {
  enabled: boolean;
  measurementKey: string;
  onRequestSizeChange: (width: number, height: number) => Promise<void>;
  targetDocument: Document | undefined;
}

export interface IContentSize {
  height: number;
  width: number;
}

export interface IPlannerProjectsState {
  error?: string;
  isLoading: boolean;
  projects: IPlannerProjectSummary[];
}

export interface IUsePlannerProjectsResult extends IPlannerProjectsState {
  hasAnyProjects: boolean;
  refresh: () => void;
}

export interface ICompatibleLoadResult {
  error: string | undefined;
  isLoading: boolean;
  load: (properties: Record<string, unknown>) => void;
}