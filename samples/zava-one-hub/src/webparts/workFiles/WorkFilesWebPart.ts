import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IWorkFilesWebPartProps extends IZavaOneWebPartProperties {}

export default class WorkFilesWebPart extends ZavaOneWebPartBase<IWorkFilesWebPartProps> {
  protected readonly intent = 'workFiles' as const;
}
