import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'shared', 'catalog.ts'), 'utf8');
const rows = [...source.matchAll(/d\('([^']+)','([^']+)','([^']+)','([^']+)','([^']+)','([^']+)','([^']+)','([^']+)','([^']+)','([^']+)'\)/g)].map(match => match.slice(1));
if (rows.length !== 22) throw new Error(`Expected 22 catalog definitions, found ${rows.length}`);
const starters = JSON.parse(fs.readFileSync(path.join(root, 'config', 'conversation-starters.json'), 'utf8')).starters;
const declared = JSON.parse(fs.readFileSync(path.join(root, 'copilot', 'declarativeAgent.json'), 'utf8')).conversation_starters;
if (JSON.stringify(declared) !== JSON.stringify(starters.map(({ title, text }) => ({ title, text })))) throw new Error('Canonical and declarative starters differ.');
const tools = new Set(rows.map(row => `${row[0]}Tool`));
if (starters.length !== 6 || new Set(starters.map(starter => starter.tool)).size !== 6 || starters.some(starter => !tools.has(starter.tool))) throw new Error('Starters require six distinct registered tools.');
const lines = [
  '# ZavaCore Procurement Command Center - Routing Matrix', '',
  'Generated from `src/shared/catalog.ts` and `config/conversation-starters.json`. Tool names retain the registered `Tool` suffix; component/view keys do not.', '',
  '| Tool | Operation | Lens and route | Role | Route when | Exclude when | Canonical prompt |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  ...rows.map(([key, , lens, route, operation, role, question, , prompt, excludes]) => `| \`${key}Tool\` | ${operation} | ${lens} / \`${route}\` | ${role} | ${question} | ${excludes} | ${prompt} |`),
  '', '## Conversation starters', '',
  '| Starter | Prompt | Expected registered tool |', '| --- | --- | --- |',
  ...starters.map(starter => `| ${starter.title} | ${starter.text} | \`${starter.tool}\` |`),
  '', '## Nearest-sibling rehearsal', '',
  '- New outcome/quantity/budget intake -> CreatePurchaseIntentTool; explicit route alternatives on an existing request -> CompareBuyingOptionsTool; controls/remediation -> CheckPurchasePolicyTool; existing demand approval -> ReviewPurchaseRequestTool.',
  '- Bid weights/ranking -> CompareSupplierBidsTool; proposed award and authority -> ReviewSupplierAwardTool.',
  '- Relationship obligations -> ExploreSupplier360Tool; one supplier continuity -> TrackSupplierRiskTool; owned mitigation -> PlanSupplierRiskMitigationTool; cross-supplier allocation -> ExploreSupplierPortfolioBalanceTool.',
  '- New supplier capture -> OnboardSupplierTool; evidence/expiry/conditions decision -> ReviewSupplierQualificationTool.',
  '- Renewal/exit judgment -> ReviewContractRenewalTool; give/get mandate -> NegotiateContractTermsTool.',
  '- New buying demand -> CreatePurchaseIntentTool; existing PO consequences -> ManagePurchaseOrderChangeTool; unmatched invoice disposition -> ResolveInvoiceExceptionTool.',
  '- Opportunity -> DetectSpendLeakageTool; intervention acceptance -> TrackLeakageRecoveryTool; verified stage/value analysis -> ExploreSpendPerformanceTool.',
  '- Capability discovery is educational, not a fallback for an operational request.',
  '', 'Local checks prove metadata, inputs, registrations, and starter targets agree. Rehearse these positive and excluded prompts in fresh authenticated Copilot conversations; local tests do not prove model selection.', ''
];
const output = `${lines.join('\n')}\n`;
const file = path.join(root, 'Zava-Procurement-Routing-Matrix.md');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== output) throw new Error('Routing matrix is stale.');
} else fs.writeFileSync(file, output);
console.log('Verified 22 registered tool owners and six canonical starter targets.');
