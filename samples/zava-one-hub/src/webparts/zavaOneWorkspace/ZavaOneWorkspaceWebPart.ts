import { ZavaOneWorkspaceWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IZavaOneWorkspaceWebPartProps extends IZavaOneWebPartProperties {}

export default class ZavaOneWorkspaceWebPart extends ZavaOneWorkspaceWebPartBase<IZavaOneWorkspaceWebPartProps> {
  protected readonly workspaceMode = 'combined' as const;
}
