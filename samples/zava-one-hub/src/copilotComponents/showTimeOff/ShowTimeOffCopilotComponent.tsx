import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowTimeOffCopilotComponentProperties } from './ShowTimeOffCopilotComponentProperties';

export default class ShowTimeOffCopilotComponent extends ZavaOneCopilotComponentBase<IShowTimeOffCopilotComponentProperties> {
  protected readonly intent = 'timeOff' as const;
}
