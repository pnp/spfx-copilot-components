import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowMyApprovalsCopilotComponentProperties } from './ShowMyApprovalsCopilotComponentProperties';

export default class ShowMyApprovalsCopilotComponent extends ZavaOneCopilotComponentBase<IShowMyApprovalsCopilotComponentProperties> {
  protected readonly intent = 'approvals' as const;
}
