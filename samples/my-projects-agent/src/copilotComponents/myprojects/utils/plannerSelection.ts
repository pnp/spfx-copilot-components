import { z } from 'zod';
import type { SPCopilotDisplayMode } from '@microsoft/sp-copilot-component';
import type {
  ICreatePlannerProjectProperties,
  IMyprojectsCopilotComponentProperties,
  IPlannerProjectSummary,
} from '../models';

const PLANNER_CREATION_OPEN_STORAGE_PREFIX = 'myprojects:created-project:';
const PLANNER_SELECTION_STORAGE_PREFIX = 'myprojects:selected-project:';
const PLANNER_SELECTION_TTL = 30_000;
const PLANNER_CREATION_TRANSFER_PREFIX = 'myprojects:creation-transfer:';

const creationTransferSchema = z.object({
  expiresAt: z.number(),
  mode: z.enum(['inline', 'fullscreen']),
  projectId: z.string().min(1),
  projectName: z.string().min(1),
});

interface IPlannerCreationTransfer {
  project: IPlannerCreationOpenHandoff;
  accept: () => void;
}

function getCreationTransferKey(properties: ICreatePlannerProjectProperties): string {
  return `${PLANNER_CREATION_TRANSFER_PREFIX}${getCreationStorageKey(properties, '')}`;
}

export function preparePlannerCreationTransfer(
  targetDocument: Document | undefined,
  properties: ICreatePlannerProjectProperties,
  project: IPlannerCreationOpenHandoff,
  mode: SPCopilotDisplayMode
): () => void {
  const storageKey = getCreationTransferKey(properties);
  const serialized = JSON.stringify({
    expiresAt: Date.now() + PLANNER_SELECTION_TTL,
    mode,
    projectId: project.projectId,
    projectName: project.projectName,
  });
  const storage = getSessionStorage(targetDocument);

  try {
    storage?.setItem(storageKey, serialized);
  } catch {
    return () => undefined;
  }

  return () => {
    try {
      if (storage?.getItem(storageKey) === serialized) {
        storage.removeItem(storageKey);
      }
    } catch {
      return;
    }
  };
}

export function readPlannerCreationTransfer(
  targetDocument: Document | undefined,
  properties: ICreatePlannerProjectProperties,
  instanceId: string,
  mode: SPCopilotDisplayMode | undefined
): IPlannerCreationTransfer | undefined {
  const storage = getSessionStorage(targetDocument);
  const storageKey = getCreationTransferKey(properties);

  try {
    const serialized = storage?.getItem(storageKey);
    if (!serialized) {
      return undefined;
    }

    const parsed = creationTransferSchema.safeParse(JSON.parse(serialized));
    if (!parsed.success || parsed.data.expiresAt < Date.now()) {
      storage?.removeItem(storageKey);
      return undefined;
    }
    if (parsed.data.mode !== mode) {
      return undefined;
    }

    const project: IPlannerCreationOpenHandoff = {
      projectId: parsed.data.projectId,
      projectName: parsed.data.projectName,
      query: { projectName: parsed.data.projectName, view: 'all' },
    };

    return {
      project,
      accept: () => {
        savePlannerCreationOpen(
          targetDocument, properties, project.projectId, project.projectName, instanceId
        );
        try {
          if (storage?.getItem(storageKey) === serialized) {
            storage.removeItem(storageKey);
          }
        } catch {
          return;
        }
      },
    };
  } catch {
    return undefined;
  }
}

interface IStoredPlannerCreationOpen {
  projectId: string;
  projectName: string;
}

export interface IPlannerCreationOpenHandoff {
  projectId: string;
  projectName: string;
  query: IMyprojectsCopilotComponentProperties;
}

interface IStoredPlannerSelection {
  expiresAt: number;
  projectId: string;
}

function getQueryKey(
  properties: IMyprojectsCopilotComponentProperties
): string {
  return JSON.stringify([
    properties.assignedToMe,
    properties.dateField,
    properties.dateRange,
    properties.fromDate,
    properties.maxResults,
    properties.projectName,
    properties.sortBy,
    properties.toDate,
    properties.view,
  ]);
}

function getStorageKey(
  properties: IMyprojectsCopilotComponentProperties
): string {
  return `${PLANNER_SELECTION_STORAGE_PREFIX}${getQueryKey(properties)}`;
}

function getCreationStorageKey(
  properties: ICreatePlannerProjectProperties,
  instanceId: string
): string {
  return `${PLANNER_CREATION_OPEN_STORAGE_PREFIX}${JSON.stringify([
    instanceId,
    properties.projectName,
    properties.startDate,
    properties.template,
    properties.assignPlanningAndDevelopmentToMe,
  ])}`;
}

function getSessionStorage(targetDocument: Document | undefined): Storage | undefined {
  try {
    return targetDocument?.defaultView?.sessionStorage;
  } catch {
    return undefined;
  }
}

export function savePlannerSelection(
  targetDocument: Document | undefined,
  properties: IMyprojectsCopilotComponentProperties,
  projectId: string
): void {
  const storage = getSessionStorage(targetDocument);
  if (!storage) {
    return;
  }

  const selection: IStoredPlannerSelection = {
    expiresAt: Date.now() + PLANNER_SELECTION_TTL,
    projectId,
  };

  try {
    storage.setItem(getStorageKey(properties), JSON.stringify(selection));
  } catch {
    // Sandboxed hosts can expose sessionStorage while denying writes.
  }
}

export function restorePlannerSelection(
  targetDocument: Document | undefined,
  properties: IMyprojectsCopilotComponentProperties
): string | undefined {
  const storage = getSessionStorage(targetDocument);
  if (!storage) {
    return undefined;
  }

  const storageKey = getStorageKey(properties);

  try {
    const serializedSelection = storage.getItem(storageKey);
    if (!serializedSelection) {
      return undefined;
    }

    const selection = JSON.parse(serializedSelection) as Partial<IStoredPlannerSelection>;
    const isValid =
      typeof selection.expiresAt === 'number' &&
      selection.expiresAt >= Date.now() &&
      typeof selection.projectId === 'string' &&
      selection.projectId.length > 0;

    if (isValid) {
      return selection.projectId;
    }

    storage.removeItem(storageKey);
  } catch {
    try {
      storage.removeItem(storageKey);
    } catch {
      // Ignore storage access failures in sandboxed hosts.
    }
  }

  return undefined;
}

export function clearPlannerSelection(
  targetDocument: Document | undefined,
  properties: IMyprojectsCopilotComponentProperties
): void {
  try {
    getSessionStorage(targetDocument)?.removeItem(getStorageKey(properties));
  } catch {
    // Ignore storage access failures in sandboxed hosts.
  }
}

export function savePlannerCreationOpen(
  targetDocument: Document | undefined,
  properties: ICreatePlannerProjectProperties,
  projectId: string,
  projectName: string,
  instanceId: string
): void {
  const storage = getSessionStorage(targetDocument);
  if (!storage) {
    return;
  }

  const handoff: IStoredPlannerCreationOpen = {
    projectId,
    projectName,
  };

  try {
    storage.setItem(
      getCreationStorageKey(properties, instanceId),
      JSON.stringify(handoff)
    );
  } catch {
    // Sandboxed hosts can expose sessionStorage while denying writes.
  }
}

export function restorePlannerCreationOpen(
  targetDocument: Document | undefined,
  properties: ICreatePlannerProjectProperties,
  instanceId: string
): IPlannerCreationOpenHandoff | undefined {
  const storage = getSessionStorage(targetDocument);
  if (!storage) {
    return undefined;
  }

  const storageKey = getCreationStorageKey(properties, instanceId);

  try {
    const serializedHandoff = storage.getItem(storageKey);
    if (!serializedHandoff) {
      return undefined;
    }

    const handoff = JSON.parse(
      serializedHandoff
    ) as Partial<IStoredPlannerCreationOpen>;
    const isValid =
      typeof handoff.projectId === 'string' &&
      handoff.projectId.length > 0 &&
      typeof handoff.projectName === 'string' &&
      handoff.projectName.length > 0;

    if (isValid) {
      return {
        projectId: handoff.projectId!,
        projectName: handoff.projectName!,
        query: {
          projectName: handoff.projectName!,
          view: 'all',
        },
      };
    }

    storage.removeItem(storageKey);
  } catch {
    try {
      storage.removeItem(storageKey);
    } catch {
      // Ignore storage access failures in sandboxed hosts.
    }
  }

  return undefined;
}

export function selectPlannerProject(
  projects: readonly IPlannerProjectSummary[],
  selectedProjectId: string | undefined,
  isFullscreen: boolean
): IPlannerProjectSummary | undefined {
  if (selectedProjectId) {
    return projects.find((project) => project.id === selectedProjectId);
  }

  return isFullscreen || projects.length === 1 ? projects[0] : undefined;
}
