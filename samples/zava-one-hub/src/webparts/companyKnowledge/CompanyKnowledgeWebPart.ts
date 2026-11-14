import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface ICompanyKnowledgeWebPartProps extends IZavaOneWebPartProperties {}

export default class CompanyKnowledgeWebPart extends ZavaOneWebPartBase<ICompanyKnowledgeWebPartProps> {
  protected readonly intent = 'knowledge' as const;
}
