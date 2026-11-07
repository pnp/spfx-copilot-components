import type { Expert, ExpertSkill } from '../models/Expert';

export interface IExpertService {
  getExpertsBySkill(skill: ExpertSkill): Promise<Expert[]>;
}
