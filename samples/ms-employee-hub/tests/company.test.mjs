import test from 'node:test';
import assert from 'node:assert/strict';
import {agenda,calendarFile,candidates,checkSlot,dateInZone,defaultRoomDate,eventRow,eventTimes,officeFor,officeInstant,officeRow,offices,readEvent,readOffice,reserve,stories} from '../src/shared/mockData/workplace.ts';
import {newSession} from '../src/shared/mockData/session.ts';
import {companyShareHistory,referenceClose} from '../src/shared/mockData/companyBrief.ts';

test('public company shares keep completed dates and prices across windows, weekends and fresh sessions',()=>{
  const before=new Date('2027-01-04T20:59:59Z'),after=new Date('2027-01-04T21:00:00Z');
  const week=companyShareHistory(before,5),month=companyShareHistory(before,21),next=companyShareHistory(after,5);
  assert.equal(week.at(-1).date,'2026-12-31');assert.deepEqual(week,month.slice(-5));
  assert.deepEqual(next.slice(0,-1),week.slice(1));assert.deepEqual(next.at(-1),referenceClose(after));
  assert.deepEqual(Object.keys(next.at(-1)).sort(),['cents','date']);assert.ok(new Set(month.map(r=>r.cents)).size>1);
  assert.equal(referenceClose(new Date('2026-11-27T17:59Z')).date,'2026-11-25');
  assert.equal(referenceClose(new Date('2026-11-27T18:00Z')).date,'2026-11-27');
});

test('news and local event windows move with two clocks; a started event drops out without moving the next one',()=>{
  for(const stamp of ['2026-03-26T16:59:59Z','2026-12-31T23:59:59Z']){
    const now=new Date(stamp),events=agenda(now),lead=stories(now)[0];
    assert.ok(Date.parse(lead.published)<=+now&&+now-Date.parse(lead.published)<=7*86400000&&Date.parse(lead.expires)>+now);
    assert.ok(stories(now).every(s=>Date.parse(s.published)<=+now));assert.ok(stories(now).some(s=>+now-Date.parse(s.published)>7*86400000));
    assert.ok(events.every(e=>Date.parse(e.start)>+now));
    const town=events.find(e=>e.id.startsWith('town-hall'));const slot=new Date(town.start);
    assert.notEqual(dateInZone(slot,'Europe/London'),dateInZone(slot,'Asia/Tokyo'));
    assert.ok(calendarFile(town).split('\r\n').includes(`DTSTART:${town.start.replace(/[-:]/g,'').replace('.000','')}`));
    const after=agenda(slot);assert.ok(!after.some(e=>e.id===town.id));assert.equal(after.find(e=>e.id===events.filter(e=>e.title===town.title)[1].id)?.start,events.filter(e=>e.title===town.title)[1].start);
  }
});
test('office lookups, UTC event timestamps and stable portable keys round trip without private fields',()=>{
  const office=offices[0], e=agenda(new Date('2027-01-01T10:00Z')).find(x=>x.officeId===office.id);
  assert.deepEqual(readOffice(officeRow(office)),office);const row=eventRow(e,new Map([[office.id,72]]));
  assert.deepEqual(readEvent(row,new Map([[72,office.id]])),e);assert.throws(()=>readEvent(row,new Map()),/Unresolved/);
  assert.throws(()=>eventRow(e,new Map()),/Office/);
  assert.throws(()=>readEvent({...row,Publication:'draft'},new Map([[72,office.id]])),/unpublished/);
  assert.equal('privateNote' in eventRow({...e,privateNote:'not for content management'},new Map([[office.id,72]])),false);
});
test('one town hall uses the injected viewer locale and zone without duplicating a displayed office',()=>{
  const s=newSession(undefined,new Date('2027-01-04T10:00Z'),{locale:'ja-JP',viewerZone:'Asia/Tokyo'});
  const e=agenda(s.now).find(e=>e.id.startsWith('town-hall')),rows=eventTimes(e,s);
  assert.equal(rows.length,2);assert.equal(rows[1].label,'Tokyo (your time)');assert.match(rows[1].text,/金/);
  const third=eventTimes(e,{...s,viewerZone:'America/New_York'});assert.equal(third[2].zone,'America/New_York');
});
test('booking rechecks capacity, accessibility, overlaps and actor-isolated idempotency',()=>{
  const now=new Date('2027-01-01T18:00Z'),s=newSession(undefined,now), office=officeFor('London');
  const d={officeId:office.id,date:defaultRoomDate(now,office.zone),startTime:'10:00',durationMinutes:30,capacity:6,accessible:true};
  assert.equal(d.date,'2027-01-04');assert.deepEqual(candidates(d,s).map(r=>r.id),['LON-01','LON-02']);
  assert.deepEqual(candidates({...d,capacity:8},s).map(r=>r.id),['LON-02']);const r=reserve(d,'LON-01','first',s);
  assert.deepEqual(reserve(d,'LON-01','first',s),r);assert.throws(()=>reserve({...d,startTime:'10:15'},'LON-01','second',s),/no longer/);
  assert.ok(candidates({...d,startTime:'10:30'},s).some(x=>x.id==='LON-01'));assert.equal(candidates(d,newSession(undefined,now)).length,2);
  assert.match(checkSlot({...d,date:'2027-01-03'},now),/weekday/);
});
test('invalid wall clock and skipped DST times cannot become another date',()=>{
  assert.ok(Number.isNaN(officeInstant('2026-03-29','01:30','Europe/London')));
  assert.ok(Number.isNaN(officeInstant('2026-02-31','10:00','Europe/London')));
  assert.equal(new Date(officeInstant('2026-07-14','10:00','Europe/London')).toISOString(),'2026-07-14T09:00:00.000Z');
});
test('a review left open past the room start fails without moving the draft',()=>{
  const s=newSession(undefined,new Date('2027-01-04T09:49Z'));
  s.clock=()=>new Date('2027-01-04T10:01Z');
  const d={officeId:'LON',date:'2027-01-04',startTime:'10:00',durationMinutes:30,capacity:6,accessible:true};
  assert.ok(candidates(d,s).length);assert.throws(()=>reserve(d,'LON-01','stale',s),/future/);
  assert.equal(d.startTime,'10:00');assert.equal(s.memory.has('company.rooms'),false);
});
