import * as React from 'react';
import { flushSync } from 'react-dom';
import type { SPCopilotDisplayMode } from '@microsoft/sp-copilot-component';
import {
  PortalMountNodeProvider,
  webDarkTheme,
  webLightTheme,
} from '@fluentui/react-components';
import { FluentUIProvider } from '@spteck/react-controls-v2/fluent-ui-provider';
import { StackV2 } from '@spteck/react-controls-v2/stack-v2';

import { useInlineCopilotContentSize } from '../../hooks/useInlineCopilotContentSize';
import { useLockDocumentViewport } from '../../hooks/useLockDocumentViewport';
import { usePlannerScrollAreaHeight } from '../../hooks/usePlannerScrollAreaHeight';
import { usePlannerProjects } from '../../hooks/usePlannerProjects';
import type {
  IMyprojectsProps,
  IPlannerProjectSummary,
} from '../../models';
import {
  clearPlannerSelection,
  restorePlannerSelection,
  savePlannerSelection,
  selectPlannerProject,
} from '../../utils/plannerSelection';
import { PlannerExpandedView } from '../PlannerExpandedView/PlannerExpandedView';
import { PlannerInlineView } from '../PlannerInlineView/PlannerInlineView';
import { useMyprojectsStyles } from './useMyprojectsStyles';

function supportsDisplayMode(
  availableDisplayModes: readonly SPCopilotDisplayMode[] | undefined,
  displayMode: SPCopilotDisplayMode
): boolean {
  return (
    !availableDisplayModes || availableDisplayModes.indexOf(displayMode) >= 0
  );
}

export default function Myprojects(
  props: IMyprojectsProps
): React.ReactElement {
  const styles = useMyprojectsStyles();
  const isDarkTheme = props.hostContext.theme === 'dark';
  const theme = isDarkTheme ? webDarkTheme : webLightTheme;
  const { error, hasAnyProjects, isLoading, projects, refresh } =
    usePlannerProjects(
    props.graphClientFactory,
    props.properties,
    props.context.pageContext.aadInfo?.userId.toString()
    );
  const [restoredProjectId] = React.useState(() =>
    props.initialSelectedProjectId ??
    restorePlannerSelection(props.targetDocument, props.properties)
  );
  const [selectedProjectId, setSelectedProjectId] =
    React.useState(restoredProjectId);
  const isFullscreen = props.hostContext.displayMode === 'fullscreen';
  const selectedProject = selectPlannerProject(
    projects,
    selectedProjectId,
    isFullscreen
  );
  const scrollAreaHeight = usePlannerScrollAreaHeight(
    props.targetDocument,
    isFullscreen
  );
  const contentRef = useInlineCopilotContentSize({
    enabled: !isFullscreen,
    measurementKey: `${props.properties.view}:${isLoading}:${error ?? ''}:${projects.length}`,
    onRequestSizeChange: props.onRequestSizeChange,
    targetDocument: props.targetDocument,
  });

  useLockDocumentViewport(props.targetDocument, isFullscreen);

  React.useEffect(() => {
    if (!restoredProjectId || isLoading) {
      return;
    }

    clearPlannerSelection(props.targetDocument, props.properties);
    if (!projects.some((project) => project.id === restoredProjectId)) {
      setSelectedProjectId(undefined);
    }
  }, [
    isLoading,
    projects,
    props.properties,
    props.targetDocument,
    restoredProjectId,
  ]);

  const requestDisplayMode = React.useCallback(
    async (displayMode: SPCopilotDisplayMode): Promise<void> => {
      try {
        await props.onRequestDisplayMode(displayMode);
      } catch (displayModeError) {
        console.error(
          `[My projects] Failed to request ${displayMode} mode:`,
          displayModeError
        );
      }
    },
    [props.onRequestDisplayMode]
  );
  const openProject = React.useCallback(
    async (project: IPlannerProjectSummary): Promise<void> => {
      flushSync(() => setSelectedProjectId(project.id));

      if (
        supportsDisplayMode(
          props.hostContext.availableDisplayModes,
          'fullscreen'
        )
      ) {
        savePlannerSelection(
          props.targetDocument,
          props.properties,
          project.id
        );
        await requestDisplayMode('fullscreen');
      }
    },
    [
      props.hostContext.availableDisplayModes,
      props.properties,
      props.targetDocument,
      requestDisplayMode,
    ]
  );
  const compact = React.useCallback(async (): Promise<void> => {
    await requestDisplayMode('inline');
  }, [requestDisplayMode]);
  return (
    <PortalMountNodeProvider value={props.targetDocument?.body}>
      <FluentUIProvider
        applicationName="my-planner-projects-"
        applyStylesToPortals
        targetDocument={props.targetDocument}
        theme={theme}
        styles={{
          height: isFullscreen ? scrollAreaHeight : 'fit-content',
          overflow: 'hidden',
        }}
      >
        <StackV2
          className={styles.root}
          overflow="hidden"
        >
          {isFullscreen && selectedProject ? (
            <PlannerExpandedView
              context={props.context}
              isDarkTheme={isDarkTheme}
              onCompact={compact}
              project={selectedProject}
              scrollAreaHeight={scrollAreaHeight}
              strings={props.strings}
            />
          ) : (
            <PlannerInlineView
              dateLocale={props.dateLocale}
              error={error}
              hasAnyProjects={hasAnyProjects}
              isLoading={isLoading}
              onOpen={openProject}
              onRefresh={refresh}
              projects={projects}
              query={props.properties}
              rootRef={contentRef}
              strings={props.strings}
              targetDocument={props.targetDocument}
              theme={theme}
            />
          )}
        </StackV2>
      </FluentUIProvider>
    </PortalMountNodeProvider>
  );
}
