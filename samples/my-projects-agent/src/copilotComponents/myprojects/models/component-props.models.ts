import type { RefObject } from 'react';
import type {
  ICopilotComponentHostContext,
  SPCopilotDisplayMode,
} from '@microsoft/sp-copilot-component';
import type { BaseComponentContext } from '@microsoft/sp-component-base';
import type { BadgeProps, Theme } from '@fluentui/react-components';
import type { MSGraphClientFactory } from '@microsoft/sp-http';
import type { GanttChartScaleKey } from '@spteck/react-controls-v2/gantt';

import type {
  ICreatePlannerProjectProperties,
  IMyprojectsCopilotComponentProperties,
  IMyprojectsStrings,
  IMyprojectsToolProperties,
} from './myprojects.models';
import type { IPlannerProjectSummary } from './planner.models';
import type { PlannerExpandedViewKey } from './planner-view.models';

export type IMyprojectsHostProps = Omit<
  IMyprojectsProps,
  'properties' | 'initialSelectedProjectId'
>;

export interface IMyprojectsExperienceProps extends IMyprojectsHostProps {
  properties: IMyprojectsToolProperties;
}

export interface IPlannerProjectCreationFlowProps extends IMyprojectsHostProps {
  properties: ICreatePlannerProjectProperties;
}

export interface IMyprojectsProps {
  initialSelectedProjectId?: string;
  context: BaseComponentContext;
  dateLocale: string;
  graphClientFactory: MSGraphClientFactory;
  hostContext: ICopilotComponentHostContext;
  onRequestDisplayMode: (mode: SPCopilotDisplayMode) => Promise<void>;
  onRequestSizeChange: (width: number, height: number) => Promise<void>;
  properties: IMyprojectsCopilotComponentProperties;
  strings: IMyprojectsStrings;
  targetDocument: Document | undefined;
}

export interface IPlannerControlProps {
  context: BaseComponentContext;
  loadingLabel: string;
  project: IPlannerProjectSummary;
  scrollAreaHeight: string | undefined;
}

export interface IPlannerDisplayModeButtonProps {
  label: string;
  mode: SPCopilotDisplayMode;
  onRequestDisplayMode: (mode: SPCopilotDisplayMode) => Promise<void>;
  theme: Theme;
}

export interface IPlannerExpandedHeaderProps {
  onCompact: () => Promise<void>;
  onScaleChange: (scaleKey: string) => void;
  onViewChange: (viewKey: string) => void;
  project: IPlannerProjectSummary;
  scale: GanttChartScaleKey;
  selectedView: PlannerExpandedViewKey;
  strings: IMyprojectsStrings;
  theme: Theme;
}

export interface IPlannerExpandedViewProps {
  context: BaseComponentContext;
  isDarkTheme: boolean;
  onCompact: () => Promise<void>;
  project: IPlannerProjectSummary;
  scrollAreaHeight: string | undefined;
  strings: IMyprojectsStrings;
}

export interface IPlannerGanttViewProps {
  isDarkTheme: boolean;
  project: IPlannerProjectSummary;
  scale: GanttChartScaleKey;
  scrollAreaHeight: string | undefined;
  strings: IMyprojectsStrings;
}

export interface IPlannerEmptyStateProps {
  strings: IMyprojectsStrings;
  targetDocument: Document | undefined;
}

export interface IPlannerInlineViewProps {
  dateLocale: string;
  error?: string;
  hasAnyProjects: boolean;
  isLoading: boolean;
  onOpen: (project: IPlannerProjectSummary) => Promise<void>;
  onRefresh: () => void;
  projects: IPlannerProjectSummary[];
  query: IMyprojectsCopilotComponentProperties;
  rootRef: RefObject<HTMLDivElement>;
  strings: IMyprojectsStrings;
  targetDocument: Document | undefined;
  theme: Theme;
}

export interface IPlannerProjectCardProps {
  dateLocale: string;
  onOpen: (project: IPlannerProjectSummary) => Promise<void>;
  project: IPlannerProjectSummary;
  strings: IMyprojectsStrings;
  theme: Theme;
}

export interface IPlannerProjectStatusBadgesProps {
  project: IPlannerProjectSummary;
  strings: IMyprojectsStrings;
}

export interface IProjectStatusBadgeProps {
  color: BadgeProps['color'];
  label: string;
  value: number;
}

export interface IPlannerScaleSelectorProps {
  onChange: (scaleKey: string) => void;
  scale: GanttChartScaleKey;
  strings: IMyprojectsStrings;
}

export interface IPlannerViewSelectorProps {
  onChange: (viewKey: string) => void;
  strings: IMyprojectsStrings;
}
