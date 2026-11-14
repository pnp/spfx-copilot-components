import * as React from 'react';
import {
  Badge,
  Caption1,
  Text,
  createFocusOutlineStyle,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens
} from '@fluentui/react-components';
import { ChevronRight20Regular } from '@fluentui/react-icons';
import type { IProject, ProjectStatus } from '../mockData';

type StatusColor = 'success' | 'warning' | 'danger' | 'informative';

const STATUS_COLOR: Record<ProjectStatus, StatusColor> = {
  onTrack: 'success',
  atRisk: 'warning',
  blocked: 'danger',
  done: 'informative'
};

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC'
};

/**
 * Formats a YYYY-MM-DD date for the locale. Uses the default locale
 * when the locale is missing or not valid.
 */
export function formatDueDate(dueDate: string, locale: string | undefined): string {
  const date: Date = new Date(`${dueDate}T00:00:00Z`);

  try {
    return date.toLocaleDateString(locale, DATE_OPTIONS);
  } catch {
    return date.toLocaleDateString(undefined, DATE_OPTIONS);
  }
}

export interface IStatusBadgeProps {
  status: ProjectStatus;
  /** The status in words. Color is never the only signal. */
  label: string;
}

export function StatusBadge(props: IStatusBadgeProps): React.ReactElement {
  return (
    <Badge appearance="tint" color={STATUS_COLOR[props.status]}>
      {props.label}
    </Badge>
  );
}

export interface IProjectCardProps {
  project: IProject;
  statusLabel: string;
  dueDateText: string;
  selected: boolean;
  /** False when the device cannot hover. */
  canHover: boolean;
  onSelect: (projectId: string) => void;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalM,
    boxSizing: 'border-box',
    width: '100%',
    minWidth: 0,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1),
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontFamily: 'inherit',
    textAlign: 'start',
    cursor: 'pointer',
    ...createFocusOutlineStyle()
  },
  selected: {
    backgroundColor: tokens.colorNeutralBackground1Selected,
    ...shorthands.borderColor(tokens.colorBrandStroke1)
  },
  // Hover styles apply only when the device can hover. On a touch
  // device the icon is always visible.
  hover: {
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover
    },
    '& .designShowcase-affordance': {
      opacity: 0
    },
    '&:hover .designShowcase-affordance': {
      opacity: 1
    },
    '&:focus-visible .designShowcase-affordance': {
      opacity: 1
    }
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXXS,
    flexGrow: 1,
    minWidth: 0
  },
  title: {
    overflowWrap: 'anywhere'
  },
  meta: {
    color: tokens.colorNeutralForeground3,
    overflowWrap: 'anywhere'
  },
  badge: {
    flexShrink: 0
  },
  affordance: {
    flexShrink: 0,
    color: tokens.colorNeutralForeground3
  }
});

/** A project as a card. Both the inline and the fullscreen view use it. */
export function ProjectCard(props: IProjectCardProps): React.ReactElement {
  const { project, onSelect } = props;
  const styles = useStyles();

  const handleClick = React.useCallback((): void => {
    onSelect(project.id);
  }, [onSelect, project.id]);

  return (
    <button
      type="button"
      className={mergeClasses(
        styles.root,
        props.selected && styles.selected,
        props.canHover && styles.hover
      )}
      aria-pressed={props.selected}
      data-project-id={project.id}
      data-hover={props.canHover ? 'true' : 'false'}
      onClick={handleClick}
    >
      <span className={styles.text}>
        <Text weight="semibold" className={styles.title}>
          {project.title}
        </Text>
        <Caption1 className={styles.meta}>
          {project.owner} · {props.dueDateText}
        </Caption1>
      </span>
      <span className={styles.badge}>
        <StatusBadge status={project.status} label={props.statusLabel} />
      </span>
      <ChevronRight20Regular
        className={mergeClasses('designShowcase-affordance', styles.affordance)}
        aria-hidden="true"
      />
    </button>
  );
}
