import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowOfficeDetailsCopilotComponentProperties } from './ShowOfficeDetailsCopilotComponentProperties';

export default class ShowOfficeDetailsCopilotComponent extends ZavaOneCopilotComponentBase<IShowOfficeDetailsCopilotComponentProperties> {
  protected readonly intent = 'officeDetails' as const;
}
