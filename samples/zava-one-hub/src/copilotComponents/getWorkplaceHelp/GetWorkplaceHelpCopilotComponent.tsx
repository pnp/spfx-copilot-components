import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IGetWorkplaceHelpCopilotComponentProperties } from './GetWorkplaceHelpCopilotComponentProperties';

export default class GetWorkplaceHelpCopilotComponent extends ZavaOneCopilotComponentBase<IGetWorkplaceHelpCopilotComponentProperties> {
  protected readonly intent = 'workplaceHelp' as const;
}
