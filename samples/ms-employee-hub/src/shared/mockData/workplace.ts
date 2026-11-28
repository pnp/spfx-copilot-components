import type { HubSession } from '../types';

export interface Office { id: string; city: string; zone: string; arrival: string; revision: number }
export interface HubEvent { id: string; title: string; officeId: string; start: string; minutes: number; format: string; revision: number }
export const offices: readonly Office[] = [
  {id:'LON',city:'London',zone:'Europe/London',arrival:'Step-free entrance on the garden level. Reception opens at 08:00.',revision:2},
  {id:'TYO',city:'Tokyo',zone:'Asia/Tokyo',arrival:'Take the south lift to the welcome desk on level two.',revision:1},
  {id:'RDM',city:'Redmond',zone:'America/Los_Angeles',arrival:'Use the west atrium for visitor check-in and campus wayfinding.',revision:1}
];
const storySeeds = [
  {id:'ST-01',topic:'Design',title:'Small changes. Wider doors.',dek:'Meet the teams designing work around the people who do it.',body:'In London, colleagues mapped the everyday journey from the station to a meeting seat. The most useful idea was also the smallest: publish the step-free route alongside every invitation. Three offices are trying it this month.',owner:'Workplace design desk',age:1},
  {id:'ST-02',topic:'People',title:'The hour we share',dek:'A town hall built for colleagues on both sides of midnight.',body:'Tokyo and London are co-hosting a short broadcast with captions and an asynchronous question round. Open the agenda to see the same start time on both calendars.',owner:'Global communications',age:3},
  {id:'ST-03',topic:'Technology',title:'A second life for a screen',dek:'Inside the refresh lab giving workplace equipment a longer useful life.',body:'The device team tests older displays for accessible contrast and connector compatibility before offering them to another team. Employees can inspect a device passport or request an eligible accessory in TechWeb.',owner:'Technology editorial',age:5},
  {id:'ST-04',topic:'People',title:'When the room listened',dek:'How a written question round changed an all-hands conversation.',body:'In our previous edition, colleagues in three time zones sent questions before and after the broadcast. The hosts published a captioned recording and answered the remaining questions in writing.',owner:'Global communications',age:16},
  {id:'ST-05',topic:'Design',title:'Preview of the next studio',dek:'A forthcoming edition.',body:'The editorial desk is preparing the next workplace story.',owner:'Workplace design desk',age:-2}
];
export function stories(now:Date): (typeof storySeeds[number] & {published:string; expires:string})[] {
  const edition=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate(),8);
  return storySeeds.map(s => ({...s,published:new Date(edition-s.age*86400000).toISOString(),expires:new Date(edition+(28-s.age)*86400000).toISOString()}))
    .filter(s=>Date.parse(s.published)<=now.getTime()&&now.getTime()<Date.parse(s.expires))
    .sort((a,b)=>b.published.localeCompare(a.published));
}
export const guidance = [
  {id:'GD-01',topic:'Travel',locale:'en-GB',title:'Before you travel',owner:'Workplace travel',version:'2.3',text:'Choose an accessible itinerary, compare rail with air, and request approval before making a booking. Keep the approved itinerary with your expense record.'},
  {id:'GD-02',topic:'Arrival',locale:'en-GB',title:'A step-free arrival in London',owner:'London workplace',version:'1.4',text:'Enter at the garden level. The welcome desk can arrange a quiet check-in and directions to an accessible meeting room.'},
  {id:'GD-03',topic:'Arrival',locale:'ja-JP',title:'Tokyo visitor arrival guide',owner:'Tokyo workplace',version:'1.2',text:'Use the south entrance and take the accessible lift to level two. Pre-register guests with the welcome desk before your visit.'},
  {id:'GD-04',topic:'Accessibility',locale:'en-US',title:'Accessible meetings playbook',owner:'Inclusive design',version:'3.1',text:'Share an agenda in advance, enable captions and leave space for written questions. Describe visual evidence aloud and provide a text alternative.'}
];
export const rooms = [
  {id:'LON-01',officeId:'LON',name:'Alder',seats:6,accessible:true,feature:'Step-free · live captions'},
  {id:'LON-02',officeId:'LON',name:'Observatory',seats:12,accessible:true,feature:'Step-free · wide display'},
  {id:'LON-03',officeId:'LON',name:'Loft',seats:8,accessible:false,feature:'Whiteboard · stair access'},
  {id:'TYO-01',officeId:'TYO',name:'Kumo',seats:8,accessible:true,feature:'Step-free · hybrid audio'},
  {id:'RDM-01',officeId:'RDM',name:'Cedar',seats:10,accessible:true,feature:'Step-free · panoramic camera'}
];
export function officeFor(id: string): Office | undefined {
  return offices.find(o=>o.id.toLowerCase()===id.toLowerCase() || o.city.toLowerCase()===id.toLowerCase());
}
export function dateInZone(date:Date,zone:string):string {
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const at=(type:string):string=>parts.find(p=>p.type===type)!.value;
  return `${at('year')}-${at('month')}-${at('day')}`;
}
export function plusDays(iso:string, days:number):string {
  const d=new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate()+days); return d.toISOString().slice(0,10);
}
// Resolve an office wall clock, not the browser's zone. A nonexistent DST time fails the round trip.
export function officeInstant(day:string,time:string,zone:string):number {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return NaN;
  const nominal=Date.parse(`${day}T${time}:00Z`);
  if(!Number.isFinite(nominal)||new Date(nominal).toISOString().slice(0,10)!==day) return NaN;
  const formatter=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  let guess=nominal;
  for(let n=0;n<4;n++){
    const parts=formatter.formatToParts(new Date(guess));
    const at=(k:string):string=>parts.find(p=>p.type===k)!.value;
    const local=Date.parse(`${at('year')}-${at('month')}-${at('day')}T${at('hour')}:${at('minute')}:00Z`);
    if(local===nominal) return guess;
    guess+=nominal-local;
  }
  return NaN;
}
export function agenda(now:Date):HubEvent[] {
  const programs=[
    {key:'town-hall',title:'One world town hall',officeId:'LON',weekday:4,time:'17:00',minutes:45,format:'Hybrid · live captions'},
    {key:'studio',title:'Open studio: inclusive design',officeId:'TYO',weekday:2,time:'11:00',minutes:30,format:'Studio · step-free'},
    {key:'lab',title:'Devices for everyone',officeId:'RDM',weekday:3,time:'14:00',minutes:50,format:'Lab · assisted listening'}
  ];
  return programs.flatMap(p=>{
    const zone=officeFor(p.officeId)!.zone, today=dateInZone(now,zone);
    const delta=(p.weekday-new Date(`${today}T12:00:00Z`).getUTCDay()+7)%7;
    let day=plusDays(today,delta);
    if(officeInstant(day,p.time,zone)<=now.getTime()) day=plusDays(day,7);
    return [day,plusDays(day,7),plusDays(day,14),plusDays(day,21)].map(date=>({id:`${p.key}-${date}`,title:p.title,officeId:p.officeId,start:new Date(officeInstant(date,p.time,zone)).toISOString(),minutes:p.minutes,format:p.format,revision:1}));
  }).sort((a,b)=>a.start.localeCompare(b.start));
}
export function eventTimes(e:HubEvent,session:HubSession):{label:string;zone:string;text:string}[] {
  const zones=offices.slice(0,2).map(o=>({label:o.city,zone:o.zone}));
  const local=zones.find(z=>z.zone===session.viewerZone);
  if(local)local.label+= ' (your time)';
  else if(session.viewerZone)zones.push({label:'Your local time',zone:session.viewerZone});
  return zones.map(z=>({...z,text:new Intl.DateTimeFormat(session.locale,{timeZone:z.zone,weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}).format(new Date(e.start))}));
}
export function calendarFile(e:HubEvent):string {
  const stamp=(time:number):string=>new Date(time).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const t=Date.parse(e.start);
  const esc=(s:string):string=>s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/[,;]/g,'\\$&');
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Employee Hub//Workplace//EN','BEGIN:VEVENT',`UID:${e.id}@employee-hub.invalid`,`DTSTAMP:${stamp(t)}`,`DTSTART:${stamp(t)}`,`DTEND:${stamp(t+60000*e.minutes)}`,`SUMMARY:${esc(e.title)}`,`LOCATION:${esc(officeFor(e.officeId)!.city)}`,'END:VEVENT','END:VCALENDAR',''].join('\r\n');
}
export interface RoomDraft {officeId:string;date:string;startTime:string;durationMinutes:number;capacity:number;accessible:boolean}
export interface Reservation {id:string;roomId:string;start:number;end:number;actorId:string}
export function defaultRoomDate(now:Date,zone:string):string {
  let day=plusDays(dateInZone(now,zone),1);
  while([0,6].includes(new Date(`${day}T12:00:00Z`).getUTCDay())) day=plusDays(day,1);
  return day;
}
export function checkSlot(d:RoomDraft,now:Date):string|undefined {
  const office=officeFor(d.officeId);
  if(!office) return 'Choose a listed workplace.';
  const start=officeInstant(d.date,d.startTime,office.zone);
  if(!Number.isFinite(start)||start<=now.getTime()) return 'Choose a future local date and time.';
  if([0,6].includes(new Date(`${d.date}T12:00:00Z`).getUTCDay())) return 'Choose a weekday when the workplace is open.';
  if(!Number.isInteger(d.capacity)||d.capacity<1||d.capacity>24) return 'Choose a capacity between 1 and 24.';
  const mins=Number(d.startTime.slice(0,2))*60+Number(d.startTime.slice(3));
  if(![15,30,45,60,90].includes(d.durationMinutes)||mins<8*60||mins+d.durationMinutes>18*60) return 'Choose a 15 to 90 minute slot within 08:00–18:00 office hours.';
  return undefined;
}
function bookings(session:HubSession):Reservation[] {
  return (session.memory.get('company.rooms') as Reservation[]|undefined)||[];
}
export function candidates(d:RoomDraft,s:HubSession):typeof rooms {
  if(checkSlot(d,s.now)) return [];
  const office=officeFor(d.officeId)!, start=officeInstant(d.date,d.startTime,office.zone), end=start+d.durationMinutes*60000;
  return rooms.filter(r=>r.officeId===office.id&&r.seats>=d.capacity&&(!d.accessible||r.accessible)&&!bookings(s).some(b=>b.roomId===r.id&&start<b.end&&end>b.start));
}
export function reserve(d:RoomDraft,roomId:string,requestKey:string,s:HubSession):Reservation {
  const key=`room-receipt:${s.actor.id}:${requestKey}`;
  const previous=s.memory.get(key) as Reservation|undefined;
  if(previous) return previous;
  const invalid=checkSlot(d,s.clock?.()??s.now);
  if(invalid) throw new Error(invalid);
  if(!candidates(d,s).some(r=>r.id===roomId)) throw new Error('That room is no longer available for these constraints. Choose another slot.');
  const start=officeInstant(d.date,d.startTime,officeFor(d.officeId)!.zone), existing=bookings(s);
  const receipt={id:`ROOM-${1001+existing.length}`,roomId,start,end:start+d.durationMinutes*60000,actorId:s.actor.id};
  s.memory.set('company.rooms',[...existing,receipt]); s.memory.set(key,receipt); return receipt;
}
interface PublishedRow {ExternalKey:string;Title:string;SchemaVersion:1;ContentRevision:number;Publication:'published';Audience:'employees'}
export interface OfficeRow extends PublishedRow {TimeZone:string;ArrivalText:string}
export interface EventRow extends PublishedRow {OfficeLookupId:number;StartUtc:string;DurationMinutes:number;FormatLabel:string}
const published={SchemaVersion:1,Publication:'published',Audience:'employees'} as const;
export function officeRow(o:Office):OfficeRow { return {ExternalKey:o.id,Title:o.city,TimeZone:o.zone,ArrivalText:o.arrival,ContentRevision:o.revision,...published}; }
export function eventRow(e:HubEvent,lookup:ReadonlyMap<string,number>):EventRow {
  const id=lookup.get(e.officeId);
  if(!id) throw new Error('Office must be mapped before its events.');
  return {ExternalKey:e.id,Title:e.title,OfficeLookupId:id,StartUtc:e.start,DurationMinutes:e.minutes,FormatLabel:e.format,ContentRevision:e.revision,...published};
}
export function readOffice(row:OfficeRow):Office {
  if(row.SchemaVersion!==1||row.Publication!=='published'||row.Audience!=='employees'||!Number.isSafeInteger(row.ContentRevision)||row.ContentRevision<1) throw new Error('Office is unpublished or uses an unsupported revision.');
  return {id:row.ExternalKey,city:row.Title,zone:row.TimeZone,arrival:row.ArrivalText,revision:row.ContentRevision};
}
export function readEvent(row:EventRow,lookup:ReadonlyMap<number,string>):HubEvent {
  const officeId=lookup.get(row.OfficeLookupId);
  if(!officeId||row.SchemaVersion!==1||row.Publication!=='published'||row.Audience!=='employees'||!Number.isSafeInteger(row.ContentRevision)||row.ContentRevision<1) throw new Error('Unresolved office, unpublished event or unsupported revision.');
  return {id:row.ExternalKey,title:row.Title,officeId,start:row.StartUtc,minutes:row.DurationMinutes,format:row.FormatLabel,revision:row.ContentRevision};
}
