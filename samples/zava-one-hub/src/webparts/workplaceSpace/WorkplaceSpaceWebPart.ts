import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IWorkplaceSpaceWebPartProps extends IZavaOneWebPartProperties {}

export default class WorkplaceSpaceWebPart extends ZavaOneWebPartBase<IWorkplaceSpaceWebPartProps> {
  protected readonly intent = 'workplaceSpace' as const;
}
