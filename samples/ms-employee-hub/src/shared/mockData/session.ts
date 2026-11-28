import type { HubActor, HubSession } from '../types';

// These are roles of fictional fixtures, never privileges inferred from a host account.
export const rehearsalLead:Readonly<HubActor>={id:'alex',displayName:'Alex',commercial:true,planner:true,reviewer:true};
export const employeeFixture:Readonly<HubActor>={id:'employee',displayName:'Jordan',commercial:false,planner:false,reviewer:false};
export function newSession(actor:Readonly<HubActor>=rehearsalLead,now:Date=new Date(),format:Pick<HubSession,'locale'|'viewerZone'>={}):HubSession {
  const resolved=new Intl.DateTimeFormat(format.locale,{timeZone:format.viewerZone}).resolvedOptions();
  return {actor:{...actor},now:new Date(now.getTime()),locale:resolved.locale,viewerZone:resolved.timeZone,memory:new Map<string,unknown>()};
}
