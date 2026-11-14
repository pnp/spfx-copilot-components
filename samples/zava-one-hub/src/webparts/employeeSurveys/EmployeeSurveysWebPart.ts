import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IEmployeeSurveysWebPartProps extends IZavaOneWebPartProperties {}

export default class EmployeeSurveysWebPart extends ZavaOneWebPartBase<IEmployeeSurveysWebPartProps> {
  protected readonly intent = 'surveys' as const;
}
