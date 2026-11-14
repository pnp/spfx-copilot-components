import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface ITeamAvailabilityWebPartProps extends IZavaOneWebPartProperties {}

export default class TeamAvailabilityWebPart extends ZavaOneWebPartBase<ITeamAvailabilityWebPartProps> {
  protected readonly intent = 'teamAvailability' as const;
}
