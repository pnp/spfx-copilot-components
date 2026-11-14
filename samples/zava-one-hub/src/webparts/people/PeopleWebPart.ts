import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IPeopleWebPartProps extends IZavaOneWebPartProperties {}

export default class PeopleWebPart extends ZavaOneWebPartBase<IPeopleWebPartProps> {
  protected readonly intent = 'people' as const;
}
