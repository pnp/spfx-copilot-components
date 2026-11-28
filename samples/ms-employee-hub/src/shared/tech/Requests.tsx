import * as React from 'react';
import { catalog, prepareAccess, prepareEquipment, proposedExpiry, resources, techDate, techMessage } from '../mockData/technology';
import type { AccessReceipt, Confirm, Order } from '../mockData/technology';
import { Alert, ContextOptions, Facts, Frame, Heading, input, Primary, Problem, ProcessPath, Props, RecordChoices, SelectField } from './Frame';
import { EquipmentArt } from './Art';

export function EquipmentRequest(p: Props): React.ReactElement {
  const category = input(p, 'category'); const items = catalog.filter(i => !category || i.category === category);
  const [id, select] = React.useState(input(p, 'itemId', items[0]?.id || ''));
  const [why, edit] = React.useState(''); const [confirm, setConfirm] = React.useState<Confirm<Order>>(); const [receipt, setReceipt] = React.useState<Order>(); const [error, errorTo] = React.useState('');
  const item = items.find(v => v.id === id);
  if (!item) return <Problem p={p} route="equipment-request" error={new Error('No equipment matches this item and category.')}/>;
  const review = (): void => { try { const command = prepareEquipment(p.session, id, why); setConfirm(() => command); errorTo(''); } catch (e) { errorTo(techMessage(e)); } };
  const submit = (): void => { if (confirm) try { setReceipt(confirm(p.session)); setConfirm(undefined); edit(''); } catch (e) { errorTo(techMessage(e)); } };
  return <Frame p={p} route="equipment-request" stage={receipt ? 'receipt' : confirm ? 'review' : 'draft'} scope={{ filters: { itemId: id, category: item.category }, receipt: receipt?.id }}>
    <Heading kicker="TechWeb / Equipment catalog" title={receipt ? 'Equipment request received' : confirm ? 'Review your equipment request' : 'Equip your workspace'} lead={receipt ? 'Pending independent review in this session. No order has been placed with a supplier.' : 'Choose standard equipment and explain the work it will support.'}/>
    {p.mode === 'full' && <ProcessPath labels={['Select equipment', 'Review the estimate', 'Pending approval']} step={receipt ? 2 : confirm ? 1 : 0}/>}
    {receipt ? <Facts rows={[['Request', receipt.id], ['Item', item.title], ['Status', receipt.status], ['Next owner', 'Workplace equipment reviewer']]}/> :
      <div className={p.mode === 'full' ? 'tw-split' : ''}><section>{!confirm && <RecordChoices label="Equipment catalog" value={id} rows={items.map(i => ({id:i.id,title:i.title,detail:`$${i.price} · ${i.lead} workdays`,art:<EquipmentArt category={i.category}/>}))} choose={v => {select(v);errorTo('');}}/>}
        <ContextOptions compact={p.mode === 'inline' && !confirm} title="Item details and policy"><Facts rows={[['Selected equipment', item.title], ['Estimated cost', `USD ${item.price}`], ['Typical lead time', `${item.lead} working days after approval`], ['Policy', item.policy]]}/></ContextOptions>
        {confirm ? <><Facts rows={[['Business rationale', why]]}/><div className="tw-actions"><Primary onClick={submit}>Submit equipment request</Primary><button type="button" onClick={() => setConfirm(undefined)}>Edit request</button></div></> :
          <><label className="tw-field">Business rationale<textarea rows={2} maxLength={800} value={why} onChange={e => edit(e.currentTarget.value)}/></label><Primary onClick={review}>Review equipment request</Primary></>}
        <Alert message={error}/></section>{p.mode === 'full' && <aside className="tw-panel"><p className="tw-kicker">Catalog comparison</p><h3>Fit for your desk</h3><EquipmentArt category={item.category}/>{items.map(i => <article key={i.id} className="tw-history"><b>{i.title}</b><p>{i.detail}</p><small>${i.price} · {i.lead} working days</small></article>)}</aside>}</div>}
  </Frame>;
}
export function AppAccess(p: Props): React.ReactElement {
  const [id, select] = React.useState(input(p, 'appId', resources[0].id)); const [level, changeLevel] = React.useState(input(p, 'accessLevel', 'Reader'));
  const [duration, changeDuration] = React.useState(input(p, 'duration', '7d')); const [confirm, setConfirm] = React.useState<Confirm<AccessReceipt>>(); const [receipt, setReceipt] = React.useState<AccessReceipt>(); const [error, errorTo] = React.useState('');
  const app = resources.find(a => a.id === id);
  if (!app) return <Problem p={p} route="app-access" error={new Error('This resource is unavailable.')}/>;
  const review = (): void => { try { const command = prepareAccess(p.session, id, level, duration); setConfirm(() => command); errorTo(''); } catch (e) { errorTo(techMessage(e)); } };
  const submit = (): void => { if (confirm) try { setReceipt(confirm(p.session)); setConfirm(undefined); } catch (e) { errorTo(techMessage(e)); } };
  const expiry = app.durations.indexOf(duration) !== -1 ? techDate(proposedExpiry(p.session, duration)) : 'Choose a supported duration';
  return <Frame p={p} route="app-access" stage={receipt ? 'receipt' : confirm ? 'review' : 'draft'} scope={{ filters: { appId: app.id, accessLevel: app.levels.indexOf(level) !== -1 ? level : undefined, duration: app.durations.indexOf(duration) !== -1 ? duration : undefined }, receipt: receipt?.id }}>
    <Heading kicker="TechWeb / Access management" title={receipt ? 'Awaiting resource-owner review' : confirm ? 'Review your access request' : 'Request app access'} lead={receipt ? 'The request was recorded in this session. Access has not been granted.' : 'Request only the permission and time you need.'}/>
    {p.mode === 'full' && <ProcessPath labels={['Choose permissions', 'Review the request', 'Await owner review']} step={receipt ? 2 : confirm ? 1 : 0}/>}
    {receipt ? <Facts rows={[['Reference', receipt.id], ['Resource', app.title], ['Requested level', receipt.level], ['Requested expiry', techDate(receipt.expires)], ['Review route', receipt.route]]}/> :
      <div className={p.mode === 'full' ? 'tw-split' : ''}><section>{confirm ? <><Facts rows={[['Resource', app.title], ['Level', level], ['Requested expiry', expiry], ['Review route', app.owner]]}/><div className="tw-actions"><Primary onClick={submit}>Submit access request</Primary><button type="button" onClick={() => setConfirm(undefined)}>Edit access request</button></div></> :
        <><RecordChoices label="Available resources" value={id} rows={resources.map(a => ({id:a.id,title:a.title,detail:a.owner}))} choose={v => {select(v);changeLevel('Reader');changeDuration('7d');errorTo('');}}/>
          <div className="tw-fields"><SelectField label="Access level" value={level} options={app.levels} onChange={changeLevel}/><SelectField label="Duration" value={duration} options={app.durations.map(d => ({ value: d, label: `${parseInt(d, 10)} days` }))} onChange={changeDuration}/></div>
          <Facts rows={[['Requested expiry', expiry], ['Review route', app.owner]]}/><Primary onClick={review}>Review access request</Primary></>}
        <Alert message={error}/></section>{p.mode === 'full' && <aside className="tw-panel"><p className="tw-kicker">Permission boundary</p><h3>{app.title}</h3><p>{app.purpose}</p><Facts rows={[['Least privilege', app.levels[0]], ['Available levels', app.levels.join(', ')], ['Resource owner', app.owner]]}/><p>A broken sign-in is a service issue, not a new entitlement.</p></aside>}</div>}
  </Frame>;
}
