const test = require('node:test');
const assert = require('node:assert/strict');
const { service: api, session, mount, scopes } = require('./techHarness.cjs');
const byCode = code => e => e.code === code;

test('device→guide→ticket carries the selected hardware and guide version without inventing steps', () => {
  const s = session(); const ui = mount(19, s, { deviceId: 'work-headset' });
  try {
    ui.click('Find a device guide'); assert.match(ui.text(), /right audio output/);
    ui.click('Next step'); ui.draw({ mode: 'full' }); assert.match(ui.text(), /Step 2 of 3/);
    ui.click('Mark helpful'); assert.ok(api.preference(s, 'guide', 'headset-output'));
    assert.ok(!api.preference(session('other', false, s.memory), 'guide', 'headset-output'));
    ui.click('Use this guide in a ticket');
    assert.equal(ui.el.querySelector('select').value, 'work-headset'); assert.match(ui.text(), /v1.4/);
    assert.match(ui.text(), /completion is not assumed/);
    ui.draw({ id: 19, inputs: { deviceId: 'unknown' } }); assert.match(ui.text(), /No assigned device/);
    ui.draw({ id: 21, inputs: { guideId: 'unknown' } }); assert.match(ui.text(), /No matching guide/);
    ui.draw({ id: 21, inputs: { issue: 'wi-fi' } }); assert.match(ui.text(), /Reconnect to workplace Wi-Fi/);
    ui.click('Use this guide in a ticket'); assert.equal(ui.el.querySelector('select').value, '');
  } finally { ui.close(); }
});

test('only confirmed updates reach a sibling surface sharing the authorized session; drafts remain independent', () => {
  const s = session(); const author = mount(22,s); const sibling = mount(23,s); const unrelated = mount(23,session());
  try {
    author.field('What happened?', 'The HDMI display goes dark several times.'); author.click('Review ticket');
    assert.ok(!sibling.text().includes('Hardware support request'));
    author.click('Submit IT ticket'); assert.match(sibling.text(), /Hardware support request/);
    assert.ok(!sibling.text().includes('HDMI')); assert.ok(!unrelated.text().includes('Hardware support request'));
  } finally { author.close(); sibling.close(); unrelated.close(); }
});

test('expanded workspace sections are gated; the same session backtracks to a real device and home', () => {
  const ui = mount(0, session());
  try {
    assert.ok(!ui.el.querySelector('.tw-worknav'));
    ui.draw({ mode: 'full' });
    const labels = () => [...ui.el.querySelectorAll('.tw-navlinks button')].map(b => b.textContent);
    assert.deepEqual(labels(), ['My day','My requests','Devices & apps','Service health']);
    ui.click('Devices & apps'); assert.ok(ui.el.querySelector('[data-layout^=tech-devices-]'));
    ui.click('Equipment catalog'); assert.ok(ui.el.querySelector('[data-layout^=tech-equipment-request-]'));
    ui.field('Business rationale','New display for a fixed workspace.'); ui.click('Review equipment request');
    assert.match(ui.el.querySelector('.tw-process [aria-current=step]').textContent, /Review the estimate/);
    ui.click('My day'); assert.match(ui.text(), /Right where you left off/);
    ui.draw({ session:session('alex', true) }); assert.ok(labels().includes('Manager view'));
    ui.click('Manager view'); assert.match(ui.text(), /See the friction/);
    assert.match(ui.el.querySelector('.tw-scoreboard').textContent, /16 of 17 responses/);
  } finally { ui.close(); }
});

test('health resolves service and office together; following is private session state', () => {
  const s = session(); const ui = mount(20, s, { serviceId: 'guest-wifi', officeId: 'redmond' });
  try {
    ui.click('Follow incident'); assert.match(ui.text(), /No notifications are sent/);
    assert.equal(api.preference(session(), 'incident', 'INC-314'), false);
    ui.click('Unfollow incident'); assert.equal(api.preference(s, 'incident', 'INC-314'), false);
    ui.draw({ inputs: { serviceId: 'guest-wifi', officeId: 'london' } }); assert.match(ui.text(), /Operational/);
    assert.ok(!ui.text().includes('INC-314'));
    ui.draw({ inputs: { serviceId: 'meeting-rooms', officeId: 'london' } }); assert.match(ui.text(), /No service update matches/);
  } finally { ui.close(); }
});

test('personal conversation filters; reply, resolve and reopen preserve history and enforce revision', () => {
  const s = session(); const ui = mount(23, s, { ticketId: 'IT-2048' });
  try {
    ui.field('Reply to the service desk', 'Another private observation.'); ui.click('Send reply');
    assert.equal(api.ticket(s, 'IT-2048').revision, 2);
    assert.throws(() => api.updateConversation(s, 'IT-2048', 1, 'Resolve'), byCode('stale'));
    ui.click('Resolve ticket'); assert.equal(api.ticket(s, 'IT-2048').status, 'Open');
    ui.click('Confirm resolve'); assert.equal(api.ticket(s, 'IT-2048').status, 'Resolved');
    ui.draw({ inputs: { status: 'Open' } }); assert.match(ui.text(), /No conversations match/);
    ui.draw({ inputs: { ticketId: 'IT-2048', status: 'Resolved' } }); ui.click('Reopen ticket'); ui.click('Confirm reopen');
    assert.match(ui.text(), /Another private observation/); assert.equal(api.ticket(s, 'IT-2048').revision, 4);
    assert.ok(!JSON.stringify(scopes).includes('Another private observation'));
  } finally { ui.close(); }
});

test('equipment review compares current evidence against requester edits; duplicates blocked on review and confirmation', () => {
  const s = session(); const manager = session('alex', true, s.memory);
  const command1 = api.prepareEquipment(s, 'usb-c-dock', 'Dock for my new desk hardware.');
  const command2 = api.prepareEquipment(s, 'usb-c-dock', 'Another draft for my desk hardware.');
  const order = command1(s); assert.equal(command1(s).id, order.id);
  assert.throws(() => command2(s), byCode('duplicate'));
  assert.throws(() => api.prepareEquipment(s, 'usb-c-dock', 'Another request for my desk.'), byCode('duplicate'));
  const decision = api.prepareDecision(manager, order.id, 1, 'Approve', 'Policy checked.');
  api.amendEquipment(s, order.id, 1, 'Dock for my new permanent desk and its monitors.');
  assert.throws(() => decision(manager), byCode('stale'));
  assert.equal(api.reviewOrder(manager, order.id).revision, 2);
  assert.throws(() => api.amendEquipment(manager, order.id, 2, 'Not the owner of the record.'), byCode('unavailable'));
  const approved = api.prepareDecision(manager, order.id, 2, 'Approve', 'Updated allocation checked.')(manager);
  assert.equal(approved.status, 'Approved'); assert.ok(!api.eligibleOrders(manager).some(r => r.id === order.id));
});

test('equipment procurement and application entitlement are independent review-before-submit operations', () => {
  const s = session(); const ui = mount(24, s, { itemId: 'usb-c-dock', category: 'Docks' });
  try {
    ui.field('Business rationale', 'Connect two displays at my new assigned desk.'); ui.click('Review equipment request'); ui.draw({ mode: 'full' });
    assert.match(ui.text(), /USD 148/); ui.click('Submit equipment request'); assert.match(ui.text(), /No order has been placed/);
    ui.draw({ id: 28, inputs: { appId: 'design-studio', accessLevel: 'Contributor', duration: '30d' } });
    ui.click('Review access request'); assert.match(ui.text(), /Design Operations/); ui.click('Edit access request');
    ui.field('Access level', 'Reader'); ui.click('Review access request'); ui.click('Submit access request');
    assert.match(ui.text(), /Access has not been granted/);
    ui.draw({ inputs: { appId: 'field-library', accessLevel: 'Contributor', duration: '90d' } });
    ui.click('Review access request'); assert.match(ui.el.querySelector('[role=alert]').textContent, /listed access level/);
    assert.throws(() => api.prepareAccess(s, 'unknown', 'Reader', '7d'), byCode('unavailable'));
  } finally { ui.close(); }
});

test('completed-week event trend and cohort flow reconcile without including today’s decision', () => {
  const s = session('alex', true);
  const trend = api.supportTrend(s, '4w', 'all'); const flow = api.supportFlow(s, '4w', 'equipment', 'all');
  const sum = (rows, key) => rows.reduce((v, r) => v + r[key], 0);
  for (const key of ['received','resolved','hours','positive','feedback']) assert.equal(sum(trend.points, key), trend.totals[key]);
  assert.ok(trend.points.some(p => p.resolved > p.received), 'closures from earlier intakes can exceed arrivals in a week');
  assert.equal((trend.totals.hours / trend.totals.resolved).toFixed(1), '86.7');
  assert.equal((100 * trend.totals.positive / trend.totals.feedback).toFixed(1), '94.1');
  assert.equal(flow.count, 24);
  const link = flow.links.find(l => l.id === 'procurement:Awaiting');
  assert.deepEqual([link.count, link.sourceCount], [6, 8]);
  assert.equal(flow.links.find(l => l.id === 'workplace:Resolved').count, 12);
  assert.deepEqual(link.matches.map(m => m.id), ['EQ-4102']);
  for (const stage of [0,1]) assert.equal(sum(flow.links.filter(l => l.level === stage), 'count'), flow.count);
  const o = api.reviewOrder(s, 'EQ-4102'); api.prepareDecision(s, o.id, o.revision, 'Approve', 'Allocation verified.')(s);
  assert.deepEqual(api.supportTrend(s, '4w', 'all'), trend);
  const afterwards = api.supportFlow(s, '4w', 'equipment', 'all').links.find(l => l.id === 'procurement:Awaiting');
  assert.equal(afterwards.count, 6); assert.deepEqual(afterwards.matches, []);
  assert.equal(api.supportFlow(s, '8w', 'equipment', 'all').count, 48);
  assert.equal(api.supportFlow(s, '4w', 'support', 'procurement').count, 0);
  assert.throws(() => api.supportTrend(session(), '4w', 'all'), byCode('denied'));
  assert.throws(() => api.supportFlow(session(), '4w', 'equipment', 'all'), byCode('denied'));
  assert.throws(() => api.supportFlow(s, '4w', 'hardware', 'all'), byCode('invalid'));
  const other = api.supportFlow(session('other-lead', true, s.memory), '4w', 'equipment', 'all');
  assert.equal(other.count, 24); assert.ok(other.links.every(l => l.matches.length === 0));
});

test('report selection, table buttons, period redraw and exact eligible record drilldown', () => {
  const s = session('alex', true); const ui = mount(27, s);
  try {
    assert.match(ui.text(), /6 of 24/); assert.match(ui.text(), /6 of 8/);
    ui.click('Workplace → Resolved'); assert.match(ui.text(), /12 of 24/);
    ui.draw({ mode: 'full' }); assert.match(ui.text(), /12 of 24/); assert.match(ui.text(), /Cohort evidence/);
    ui.field('Cohort period', '8w'); assert.match(ui.text(), /24 of 48/);
    ui.click('Procurement → Awaiting'); ui.click('Review EQ-4102 · 27-inch studio display');
    assert.match(ui.text(), /Revision 1/); assert.equal(api.reviewOrder(s,'EQ-4102').status, 'Pending');
    ui.draw({ id: 26, inputs: { period: '8w' } }); assert.equal(ui.el.querySelectorAll('tbody tr').length, 8);
    ui.field('Reporting period', '4w'); assert.equal(ui.el.querySelectorAll('tbody tr').length, 4);
    ui.draw({ id: 27, inputs: { category: 'support', queueId: 'procurement' } }); assert.match(ui.text(), /No share is calculated/); assert.ok(!ui.text().includes('NaN'));
  } finally { ui.close(); }
});

test('two clocks across year and DST boundaries retain historical cuts and intentional request dates', () => {
  for (const instant of ['2027-01-01T00:01:00Z', '2027-03-15T00:00:00Z']) {
    const s = session('alex', true, new Map(), instant);
    const r = api.supportTrend(s, '12w', 'workplace');
    assert.equal(r.points.length, 12); assert.ok(new Date(r.end) < s.now);
    assert.equal(new Date(r.start).getUTCDay(), 1);
    const device = api.devices(s)[0]; assert.ok(new Date(device.refresh) > s.now && new Date(device.checkIn) <= s.now);
    const confirm = api.prepareAccess(s, 'design-studio', 'Reader', '7d');
    const receipt = confirm(s); const frozen = receipt.expires;
    s.now = new Date(s.now.getTime() + 86400000);
    assert.equal(confirm(s).expires, frozen);
  }
});
