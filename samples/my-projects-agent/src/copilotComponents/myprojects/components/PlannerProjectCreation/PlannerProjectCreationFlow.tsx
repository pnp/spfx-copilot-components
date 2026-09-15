import * as React from 'react';
import { usePlannerCreationNavigation } from '../../hooks/usePlannerCreationNavigation';
import type { IPlannerProjectCreationFlowProps } from '../../models';
import Myprojects from '../Myprojects/Myprojects';
import { PlannerProjectCreation } from './PlannerProjectCreation';

export function PlannerProjectCreationFlow({
  properties,
  ...hostProps
}: IPlannerProjectCreationFlowProps): React.ReactElement {
  const { openedProject, openProject, requestDisplayMode } =
    usePlannerCreationNavigation(
      properties,
      hostProps.targetDocument,
      hostProps.onRequestDisplayMode,
      hostProps.context.instanceId,
      hostProps.hostContext.displayMode
    );

  if (openedProject) {
    return (
      <Myprojects
        {...hostProps}
        initialSelectedProjectId={openedProject.projectId}
        onRequestDisplayMode={requestDisplayMode}
        properties={openedProject.query}
      />
    );
  }

  return (
    <PlannerProjectCreation
      currentUserId={hostProps.context.pageContext.aadInfo?.userId.toString()}
      dateLocale={hostProps.dateLocale}
      graphClientFactory={hostProps.graphClientFactory}
      isDarkTheme={hostProps.hostContext.theme === 'dark'}
      isFullscreen={hostProps.hostContext.displayMode === 'fullscreen'}
      onOpenProject={openProject}
      onRequestSizeChange={hostProps.onRequestSizeChange}
      properties={properties}
      strings={hostProps.strings}
      targetDocument={hostProps.targetDocument}
    />
  );
}