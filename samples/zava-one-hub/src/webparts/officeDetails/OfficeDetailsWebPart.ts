import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IOfficeDetailsWebPartProps extends IZavaOneWebPartProperties {}

export default class OfficeDetailsWebPart extends ZavaOneWebPartBase<IOfficeDetailsWebPartProps> {
  protected readonly intent = 'officeDetails' as const;
}
