import { ZavaOneWorkspaceWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IZavaOnePersonalWorkspaceWebPartProps extends IZavaOneWebPartProperties {}

export default class ZavaOnePersonalWorkspaceWebPart extends ZavaOneWorkspaceWebPartBase<IZavaOnePersonalWorkspaceWebPartProps> {
  protected readonly workspaceMode = 'personal' as const;
}
