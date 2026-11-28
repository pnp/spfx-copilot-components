import * as React from 'react';
import { catalogItem, categories, decisionList, devices, eligibleOrders, guides, impacts, prepareDecision, prepareTicket, reviewOrder, techDate, techMessage } from '../mockData/technology';
import type { Confirm, Decision, Order, Ticket, TicketDraft } from '../mockData/technology';
import { DeviceArt, EquipmentArt } from './Art';
import { Alert, ContextOptions, Facts, Frame, Heading, input, Primary, Problem, ProcessPath, Props, RecordChoices, RecordList, SelectField } from './Frame';
export function TicketIntake(p: Props): React.ReactElement {
  const mine = devices(p.session);
  const [d, set] = React.useState<TicketDraft>(() => {
    const guideId = input(p, 'guideId'); const linked = guides.find(g => g.id === guideId);
    return { deviceId: input(p, 'deviceId', guideId ? '' : mine[0]?.id || ''), guideId, category: input(p, 'category', linked?.category || 'Hardware'), impact: input(p, 'impact', impacts[0]), description: '' };
  });
  const [confirm, setConfirm] = React.useState<Confirm<Ticket>>();
  const [receipt, setReceipt] = React.useState<Ticket>();
  const [error, errorTo] = React.useState('');
  const update = (patch: Partial<TicketDraft>): void => { set({ ...d, ...patch }); errorTo(''); };
  const review = (): void => {
    try { const commit = prepareTicket(p.session, d); setConfirm(() => commit); errorTo(''); }
    catch (e) { errorTo(techMessage(e)); }
  };
  const submit = (): void => { try { if (confirm) { setReceipt(confirm(p.session)); setConfirm(undefined); set({ ...d, description: '' }); } } catch (e) { errorTo(techMessage(e)); } };
  const device = mine.find(dev => dev.id === d.deviceId); const linked = guides.find(g => g.id === d.guideId);
  const scope = receipt ? { receipt: receipt.id } : { filters: { category: categories.indexOf(d.category) !== -1 ? d.category : undefined, impact: impacts.indexOf(d.impact) !== -1 ? d.impact : undefined, deviceId: device?.id, guideId: linked?.id } };
  return <Frame p={p} route="ticket-intake" stage={receipt ? 'receipt' : confirm ? 'review' : 'draft'} scope={scope}>
    <Heading kicker="TechWeb / Break & fix" title={receipt ? 'Ticket received' : confirm ? 'Review your IT ticket' : 'Report an IT problem'} lead={receipt ? 'Your request was recorded in this session.' : confirm ? 'Nothing has been submitted. Check the details before sending.' : 'Tell the service desk what stopped working. Do not include passwords or credentials.'}/>
    {p.mode === 'full' && <ProcessPath labels={['Describe the problem', 'Review the ticket', 'Session receipt']} step={receipt ? 2 : confirm ? 1 : 0}/>}
    {receipt ? <><Facts rows={[['Ticket', receipt.id], ['Owning queue', receipt.queue], ['Next step', `${receipt.next} reviews the description.`]]}/><Primary onClick={() => p.navigate(23, { ticketId: receipt.id })}>Track this ticket</Primary></> :
      <div className={p.mode === 'full' ? 'tw-split' : ''}><div>
        {confirm ? <><Facts rows={[['Category', d.category], ['Impact', d.impact], ['Device', device?.name || 'Not linked'], ['Guide', linked ? `${linked.title} · v${linked.version}` : 'Not linked'], ['Description', d.description]]}/><div className="tw-actions"><Primary onClick={submit}>Submit IT ticket</Primary><button type="button" onClick={() => setConfirm(undefined)}>Edit ticket</button></div></> :
          <><ContextOptions compact={p.mode === 'inline'} title={`Context · ${device?.name || (d.deviceId ? 'Unavailable device' : 'No device')} · ${linked ? `${linked.title} v${linked.version}` : d.guideId ? 'Unavailable guide' : 'No guide'}`}><div className="tw-fields"><SelectField label="Assigned device" value={d.deviceId} options={[{ value: '', label: 'No device' }, ...mine.map(dev => ({ value: dev.id, label: dev.name }))]} onChange={deviceId => update({ deviceId })}/><SelectField label="Linked guide (optional)" value={d.guideId} options={[{ value: '', label: 'No guide' }, ...guides.map(g => ({ value: g.id, label: `${g.title} · v${g.version}` }))]} onChange={guideId => update({ guideId })}/></div></ContextOptions>
            <div className="tw-fields"><SelectField label="Category" value={d.category} options={categories} onChange={category => update({ category })}/><SelectField label="Impact" value={d.impact} options={impacts} onChange={impact => update({ impact })}/></div>
            <label className="tw-field">What happened?<textarea rows={3} maxLength={800} value={d.description} onChange={e => update({ description: e.currentTarget.value })}/></label>
            <Primary onClick={review}>Review ticket</Primary></>}
        <Alert message={error}/>
      </div>{p.mode === 'full' && <aside className="tw-panel"><p className="tw-kicker">Case context</p><h3>{device?.name || 'No device linked'}</h3>{device && <><DeviceArt type={device.type}/><Facts rows={[['Device posture', device.posture], ['Last check-in', techDate(device.checkIn)]]}/></>}
        <h4>Linked knowledge</h4><p>{linked ? `${linked.title} · v${linked.version}. Linked for context; completion is not assumed.` : 'No troubleshooting guide is attached.'}</p></aside>}</div>}
  </Frame>;
}
export function Inbox({ p }: { p: Props }): React.ReactElement {
  const list = eligibleOrders(p.session);
  return <section><p className="tw-kicker">Live decision queue</p><h3>Awaiting your review</h3>{list.length ? <RecordList rows={list.map(o => ({ id: o.id, meta: `${o.id} · From ${o.requester}`, title: catalogItem(o.itemId).title, detail: `Estimated cost: USD ${o.cost}`, open: () => p.navigate(25, { requestId: o.id }) }))}/> : <p>No pending equipment decisions are assigned to you.</p>}</section>;
}
export function EquipmentReview(p: Props): React.ReactElement {
  const [selected, select] = React.useState(input(p, 'requestId')); const [choice, choose] = React.useState<Decision>('Approve');
  const [note, setNote] = React.useState(''); const [confirm, setConfirm] = React.useState<Confirm<Order>>(); const [reviewedRevision, setReviewedRevision] = React.useState<number>(); const [receipt, setReceipt] = React.useState<Order>();
  const [error, errorTo] = React.useState('');
  let list: Order[]; let order: Order | undefined;
  const [status, filter] = React.useState(input(p, 'status', 'Pending'));
  try {
    list = decisionList(p.session, status);
    if (selected && !receipt) {
      order = reviewOrder(p.session, selected);
      if (order.status !== status) throw new Error('This request is not in the selected queue status.');
    }
  } catch (e) { return <Problem p={p} route="equipment-decisions" error={e}/>; }
  const startReview = (): void => {
    if (order) try { const command = prepareDecision(p.session, order.id, order.revision, choice, note); setReviewedRevision(order.revision); setConfirm(() => command); errorTo(''); } catch (e) { errorTo(techMessage(e)); }
  };
  const decide = (): void => { if (confirm) try { setReceipt(confirm(p.session)); setConfirm(undefined); setNote(''); } catch (e) { errorTo(techMessage(e)); } };
  const stale = !!confirm && !!order && order.revision !== reviewedRevision;
  const stage = receipt ? 'receipt' : stale ? 'unavailable' : confirm ? 'review' : order ? 'draft' : 'selection';
  return <Frame p={p} route="equipment-decisions" stage={stage} scope={{ filters: { requestId: order?.id, status: receipt?.status || status }, receipt: receipt?.id }}>
    <Heading kicker="TechWeb / Independent equipment review" title={receipt ? 'Decision recorded' : stale ? 'The request has changed' : confirm ? 'Confirm your decision' : order ? catalogItem(order.itemId).title : 'Equipment decisions'} lead={receipt ? 'The pending queue has been updated in this session.' : order ? `${order.requester} · ${order.id} · Revision ${order.revision}` : 'Only assigned colleague requests are eligible for a decision.'}/>
    {p.mode === 'full' && (order || receipt) && <ProcessPath labels={['Assess the evidence', 'Review the decision', 'Record the outcome']} step={receipt ? 2 : confirm && !stale ? 1 : 0}/>}
    {receipt ? <><Facts rows={[['Request', receipt.id], ['Outcome', receipt.status], ['Revision', receipt.revision], ['Next owner', receipt.status === 'Approved' ? 'Procurement desk' : receipt.requester]]}/><Primary onClick={() => p.navigate(25)}>Back to decision queue</Primary></> :
      !order ? <div className={p.mode === 'full' ? 'tw-split' : ''}><section><RecordChoices label="Queue status" value={status} rows={['Pending', 'Approved', 'Changes requested'].map(s=>({id:s,title:s}))} choose={filter}/>{list.length ? status === 'Pending' ? <RecordList rows={list.map(o => ({ id: o.id, meta: `${o.id} · From ${o.requester}`, title: catalogItem(o.itemId).title, detail: `Estimated USD ${o.cost} · Submitted ${techDate(o.submitted)}`, open: () => select(o.id) }))}/> : list.map(row => <article key={row.id} className="tw-history"><b>{catalogItem(row.itemId).title}</b><p>{row.requester} · {row.id} · {row.status} · Revision {row.revision}</p></article>) : <p>No {status.toLowerCase()} requests in your queue.</p>}</section>
        {p.mode === 'full' && <aside className="tw-panel"><p className="tw-kicker">Equipment desk / Review brief</p><h3>Before you decide</h3><Facts rows={[['In this view', `${list.length} ${status.toLowerCase()} requests`], ['Check each order', 'Business need, catalog cost and allocation policy'], ['Your decision', 'Approve or request changes with a note']]}/><p>Only confirmation records a decision. Selecting a request opens its evidence.</p></aside>}</div> :
        <div className={p.mode === 'full' ? 'tw-split' : ''}><div><Facts rows={[['Justification', order.rationale], ['Cost estimate', `$${order.cost}`], ['Policy evidence', order.policy]]}/>
          {stale ? <><p role="alert">Your review used revision {reviewedRevision}. Check the updated evidence before deciding.</p><button type="button" onClick={() => { setConfirm(undefined); errorTo(''); }}>Review updated evidence</button></> : confirm ? <><Facts rows={[['Proposed decision', choice], ['Decision note', note]]}/><div className="tw-actions"><Primary onClick={decide}>Confirm decision</Primary><button type="button" onClick={() => setConfirm(undefined)}>Edit decision</button></div></> :
            <><RecordChoices label="Decision" value={choice} rows={['Approve','Request changes'].map(s=>({id:s,title:s}))} choose={v=>choose(v as Decision)}/><label className="tw-field">Decision note<textarea rows={2} maxLength={400} value={note} onChange={e => setNote(e.currentTarget.value)}/></label><Primary onClick={startReview}>Review decision</Primary></>}
          <Alert message={error}/></div>{p.mode === 'full' && <aside className="tw-panel"><p className="tw-kicker">Approval evidence</p><h3>Before you decide</h3><EquipmentArt category={catalogItem(order.itemId).category}/><Facts rows={[['Requested by', order.requester], ['Submitted', techDate(order.submitted)], ['Fulfillment estimate', `${catalogItem(order.itemId).lead} working days after approval`], ['Current state', order.status]]}/><p>A decision changes this request, not previously reported service totals.</p></aside>}</div>}
  </Frame>;
}
