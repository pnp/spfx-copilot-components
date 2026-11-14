import { ZavaOneCopilotComponentBase } from '../../shared/hosts/ZavaOneCopilotComponentBase';
import type { IShowPayDocumentsCopilotComponentProperties } from './ShowPayDocumentsCopilotComponentProperties';

export default class ShowPayDocumentsCopilotComponent extends ZavaOneCopilotComponentBase<IShowPayDocumentsCopilotComponentProperties> {
  protected readonly intent = 'payDocuments' as const;
}
