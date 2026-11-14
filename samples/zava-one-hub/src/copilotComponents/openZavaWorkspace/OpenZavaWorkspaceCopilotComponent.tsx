import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IOpenZavaWorkspaceCopilotComponentProperties } from './OpenZavaWorkspaceCopilotComponentProperties';

export default class OpenZavaWorkspaceCopilotComponent extends ZavaOneCopilotComponentBase<IOpenZavaWorkspaceCopilotComponentProperties> {
  protected readonly intent = 'workspace' as const;
}
