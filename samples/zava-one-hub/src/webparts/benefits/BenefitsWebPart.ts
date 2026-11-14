import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IBenefitsWebPartProps extends IZavaOneWebPartProperties {}

export default class BenefitsWebPart extends ZavaOneWebPartBase<IBenefitsWebPartProps> {
  protected readonly intent = 'benefits' as const;
}
