import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowGoalsAndScorecardsCopilotComponentProperties } from './ShowGoalsAndScorecardsCopilotComponentProperties';

export default class ShowGoalsAndScorecardsCopilotComponent extends ZavaOneCopilotComponentBase<IShowGoalsAndScorecardsCopilotComponentProperties> {
  protected readonly intent = 'goalsScorecards' as const;
}
