import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface ICorporateGlossaryWebPartProps extends IZavaOneWebPartProperties {}

export default class CorporateGlossaryWebPart extends ZavaOneWebPartBase<ICorporateGlossaryWebPartProps> {
  protected readonly intent = 'glossary' as const;
}
