import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IImportantMailWebPartProps extends IZavaOneWebPartProperties {}

export default class ImportantMailWebPart extends ZavaOneWebPartBase<IImportantMailWebPartProps> {
  protected readonly intent = 'importantMail' as const;
}
