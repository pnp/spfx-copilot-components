import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowMyTasksCopilotComponentProperties } from './ShowMyTasksCopilotComponentProperties';

export default class ShowMyTasksCopilotComponent extends ZavaOneCopilotComponentBase<IShowMyTasksCopilotComponentProperties> {
  protected readonly intent = 'tasks' as const;
}
