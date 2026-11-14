import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface ICompanyEventsWebPartProps extends IZavaOneWebPartProperties {}

export default class CompanyEventsWebPart extends ZavaOneWebPartBase<ICompanyEventsWebPartProps> {
  protected readonly intent = 'companyEvents' as const;
}
