import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IFindCompanyKnowledgeCopilotComponentProperties } from './FindCompanyKnowledgeCopilotComponentProperties';

export default class FindCompanyKnowledgeCopilotComponent extends ZavaOneCopilotComponentBase<IFindCompanyKnowledgeCopilotComponentProperties> {
  protected readonly intent = 'knowledge' as const;
}
