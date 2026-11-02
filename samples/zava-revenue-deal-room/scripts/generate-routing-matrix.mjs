import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const outputPath = path.join(root, 'Zava-Revenue-Deal-Room-Routing-Matrix.md');
const config = JSON.parse(fs.readFileSync(path.join(root, 'config', 'config.json'), 'utf8'));
const starters = JSON.parse(fs.readFileSync(path.join(root, 'config', 'conversation-starters.json'), 'utf8')).starters;
const declarativeAgent = JSON.parse(fs.readFileSync(path.join(root, 'copilot', 'declarativeAgent.json'), 'utf8'));
const entries = Object.values(config.bundles).flatMap((bundle) => bundle.components || []);
const manifests = entries.map((entry) => JSON.parse(fs.readFileSync(path.join(root, entry.manifest.replace('./', '')), 'utf8')));
const rows = manifests.map((manifest) => {
  const tool = manifest.tools[0];
  const description = tool.description.default;
  const boundary = description.split(' Do not ')[0];
  const exclusion = description.includes(' Do not ') ? `Do not ${description.split(' Do not ')[1]}` : '';
  return `| \`${tool.name}\` | ${boundary} | ${exclusion} |`;
});
const starterRows = starters.map((starter, index) => `| ${index + 1} | ${starter.title} | ${starter.text} | \`${starter.targetName}\` |`);
const collisions = [
  ['Account context vs meeting prep', 'Build a brief for the Contoso expansion.', 'BuildAccountBrief', 'Prepare me for the Contoso steering meeting.', 'PrepareCustomerMeeting'],
  ['Qualification vs forecast', 'Should we pursue the Contoso expansion?', 'QualifyOpportunity', 'Should Contoso remain in commit for Q4?', 'InspectForecastCommit'],
  ['Deal risk vs pipeline quality', 'What can derail the Contoso signature?', 'GetDealRisk', 'Show pipeline quality for this quarter.', 'ExplorePipelineQuality'],
  ['Scenario vs exception decision', 'Model a three-year ramped offer for Contoso.', 'SimulateCommercialOffer', 'Review the Contoso payment-term exception.', 'ReviewDealException'],
  ['Proposal creation vs readiness', 'Shape the Contoso solution proposal.', 'ShapeSolutionProposal', 'Review the Contoso proposal readiness.', 'ReviewProposalReadiness'],
  ['Inline attention vs aggregate pipeline', 'Show important deals needing attention and let me inspect one inline.', 'ExploreDealAttention', 'Show pipeline quality for this quarter.', 'ExplorePipelineQuality'],
  ['Deal submission vs independent approval', 'Help me submit an evidence-backed deal.', 'SubmitDealRequest', 'Review submitted demo request ZM-1001.', 'ReviewDealApproval'],
  ['Fictional pipeline flow vs catalog quality', 'Show an imaginary pipeline Sankey from regions to buyer readiness and actions.', 'ExplorePipelineFlow', 'Show pipeline quality for this quarter.', 'ExplorePipelineQuality'],
  ['Fictional approval flow vs stored decisions', 'Show an imaginary approval Sankey through current reviewer stages.', 'ExploreApprovalFlow', 'Review stored demo request ZM-1001.', 'ReviewDealApproval']
];
const collisionRows = collisions.map(([pair, promptA, toolA, promptB, toolB]) => `| ${pair} | ${promptA} | \`${toolA}\` | ${promptB} | \`${toolB}\` |`);
const markdown = `# Zava Revenue Deal Room routing matrix\n\nGenerated from configured component manifests and the canonical starter configuration. Tool schemas prefill or scope experiences; they never confirm consequential actions.\n\n## Tool boundaries\n\n| Tool | Positive use boundary | Nearest exclusion |\n| --- | --- | --- |\n${rows.join('\n')}\n\n## Conversation starters\n\n| # | Title | Prompt | Expected inline component |\n| ---: | --- | --- | --- |\n${starterRows.join('\n')}\n\n## Sibling collision rehearsal\n\n| Boundary | Prompt A | Expected A | Prompt B | Expected B |\n| --- | --- | --- | --- | --- |\n${collisionRows.join('\n')}\n\n## Host validation notes\n\n- Verify selected tool and extracted properties in an authenticated Copilot tenant.\n- Verify Expand lands in the tool's configured lens and preserves supported context.\n- Verify a fresh prompt resets defaults while a passive host rerender preserves local interaction state.\n- Local source validation proves catalog metadata alignment, not model routing behavior.\n`;

const check = process.argv.includes('--check');
if (check) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== markdown) throw new Error('Routing matrix is missing or stale. Run npm run generate:routing-matrix.');
  const configuredStarters = declarativeAgent.conversation_starters || [];
  if (JSON.stringify(configuredStarters) !== JSON.stringify(starters.map(({ title, text }) => ({ title, text })))) throw new Error('Declarative-agent starters differ from canonical starter configuration.');
  console.log(JSON.stringify({ tools: rows.length, starters: starters.length, collisions: collisions.length, current: true }));
} else {
  fs.writeFileSync(outputPath, markdown, 'utf8');
  console.log(`Generated ${path.basename(outputPath)} with ${rows.length} tools.`);
}
