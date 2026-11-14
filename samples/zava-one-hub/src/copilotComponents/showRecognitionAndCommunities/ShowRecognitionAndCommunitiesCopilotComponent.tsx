import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowRecognitionAndCommunitiesCopilotComponentProperties } from './ShowRecognitionAndCommunitiesCopilotComponentProperties';

export default class ShowRecognitionAndCommunitiesCopilotComponent extends ZavaOneCopilotComponentBase<IShowRecognitionAndCommunitiesCopilotComponentProperties> {
  protected readonly intent = 'recognition' as const;
}
