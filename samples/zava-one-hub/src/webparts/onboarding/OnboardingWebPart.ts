import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IOnboardingWebPartProps extends IZavaOneWebPartProperties {}

export default class OnboardingWebPart extends ZavaOneWebPartBase<IOnboardingWebPartProps> {
  protected readonly intent = 'onboarding' as const;
}
