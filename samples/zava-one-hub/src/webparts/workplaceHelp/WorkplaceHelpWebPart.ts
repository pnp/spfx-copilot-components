import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IWorkplaceHelpWebPartProps extends IZavaOneWebPartProperties {}

export default class WorkplaceHelpWebPart extends ZavaOneWebPartBase<IWorkplaceHelpWebPartProps> {
  protected readonly intent = 'workplaceHelp' as const;
}
