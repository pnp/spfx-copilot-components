import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowImportantMailCopilotComponentProperties } from './ShowImportantMailCopilotComponentProperties';

export default class ShowImportantMailCopilotComponent extends ZavaOneCopilotComponentBase<IShowImportantMailCopilotComponentProperties> {
  protected readonly intent = 'importantMail' as const;
}
