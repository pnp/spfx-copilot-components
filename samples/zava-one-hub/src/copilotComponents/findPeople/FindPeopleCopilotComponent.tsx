import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IFindPeopleCopilotComponentProperties } from './FindPeopleCopilotComponentProperties';

export default class FindPeopleCopilotComponent extends ZavaOneCopilotComponentBase<IFindPeopleCopilotComponentProperties> {
  protected readonly intent = 'people' as const;
}
