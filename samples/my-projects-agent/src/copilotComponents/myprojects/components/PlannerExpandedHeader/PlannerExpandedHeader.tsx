import * as React from 'react';
import { Divider } from '@fluentui/react-components';
import { StackV2 } from '@spteck/react-controls-v2/stack-v2';
import { TypographyControl } from '@spteck/react-controls-v2/typography-control';

import { GANTT_VIEW_KEY } from '../../constants/plannerExpandedView.constants';
import type { IPlannerExpandedHeaderProps } from '../../models';
import { PlannerDisplayModeButton } from '../PlannerDisplayModeButton/PlannerDisplayModeButton';
import { PlannerProjectStatusBadges } from '../PlannerProjectStatusBadges/PlannerProjectStatusBadges';
import { PlannerScaleSelector } from '../PlannerScaleSelector/PlannerScaleSelector';
import { PlannerViewSelector } from '../PlannerViewSelector/PlannerViewSelector';

export function PlannerExpandedHeader(
  props: IPlannerExpandedHeaderProps
): React.ReactElement {
  return (
    <StackV2
      alignItems="flex-start"
      direction="horizontal"
      gap="m"
      justifyContent="space-between"
      wrap
    >
      <StackV2 gap="m">
        <TypographyControl fontSize="l" fontWeight="semibold">
          {props.project.title}
        </TypographyControl>
        <StackV2 direction="horizontal" gap="s" wrap>
          <PlannerProjectStatusBadges
            project={props.project}
            strings={props.strings}
          />
        </StackV2>
      </StackV2>
      <StackV2 alignItems="flex-end" direction="horizontal" gap="m">
        <PlannerViewSelector
          onChange={props.onViewChange}
          strings={props.strings}
        />
        {props.selectedView === GANTT_VIEW_KEY && (
          <PlannerScaleSelector
            onChange={props.onScaleChange}
            scale={props.scale}
            strings={props.strings}
          />
        )}
        <PlannerDisplayModeButton
          label={props.strings.CompactButtonLabel}
          mode="inline"
          onRequestDisplayMode={props.onCompact}
          theme={props.theme}
        />
      </StackV2>
      <Divider />
    </StackV2>
  );
}
