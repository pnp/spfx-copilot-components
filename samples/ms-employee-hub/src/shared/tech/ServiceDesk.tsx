import * as React from 'react';
import { devices, findGuides, incidentTime, preference, serviceHealth, setPreference, techDate, techTime } from '../mockData/technology';
import { TechIcon } from './Art';
import { ContextOptions, Facts, Frame, Heading, input, Primary, Problem, Props, RecordChoices, SelectField } from './Frame';

export function Devices(p: Props): React.ReactElement {
  const type = input(p, 'deviceType'); const all = devices(p.session).filter(d => !type || d.type === type);
  const [id, select] = React.useState(input(p, 'deviceId', all[0]?.id || ''));
  const d = all.find(device => device.id === id);
  if (!d) return <Problem p={p} route="devices" error={new Error('No assigned device matches this selection.')}/>;
  return <Frame p={p} route="devices" stage="information" scope={{ filters: { deviceId: d.id, deviceType: d.type } }}>
    <div className="tw-device-spread"><section><Heading kicker="TechWeb / Device passport" title={d.name} lead={`${d.alias} · ${d.posture}`}/>
      <RecordChoices label="Assigned devices" value={id} rows={all.map(v => ({id:v.id,title:v.name,detail:v.posture}))} choose={select}/>
      <Facts rows={[[ 'Last check-in', techTime(d.checkIn)], ['Refresh window starts', techDate(d.refresh)]]}/>
      <div className="tw-actions"><Primary onClick={() => p.navigate(21, { deviceType: d.type })}>Find a device guide</Primary><button type="button" onClick={() => p.navigate(22, { deviceId: d.id })}>Report a problem with this device</button></div>
    </section><figure className="tw-device-plate" data-family={d.type}><div className="tw-device-scene" role="img" aria-label={d.type === 'Laptop' ? 'Microsoft campaign photograph of a colleague carrying a computer in a sunlit workplace' : 'Microsoft campaign portrait against a blue studio backdrop'}/>
      <div className="tw-device-product" role="img" aria-label={d.type === 'Laptop' ? 'Illustrative Surface laptop product photograph' : 'Microsoft Fluent three-dimensional headphones illustration'}/>
      <figcaption><small>DEVICE COLLECTION / {d.type === 'Laptop' ? '01' : '02'}</small><strong>{d.alias}</strong></figcaption></figure></div>
    {p.mode === 'full' && <aside className="tw-selection"><h3>{d.posture === 'Update ready' ? 'Plan your update' : 'Ready for work'}</h3><p>{d.posture === 'Update ready' ? 'Save your work, connect to power and choose an update window in device settings.' : 'No update is currently indicated by the last inventory check.'}</p></aside>}
  </Frame>;
}
export function Health(p: Props): React.ReactElement {
  const rows = serviceHealth(p.session, input(p, 'serviceId'), input(p, 'officeId'));
  const keyOf = (r: (typeof rows)[number]): string => `${r.id}:${r.office}`;
  const [key, select] = React.useState(rows[0] ? keyOf(rows[0]) : '');
  const row = rows.find(r => keyOf(r) === key);
  if (!row) return <Problem p={p} route="service-health" error={new Error('No service update matches that service and office.')}/>;
  const followed = row.incident && preference(p.session, 'incident', row.incident);
  return <Frame p={p} route="service-health" stage="information" scope={{ filters: { serviceId: row.id, officeId: row.office } }}>
    <Heading kicker="TechWeb / Service health" title={`${row.label} in ${row.site}`} lead={`${row.state} · ${row.scope}`}/>
    {rows.length > 1 && <RecordChoices label="Services by location" value={key} rows={rows.map(r => ({id:keyOf(r),title:r.label,detail:`${r.site} · ${r.state}`}))} choose={select}/>}
    {p.mode === 'inline' && <p className="tw-reading">{row.next ? <>Next update: <strong>{techTime(incidentTime(p.session, row.next))}</strong></> : <>Last check: <strong>{techTime(incidentTime(p.session, row.latest))}</strong></>}</p>}
    <div className={p.mode === 'full' ? 'tw-split' : ''}><section><ContextOptions compact={p.mode === 'inline'} title="Incident timeline and service owner"><p className="tw-kicker">Service timeline</p><ol className="tw-thread">
      {row.incident && <li><b>{techTime(incidentTime(p.session, row.minutes))}</b><p>{row.event}</p></li>}<li><b>{techTime(incidentTime(p.session, row.latest))}</b><p>{row.update}</p></li>
    </ol>{p.mode === 'inline' && <Facts rows={[['Incident', row.incident || 'None active'], ['Service owner', row.owner]]}/>}</ContextOptions>{row.incident && <><button type="button" aria-pressed={!!followed} onClick={() => setPreference(p.session, 'incident', row.incident, !followed)}>{followed ? 'Unfollow incident' : 'Follow incident'}</button><p className="tw-note" role="status">{followed ? 'Following in this session. No notifications are sent.' : 'Following saves a session preference only.'}</p></>}</section>
      {p.mode === 'full' && <aside className="tw-panel"><p className="tw-kicker">Your location / {row.site}</p><div className="tw-stateheadline"><TechIcon name={row.incident ? 'bell' : 'shield'}/><h3>{row.state}</h3></div><p>{row.update}</p><Facts rows={[['Incident', row.incident || 'None active'], ['Service owner', row.owner], ['Next update', row.next ? techTime(incidentTime(p.session, row.next)) : 'No incident update scheduled']]}/></aside>}</div>
  </Frame>;
}
export function GuideReader(p: Props): React.ReactElement {
  const [issue, search] = React.useState(input(p, 'issue'));
  const type = input(p, 'deviceType'); const fixedId = input(p, 'guideId');
  const list = findGuides(p.session, issue, type, fixedId);
  const [id, select] = React.useState(list[0]?.id as string | undefined); const [step, move] = React.useState(0);
  const g = list.find(r => r.id === id) || list[0];
  const compatible = devices(p.session).filter(d => d.type === g?.type);
  const [deviceId, selectDevice] = React.useState(type && compatible.length === 1 ? compatible[0].id : '');
  const linked = compatible.find(d => d.id === deviceId); const helpful = g && preference(p.session, 'guide', g.id);
  return <Frame p={p} route="guides" stage={g ? 'information' : 'unavailable'} scope={{ filters: { guideId: g?.id, deviceType: g?.type }, progress:g?{current:step+1,total:g.steps.length}:undefined }}>
    <Heading kicker="TechWeb / Knowledge desk" title={g?.title || 'No matching guide'} lead={g ? `Reviewed guide · Version ${g.version} · ${g.type}` : 'Try a different issue or open the guide library.'}/>
    {!fixedId && <><label className="tw-field">Find a guide<input type="search" maxLength={120} value={issue} onChange={e => { search(e.currentTarget.value); move(0); select(undefined); }}/></label>
      {list.length > 1 && <RecordChoices label="Matching guides" value={g.id} rows={list.map(r => ({id:r.id,title:r.title,detail:`${r.type} · ${r.steps.length} steps`}))} choose={v => {select(v); move(0);}}/>}</>}
    {g ? <div className={p.mode === 'full' ? 'tw-split' : ''}><section>
      {p.mode === 'full' && <div className="tw-guidetrack" aria-label="Guide steps">{g.steps.map((_, i) => <button key={i} type="button" aria-label={`Go to step ${i+1}`} aria-current={i === step ? 'step' : undefined} onClick={() => move(i)}>{i+1}</button>)}</div>}
      <div className="tw-step"><div aria-live="polite" aria-atomic="true"><p className="tw-kicker">Step {step + 1} of {g.steps.length}</p><h3>{g.steps[step]}</h3></div><div className="tw-actions"><button type="button" disabled={step === 0} onClick={() => move(step - 1)}>Previous step</button><button type="button" disabled={step + 1 >= g.steps.length} onClick={() => move(step + 1)}>Next step</button></div></div>
    </section><aside className={p.mode === 'full' ? 'tw-panel' : ''}>{p.mode === 'full' && <><p className="tw-kicker">Still blocked?</p><h3>Carry the reference forward</h3><p>Reviewed {techDate(incidentTime(p.session, g.reviewedDays * 1440))}. The desk receives the guide reference, not a claim that you completed every step.</p></>}
      <ContextOptions compact={p.mode === 'inline'} title={`Linked device · ${linked?.name || 'None'}`}><SelectField label="Device to link (optional)" value={linked?.id || ''} options={[{ value: '', label: 'No device' }, ...compatible.map(d => ({ value: d.id, label: d.name }))]} onChange={selectDevice}/></ContextOptions>
      <div className="tw-actions"><button type="button" aria-pressed={!!helpful} onClick={() => setPreference(p.session, 'guide', g.id, !helpful)}>{helpful ? 'Marked helpful' : 'Mark helpful'}</button><Primary onClick={() => p.navigate(22, { category: g.category, guideId: g.id, ...(linked ? { deviceId: linked.id } : {}) })}>Use this guide in a ticket</Primary></div></aside></div> :
      <button type="button" onClick={() => p.navigate(21)}>Open guide library</button>}
  </Frame>;
}
