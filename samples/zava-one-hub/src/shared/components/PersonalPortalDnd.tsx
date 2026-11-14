import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { Dismiss24Regular, ReOrderDotsVertical24Regular } from '@fluentui/react-icons';
import {
  createDefaultPersonalPortalLayout,
  movePersonalPortalPanel,
  normalizePersonalPortalLayout,
  personalPortalColumnIds,
  type PersonalPortalColumnId,
  type PersonalPortalLayout
} from '../models/personalPortalLayout';

const defaultStorageKey = 'zava-one:personal-portal-layout:v1';

const useStyles = makeStyles({
  columns: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: tokens.spacingHorizontalL, alignItems: 'start', '@container zava-experience (max-width: 1080px)': { gridTemplateColumns: '1fr' } },
  column: { display: 'grid', gap: tokens.spacingVerticalL, alignContent: 'start', minWidth: 0, minHeight: '96px', borderRadius: tokens.borderRadiusLarge, transitionProperty: 'background-color, box-shadow', transitionDuration: tokens.durationNormal },
  columnEditing: { boxShadow: `inset 0 0 0 1px ${tokens.colorNeutralStroke2}`, padding: tokens.spacingHorizontalXS },
  columnOver: { backgroundColor: tokens.colorBrandBackground2, boxShadow: `0 0 0 2px ${tokens.colorBrandStroke2}` },
  panel: { position: 'relative', minWidth: 0, paddingTop: tokens.spacingVerticalL, transitionProperty: 'opacity', transitionDuration: tokens.durationFaster },
  staticPanel: { minWidth: 0 },
  panelDragging: { opacity: 0.42 },
  panelControls: { position: 'absolute', zIndex: 3, top: 0, right: tokens.spacingHorizontalS, display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS },
  handle: { display: 'grid', placeItems: 'center', width: '32px', minWidth: '32px', height: '32px', padding: 0, color: tokens.colorNeutralForeground2, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusMedium, boxShadow: tokens.shadow4, cursor: 'grab', ':hover': { color: tokens.colorBrandForeground1, backgroundColor: tokens.colorNeutralBackground1Hover }, ':focus-visible': { outline: `2px solid ${tokens.colorStrokeFocus2}`, outlineOffset: '2px' }, ':active': { cursor: 'grabbing' } },
  hide: { width: '32px', minWidth: '32px', height: '32px', backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, boxShadow: tokens.shadow4 },
  overlay: { maxWidth: '340px', padding: tokens.spacingHorizontalM, color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorBrandStroke1}`, borderRadius: tokens.borderRadiusLarge, boxShadow: tokens.shadow28, fontWeight: tokens.fontWeightSemibold }
});

export interface IPersonalPortalPanel {
  id: string;
  title: string;
  content: React.ReactNode;
  visible?: boolean;
}

export interface IPersonalPortalDndProps {
  panels: readonly IPersonalPortalPanel[];
  targetDocument: Document;
  editMode: boolean;
  onHidePanel: (panelId: string) => void;
  storageKey?: string;
  ariaLabel?: string;
  dataAttribute?: 'data-personal-capability' | 'data-company-capability';
  defaultColumnAssignments?: Readonly<Record<string, PersonalPortalColumnId>>;
}

function readLayout(targetDocument: Document, storageKey: string, panelIds: readonly string[], columnAssignments?: Readonly<Record<string, PersonalPortalColumnId>>): PersonalPortalLayout {
  try {
    const saved = targetDocument.defaultView?.sessionStorage.getItem(storageKey);
    return normalizePersonalPortalLayout(saved ? JSON.parse(saved) : undefined, panelIds, columnAssignments);
  } catch {
    return createDefaultPersonalPortalLayout(panelIds, columnAssignments);
  }
}

function SortablePanel(props: { panel: IPersonalPortalPanel; onHidePanel: (panelId: string) => void; dataAttribute: string }): React.ReactElement {
  const styles = useStyles();
  const sortable = useSortable({ id: props.panel.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    zIndex: sortable.isDragging ? 2 : undefined
  };
  const dataAttribute = { [props.dataAttribute]: props.panel.id };
  return <section ref={sortable.setNodeRef} style={style} className={mergeClasses(styles.panel, sortable.isDragging && styles.panelDragging)} {...dataAttribute}><div className={styles.panelControls}><button ref={sortable.setActivatorNodeRef} {...sortable.attributes} {...sortable.listeners} type="button" className={styles.handle} aria-label={`Move ${props.panel.title}`} title={`Move ${props.panel.title}`}><ReOrderDotsVertical24Regular /></button><Button className={styles.hide} appearance="subtle" icon={<Dismiss24Regular />} aria-label={`Hide ${props.panel.title}`} title={`Hide ${props.panel.title}`} onPointerDown={(event) => event.stopPropagation()} onClick={() => props.onHidePanel(props.panel.id)} /></div>{props.panel.content}</section>;
}

function PortalColumn(props: { columnId: PersonalPortalColumnId; panels: readonly IPersonalPortalPanel[]; onHidePanel: (panelId: string) => void; dataAttribute: string }): React.ReactElement {
  const styles = useStyles();
  const droppable = useDroppable({ id: props.columnId });
  return <SortableContext items={props.panels.map((panel) => panel.id)} strategy={verticalListSortingStrategy}><div ref={droppable.setNodeRef} className={mergeClasses(styles.column, styles.columnEditing, droppable.isOver && styles.columnOver)} data-portal-column={props.columnId}>{props.panels.map((panel) => <SortablePanel key={panel.id} panel={panel} onHidePanel={props.onHidePanel} dataAttribute={props.dataAttribute} />)}</div></SortableContext>;
}

export function PersonalPortalDnd(props: IPersonalPortalDndProps): React.ReactElement {
  const styles = useStyles();
  const panelIds = props.panels.map((panel) => panel.id);
  const panelSignature = panelIds.join('|');
  const storageKey = props.storageKey || defaultStorageKey;
  const ariaLabel = props.ariaLabel || 'Personal experiences';
  const dataAttribute = props.dataAttribute || 'data-personal-capability';
  const [layout, setLayout] = React.useState<PersonalPortalLayout>(() => readLayout(props.targetDocument, storageKey, panelIds, props.defaultColumnAssignments));
  const [activeId, setActiveId] = React.useState<string>();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  React.useEffect(() => {
    setLayout((current) => normalizePersonalPortalLayout(current, panelIds));
  }, [panelSignature]);

  React.useEffect(() => {
    try {
      props.targetDocument.defaultView?.sessionStorage.setItem(storageKey, JSON.stringify(layout));
    } catch {
      // Session storage can be unavailable in restricted hosts; dragging still works for this mount.
    }
  }, [layout, props.targetDocument, storageKey]);

  const panelById = new Map(props.panels.map((panel) => [panel.id, panel]));
  const visiblePanels = (columnId: PersonalPortalColumnId): IPersonalPortalPanel[] => layout[columnId].map((panelId) => panelById.get(panelId)).filter((panel): panel is IPersonalPortalPanel => !!panel && panel.visible !== false);
  const startDrag = (event: DragStartEvent): void => setActiveId(String(event.active.id));
  const endDrag = (event: DragEndEvent): void => {
    setActiveId(undefined);
    if (!event.over) return;
    setLayout((current) => movePersonalPortalPanel(current, String(event.active.id), String(event.over?.id)));
  };
  const cancelDrag = (): void => setActiveId(undefined);

  if (!props.editMode) return <div className={styles.columns} aria-label={ariaLabel}>{personalPortalColumnIds.map((columnId) => <div key={columnId} className={styles.column} data-portal-column={columnId}>{visiblePanels(columnId).map((panel) => { const panelAttribute = { [dataAttribute]: panel.id }; return <section key={panel.id} className={styles.staticPanel} {...panelAttribute}>{panel.content}</section>; })}</div>)}</div>;

  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={startDrag} onDragCancel={cancelDrag} onDragEnd={endDrag}>
    <div className={styles.columns} aria-label={ariaLabel}>
      {personalPortalColumnIds.map((columnId) => <PortalColumn key={columnId} columnId={columnId} panels={visiblePanels(columnId)} onHidePanel={props.onHidePanel} dataAttribute={dataAttribute} />)}
    </div>
    <DragOverlay>{activeId && panelById.get(activeId) ? <div className={styles.overlay}>{panelById.get(activeId)?.title}</div> : null}</DragOverlay>
  </DndContext>;
}