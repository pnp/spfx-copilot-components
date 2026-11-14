import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IReportSecurityConcernCopilotComponentProperties } from './ReportSecurityConcernCopilotComponentProperties';

export default class ReportSecurityConcernCopilotComponent extends ZavaOneCopilotComponentBase<IReportSecurityConcernCopilotComponentProperties> {
  protected readonly intent = 'securityReporting' as const;
}
