import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IFindCompanyTermCopilotComponentProperties } from './FindCompanyTermCopilotComponentProperties';

export default class FindCompanyTermCopilotComponent extends ZavaOneCopilotComponentBase<IFindCompanyTermCopilotComponentProperties> {
  protected readonly intent = 'glossary' as const;
}
