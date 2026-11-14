import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IGoalsAndScorecardsWebPartProps extends IZavaOneWebPartProperties {}

export default class GoalsAndScorecardsWebPart extends ZavaOneWebPartBase<IGoalsAndScorecardsWebPartProps> {
  protected readonly intent = 'goalsScorecards' as const;
}
