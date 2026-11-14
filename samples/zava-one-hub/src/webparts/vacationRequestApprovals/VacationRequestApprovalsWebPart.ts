import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IVacationRequestApprovalsWebPartProps extends IZavaOneWebPartProperties {}

export default class VacationRequestApprovalsWebPart extends ZavaOneWebPartBase<IVacationRequestApprovalsWebPartProps> {
  protected readonly intent = 'vacationApprovals' as const;
}
