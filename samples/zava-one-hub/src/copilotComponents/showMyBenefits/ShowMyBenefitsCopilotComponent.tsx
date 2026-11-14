import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowMyBenefitsCopilotComponentProperties } from './ShowMyBenefitsCopilotComponentProperties';

export default class ShowMyBenefitsCopilotComponent extends ZavaOneCopilotComponentBase<IShowMyBenefitsCopilotComponentProperties> {
  protected readonly intent = 'benefits' as const;
}
