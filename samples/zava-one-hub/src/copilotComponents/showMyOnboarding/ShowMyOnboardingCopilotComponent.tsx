import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowMyOnboardingCopilotComponentProperties } from './ShowMyOnboardingCopilotComponentProperties';

export default class ShowMyOnboardingCopilotComponent extends ZavaOneCopilotComponentBase<IShowMyOnboardingCopilotComponentProperties> {
  protected readonly intent = 'onboarding' as const;
}
