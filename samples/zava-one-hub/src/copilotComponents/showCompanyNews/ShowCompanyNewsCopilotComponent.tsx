import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowCompanyNewsCopilotComponentProperties } from './ShowCompanyNewsCopilotComponentProperties';

export default class ShowCompanyNewsCopilotComponent extends ZavaOneCopilotComponentBase<IShowCompanyNewsCopilotComponentProperties> {
  protected readonly intent = 'companyNews' as const;
}
