import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IReviewVacationRequestsCopilotComponentProperties } from './ReviewVacationRequestsCopilotComponentProperties';

export default class ReviewVacationRequestsCopilotComponent extends ZavaOneCopilotComponentBase<IReviewVacationRequestsCopilotComponentProperties> {
  protected readonly intent = 'vacationApprovals' as const;
}
