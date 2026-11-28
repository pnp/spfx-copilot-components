import type { HubInputs } from '../shared/types';

type FieldKind = 'text' | 'id' | 'enum' | 'date' | 'time' | 'number' | 'boolean';
export interface FieldSpec { kind: FieldKind; description: string; choices?: readonly string[]; bounds?: readonly [number, number]; numbers?: readonly number[] }
const choice = (description: string, ...choices: string[]): FieldSpec => ({ kind: 'enum', description, choices });
const perEntry: Record<number, Record<string, FieldSpec>> = {
  1: { window: choice('Upcoming event window.', 'week', 'month') },
  2: { topic: choice('Published news edition, older stories or bookmarks.', 'All', 'Design', 'People', 'Technology', 'Saved', 'Archive') },
  5: { topic: choice('Published guidance topic.', 'All', 'Travel', 'Arrival', 'Accessibility'), locale: choice('Resource language and region.', 'All', 'en-US', 'en-GB', 'ja-JP') },
  6: { workstream: choice('Growth follow-up workstream.', 'qualification', 'forecast') },
  7: { driver: choice('Signed forecast movement to inspect.', 'new', 'expansion', 'slippage', 'reductions') },
  9: { channel: choice('Lead acquisition channel within the selected cohort.', 'all', 'partner', 'inbound') },
  10: { dueBand: choice('Due-date band for learning assignments.', 'all', 'overdue', 'next7', 'upcoming') },
  11: { topic: choice('Benefits preparation topic.', 'health', 'future', 'time'), window: choice('Enrollment planning window.', 'current', 'next') },
  12: { payPeriod: { kind: 'text', description: 'Completed pay period key or latest; never a pay amount.' } },
  13: { horizon: choice('Look-ahead window for vesting milestones.', '90d', '180d', '1y') },
  14: { period: choice('Entitlement period.', 'current', 'next') },
  16: { week: { kind: 'text', description: 'Planning week: current, next or a local date in YYYY-MM-DD format.' } },
  17: { status: choice('Assigned leave queue filter, not a decision.', 'pending', 'approved', 'declined', 'all') },
  18: { category: choice('Private case category. Never include a private message.', 'benefits', 'pay', 'time', 'workplace') },
  22: { category: choice('Type of break/fix problem.', 'Hardware', 'Network', 'Software'), impact: choice('Employee-reported work impact.', 'One device', 'Work blocked', 'Team affected') },
  23: { status: choice('Personal ticket status filter.', 'Open', 'Resolved') },
  24: { category: choice('Equipment catalog category.', 'Displays', 'Docks', 'Audio') },
  25: { status: choice('Assigned equipment queue filter, never a requested decision.', 'Pending', 'Approved', 'Changes requested') },
  26: { period: choice('Historical service-reporting period.', '4w', '8w', '12w') },
  27: { period: choice('Historical service cohort.', '4w', '8w', '12w'), category: choice('Intake category for flow reporting.', 'equipment', 'support', 'all') },
  28: { accessLevel: choice('Proposed access to review; no grant is made.', 'Reader', 'Contributor'), duration: choice('Requested access duration.', '7d', '30d', '90d') },
  29: { category: choice('Read-only explorer category.', 'Company & workplace', 'Leadership business review', 'Pay & benefits', 'Time & learning', 'Tech support', 'Manager decisions') },
  30: { landing: choice('Workspace to open; access is checked independently.', 'company', 'hr', 'tech', 'business') }
};
const common: Record<string, FieldSpec> = {
  marketId: { kind: 'id', description: 'ISO market key for the authorized commercial cut (Germany: DE).' },
  period: choice('Quarter containing the reporting cut.', 'current-quarter', 'previous-quarter'),
  region: choice('Commercial reporting region.', 'all', 'EMEA', 'Americas', 'APAC'),
  leaveType: choice('Type of leave in the employee ledger.', 'annual', 'sick', 'personal'),
  deviceType: choice('Device family.', 'Laptop', 'Headset'),
  query: { kind: 'text', description: 'Short published content or capability search phrase, without private details.' },
  issue: { kind: 'text', description: 'Short troubleshooting topic, not a private ticket description.' },
  startTime: { kind: 'time', description: 'Office-local start time in 24-hour HH:mm format.' },
  durationMinutes: { kind: 'number', description: 'Meeting duration in minutes: 15, 30, 45, 60 or 90.', bounds: [15, 90], numbers: [15, 30, 45, 60, 90] },
  capacity: { kind: 'number', description: 'Number of seats required, 1–24.', bounds: [1, 24] },
  accessible: { kind: 'boolean', description: 'Whether step-free access is required.' }
};
export function fieldSpec(entry: number, name: string): FieldSpec {
  const spec = perEntry[entry]?.[name] || common[name];
  if (spec) return spec;
  if (/Id$/.test(name)) return { kind: 'id', description: `Exact ${name.slice(0, -2)} reference in the current authorized fixture; unknown references return no match.` };
  if (/date$/i.test(name)) return { kind: 'date', description: `Local calendar ${name} as YYYY-MM-DD, not a UTC timestamp.` };
  throw new Error(`Unknown input field ${name}`);
}
export type ParsedInputs = { ok: true; inputs: HubInputs } | { ok: false; field: string };
export function normalizeInputs(entry: number, fields: readonly string[], raw: Readonly<Record<string, unknown>>): ParsedInputs {
  const inputs: Record<string, string | number | boolean> = {};
  const unexpected = Object.keys(raw).find(key => fields.indexOf(key) < 0 && raw[key] !== undefined);
  if (unexpected !== undefined) return { ok: false, field: 'unsupported setting' };
  for (const key of fields) {
    const value = raw[key];
    if (value === undefined) continue;
    const spec = fieldSpec(entry, key);
    if (spec.kind === 'boolean' && typeof value === 'boolean') inputs[key] = value;
    else if (spec.kind === 'number' && typeof value === 'number' && Number.isInteger(value) && spec.bounds && value >= spec.bounds[0] && value <= spec.bounds[1] && (!spec.numbers || spec.numbers.indexOf(value) >= 0)) inputs[key] = value;
    else if (typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 120 && !Array.from(value).some(char => char.charCodeAt(0) < 32)) {
      let text = value.trim();
      if (key === 'marketId') {
        const aliases: Record<string, string> = { germany: 'DE', 'united kingdom': 'GB', 'united states': 'US', brazil: 'BR', india: 'IN', japan: 'JP', australia: 'AU' };
        text = Object.prototype.hasOwnProperty.call(aliases, text.toLowerCase()) ? aliases[text.toLowerCase()] : text;
      }
      if (key === 'officeId' && (entry === 1 || entry === 4)) {
        const aliases: Record<string, string> = { london: 'LON', tokyo: 'TYO', redmond: 'RDM' };
        text = Object.prototype.hasOwnProperty.call(aliases, text.toLowerCase()) ? aliases[text.toLowerCase()] : text;
      }
      if (key === 'officeId' && entry === 20 && /^(redmond|london)$/i.test(text)) text = text.toLowerCase();
      if (key === 'period' && spec.choices && spec.choices.indexOf('current-quarter') >= 0) {
        if (/^(this|current)( fiscal)? quarter$/i.test(text)) text = 'current-quarter';
        if (/^(previous|last)( fiscal)? quarter$/i.test(text)) text = 'previous-quarter';
      }
      if (key === 'payPeriod' && !/^(?:latest|previous|\d{4}-(?:0[1-9]|1[0-2]))$/.test(text)) return { ok: false, field: key };
      if (key === 'week' && !/^(current|next)$/.test(text) && (!/^\d{4}-\d\d-\d\d$/.test(text) || Number.isNaN(Date.parse(text)) || new Date(text).toISOString().slice(0, 10) !== text)) return { ok: false, field: key };
      if (spec.kind === 'enum') {
        const match = spec.choices?.find(option => option.toLowerCase() === text.toLowerCase());
        if (!match) return { ok: false, field: key };
        inputs[key] = match;
      } else if (spec.kind === 'date' && /^\d{4}-\d\d-\d\d$/.test(text) && !Number.isNaN(Date.parse(text)) && new Date(text).toISOString().slice(0, 10) === text) inputs[key] = text;
      else if (spec.kind === 'time' && /^([01]\d|2[0-3]):[0-5]\d$/.test(text)) inputs[key] = text;
      else if (spec.kind === 'id' && /^[a-z0-9][a-z0-9._:-]{0,79}$/i.test(text)) inputs[key] = key === 'marketId' ? text.toUpperCase() : text;
      else if (spec.kind === 'text') inputs[key] = text;
      else return { ok: false, field: key };
    } else return { ok: false, field: key };
  }
  if (typeof inputs.startDate === 'string' && typeof inputs.endDate === 'string' && inputs.startDate > inputs.endDate) return { ok: false, field: 'endDate' };
  return { ok: true, inputs };
}
