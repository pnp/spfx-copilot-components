import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IEquityWebPartProps extends IZavaOneWebPartProperties {}

export default class EquityWebPart extends ZavaOneWebPartBase<IEquityWebPartProps> {
  protected readonly intent = 'equity' as const;
}
