import * as React from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@fluentui/react-components';
import { Add20Regular } from '@fluentui/react-icons';
import { StackV2 } from '@spteck/react-controls-v2/stack-v2';
import { TypographyControl } from '@spteck/react-controls-v2/typography-control';

import type { IPlannerEmptyStateProps } from '../../models';
import { PLANNER_APP_URL } from './plannerEmptyState.constants';
import { usePlannerEmptyStateStyles } from './usePlannerEmptyStateStyles';

export function PlannerEmptyState(
  props: IPlannerEmptyStateProps
): React.ReactElement {
  const styles = usePlannerEmptyStateStyles();
  const handleCreateProject = (): void => {
    props.targetDocument?.defaultView?.open(
      PLANNER_APP_URL,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <StackV2
      alignItems="center"
      className={styles.root}
      gap="l"
      justifyContent="center"
      padding="xxl"
      width="100%"
    >
      <StackV2
        alignItems="center"
        className={styles.iconFrame}
        height="72px"
        justifyContent="center"
        width="72px"
      >
        <Icon
          aria-hidden="true"
          height={48}
          icon="thesvg-color:microsoft-planner"
          width={48}
        />
      </StackV2>
      <StackV2 alignItems="center" gap="xs">
        <TypographyControl fontSize="xl" fontWeight="semibold">
          {props.strings.NoProjectsTitle}
        </TypographyControl>
        <TypographyControl className={styles.description} fontSize="m">
          {props.strings.NoProjectsDescription}
        </TypographyControl>
      </StackV2>
      <Button
        appearance="primary"
        icon={<Add20Regular />}
        onClick={handleCreateProject}
      >
        <TypographyControl fontWeight="semibold">
          {props.strings.CreateProjectButtonLabel}
        </TypographyControl>
      </Button>
    </StackV2>
  );
}