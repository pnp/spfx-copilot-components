import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface ISalesPerformanceWebPartProps extends IZavaOneWebPartProperties {}

export default class SalesPerformanceWebPart extends ZavaOneWebPartBase<ISalesPerformanceWebPartProps> {
  protected readonly intent = 'salesPerformance' as const;
}
