import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IShiftsWebPartProps extends IZavaOneWebPartProperties {}

export default class ShiftsWebPart extends ZavaOneWebPartBase<IShiftsWebPartProps> {
  protected readonly intent = 'shifts' as const;
}
