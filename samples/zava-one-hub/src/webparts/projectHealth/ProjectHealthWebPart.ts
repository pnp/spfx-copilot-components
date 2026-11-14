import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IProjectHealthWebPartProps extends IZavaOneWebPartProperties {}

export default class ProjectHealthWebPart extends ZavaOneWebPartBase<IProjectHealthWebPartProps> {
  protected readonly intent = 'projectHealth' as const;
}
