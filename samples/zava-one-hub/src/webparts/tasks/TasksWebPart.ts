import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface ITasksWebPartProps extends IZavaOneWebPartProperties {}

export default class TasksWebPart extends ZavaOneWebPartBase<ITasksWebPartProps> {
  protected readonly intent = 'tasks' as const;
}
