import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowCompanyEventsCopilotComponentProperties } from './ShowCompanyEventsCopilotComponentProperties';

export default class ShowCompanyEventsCopilotComponent extends ZavaOneCopilotComponentBase<IShowCompanyEventsCopilotComponentProperties> {
  protected readonly intent = 'companyEvents' as const;
}
