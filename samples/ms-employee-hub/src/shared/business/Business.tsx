import * as React from 'react';
import type { SurfaceProps } from '../types';
import { workspaceNames } from '../catalog';
import { useHubVisibleScope } from '../../hosts/VisibleScope';
import { drivers, marketInScope, normalizeCommercialInputs, regions } from '../mockData/commercial';
import ActionReview from './ActionReview';
import LeadReview from './LeadReview';
import { Heading } from './layout';
import ForecastReview from './ForecastReview';
import { MarketReview, QuarterLanding, Scorecard } from './MarketReview';
import { businessStyles } from './styles';
import { readReviewMark } from './reviewLink';

function Notice({ props, denied }: { props: SurfaceProps; denied?: boolean }): React.ReactElement {
  const entry = [3, 6, 7, 8, 9].indexOf(props.id) >= 0 ? props.id : 30;
  useHubVisibleScope({ entry, route: entry === 30 ? 'business/home' : undefined, stage: denied ? 'denied' : 'unavailable' });
  return <section aria-label={`${workspaceNames.business} access`}><Heading section="Operating review">{denied ? 'Access required.' : 'Selection unavailable.'}</Heading>
    <p>{denied ? 'This commercial workspace requires a granted role. Planning actions also require planning rights.' : 'The requested scope is not available. No other market or cut has been substituted.'}</p>
    {!denied && <button type="button" onClick={() => props.navigate(props.id, {})}>Choose a new scope</button>}</section>;
}
function valid(p: SurfaceProps): boolean {
  const i = p.inputs;
  if (i.period !== undefined && i.period !== 'current-quarter' && i.period !== 'previous-quarter') return false;
  if (i.marketId !== undefined && !marketInScope(p.session, i.marketId, i.region)) return false;
  if (i.region !== undefined && i.region !== 'all' && !regions.some(r => r === i.region)) return false;
  if (i.evidenceId !== undefined && (typeof i.evidenceId !== 'string' || !i.evidenceId.trim())) return false;
  if (i.channel !== undefined && !['all', 'partner', 'inbound'].some(c => c === i.channel)) return false;
  if (i.driver !== undefined && !drivers.some(d => d === i.driver)) return false;
  if (i.workstream !== undefined && i.workstream !== 'qualification' && i.workstream !== 'forecast') return false;
  return true;
}
export default function Business(surface: SurfaceProps): React.ReactElement {
  const [scope, setScope] = React.useState({ memory: surface.session.memory, revision: 0 });
  if (scope.memory !== surface.session.memory) setScope({ memory: surface.session.memory, revision: scope.revision + 1 });
  const { actor } = surface.session, denied = !actor.commercial || (surface.id === 6 && !actor.planner);
  const props = { ...surface, inputs: denied ? {} : normalizeCommercialInputs(surface.session, surface.inputs) };
  const key = JSON.stringify([scope.revision, actor.id, props.id, Object.keys(props.inputs).sort().map(k => [k, props.inputs[k]])]);
  return <div className={`slt-root slt-${props.mode}`}><style>{businessStyles}</style><div className="slt-body" key={key}>
    {denied ? <Notice props={props} denied/> : !valid(props) ? <Notice props={props}/> : props.id === 9 ? <LeadReview {...props} restoredSelection={surface.restoredSelection || readReviewMark(surface.session,surface.inputs)}/> :
      props.id === 6 ? <ActionReview {...props}/> : props.id === 0 ? <QuarterLanding {...props}/> : props.id === 3 ? <MarketReview {...props}/> :
      props.id === 7 ? <ForecastReview {...props}/> : props.id === 8 ? <Scorecard {...props}/> : <Notice props={props}/>}</div></div>;
}
