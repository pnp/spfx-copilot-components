import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IEmployeeServicesWebPartProps extends IZavaOneWebPartProperties {}

export default class EmployeeServicesWebPart extends ZavaOneWebPartBase<IEmployeeServicesWebPartProps> {
  protected readonly intent = 'employeeServices' as const;
}
