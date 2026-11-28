/** Synthetic public information. No employee holdings, targets or live quotes. */
export const companyObjectives = [
  {id:'accessible-arrival', title:'Make a campus visit accessible before it starts.', evidence:'Workplace teams publish step-free routes alongside meeting invitations.', resourceId:'GD-02'},
  {id:'every-voice', title:'Make distributed meetings easier to join.', evidence:'The communications desk pairs live captions with a written question round.', resourceId:'GD-04'}
] as const;
export const officeLocations: Readonly<Record<string, readonly [number, number]>> = {LON:[-.128,51.507],TYO:[139.692,35.69],RDM:[-122.122,47.674]};
const dayMs=86400000;
export function shiftDay(day:string, by:number):string {return new Date(Date.parse(`${day}T12:00:00Z`)+by*dayMs).toISOString().slice(0,10);}
function weekday(day:string):number {return new Date(`${day}T12:00:00Z`).getUTCDay();}
function observed(day:string):string {const n=weekday(day);return n===6?shiftDay(day,-1):n===0?shiftDay(day,1):day;}
export function dayKind(day:string):'workday'|'weekend'|'holiday' {
  const y=Number(day.slice(0,4));if([`${y}-01-01`,`${y}-07-04`,`${y}-12-25`,`${y+1}-01-01`].some(k=>observed(k)===day))return 'holiday';
  return [0,6].includes(weekday(day))?'weekend':'workday';
}
function closeFor(day:string):{date:string;cents:number} {
  const t=Date.parse(`${day}T00:00:00Z`)/dayMs;
  return {date:day,cents:Math.round(40000+680*Math.sin(t/6.7)+350*Math.sin(t/2.3)+820*Math.cos(t/31))};
}
function sessionEndHour(day:string):number|undefined {
  if(dayKind(day)!=='workday')return undefined;
  const [,month,date]=day.split('-').map(Number),dow=weekday(day);
  if(month===11&&dow===4&&date>=22&&date<=28)return undefined;
  if(month===11&&dow===5&&date>=23&&date<=29)return 13;
  return 16;
}
/** Deliberately simplified fixture exchange calendar; never presents a future close. */
export function referenceClose(now:Date):{date:string;cents:number} {
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now);
  const part=(type:string):string=>parts.find(p=>p.type===type)!.value;
  let date=`${part('year')}-${part('month')}-${part('day')}`;
  const end=sessionEndHour(date);
  if(end===undefined||Number(part('hour'))<end)date=shiftDay(date,-1);
  while(sessionEndHour(date)===undefined)date=shiftDay(date,-1);
  return closeFor(date);
}
export function companyShareHistory(now:Date,sessions:5|21):ReturnType<typeof closeFor>[] {
  const rows=[referenceClose(now)];let date=rows[0].date;
  while(rows.length<sessions){date=shiftDay(date,-1);if(sessionEndHour(date)!==undefined)rows.push(closeFor(date));}
  return rows.reverse();
}
