import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IFindWorkplaceSpaceCopilotComponentProperties } from './FindWorkplaceSpaceCopilotComponentProperties';

export default class FindWorkplaceSpaceCopilotComponent extends ZavaOneCopilotComponentBase<IFindWorkplaceSpaceCopilotComponentProperties> {
  protected readonly intent = 'workplaceSpace' as const;
}
