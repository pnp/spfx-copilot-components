import { HubWebPart } from '../../hosts/HubWebPart';

export default class MicrosoftHomeWorkspaceWebPart extends HubWebPart {
  protected readonly entry = 30;
  protected readonly landing = 'company' as const;
}
