import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowMyDayCopilotComponentProperties } from './ShowMyDayCopilotComponentProperties';

export default class ShowMyDayCopilotComponent extends ZavaOneCopilotComponentBase<IShowMyDayCopilotComponentProperties> {
  protected readonly intent = 'myDay' as const;
}
