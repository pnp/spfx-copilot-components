import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowExpensesAndTravelCopilotComponentProperties } from './ShowExpensesAndTravelCopilotComponentProperties';

export default class ShowExpensesAndTravelCopilotComponent extends ZavaOneCopilotComponentBase<IShowExpensesAndTravelCopilotComponentProperties> {
  protected readonly intent = 'expensesTravel' as const;
}
