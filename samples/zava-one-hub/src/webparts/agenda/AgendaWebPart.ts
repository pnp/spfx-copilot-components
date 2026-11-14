import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IAgendaWebPartProps extends IZavaOneWebPartProperties {}

export default class AgendaWebPart extends ZavaOneWebPartBase<IAgendaWebPartProps> {
  protected readonly intent = 'agenda' as const;
}
