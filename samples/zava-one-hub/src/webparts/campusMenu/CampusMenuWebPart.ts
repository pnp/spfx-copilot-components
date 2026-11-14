import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface ICampusMenuWebPartProps extends IZavaOneWebPartProperties {}

export default class CampusMenuWebPart extends ZavaOneWebPartBase<ICampusMenuWebPartProps> {
  protected readonly intent = 'campusMenu' as const;
}
