import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const intents=['SubmitInnovationIdea','GetMyInnovation','BuildIdeaBusinessCase','CelebrateInnovationImpact','GetInnovationReviewQueue','ReviewIdeaGate','ReviewInnovationFunding','ExploreInnovationPortfolio','TrackInnovationValue','GenerateInnovationBrief','GetInnovationGrowth','ExploreGlobalInnovation','TrackInnovationBudget','GetInnovationPortfolioHealth','LaunchInnovationChallenge','ManageInnovationExperiment','ExploreAgentCapabilities'];
const operations={
 SubmitInnovationIdea:{review:'idea canvas',confirm:'idea submission',fields:{'Idea title':'Reduce onboarding access delays','Problem to solve':'New joiners wait for application access','Affected audience':'New hires across EMEA offices','Current onboarding / process days':'20','Target process days':'10','Accountable owner':'Patti Fernandez','Evidence source and observation':'HR survey of 40 new hires in October'}},
 BuildIdeaBusinessCase:{review:'financial business case',confirm:'business case saved',fields:{'One-time investment ($)':'120000','Annual gross benefit ($)':'180000','Annual operating cost ($)':'30000','Benefit confidence (%)':'50','Case owner':'Miriam Graham','Benefit assumption and source':'Finance estimate of 30 hours saved weekly'}},
 CelebrateInnovationImpact:{review:'impact recognition',confirm:'recognition prepared',fields:{'Specific contribution':'Validated onboarding access controls','Measurement source':'Finance Q3 benefits ledger signed by owner','Recognition message':'Thank you for reducing onboarding delays with accessible design'}},
 ReviewInnovationFunding:{review:'capital committee decision',confirm:'funding decision',fields:{'Proposed capital ($)':'350000','Funding accountable owner':'Joni Sherman','Conditions or decision rationale':'Release in two tranches after control validation'}},
 GenerateInnovationBrief:{review:'executive narrative',confirm:'executive brief prepared',fields:{'Leadership decision ask':'Commission an independent benefits review before the next gate.'}},
 LaunchInnovationChallenge:{review:'challenge launch plan',confirm:'challenge launch staged',fields:{'Challenge title':'Accessible onboarding challenge','Target audience':'Frontline and remote new employees','Measurable challenge success criteria':'20 qualified proposals reducing application access delays'}},
 ManageInnovationExperiment:{review:'pilot learning assessment',confirm:'experiment learning recorded',fields:{'Testable pilot hypothesis':'Coaching reduces time to complete service tasks by 20 percent','Observed sample size':'40','Observed process days':'7','Observation source':'October pilot observation log across 40 service teams','Human decision rationale':'All predeclared thresholds met with no safety incidents'}}
};
export async function captureIntentVisuals(browser,baseUrl,root,sourceFiles,sourceSha256){
 const directory=path.join(root,'assets','intent-visuals');
 fs.mkdirSync(directory,{recursive:true});
 const captures=[],checks=[];
 const errors=[];
 const screenshot=async(page,name,intent,state,variant)=>{
   await page.locator('[data-layout]').first().waitFor();
   const metrics=await page.evaluate(()=>({width:document.documentElement.clientWidth,content:document.documentElement.scrollWidth,broken:[...document.images].filter(image=>!image.complete||!image.naturalWidth).length}));
   if(metrics.content>metrics.width||metrics.broken)throw new Error(`${name}: overflow ${metrics.content}/${metrics.width}, broken images ${metrics.broken}`);
   const output=path.join(directory,`${name}.png`);
   await page.locator('[data-harness-root]').screenshot({path:output,animations:'disabled'});
   const bytes=fs.readFileSync(output);
   captures.push({name:`intent-visuals/${name}.png`,intent,state,variant,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)});
 };
 for(const variant of [{name:'standard',width:900,theme:'light'},{name:'narrow',width:390,theme:'light'},{name:'dark',width:900,theme:'dark'}]){
  for(const intent of intents){
   const page=await browser.newPage({viewport:{width:variant.width,height:950},reducedMotion:'reduce',colorScheme:variant.theme});
   page.on('pageerror',error=>errors.push(`${intent}: ${error}`));
   page.on('console',message=>{if(message.type()==='error'||message.type()==='warning')errors.push(`${intent}: ${message.text()}`);});
   await page.goto(`${baseUrl}/?${new URLSearchParams({intent,theme:variant.theme,test:'1'})}`,{waitUntil:'networkidle'});
   await screenshot(page,`${intent}-${variant.name}`,intent,'initial',variant.name);
   const operation=operations[intent];
   if(operation){
    for(const [label,value] of Object.entries(operation.fields))await page.getByLabel(label).fill(value);
    if(intent==='ManageInnovationExperiment')await page.getByLabel('Human learning decision',{exact:true}).selectOption('Go');
    if(intent==='ReviewInnovationFunding')await page.getByLabel('Funding decision',{exact:true}).selectOption('Adjust');
    const values=await page.locator('input,textarea,select').evaluateAll(elements=>elements.map(element=>element.value));
    await page.getByRole('button',{name:'Harness theme',exact:true}).click();
    await page.getByRole('button',{name:'Harness mode',exact:true}).click();
    await page.getByRole('button',{name:'Harness mode',exact:true}).click();
    await page.getByRole('button',{name:'Harness theme',exact:true}).click();
    const retained=await page.locator('input,textarea,select').evaluateAll(elements=>elements.map(element=>element.value));
    if(JSON.stringify(values)!==JSON.stringify(retained))throw new Error(`${intent}: lost draft across mode/theme transitions`);
    await page.getByRole('button',{name:`Review ${operation.review}`,exact:true}).click();
    await screenshot(page,`${intent}-${variant.name}-review`,intent,'review',variant.name);
    if(!(await page.locator('[data-model-context]').innerText()).includes('"state":"review"'))throw new Error(`${intent}: review context missing`);
    await page.getByRole('button',{name:'Continue to confirmation',exact:true}).click();
    if(variant.name==='standard')await screenshot(page,`${intent}-confirm`,intent,'confirm',variant.name);
    await page.getByRole('button',{name:`Confirm ${operation.confirm}`,exact:true}).click();
    await screenshot(page,`${intent}-${variant.name}-receipt`,intent,'receipt',variant.name);
    if(!(await page.locator('[data-model-context]').innerText()).includes('"state":"receipt"'))throw new Error(`${intent}: receipt context missing`);
    checks.push({intent,variant:variant.name,draftRetention:true,review:true,humanConfirmation:true,semanticReceipt:true});
   }else if(intent==='ReviewIdeaGate'){
    await page.getByLabel('Decision rationale').fill('Advance with an APAC accessibility sample before the next gate.');
    await page.getByRole('button',{name:'Approve and advance',exact:true}).click();
    await screenshot(page,`${intent}-${variant.name}-confirm`,intent,'confirm',variant.name);
    await page.getByRole('button',{name:'Confirm approval',exact:true}).click();
    await screenshot(page,`${intent}-${variant.name}-receipt`,intent,'receipt',variant.name);
    checks.push({intent,variant:variant.name,humanConfirmation:true,semanticReceipt:true});
   }
   await page.close();
  }
 }
 for(const intent of ['BuildIdeaBusinessCase','CelebrateInnovationImpact','ReviewInnovationFunding','TrackInnovationValue','GenerateInnovationBrief','ManageInnovationExperiment','ReviewIdeaGate','GetMyInnovation']){
  const page=await browser.newPage({viewport:{width:900,height:950}});
  page.on('pageerror',error=>errors.push(`${intent} no-match: ${error}`));
  page.on('console',message=>{if(message.type()==='error'||message.type()==='warning')errors.push(`${intent} no-match: ${message.text()}`);});
  await page.goto(`${baseUrl}/?${new URLSearchParams({intent,ideaId:'IDEA-MISSING',test:'1'})}`,{waitUntil:'networkidle'});
  const context=await page.locator('[data-model-context]').innerText();
  if(!context.includes('no-match'))throw new Error(`${intent}: unknown ID published a success-shaped context`);
  await screenshot(page,`${intent}-no-match`,intent,'no-match','standard');
  await page.getByRole('button',{name:'Harness mode',exact:true}).click();
  if(!await page.getByText('Selection unresolved',{exact:true}).isVisible())throw new Error(`${intent}: full-screen no-match showed a healthy default`);
  await screenshot(page,`${intent}-fullscreen-no-match`,intent,'no-match','fullscreen');
  checks.push({intent,noMatch:true,fullscreenNoMatch:true});await page.close();
 }
 if(errors.length)throw new Error(errors.join('\n'));
 const report={schemaVersion:1,capturedAt:new Date().toISOString(),sourceFiles,sourceSha256,intents:intents.length,totalCaptures:captures.length,failureCount:0,runtimeErrors:errors,checks,captures};
 fs.writeFileSync(path.join(root,'assets','intent-evidence.json'),`${JSON.stringify(report,null,2)}\n`);
 console.log(`Captured ${captures.length} supplementary intent states across all ${intents.length} tools; zero runtime/overflow failures.`);
}
