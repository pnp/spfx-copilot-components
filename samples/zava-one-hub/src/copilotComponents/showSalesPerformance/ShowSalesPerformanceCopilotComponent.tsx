import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowSalesPerformanceCopilotComponentProperties } from './ShowSalesPerformanceCopilotComponentProperties';

export default class ShowSalesPerformanceCopilotComponent extends ZavaOneCopilotComponentBase<IShowSalesPerformanceCopilotComponentProperties> {
  protected readonly intent = 'salesPerformance' as const;
}
