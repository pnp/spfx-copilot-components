import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowProjectHealthCopilotComponentProperties } from './ShowProjectHealthCopilotComponentProperties';

export default class ShowProjectHealthCopilotComponent extends ZavaOneCopilotComponentBase<IShowProjectHealthCopilotComponentProperties> {
  protected readonly intent = 'projectHealth' as const;
}
