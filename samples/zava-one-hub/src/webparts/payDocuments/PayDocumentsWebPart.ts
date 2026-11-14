import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IPayDocumentsWebPartProps extends IZavaOneWebPartProperties {}

export default class PayDocumentsWebPart extends ZavaOneWebPartBase<IPayDocumentsWebPartProps> {
  protected readonly intent = 'payDocuments' as const;
}
