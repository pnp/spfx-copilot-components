import * as React from 'react';
import {
  Body1,
  Subtitle1,
  Title3,
  makeStyles,
  mergeClasses,
  tokens
} from '@fluentui/react-components';

import type { IProject } from '../mockData';
import type { IShowcaseViewProps } from './IDesignShowcaseProps';
import { ProjectCard, StatusBadge, formatDueDate } from './ProjectCard';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
    boxSizing: 'border-box',
    width: '100%',
    minWidth: 0,
    padding: tokens.spacingHorizontalXXL
  },
  body: {
    display: 'grid',
    alignItems: 'start',
    gap: tokens.spacingHorizontalL
  },
  // The extra space holds a second region. The inline layout is not
  // stretched.
  wide: {
    gridTemplateColumns: 'minmax(0, 1fr) 320px'
  },
  stacked: {
    gridTemplateColumns: 'minmax(0, 1fr)'
  },
  // The number of columns follows the width. No breakpoint code.
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: tokens.spacingHorizontalM,
    listStyleType: 'none',
    margin: 0,
    padding: 0,
    minWidth: 0
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM,
    boxSizing: 'border-box',
    minWidth: 0,
    padding: tokens.spacingHorizontalL,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground2
  },
  detailsTitle: {
    overflowWrap: 'anywhere'
  },
  fields: {
    display: 'grid',
    gridTemplateColumns: 'max-content minmax(0, 1fr)',
    columnGap: tokens.spacingHorizontalM,
    rowGap: tokens.spacingVerticalXS,
    margin: 0
  },
  term: {
    color: tokens.colorNeutralForeground3
  },
  value: {
    margin: 0,
    overflowWrap: 'anywhere'
  }
});

export function FullscreenView(props: IShowcaseViewProps): React.ReactElement {
  const { projects, layout, strings } = props;
  const styles = useStyles();
  const selected: IProject | undefined = projects.find(
    (project: IProject) => project.id === props.selectedId
  );

  const grid: React.ReactElement = (
    <ul key="grid" className={styles.grid}>
      {projects.map((project: IProject) => (
        <li key={project.id}>
          <ProjectCard
            project={project}
            statusLabel={props.statusLabels[project.status]}
            dueDateText={`${strings.DueLabel} ${formatDueDate(project.dueDate, props.locale)}`}
            selected={project.id === props.selectedId}
            canHover={layout.canHover}
            onSelect={props.onSelect}
          />
        </li>
      ))}
    </ul>
  );

  const details: React.ReactElement = (
    <section
      key="details"
      className={styles.details}
      aria-label={strings.DetailsTitle}
      aria-live="polite"
      data-region="details"
    >
      {selected === undefined ? (
        <Body1>{strings.NoSelectionMessage}</Body1>
      ) : (
        <>
          <Subtitle1 as="h3" className={styles.detailsTitle}>
            {selected.title}
          </Subtitle1>
          <div>
            <StatusBadge status={selected.status} label={props.statusLabels[selected.status]} />
          </div>
          <Body1>{selected.summary}</Body1>
          <dl className={styles.fields}>
            <dt className={styles.term}>{strings.OwnerLabel}</dt>
            <dd className={styles.value}>{selected.owner}</dd>
            <dt className={styles.term}>{strings.DueLabel}</dt>
            <dd className={styles.value}>{formatDueDate(selected.dueDate, props.locale)}</dd>
          </dl>
        </>
      )}
    </section>
  );

  return (
    <div className={styles.root}>
      {/* No collapse control. The host owns the way out of fullscreen. */}
      <Title3 as="h2">{strings.Title}</Title3>
      <div
        className={mergeClasses(styles.body, layout.isNarrow ? styles.stacked : styles.wide)}
        data-layout={layout.isNarrow ? 'stacked' : 'wide'}
      >
        {/* In a narrow container the details come first, so the user
            sees them without scrolling past the grid. */}
        {layout.isNarrow ? [details, grid] : [grid, details]}
      </div>
    </div>
  );
}
