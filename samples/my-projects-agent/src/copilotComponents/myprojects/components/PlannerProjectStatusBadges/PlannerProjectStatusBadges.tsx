import * as React from 'react';
import { Badge } from '@fluentui/react-components';
import { TypographyControl } from '@spteck/react-controls-v2/typography-control';

import type {
  IPlannerProjectStatusBadgesProps,
  IProjectStatusBadgeProps,
} from '../../models';
import {
  PLANNER_PROJECT_STATUS_BADGE_DEFINITIONS,
  resolvePlannerProjectStatusBadge,
} from './plannerProjectStatusBadges.constants';
import { usePlannerProjectStatusBadgesStyles } from './usePlannerProjectStatusBadgesStyles';

function ProjectStatusBadge(
  props: IProjectStatusBadgeProps
): React.ReactElement {
  const styles = usePlannerProjectStatusBadgesStyles();

  return (
    <Badge
      appearance="tint"
      className={styles.badge}
      color={props.color}
      shape="rounded"
      size="large"
    >
      <TypographyControl fontSize="s" fontWeight="semibold">
        {props.value} {props.label}
      </TypographyControl>
    </Badge>
  );
}

export function PlannerProjectStatusBadges(
  props: IPlannerProjectStatusBadgesProps
): React.ReactElement {
  return (
    <>
      {PLANNER_PROJECT_STATUS_BADGE_DEFINITIONS.map((definition) => {
        const badge = resolvePlannerProjectStatusBadge(
          definition,
          props.project,
          props.strings
        );

        return (
          <ProjectStatusBadge
            color={badge.color}
            key={definition.valueKey}
            label={badge.label}
            value={badge.value}
          />
        );
      })}
    </>
  );
}