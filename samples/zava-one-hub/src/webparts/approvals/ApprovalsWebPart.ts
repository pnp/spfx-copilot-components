import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IApprovalsWebPartProps extends IZavaOneWebPartProperties {}

export default class ApprovalsWebPart extends ZavaOneWebPartBase<IApprovalsWebPartProps> {
  protected readonly intent = 'approvals' as const;
}
