import { HubWebPart } from '../../hosts/HubWebPart';

export default class HRwebWorkspaceWebPart extends HubWebPart {
  protected readonly entry = 30;
  protected readonly landing = 'hr' as const;
}
