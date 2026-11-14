import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowMyLearningCopilotComponentProperties } from './ShowMyLearningCopilotComponentProperties';

export default class ShowMyLearningCopilotComponent extends ZavaOneCopilotComponentBase<IShowMyLearningCopilotComponentProperties> {
  protected readonly intent = 'learning' as const;
}
