import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IMyDayWebPartProps extends IZavaOneWebPartProperties {}

export default class MyDayWebPart extends ZavaOneWebPartBase<IMyDayWebPartProps> {
  protected readonly intent = 'myDay' as const;
}
