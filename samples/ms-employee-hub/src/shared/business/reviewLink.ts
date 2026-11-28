import type { HubInputs, HubSession } from '../types';
import type { Period } from '../mockData/commercial';
import { fiscalCut } from '../mockData/commercial';

type Marks = WeakMap<HubInputs, { cut: string; link: string }>;
const key = (s: HubSession): string => `business:review-link:${s.actor.id}`;

// Associate the clicked navigation object with its mark; never change the public tool schema or a later invocation.
export function withReviewMark(s: HubSession, inputs: HubInputs, cut: string, link: string): HubInputs {
  if (!s.actor.commercial) return inputs;
  const marks = s.memory.get(key(s)) as Marks || new WeakMap();
  marks.set(inputs, { cut, link }); s.memory.set(key(s), marks);
  return inputs;
}
export function readReviewMark(s: HubSession, inputs: HubInputs): string | undefined {
  const mark = s.actor.commercial && (s.memory.get(key(s)) as Marks | undefined)?.get(inputs);
  return mark && mark.cut === fiscalCut(s.now, inputs.period as Period).asOf ? mark.link : undefined;
}
