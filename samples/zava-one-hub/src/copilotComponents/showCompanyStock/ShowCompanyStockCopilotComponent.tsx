import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowCompanyStockCopilotComponentProperties } from './ShowCompanyStockCopilotComponentProperties';

export default class ShowCompanyStockCopilotComponent extends ZavaOneCopilotComponentBase<IShowCompanyStockCopilotComponentProperties> {
  protected readonly intent = 'companyStock' as const;
}
