import { HubWebPart } from '../../hosts/HubWebPart';

export default class BusinessSltWorkspaceWebPart extends HubWebPart {
  protected readonly entry = 30;
  protected readonly landing = 'business' as const;
}
