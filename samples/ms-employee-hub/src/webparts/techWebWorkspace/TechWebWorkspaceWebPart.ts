import { HubWebPart } from '../../hosts/HubWebPart';

export default class TechWebWorkspaceWebPart extends HubWebPart {
  protected readonly entry = 30;
  protected readonly landing = 'tech' as const;
}
