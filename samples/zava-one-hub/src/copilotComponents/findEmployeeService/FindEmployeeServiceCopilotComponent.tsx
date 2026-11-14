import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IFindEmployeeServiceCopilotComponentProperties } from './FindEmployeeServiceCopilotComponentProperties';

export default class FindEmployeeServiceCopilotComponent extends ZavaOneCopilotComponentBase<IFindEmployeeServiceCopilotComponentProperties> {
  protected readonly intent = 'employeeServices' as const;
}
