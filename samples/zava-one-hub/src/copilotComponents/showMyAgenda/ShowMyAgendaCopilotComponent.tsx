import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowMyAgendaCopilotComponentProperties } from './ShowMyAgendaCopilotComponentProperties';

export default class ShowMyAgendaCopilotComponent extends ZavaOneCopilotComponentBase<IShowMyAgendaCopilotComponentProperties> {
  protected readonly intent = 'agenda' as const;
}
