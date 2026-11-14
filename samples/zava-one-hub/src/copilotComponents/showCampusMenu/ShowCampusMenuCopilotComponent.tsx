import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowCampusMenuCopilotComponentProperties } from './ShowCampusMenuCopilotComponentProperties';

export default class ShowCampusMenuCopilotComponent extends ZavaOneCopilotComponentBase<IShowCampusMenuCopilotComponentProperties> {
  protected readonly intent = 'campusMenu' as const;
}
