import { generatedCapabilities } from './generatedCapabilities';
import type { IZavaCapabilityDefinition } from '../models/zavaOne';

export interface IZavaRuntimeCapability extends IZavaCapabilityDefinition {
  intentKey: string;
  tab: 'company' | 'personal';
  grammar: string;
  webPartName: string;
  copilotName: string;
  useWhen: string;
  doNotUse: string;
}

export const zavaCapabilities: readonly IZavaRuntimeCapability[] = generatedCapabilities.map((capability) => ({
  id: capability.id,
  intentKey: capability.intentKey,
  title: capability.title,
  category: capability.category,
  audience: capability.category === 'Business' ? 'Authorized business roles' : 'Zava employees',
  outcome: capability.outcome,
  operation: capability.operation,
  prompt: capability.prompt,
  route: capability.route,
  tab: capability.tab,
  grammar: capability.grammar,
  webPartName: capability.webPartName,
  copilotName: capability.copilotName,
  useWhen: capability.useWhen,
  doNotUse: capability.doNotUse
}));

export function getCapabilityByIntent(intentKey: string): IZavaRuntimeCapability | undefined {
  return zavaCapabilities.find((capability) => capability.intentKey === intentKey);
}