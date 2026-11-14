import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IExploreAgentCapabilitiesCopilotComponentProperties } from './ExploreAgentCapabilitiesCopilotComponentProperties';

export default class ExploreAgentCapabilitiesCopilotComponent extends ZavaOneCopilotComponentBase<IExploreAgentCapabilitiesCopilotComponentProperties> {
  protected readonly intent = 'capabilities' as const;
}
