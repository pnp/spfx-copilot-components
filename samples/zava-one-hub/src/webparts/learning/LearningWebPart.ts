import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface ILearningWebPartProps extends IZavaOneWebPartProperties {}

export default class LearningWebPart extends ZavaOneWebPartBase<ILearningWebPartProps> {
  protected readonly intent = 'learning' as const;
}
