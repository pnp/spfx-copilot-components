import * as React from 'react';
import { Button, Subtitle1, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowExpand24Regular } from '@fluentui/react-icons';

import type { IProject } from '../mockData';
import type { IInlineViewProps } from './IDesignShowcaseProps';
import { ProjectCard, formatDueDate } from './ProjectCard';

/** The inline view has one job: show the first projects. */
export const INLINE_CARD_COUNT: number = 4;

const useStyles = makeStyles({
  // Fluid width. No fixed pixel width, so the view works down to
  // about 320 pixels.
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM,
    boxSizing: 'border-box',
    width: '100%',
    minWidth: 0,
    padding: tokens.spacingHorizontalL
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: tokens.spacingHorizontalM
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
    listStyleType: 'none',
    margin: 0,
    padding: 0
  },
  viewAll: {
    alignSelf: 'flex-start'
  }
});

export function InlineView(props: IInlineViewProps): React.ReactElement {
  const { projects, layout, strings } = props;
  const styles = useStyles();
  const visible: ReadonlyArray<IProject> = projects.slice(0, INLINE_CARD_COUNT);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Subtitle1 as="h2">{strings.Title}</Subtitle1>
        {/* The host does not supply an expand control. The component does. */}
        {layout.canExpand && (
          <Button
            appearance="subtle"
            icon={<ArrowExpand24Regular />}
            aria-label={strings.ExpandButtonLabel}
            title={strings.ExpandButtonLabel}
            onClick={props.onExpand}
          />
        )}
      </div>

      <ul className={styles.list}>
        {visible.map((project: IProject) => (
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

      {layout.canExpand && projects.length > INLINE_CARD_COUNT && (
        <Button
          appearance="secondary"
          className={styles.viewAll}
          data-action="view-all"
          onClick={props.onExpand}
        >
          {strings.ViewAllLabel.replace('{0}', String(projects.length))}
        </Button>
      )}
    </div>
  );
}
