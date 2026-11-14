import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowMyShiftsCopilotComponentProperties } from './ShowMyShiftsCopilotComponentProperties';

export default class ShowMyShiftsCopilotComponent extends ZavaOneCopilotComponentBase<IShowMyShiftsCopilotComponentProperties> {
  protected readonly intent = 'shifts' as const;
}
