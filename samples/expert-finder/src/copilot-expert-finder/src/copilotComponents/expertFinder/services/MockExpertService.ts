import { mockExperts } from '../data/mockExperts';
import type { Expert, ExpertSkill } from '../models/Expert';
import { normalizeSkill } from '../utils/skills';
import type { IExpertService } from './IExpertService';

export class MockExpertService implements IExpertService {
  public async getExpertsBySkill(skill: ExpertSkill): Promise<Expert[]> {
    const canonical = normalizeSkill(skill);
    if (!canonical) throw new Error('Choose a supported skill: SPFx, Copilot, DB or Spanish.');
    await new Promise<void>(resolve => window.setTimeout(resolve, 300));
    return mockExperts.filter(expert => expert.skill === canonical).map(expert => ({ ...expert }));
  }
}
