import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowActiveAnnouncementsCopilotComponentProperties } from './ShowActiveAnnouncementsCopilotComponentProperties';

export default class ShowActiveAnnouncementsCopilotComponent extends ZavaOneCopilotComponentBase<IShowActiveAnnouncementsCopilotComponentProperties> {
  protected readonly intent = 'announcements' as const;
}
