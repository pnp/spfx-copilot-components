import * as React from 'react';
import type {
  ICreatePlannerProjectProperties,
  IMyprojectsExperienceProps,
  IMyprojectsToolProperties,
} from '../../models';
import Myprojects from '../Myprojects/Myprojects';
import { PlannerProjectCreationFlow } from '../PlannerProjectCreation/PlannerProjectCreationFlow';

function isCreation(
  properties: IMyprojectsToolProperties
): properties is ICreatePlannerProjectProperties {
  return 'operation' in properties && properties.operation === 'create';
}

export function MyprojectsExperience({
  properties,
  ...hostProps
}: IMyprojectsExperienceProps): React.ReactElement {
  if (isCreation(properties)) {
    return (
      <PlannerProjectCreationFlow
        {...hostProps}
        key={JSON.stringify([
          hostProps.context.instanceId,
          properties.projectName,
          properties.startDate,
          properties.template,
          properties.assignPlanningAndDevelopmentToMe,
        ])}
        properties={properties}
      />
    );
  }

  return (
    <Myprojects
      {...hostProps}
      properties={{ ...properties, view: properties.view ?? 'all' }}
    />
  );
}