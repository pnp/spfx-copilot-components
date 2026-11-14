import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface ICompanyNewsWebPartProps extends IZavaOneWebPartProperties {}

export default class CompanyNewsWebPart extends ZavaOneWebPartBase<ICompanyNewsWebPartProps> {
  protected readonly intent = 'companyNews' as const;
}
