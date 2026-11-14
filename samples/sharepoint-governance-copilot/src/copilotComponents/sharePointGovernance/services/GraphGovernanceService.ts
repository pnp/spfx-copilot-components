import { MSGraphClientV3 } from '@microsoft/sp-http';
import { IGovernanceResult } from '../models/IGovernanceRisk';
import { ISharePointGovernanceCopilotComponentProperties } from '../SharePointGovernanceCopilotComponentProperties';
import { IGovernanceService } from './IGovernanceService';

export class GraphGovernanceService implements IGovernanceService {
  public constructor(private readonly graphClient: MSGraphClientV3) {}

  public async getGovernanceRisks(
    _options: ISharePointGovernanceCopilotComponentProperties
  ): Promise<IGovernanceResult> {
    void this.graphClient;
    throw new Error(
      'GraphGovernanceService is intentionally not implemented in the starter. Define the approved APIs, permissions, evidence rules, and pagination before enabling tenant data.'
    );
  }
}
