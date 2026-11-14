import { zavaCapabilityCatalog } from '../config/zava-capabilities.mjs';

const byId = new Map(zavaCapabilityCatalog.map((capability) => [capability.id, capability]));
const collisions = [
  { left: 'C05', right: 'C35', leftBoundary: /vacation|leave/i, rightBoundary: /own time off|other approval/i },
  { left: 'C16', right: 'C35', leftBoundary: /manager|approve/i, rightBoundary: /own time off/i },
  { left: 'C04', right: 'C05', leftBoundary: /approval/i, rightBoundary: /general approval/i },
  { left: 'C06', right: 'C07', leftBoundary: /event|urgent alert/i, rightBoundary: /ordinary company news/i },
  { left: 'C08', right: 'C32', leftBoundary: /acronym|definition/i, rightBoundary: /broader policy/i },
  { left: 'C10', right: 'C02', leftBoundary: /personal calendar/i, rightBoundary: /company event/i },
  { left: 'C13', right: 'C04', leftBoundary: /task|onboarding/i, rightBoundary: /learning/i },
  { left: 'C23', right: 'C33', leftBoundary: /security concern/i, rightBoundary: /ordinary IT/i },
  { left: 'C23', right: 'C24', leftBoundary: /ordinary IT/i, rightBoundary: /IT or security/i },
  { left: 'C31', right: 'C19', leftBoundary: /personal equity/i, rightBoundary: /public company stock/i },
  { left: 'C16', right: 'C30', leftBoundary: /manager|approve/i, rightBoundary: /vacation request/i },
  { left: 'C34', right: 'C22', leftBoundary: /book a room|menu/i, rightBoundary: /office information/i },
  { left: 'C34', right: 'C21', leftBoundary: /menu/i, rightBoundary: /office detail/i }
];
const errors = [];

for (const collision of collisions) {
  const left = byId.get(collision.left);
  const right = byId.get(collision.right);
  if (!left || !right) {
    errors.push(`Missing collision capability: ${collision.left}/${collision.right}.`);
    continue;
  }
  if (left.intentKey === right.intentKey || left.route === right.route || left.copilotName === right.copilotName) {
    errors.push(`Collision pair ${left.id}/${right.id} does not have unique intent, route, and tool identities.`);
  }
  const leftRouting = `${left.useWhen}. ${left.doNotUse}`;
  const rightRouting = `${right.useWhen}. ${right.doNotUse}`;
  if (!collision.leftBoundary.test(leftRouting)) errors.push(`${left.id} lacks the expected boundary against ${right.id}.`);
  if (!collision.rightBoundary.test(rightRouting)) errors.push(`${right.id} lacks the expected boundary against ${left.id}.`);
}

if (new Set(zavaCapabilityCatalog.map((capability) => capability.prompt.toLowerCase())).size !== zavaCapabilityCatalog.length) {
  errors.push('Canonical capability prompts must be unique.');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Validated ${collisions.length} nearest-sibling routing collision pairs across ${zavaCapabilityCatalog.length} capabilities.`);