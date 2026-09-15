import * as React from 'react';
import { Button } from '@fluentui/react-components';

import {
  ArrowExpand20Regular,
  ArrowMinimize20Regular,
} from '@fluentui/react-icons';
import { CustomTooltip } from '@spteck/react-controls-v2/custom-tooltip';

import type { IPlannerDisplayModeButtonProps } from '../../models';

export function PlannerDisplayModeButton(
  props: IPlannerDisplayModeButtonProps
): React.ReactElement {
  const handleClick = async (): Promise<void> => {
    await props.onRequestDisplayMode(props.mode);
  };

  return (
    <CustomTooltip content={props.label} relationship="label" theme={props.theme}>
      <Button
        appearance="subtle"
        aria-label={props.label}
        icon={
          props.mode === 'fullscreen' ? (
            <ArrowExpand20Regular />
          ) : (
            <ArrowMinimize20Regular />
          )
        }
        onClick={handleClick}
      />
    </CustomTooltip>
  );
}
