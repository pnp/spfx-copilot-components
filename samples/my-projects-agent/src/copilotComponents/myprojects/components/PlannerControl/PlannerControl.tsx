import * as React from 'react';
import type { BaseComponentContext } from '@microsoft/sp-component-base';
import {
  MessageBar,
  MessageBarBody,
  Spinner,
} from '@fluentui/react-components';
import { useLoadSPComponent } from '@spteck/m365-hooks';
import { StackV2 } from '@spteck/react-controls-v2/stack-v2';
import { TypographyControl } from '@spteck/react-controls-v2/typography-control';

import type {
  ICompatibleLoadResult,
  IPlannerControlProps,
} from '../../models';
import { PLANNER_COMPONENT_TARGET } from '../../utils/plannerComponent';
import { createPlannerControlProperties } from './plannerControl.constants';
import { usePlannerControlStyles } from './usePlannerControlStyles';

// The local hook is compiled against SPFx 1.23; its runtime context contract is
// compatible, but SPFx 1.24's private BaseComponentContext members are nominal.
const useCurrentSpfxLoadComponent = useLoadSPComponent as unknown as (
  context: BaseComponentContext,
  target: typeof PLANNER_COMPONENT_TARGET,
  containerRef: React.RefObject<HTMLDivElement>
) => ICompatibleLoadResult;

export function PlannerControl(
  props: IPlannerControlProps
): React.ReactElement {
  const styles = usePlannerControlStyles();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { error, isLoading, load } = useCurrentSpfxLoadComponent(
    props.context,
    PLANNER_COMPONENT_TARGET,
    containerRef
  );

  React.useEffect(() => {
    load(createPlannerControlProperties(props.project));
  }, [
    load,
    props.project.id,
    props.project.owner,
    props.project.title,
  ]);

  return (
    <StackV2
      className={styles.root}
      height={props.scrollAreaHeight}
      overflow="hidden"
      width="100%"
    >
      {isLoading && (
        <StackV2
          alignItems="center"
          className={styles.loadingOverlay}
          height="100%"
          justifyContent="center"
          width="100%"
        >
          <Spinner label={props.loadingLabel} size="medium" />
        </StackV2>
      )}
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>
            <TypographyControl>{error}</TypographyControl>
          </MessageBarBody>
        </MessageBar>
      )}
      <StackV2
        className={styles.content}
        height="100%"
        ref={containerRef}
        width="100%"
      />
    </StackV2>
  );
}
