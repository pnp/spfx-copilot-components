import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IItHelpWebPartProps extends IZavaOneWebPartProperties {}

export default class ItHelpWebPart extends ZavaOneWebPartBase<IItHelpWebPartProps> {
  protected readonly intent = 'itHelp' as const;
}
