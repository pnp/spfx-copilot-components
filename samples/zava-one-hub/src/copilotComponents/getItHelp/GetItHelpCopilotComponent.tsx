import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IGetItHelpCopilotComponentProperties } from './GetItHelpCopilotComponentProperties';

export default class GetItHelpCopilotComponent extends ZavaOneCopilotComponentBase<IGetItHelpCopilotComponentProperties> {
  protected readonly intent = 'itHelp' as const;
}
