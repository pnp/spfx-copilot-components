import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface ICompanyStockWebPartProps extends IZavaOneWebPartProperties {}

export default class CompanyStockWebPart extends ZavaOneWebPartBase<ICompanyStockWebPartProps> {
  protected readonly intent = 'companyStock' as const;
}
