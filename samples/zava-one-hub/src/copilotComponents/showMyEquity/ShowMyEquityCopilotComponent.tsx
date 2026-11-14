import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowMyEquityCopilotComponentProperties } from './ShowMyEquityCopilotComponentProperties';

export default class ShowMyEquityCopilotComponent extends ZavaOneCopilotComponentBase<IShowMyEquityCopilotComponentProperties> {
  protected readonly intent = 'equity' as const;
}
