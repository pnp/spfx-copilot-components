import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowEmployeeSurveysCopilotComponentProperties } from './ShowEmployeeSurveysCopilotComponentProperties';

export default class ShowEmployeeSurveysCopilotComponent extends ZavaOneCopilotComponentBase<IShowEmployeeSurveysCopilotComponentProperties> {
  protected readonly intent = 'surveys' as const;
}
