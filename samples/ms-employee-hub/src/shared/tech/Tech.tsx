import * as React from 'react';
import type { SurfaceProps } from '../types';
import { EquipmentReview, TicketIntake } from './Proof';
import { Home } from './Landing';
import { Problem } from './Frame';
import { Conversation } from './Conversation';
import { Devices, GuideReader, Health } from './ServiceDesk';
import { AppAccess, EquipmentRequest } from './Requests';
import { Flow, Trends } from './Reports';
import { observeTech, techVersion } from '../mockData/technology';

function Surface(p: SurfaceProps): React.ReactElement {
  const session = p.session; const actorId = session.actor.id;
  const subscribe = React.useCallback((fn: () => void) => observeTech(session, fn), [session, actorId]);
  const read = React.useCallback(() => techVersion(session), [session, actorId]);
  React.useSyncExternalStore(subscribe, read, read);
  switch (p.id) {
    case 0: return <Home {...p}/>;
    case 19: return <Devices {...p}/>;
    case 20: return <Health {...p}/>;
    case 21: return <GuideReader {...p}/>;
    case 22: return <TicketIntake {...p}/>;
    case 23: return <Conversation {...p}/>;
    case 24: return <EquipmentRequest {...p}/>;
    case 25: return <EquipmentReview {...p}/>;
    case 26: return <Trends {...p}/>;
    case 27: return <Flow {...p}/>;
    case 28: return <AppAccess {...p}/>;
    default: return <Problem p={p} route="service-desk" error={new Error('This service view is unavailable.')}/>;
  }
}
export default function Tech(p: SurfaceProps): React.ReactElement {
  const activation = React.useRef({ id: p.id, inputs: p.inputs, actor: p.session.actor.id, reviewer: p.session.actor.reviewer, memory: p.session.memory, generation: 0 });
  const a = activation.current;
  if (a.id !== p.id || a.inputs !== p.inputs || a.actor !== p.session.actor.id || a.reviewer !== p.session.actor.reviewer || a.memory !== p.session.memory)
    activation.current = { id: p.id, inputs: p.inputs, actor: p.session.actor.id, reviewer: p.session.actor.reviewer, memory: p.session.memory, generation: a.generation + 1 };
  return <Surface key={activation.current.generation} {...p}/>;
}
