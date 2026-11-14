import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const definitions = [
  ['CreatePurchaseIntent', ['outcome', 'quantity', 'budget', 'currency', 'neededBy', 'locations', 'constraints', 'categoryHint']],
  ['CompareBuyingOptions', ['requestId', 'quantity', 'budget', 'currency', 'neededBy']],
  ['CheckPurchasePolicy', ['requestId', 'quantity', 'budget', 'currency', 'constraints']],
  ['ReviewPurchaseRequest', ['requestId', 'proposedDecision', 'conditionText']],
  ['AggregateDemand', ['category', 'region', 'currency']],
  ['BuildSourcingEvent', ['cohortId', 'eventId', 'category', 'neededBy', 'supplierId', 'outcome']],
  ['CompareSupplierBids', ['eventId', 'riskWeight', 'supplierId']],
  ['ReviewSupplierAward', ['eventId', 'splitPercent', 'proposedDecision', 'conditionText']],
  ['ExploreSupplier360', ['supplierId']],
  ['ReviewContractRenewal', ['contractId', 'supplierId', 'proposedDecision', 'conditionText']],
  ['DetectSpendLeakage', ['category', 'region', 'opportunityId']],
  ['TrackSupplierRisk', ['supplierId', 'region', 'scenario']],
  ['ResolveInvoiceException', ['invoiceId', 'proposedDecision', 'conditionText']],
  ['ExploreSpendPerformance', ['category', 'period', 'region']],
  ['OnboardSupplier', ['supplierName', 'country', 'category', 'outcome']],
  ['ReviewSupplierQualification', ['supplierId', 'proposedDecision', 'conditionText', 'neededBy']],
  ['PlanSupplierRiskMitigation', ['supplierId', 'scenario', 'owner', 'neededBy', 'budget', 'outcome']],
  ['NegotiateContractTerms', ['contractId', 'supplierId', 'budget', 'neededBy', 'outcome']],
  ['ManagePurchaseOrderChange', ['purchaseOrderId', 'requestId', 'quantity', 'neededBy', 'budget', 'proposedDecision', 'conditionText']],
  ['TrackLeakageRecovery', ['opportunityId', 'proposedDecision', 'conditionText']],
  ['ExploreSupplierPortfolioBalance', ['region', 'scenario', 'concentrationLimit']],
  ['ExploreAgentCapabilities', ['query']]
];
const fields = {
  outcome: ["string()", 'Specific business outcome, sourcing scope, mitigation action, or negotiation objective stated by the user.'],
  requestId: ["string()", 'Existing purchase request identifier. Unknown identifiers remain visible as no-match states.'],
  purchaseOrderId: ["string()", 'Existing purchase order identifier, such as ZPC-PO-4108.'],
  category: ["string()", 'Procurement category to filter or prefill, such as IT hardware or Logistics.'],
  categoryHint: ["string()", 'Requested category for a new purchase, such as IT hardware.'],
  quantity: ["number().int()", 'Whole positive unit quantity explicitly requested by the user; runtime range is 1 to 100000.'],
  neededBy: ["string()", 'ISO date YYYY-MM-DD for delivery, bid deadline, mitigation, negotiation, or qualification expiry.'],
  locations: ["array(z.string())", 'Named delivery locations for the editable purchase draft.'],
  budget: ["number()", 'Budget, negotiation target, mitigation cost, or PO change cap. Runtime policy validates it; a prompt never grants authority.'],
  currency: ["enum(['EUR','USD','GBP','JPY'])", 'Explicit currency; comparison and policy scenarios use EUR and never silently convert.'],
  constraints: ["array(z.string())", 'User-stated purchase constraints to retain in the reviewed outcome and policy context.'],
  cohortId: ["string()", 'Source demand cohort identifier for a sourcing event draft.'],
  eventId: ["string()", 'Sourcing event identifier; the curated bid and award case is ZPC-RFP-31.'],
  supplierId: ["string()", 'Exact supplier identifier or name; an unknown value must not select another supplier.'],
  contractId: ["string()", 'Existing contract identifier to review or negotiate, such as ZPC-CON-101.'],
  invoiceId: ["string()", 'Invoice exception identifier, such as ZPC-8831.'],
  opportunityId: ["string()", 'Leakage opportunity or recovery intervention identifier, such as ZPC-LEAK-01.'],
  period: ["string()", 'Evidence period; spend comparisons support Current period or Previous period.'],
  region: ["string()", 'Evidence region: EMEA, AMER, APAC, LATAM, or All regions where supported.'],
  scenario: ["string()", 'Explicit continuity, mitigation-trigger, or portfolio scenario stated by the user.'],
  proposedDecision: ["string()", 'Editable decision suggestion only; never confirms, approves, rejects, or posts anything automatically.'],
  conditionText: ["string()", 'User-provided rationale or conditions for human review; at least 12 characters are required to confirm.'],
  query: ["string()", 'Business terms to search the capability explorer.'],
  supplierName: ["string()", 'Legal name of the new supplier candidate, not an existing supplier approval.'],
  country: ["string()", 'Country for the editable supplier intake.'],
  owner: ["string()", 'Named accountable owner for the mitigation action.'],
  riskWeight: ["number()", 'Bid risk weight percentage, runtime range 5 to 45; all evaluation weights retain a 100% total.'],
  splitPercent: ["number()", 'Proposed primary award percentage, runtime range 50 to 85. Above 70 requires separate approval authority.'],
  concentrationLimit: ["number()", 'Maximum primary supplier share, runtime range 34 to 80, for the illustrative three-supplier portfolio.']
};
const catalog = fs.readFileSync(path.join(root, 'src', 'shared', 'catalog.ts'), 'utf8');
const rows = [...catalog.matchAll(/d\('([^']+)','([^']+)','([^']+)','([^']+)','([^']+)','([^']+)','([^']+)','([^']+)','([^']+)','([^']+)'\)/g)].map(match => match.slice(1));
if (rows.length !== definitions.length) throw new Error('Catalog and generation definitions differ.');
const components = [];
const ids = [];
const routingDescriptions = {
  CreatePurchaseIntent: 'Use when the user states a new purchase outcome, quantity, budget, or delivery need and wants an editable intake. Do not use for comparing fulfillment routes on an existing request, inspecting policy, or approving demand.',
  CompareBuyingOptions: 'Use when explicitly comparing contract, reuse, catalog, or sourcing routes for an existing purchase request. Do not use for a new purchase intake, supplier bid ranking, or an award decision.',
  CompareSupplierBids: 'Use when comparing normalized supplier bids, evaluation weights, price, delivery, confidence, or risk sensitivity for an event. Do not use to approve a supplier award or compare fulfillment routes.',
  ReviewSupplierAward: 'Use when a human must review a proposed single or split supplier award and its authority, concentration, and cost consequences. Do not use for read-only bid ranking or a new purchase request.',
  TrackSupplierRisk: 'Use when analyzing one named supplier continuity, corridor, or sub-tier exposure. Do not use for a cross-supplier allocation scenario, relationship overview, or mitigation approval.',
  DetectSpendLeakage: 'Use when identifying addressable off-contract spend or price leakage opportunities. Do not use to accept recovered savings, execute an intervention, or report verified realized value.'
};
for (const [name, names] of definitions) {
  const row = rows.find(item => item[0] === name);
  if (!row) throw new Error(`Missing catalog owner ${name}.`);
  const folder = name[0].toLowerCase() + name.slice(1);
  const directory = path.join(root, 'src', 'copilotComponents', folder);
  const manifestPath = path.join(directory, `${name}CopilotComponent.manifest.json`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.tools[0].name = `${name}Tool`;
  manifest.tools[0].description.default = routingDescriptions[name] || `Use when the user asks: ${row[6]} Outcome: ${row[7]} Boundary: ${row[9]}`;
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const schema = names.map(field => {
    if (!fields[field]) throw new Error(`Unknown schema field ${field}.`);
    const [type, description] = fields[field];
    return `  ${field}: z.${type}.optional().describe(${JSON.stringify(description)})`;
  });
  fs.writeFileSync(path.join(directory, `${name}CopilotComponentProperties.ts`), `import { z } from 'zod';\nimport zodToJsonSchema from 'zod-to-json-schema';\n\nconst propertiesSchema = z.object({\n${schema.join(',\n')}\n});\nexport type I${name}CopilotComponentProperties = z.infer<typeof propertiesSchema>;\nexport default zodToJsonSchema(propertiesSchema);\n`);
  components.push({ entrypoint: `./lib/copilotComponents/${folder}/${name}CopilotComponent.js`, manifest: `./src/copilotComponents/${folder}/${name}CopilotComponent.manifest.json` });
  ids.push(manifest.id);
}
const configPath = path.join(root, 'config', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
config.bundles = { 'zava-procurement-components': { components } };
fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
const agentPath = path.join(root, 'config', 'copilot-agent.json');
const agent = JSON.parse(fs.readFileSync(agentPath, 'utf8'));
agent.agents[0].components = ids;
fs.writeFileSync(agentPath, `${JSON.stringify(agent, null, 2)}\n`);
const starters = JSON.parse(fs.readFileSync(path.join(root, 'config', 'conversation-starters.json'), 'utf8')).starters;
const declarativePath = path.join(root, 'copilot', 'declarativeAgent.json');
const declarative = JSON.parse(fs.readFileSync(declarativePath, 'utf8'));
declarative.conversation_starters = starters.map(({ title, text }) => ({ title, text }));
fs.writeFileSync(declarativePath, `${JSON.stringify(declarative, null, 2)}\n`);
console.log(`Configured ${definitions.length} immutable tools with bounded, described, intent-specific schemas.`);
