import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface ISecurityReportingWebPartProps extends IZavaOneWebPartProperties {}

export default class SecurityReportingWebPart extends ZavaOneWebPartBase<ISecurityReportingWebPartProps> {
  protected readonly intent = 'securityReporting' as const;
}
