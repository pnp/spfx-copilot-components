import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = name => JSON.parse(readFileSync(new URL(`../${name}`,import.meta.url)));
const catalog=read('config/hub-catalog.json');
export const cases=read('review/routing-cases.json');
const byId=id=>catalog.find(c=>c.id===id);
const additional=[[3,8],[6,7],[14,16],[15,16],[16,17],[19,21],[19,22],[20,21],[20,23],[21,28],[22,28],[23,26],[26,27]];
const pairs=new Map();
for(const [a,b] of [...cases.map(c=>[c.id,c.nearest]),...additional]){
  assert(byId(a)&&byId(b)&&a!==b,`Invalid collision ${a}/${b}`);
  const pair=[a,b].sort((x,y)=>x-y);pairs.set(pair.join('/'),pair);
}
export const collisions=[...pairs.values()].sort(([a,b],[x,y])=>a-x||b-y);
export const neighbors=id=>collisions.filter(pair=>pair.includes(id)).map(pair=>byId(pair.find(n=>n!==id)));
export const toolDescription=c=>`Use when: ${c.description} Do not use for: ${c.negative} Related but separate tools: ${neighbors(c.id).map(n=>n.tool).join(', ')}.`;
export const directions='For one clear intent invoke exactly one matching tool, once. Never open a second component as a fallback. Clarify before using any tool when the goal is ambiguous (for example help with leave, check my stock, sales outlook, or a sign-in problem without a requested action). Discuss visible evidence in text without reopening a component. An explicit handoff is a new intent; selections, prompt fields and starters never confirm a submission, decision or grant.';
export const noCallTurns=[
  ['Help with leave.','Clarify balance, personal request, team coverage or an assigned decision.'],
  ['Check my stock.','Clarify public share prices versus personal vesting.'],
  ['Sales outlook?','Clarify actual bookings versus a change between forecast cuts.'],
  ["I can't open Design Studio.",'Clarify troubleshooting, reporting a fault or requesting access.'],
  ['Approve that.','Without an eligible selected record, clarify. Never confirm in chat.'],
  ['Why did this number change?','With a visible chart, discuss its cut and denominator; do not reopen it or start an action.']
];
