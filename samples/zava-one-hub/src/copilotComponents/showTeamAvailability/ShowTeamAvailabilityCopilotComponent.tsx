import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowTeamAvailabilityCopilotComponentProperties } from './ShowTeamAvailabilityCopilotComponentProperties';

export default class ShowTeamAvailabilityCopilotComponent extends ZavaOneCopilotComponentBase<IShowTeamAvailabilityCopilotComponentProperties> {
  protected readonly intent = 'teamAvailability' as const;
}
