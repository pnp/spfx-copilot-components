import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IFindMyWorkFilesCopilotComponentProperties } from './FindMyWorkFilesCopilotComponentProperties';

export default class FindMyWorkFilesCopilotComponent extends ZavaOneCopilotComponentBase<IFindMyWorkFilesCopilotComponentProperties> {
  protected readonly intent = 'workFiles' as const;
}
