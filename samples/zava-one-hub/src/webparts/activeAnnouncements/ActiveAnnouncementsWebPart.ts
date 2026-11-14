import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IActiveAnnouncementsWebPartProps extends IZavaOneWebPartProperties {}

export default class ActiveAnnouncementsWebPart extends ZavaOneWebPartBase<IActiveAnnouncementsWebPartProps> {
  protected readonly intent = 'announcements' as const;
}
