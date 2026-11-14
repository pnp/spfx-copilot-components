import { ZavaOneWorkspaceWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IZavaOneCompanyWorkspaceWebPartProps extends IZavaOneWebPartProperties {}

export default class ZavaOneCompanyWorkspaceWebPart extends ZavaOneWorkspaceWebPartBase<IZavaOneCompanyWorkspaceWebPartProps> {
  protected readonly workspaceMode = 'company' as const;
}
