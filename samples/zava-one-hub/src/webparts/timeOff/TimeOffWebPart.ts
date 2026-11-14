import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface ITimeOffWebPartProps extends IZavaOneWebPartProperties {}

export default class TimeOffWebPart extends ZavaOneWebPartBase<ITimeOffWebPartProps> {
  protected readonly intent = 'timeOff' as const;
}
