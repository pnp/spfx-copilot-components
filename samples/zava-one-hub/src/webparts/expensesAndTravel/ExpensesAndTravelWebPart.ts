import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IExpensesAndTravelWebPartProps extends IZavaOneWebPartProperties {}

export default class ExpensesAndTravelWebPart extends ZavaOneWebPartBase<IExpensesAndTravelWebPartProps> {
  protected readonly intent = 'expensesTravel' as const;
}
