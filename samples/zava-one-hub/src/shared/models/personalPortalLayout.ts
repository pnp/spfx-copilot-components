export const personalPortalColumnIds = ['personal-column-1', 'personal-column-2', 'personal-column-3'] as const;

export type PersonalPortalColumnId = typeof personalPortalColumnIds[number];
export type PersonalPortalLayout = Readonly<Record<PersonalPortalColumnId, readonly string[]>>;

export function createDefaultPersonalPortalLayout(panelIds: readonly string[], columnAssignments: Readonly<Record<string, PersonalPortalColumnId>> = {}): PersonalPortalLayout {
  const columns: Record<PersonalPortalColumnId, string[]> = {
    'personal-column-1': [],
    'personal-column-2': [],
    'personal-column-3': []
  };
  panelIds.forEach((panelId, index) => columns[columnAssignments[panelId] || personalPortalColumnIds[index % personalPortalColumnIds.length]].push(panelId));
  return columns;
}

export function normalizePersonalPortalLayout(value: unknown, panelIds: readonly string[], columnAssignments: Readonly<Record<string, PersonalPortalColumnId>> = {}): PersonalPortalLayout {
  if (!value || typeof value !== 'object') return createDefaultPersonalPortalLayout(panelIds, columnAssignments);
  const allowed = new Set(panelIds);
  const seen = new Set<string>();
  const columns: Record<PersonalPortalColumnId, string[]> = {
    'personal-column-1': [],
    'personal-column-2': [],
    'personal-column-3': []
  };

  personalPortalColumnIds.forEach((columnId) => {
    const entries = (value as Partial<Record<PersonalPortalColumnId, unknown>>)[columnId];
    if (!Array.isArray(entries)) return;
    entries.forEach((entry) => {
      if (typeof entry === 'string' && allowed.has(entry) && !seen.has(entry)) {
        columns[columnId].push(entry);
        seen.add(entry);
      }
    });
  });

  panelIds.filter((panelId) => !seen.has(panelId)).forEach((panelId, index) => {
    columns[personalPortalColumnIds[index % personalPortalColumnIds.length]].push(panelId);
  });
  return columns;
}

function findColumn(layout: PersonalPortalLayout, panelId: string): PersonalPortalColumnId | undefined {
  return personalPortalColumnIds.find((columnId) => layout[columnId].indexOf(panelId) >= 0);
}

export function movePersonalPortalPanel(layout: PersonalPortalLayout, activeId: string, overId: string): PersonalPortalLayout {
  const sourceColumn = findColumn(layout, activeId);
  const targetColumn = personalPortalColumnIds.indexOf(overId as PersonalPortalColumnId) >= 0
    ? overId as PersonalPortalColumnId
    : findColumn(layout, overId);
  if (!sourceColumn || !targetColumn) return layout;

  const sourceIndex = layout[sourceColumn].indexOf(activeId);
  const targetIndex = personalPortalColumnIds.indexOf(overId as PersonalPortalColumnId) >= 0
    ? layout[targetColumn].length
    : layout[targetColumn].indexOf(overId);
  if (sourceColumn === targetColumn && sourceIndex === targetIndex) return layout;

  const next: Record<PersonalPortalColumnId, string[]> = {
    'personal-column-1': [...layout['personal-column-1']],
    'personal-column-2': [...layout['personal-column-2']],
    'personal-column-3': [...layout['personal-column-3']]
  };
  next[sourceColumn].splice(sourceIndex, 1);
  const adjustedTarget = sourceColumn === targetColumn && sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
  next[targetColumn].splice(Math.max(0, adjustedTarget), 0, activeId);
  return next;
}