import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import App from './PremiumInnovationApp';
import Theme from './InnovationThemeProvider';
import { getIntent, INTENTS, type IInnovationProperties, type InnovationIntentKey } from './catalog';
import { getReceipts, resetReceipts } from './sessionStore';
import type { IVisibleState } from './InnovationContext';

Object.defineProperty(globalThis,'IS_REACT_ACT_ENVIRONMENT',{value:true,configurable:true});
let container:HTMLDivElement;
let root:Root;
const contexts:IVisibleState[]=[];
const publish=(state:IVisibleState):void=>{contexts.push(state);};
function render(intent:InnovationIntentKey,properties:IInnovationProperties={},mode='inline',theme:'light'|'dark'='light'):void{
  act(()=>root.render(<Theme theme={theme} targetDocument={document}><App definition={getIntent(intent)} properties={properties} currentUserName={getIntent(intent).role==='All roles'?'Megan Bowen':getIntent(intent).role} displayMode={mode} onVisibleState={publish}/></Theme>));
}
function control(label:string):HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement{
  const native=container.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`);
  if(native)return native;
  const labels=Array.from(container.querySelectorAll('label'));
  const item=labels.find(candidate=>(candidate.textContent||'').replace('*','').trim()===label);
  const id=item?.getAttribute('for');
  const input=id?container.querySelector<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>(`[id="${id}"]`):item?.querySelector<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>('select,input,textarea');
  if(!input)throw new Error(`Missing control ${label}`);
  return input;
}
function fill(label:string,value:string):void{
  const input=control(label);
  const prototype=input instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:input instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(prototype,'value')?.set;
  if(!setter)throw new Error(`Missing native value setter for ${label}`);
  act(()=>{setter.call(input,value);input.dispatchEvent(new Event(input instanceof HTMLSelectElement?'change':'input',{bubbles:true}));});
}
function button(text:string):HTMLButtonElement{
  const found=Array.from(container.querySelectorAll('button')).find(item=>item.textContent===text);
  if(!found)throw new Error(`Missing button ${text}`);
  return found;
}
function click(text:string):void{act(()=>button(text).click());}
function complete(review:string,operation:string):void{
  expect(button(`Review ${review}`).disabled).toBe(false);click(`Review ${review}`);
  expect(getReceipts()).toHaveLength(0);
  click('Continue to confirmation');expect(getReceipts()).toHaveLength(0);
  click(`Confirm ${operation}`);expect(getReceipts()).toHaveLength(1);
  expect(container.textContent).toContain('In-memory demo receipt only');
}
beforeEach(()=>{container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);contexts.length=0;resetReceipts();});
afterEach(()=>{act(()=>root.unmount());container.remove();});

describe('intent-specific completion',()=>{
  test('submits problem, audience, owner, measured baseline and evidence only after confirmation',()=>{
    render('SubmitInnovationIdea',{message:'Reduce onboarding delay'});
    expect(button('Review idea canvas').disabled).toBe(true);
    fill('Problem to solve','New hires wait for access');fill('Affected audience','New joiners in EMEA');
    fill('Current onboarding / process days','20');fill('Target process days','10');fill('Accountable owner','Patti Fernandez');fill('Evidence source and observation','HR survey of 40 new starters');
    complete('idea canvas','idea submission');
    expect(getReceipts()[0].values).toMatchObject({Owner:'Patti Fernandez','Reduction target':'50.0%',Audience:'New joiners in EMEA'});
    click('Start a fresh draft');expect(control('Problem to solve').value).toBe('');expect(control('Accountable owner').value).toBe('Megan Bowen');
  });
  test('business case uses requested amount and edited confidence/cost in its committed snapshot',()=>{
    render('BuildIdeaBusinessCase',{ideaId:'IDEA-031',amount:120000});
    fill('Annual gross benefit ($)','180000');fill('Annual operating cost ($)','30000');fill('Benefit confidence (%)','50');fill('Case owner','Miriam Graham');fill('Benefit assumption and source','Finance forecast: 30 hours saved weekly');
    complete('financial business case','business case saved');
    expect(getReceipts()[0].values).toMatchObject({Investment:'$120,000','Risk-adjusted net benefit':'$60,000','Risk-adjusted payback':'24.0 months',Owner:'Miriam Graham'});
  });
  test('recognition credits a selected contributor and selected idea outcome rather than canned praise',()=>{
    render('CelebrateInnovationImpact',{ideaId:'IDEA-063',message:'Thank you for validating finance controls'});
    fill('Contributor','Grady Archie');fill('Specific contribution','Validated invoice source controls');fill('Measurement source','Finance ledger Q3 signed reconciliation');
    complete('impact recognition','recognition prepared');
    expect(getReceipts()[0].values).toMatchObject({Contributor:'Grady Archie','Measured value':'$1,700,000',Contribution:'Validated invoice source controls'});
  });
  test('funding blocks over-envelope amounts and unapproved ideas; adjusted commitment uses edited owner',()=>{
    const properties={ideaId:'IDEA-044',amount:800001};
    render('ReviewInnovationFunding',properties);
    fill('Conditions or decision rationale','Release in two tranches after controls review');
    expect(button('Review capital committee decision').disabled).toBe(true);
    fill('Proposed capital ($)','350000');fill('Funding accountable owner','Joni Sherman');fill('Funding decision','Adjust');
    complete('capital committee decision','funding decision');
    expect(getReceipts()[0].values).toMatchObject({'New commitment':'$350,000','Remaining envelope':'$450,000',Owner:'Joni Sherman',Decision:'Adjust'});
    render('ReviewInnovationFunding',{ideaId:'IDEA-001',amount:10000});
    fill('Conditions or decision rationale','Needs a gate approval first');
    expect(button('Review capital committee decision').disabled).toBe(true);
    fill('Funding decision','Defer');expect(button('Review capital committee decision').disabled).toBe(false);
    render('ReviewInnovationFunding',{ideaId:'IDEA-031',amount:10000});
    fill('Conditions or decision rationale','Complete the pending business-case gate before funding');
    expect(button('Review capital committee decision').disabled).toBe(true);
  });
  test('brief generates a scoped source ledger and keeps edited narrative and leadership ask',()=>{
    render('GenerateInnovationBrief',{ideaId:'IDEA-063'});
    expect(control('Editable evidence narrative').value).toContain('1 catalog ideas');
    expect(control('Editable evidence narrative').value).toContain('$1,700,000');
    fill('Editable evidence narrative','Controls are validated against finance source evidence.');
    fill('Leadership decision ask','Decide whether to schedule a formal scale gate.');
    complete('executive narrative','executive brief prepared');
    expect(getReceipts()[0].values.Narrative).toBe('Controls are validated against finance source evidence.');
  });
  test('challenge validates scoring weights and timeline, and captures a recruitment plan',()=>{
    render('LaunchInnovationChallenge',{message:'Accessible onboarding challenge',region:'EMEA',theme:'Employee experience'});
    fill('Target audience','Frontline and remote employees');fill('Measurable challenge success criteria','20 qualified proposals that reduce access delays');
    fill('Impact weight (%)','60');expect(button('Review challenge launch plan').disabled).toBe(true);
    fill('Feasibility weight (%)','20');fill('Closing date','2026-11-05');expect(button('Review challenge launch plan').disabled).toBe(true);
    fill('Closing date','2026-11-30');complete('challenge launch plan','challenge launch staged');
    expect(getReceipts()[0].values).toMatchObject({Region:'EMEA','Window days':29,'Impact / feasibility / inclusion':'60% / 20% / 20%'});
  });
  test('experiment gates Go on measurable thresholds and requires a human learning choice',()=>{
    render('ManageInnovationExperiment',{ideaId:'IDEA-057',message:'Reduce coaching completion time by 20 percent'});
    fill('Observed sample size','29');fill('Observed process days','8');fill('Observation source','Pilot observation log of coached service teams');fill('Human decision rationale','The sample must reach the predeclared minimum');fill('Human learning decision','Go');
    expect(button('Review pilot learning assessment').disabled).toBe(true);
    fill('Observed sample size','30');fill('Safety incident count','1');expect(button('Review pilot learning assessment').disabled).toBe(true);
    fill('Safety incident count','0');complete('pilot learning assessment','experiment learning recorded');
    expect(getReceipts()[0].values).toMatchObject({'Measured reduction':'20.0%','Human learning decision':'Go','Rule recommendation':'Go'});
  });
});

describe('all current target intents and advertised properties',()=>{
  test.each(INTENTS.map(item=>[item.key] as const))('%s renders a meaningful current-target body',(key)=>{
    render(key);expect(container.querySelector('[data-layout]')).not.toBeNull();expect(container.textContent).toContain(getIntent(key).title);
    expect(getReceipts()).toHaveLength(0);
  });
  test.each(['BuildIdeaBusinessCase','CelebrateInnovationImpact','ReviewInnovationFunding','GenerateInnovationBrief','ManageInnovationExperiment','ReviewIdeaGate'] as InnovationIntentKey[])('%s leaves unknown IDs visibly unmatched',(intent)=>{
    render(intent,{ideaId:'IDEA-MISSING'});expect(container.textContent).toContain('No matching record');expect(container.textContent).toContain('IDEA-MISSING');
    expect(contexts[contexts.length-1].state).toBe('no-match');expect(getReceipts()).toHaveLength(0);
  });
  test('personal filters never substitute another owner or ID; value and geography use the requested scope',()=>{
    render('GetMyInnovation',{ideaId:'IDEA-MISSING'});expect(container.textContent).toContain('No matching personal ideas');
    render('TrackInnovationValue',{ideaId:'IDEA-063'});expect(container.textContent).toContain('Invoice Exception Automation');expect(container.textContent).not.toContain('Knowledge Discovery');
    render('TrackInnovationValue',{theme:'not-a-theme'});expect(contexts[contexts.length-1].state).toBe('no-match');
    render('ExploreGlobalInnovation',{region:'EMEA'});expect(container.textContent).toContain('EMEA trails the best reporting region by 0');
    render('ExploreGlobalInnovation',{region:'Atlantis'});expect(container.textContent).toContain('No matching record');
  });
  test('growth metric switches actual series and computed change; capability query narrows actual cards',()=>{
    render('GetInnovationGrowth');click('conversion');expect(container.textContent).toContain('21 percentage points');expect(contexts[contexts.length-1].detail).toContain('conversion');
    render('ExploreAgentCapabilities',{query:'funding committee'});expect(container.textContent).toContain('Funding committee');expect(container.textContent).toContain('1 shown');
    render('ExploreAgentCapabilities',{query:'zzzz-no-capability'});expect(container.textContent).toContain('No matching capability');
  });
  test('gate decision uses exact selected record, never auto-confirms, and queue inspection cannot decide',()=>{
    render('GetInnovationReviewQueue');click('Review');expect(container.textContent).toContain('Inspection only');
    expect(container.textContent).not.toContain('Approve and advance');
    render('ReviewIdeaGate',{ideaId:'IDEA-014'});expect(container.textContent).toContain('Customer Signal Studio');
    click('Approve and advance');expect(button('Confirm approval').disabled).toBe(true);expect(getReceipts()).toHaveLength(0);
    fill('Recorded rationale','Advance only after naming a data owner and privacy review.');
    click('Confirm approval');expect(getReceipts()[0].values.ideaId).toBe('IDEA-014');
  });
  test('draft and reviewed snapshot survive passive theme/width/mode changes; fresh invocation resets',()=>{
    const properties={ideaId:'IDEA-031',amount:120000};
    render('BuildIdeaBusinessCase',properties);fill('Case owner','Edited case owner');fill('Benefit assumption and source','Finance owner verified savings source');
    const input=control('Case owner');
    render('BuildIdeaBusinessCase',properties,'fullscreen','dark');expect(control('Case owner')).toBe(input);expect(control('Case owner').value).toBe('Edited case owner');
    render('BuildIdeaBusinessCase',properties,'inline','light');click('Review financial business case');
    render('BuildIdeaBusinessCase',properties,'fullscreen','dark');expect(container.textContent).toContain('Edited case owner');expect(container.querySelector('[data-layout="BuildIdeaBusinessCase-review"]')).not.toBeNull();
    render('BuildIdeaBusinessCase',{ideaId:'IDEA-063',amount:50000});expect(control('Case owner').value).toBe('Miriam Graham');
    expect(control('One-time investment ($)').value).toBe('50000');expect(control('Benefit assumption and source').value).toBe('');
  });
  test.each([['Send back for evaluation','Confirm send back','sentBack'],['Decline submission','Confirm decline','declined']])('gate %s retains a typed rationale and exact outcome',(action,confirmation,outcome)=>{
    render('ReviewIdeaGate',{ideaId:'IDEA-014'});click(action);
    fill('Recorded rationale','Data ownership and privacy evidence are incomplete.');
    const input=control('Recorded rationale');
    fill('Recorded rationale','Data ownership and privacy evidence must be completed first.');
    expect(control('Recorded rationale')).toBe(input);
    click(confirmation);expect(getReceipts()[0].values).toMatchObject({ideaId:'IDEA-014',decision:outcome});
    click('Review next submission');expect(container.textContent).toContain('3 need action');
  });
  test('workspace navigation retains the primary draft and republishes only visible committed state',()=>{
    render('BuildIdeaBusinessCase',{ideaId:'IDEA-031'},'fullscreen');
    fill('Case owner','Edited owner retained');fill('Benefit assumption and source','Validated finance assumption for savings');click('Review financial business case');
    click('Enterprise Insights');expect(contexts[contexts.length-1].intent).toBe('ExploreInnovationPortfolio');
    click('My Innovation');expect(contexts[contexts.length-1].intent).toBe('BuildIdeaBusinessCase');
    expect(contexts[contexts.length-1].state).toBe('review');expect(contexts[contexts.length-1].detail).toContain('Edited owner retained');
    click('Reset demo data');expect(control('Case owner').value).toBe('Pradeep Gupta');expect(getReceipts()).toHaveLength(0);
  });
  test.each(['GetMyInnovation','TrackInnovationValue'])('%s applies exact theme filters',(intent)=>{
    render(intent as InnovationIntentKey,{theme:'Sustainability'});
    expect(container.textContent).toContain('Sustainability');expect(container.textContent).not.toContain('Smart Onboarding Journey');
  });
  test('unknown full-screen selections do not display a healthy workspace assessment',()=>{
    render('BuildIdeaBusinessCase',{ideaId:'IDEA-MISSING'},'fullscreen');
    const hero=container.querySelector('h1')?.parentElement?.parentElement;
    expect(hero?.textContent).toContain('Selection unresolved');
    const kpi=Array.from(container.querySelectorAll('p')).find(item=>item.textContent?.indexOf('Illustrative workspace-wide KPIs')===0);
    expect(kpi?.parentElement?.hidden).toBe(true);
    expect(contexts[contexts.length-1].state).toBe('no-match');
  });
});
