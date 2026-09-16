import * as React from 'react';
import { flushSync } from 'react-dom';
import type {
  ICreatePlannerProjectProperties,
  IMyprojectsHostProps,
} from '../models';
import {
  type IPlannerCreationOpenHandoff,
  preparePlannerCreationTransfer,
  readPlannerCreationTransfer,
  restorePlannerCreationOpen,
  savePlannerCreationOpen,
  savePlannerSelection,
} from '../utils/plannerSelection';

interface IPlannerCreationNavigation {
  openedProject: IPlannerCreationOpenHandoff | undefined;
  openProject: (projectId: string, projectName: string) => Promise<void>;
  requestDisplayMode: IMyprojectsHostProps['onRequestDisplayMode'];
}

export function usePlannerCreationNavigation(
  properties: ICreatePlannerProjectProperties,
  targetDocument: Document | undefined,
  onRequestDisplayMode: IMyprojectsHostProps['onRequestDisplayMode'],
  instanceId: string,
  displayMode: IMyprojectsHostProps['hostContext']['displayMode']
): IPlannerCreationNavigation {
  const [openedProject, setOpenedProject] = React.useState(() =>
    restorePlannerCreationOpen(targetDocument, properties, instanceId)
  );
  const activeProject = openedProject ??
    restorePlannerCreationOpen(targetDocument, properties, instanceId);

  React.useLayoutEffect(() => {
    const transfer = readPlannerCreationTransfer(
      targetDocument, properties, instanceId, displayMode
    );
    if (transfer) {
      transfer.accept();
      setOpenedProject(transfer.project);
    }
  }, [displayMode, instanceId, properties, targetDocument]);

  const saveOpenedProject = (project: IPlannerCreationOpenHandoff): void => {
    savePlannerCreationOpen(
      targetDocument,
      properties,
      project.projectId,
      project.projectName,
      instanceId
    );
    savePlannerSelection(targetDocument, project.query, project.projectId);
  };

  const openProject = async (
    projectId: string,
    projectName: string
  ): Promise<void> => {
    const project: IPlannerCreationOpenHandoff = {
      projectId,
      projectName,
      query: { projectName, view: 'all' },
    };

    saveOpenedProject(project);
    flushSync(() => setOpenedProject(project));
    if (displayMode === 'fullscreen') {
      return;
    }
    const cancelTransfer = preparePlannerCreationTransfer(
      targetDocument, properties, project, 'fullscreen'
    );

    try {
      await onRequestDisplayMode('fullscreen');
    } catch (displayModeError) {
      cancelTransfer();
      console.error(
        '[My projects] Failed to open the created project:',
        displayModeError
      );
    }
  };

  const requestDisplayMode: IMyprojectsHostProps['onRequestDisplayMode'] =
    async (mode) => {
      if (displayMode === mode) {
        return;
      }
      if (activeProject) {
        saveOpenedProject(activeProject);
      }

      const cancelTransfer = activeProject
        ? preparePlannerCreationTransfer(targetDocument, properties, activeProject, mode)
        : () => undefined;
      try {
        await onRequestDisplayMode(mode);
      } catch (displayModeError) {
        cancelTransfer();
        throw displayModeError;
      }
    };

  return { openedProject: activeProject, openProject, requestDisplayMode };
}