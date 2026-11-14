import { IGovernanceResult } from '../models/IGovernanceRisk';
import { ISharePointGovernanceCopilotComponentProperties } from '../SharePointGovernanceCopilotComponentProperties';

export interface IGovernanceService {
  getGovernanceRisks(
    options: ISharePointGovernanceCopilotComponentProperties
  ): Promise<IGovernanceResult>;
}
