import type { MSGraphClientFactory } from '@microsoft/sp-http';

import type {
  ICreatePlannerProjectProperties,
  IMyprojectsStrings,
  PlannerProjectTemplateKey,
} from './myprojects.models';

export type PlannerBlueprintAssignment =
  | 'planningAndDevelopment'
  | 'unassigned';

export interface IPlannerBlueprintBucket {
  key: string;
  name: string;
}

export interface IPlannerBlueprintTask {
  assignment: PlannerBlueprintAssignment;
  bucketKey: string;
  dueOffsetDays: number;
  startOffsetDays: number;
  title: string;
}

export interface IPlannerProjectBlueprint {
  buckets: readonly IPlannerBlueprintBucket[];
  key: PlannerProjectTemplateKey;
  tasks: readonly IPlannerBlueprintTask[];
  version: number;
}

export interface IScheduledPlannerBlueprintTask
  extends IPlannerBlueprintTask {
  dueDateTime: string;
  startDateTime: string;
}

export interface IMicrosoft365Group {
  description?: string;
  displayName: string;
  id: string;
  mail?: string;
}

export interface IMicrosoft365GroupPage {
  groups: IMicrosoft365Group[];
  nextLink?: string;
}

export interface IMicrosoft365GroupsState {
  error?: string;
  groups: IMicrosoft365Group[];
  hasLoaded: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  nextLink?: string;
}

export interface IUseMicrosoft365GroupsResult
  extends IMicrosoft365GroupsState {
  ensureFirstPage: () => void;
  loadMore: () => void;
  retry: () => void;
  search: (searchValue: string) => void;
}

export interface ICreatePlannerProjectRequest {
  assignPlanningAndDevelopmentToMe: boolean;
  blueprint: IPlannerProjectBlueprint;
  currentUserId?: string;
  groupId: string;
  projectName: string;
  resumePlanId?: string;
  startDate: string;
}

export type PlannerProjectCreationStatus =
  | 'alreadyExists'
  | 'created'
  | 'partial';

export interface IPlannerProjectCreationResult {
  createdBucketCount: number;
  createdTaskCount: number;
  error?: string;
  planId: string;
  plannerUrl: string;
  status: PlannerProjectCreationStatus;
  totalBucketCount: number;
  totalTaskCount: number;
}

export interface IUsePlannerProjectCreationResult {
  createProject: (
    request: ICreatePlannerProjectRequest
  ) => Promise<IPlannerProjectCreationResult | undefined>;
  error?: string;
  isCreating: boolean;
  result?: IPlannerProjectCreationResult;
}

export interface IPlannerProjectCreationProps {
  currentUserId?: string;
  dateLocale: string;
  graphClientFactory: MSGraphClientFactory;
  isDarkTheme: boolean;
  isFullscreen: boolean;
  onOpenProject: (planId: string, projectName: string) => Promise<void>;
  onRequestSizeChange: (width: number, height: number) => Promise<void>;
  properties: ICreatePlannerProjectProperties;
  strings: IMyprojectsStrings;
  targetDocument: Document | undefined;
}