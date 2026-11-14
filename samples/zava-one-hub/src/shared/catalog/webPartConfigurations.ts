export type ZavaWebPartProperty =
  | 'primaryView'
  | 'scope'
  | 'filter'
  | 'location'
  | 'density'
  | 'maxItems'
  | 'showSource'
  | 'showImages'
  | 'allowActions'
  | 'showAgenda'
  | 'showTasks'
  | 'showMail'
  | 'showLearning'
  | 'showCompanyHighlights'
  | 'showPlanMyDay';

export interface IZavaConfigurationOption {
  key: string;
  text: string;
}

export interface IZavaTopActionDefinition {
  property: Exclude<ZavaWebPartProperty, 'maxItems' | 'showSource' | 'showImages' | 'allowActions'>;
  label: string;
  options: readonly IZavaConfigurationOption[];
}

export interface IZavaWebPartConfigurationValues {
  primaryView?: string;
  scope?: string;
  filter?: string;
  location?: string;
  density?: string;
  maxItems?: number;
  showSource?: boolean;
  showImages?: boolean;
  allowActions?: boolean;
  showAgenda?: boolean;
  showTasks?: boolean;
  showMail?: boolean;
  showLearning?: boolean;
  showCompanyHighlights?: boolean;
  showPlanMyDay?: boolean;
}

export interface IZavaWebPartConfigurationDefinition {
  defaults: IZavaWebPartConfigurationValues;
  topActions: readonly IZavaTopActionDefinition[];
  advanced: readonly ZavaWebPartProperty[];
  itemLabel: string;
  minItems: number;
  maxItems: number;
}

const option = (key: string, text: string): IZavaConfigurationOption => ({ key, text });
const choice = (
  property: IZavaTopActionDefinition['property'],
  label: string,
  options: readonly IZavaConfigurationOption[]
): IZavaTopActionDefinition => ({ property, label, options });

const densityOptions = [option('comfortable', 'Comfortable'), option('compact', 'Compact')];

function define(
  topActions: readonly IZavaTopActionDefinition[],
  defaults: IZavaWebPartConfigurationValues,
  advanced: readonly ZavaWebPartProperty[] = ['density', 'maxItems', 'showSource'],
  itemLabel: string = 'Visible records',
  minItems: number = 1,
  maxItems: number = 8
): IZavaWebPartConfigurationDefinition {
  return { topActions, defaults, advanced, itemLabel, minItems, maxItems };
}

export const zavaWebPartConfigurations: Readonly<Record<string, IZavaWebPartConfigurationDefinition>> = {
  myDay: define([
    choice('primaryView', 'Start in', [option('summary', 'Daily briefing'), option('agenda', 'Agenda'), option('plan', 'Plan my day')])
  ], { primaryView: 'summary', density: 'comfortable', maxItems: 5, showSource: true, showAgenda: true, showTasks: true, showMail: true, showLearning: true, showCompanyHighlights: true, showPlanMyDay: true }, ['showSource', 'showAgenda', 'showTasks', 'showMail', 'showLearning', 'showCompanyHighlights', 'showPlanMyDay'], 'Visible priorities', 3, 8),
  agenda: define([
    choice('primaryView', 'View', [option('timeline', 'Timeline'), option('next', 'Next meeting')]),
    choice('scope', 'Period', [option('Today', 'Today'), option('Tomorrow', 'Tomorrow'), option('This week', 'This week')])
  ], { primaryView: 'timeline', scope: 'Today', density: 'comfortable', maxItems: 5, showSource: true, allowActions: true }, ['showSource', 'allowActions'], 'Visible meetings', 1, 8),
  importantMail: define([
    choice('primaryView', 'View', [option('summary', 'Priority summary'), option('list', 'Message list'), option('detail', 'Top message')]),
    choice('filter', 'Messages', [option('Flagged', 'Flagged'), option('Unread', 'Unread'), option('High importance', 'High importance')])
  ], { primaryView: 'summary', filter: 'Flagged', density: 'comfortable', maxItems: 3, showSource: true }, undefined, 'Visible messages', 1, 5),
  tasks: define([
    choice('primaryView', 'View', [option('summary', 'Task summary'), option('list', 'Task list'), option('detail', 'Top task')]),
    choice('filter', 'Tasks', [option('Today', 'Due today'), option('Upcoming', 'Upcoming'), option('Completed', 'Completed')])
  ], { primaryView: 'summary', filter: 'Today', density: 'comfortable', maxItems: 5, showSource: true, allowActions: true }, ['density', 'maxItems', 'showSource', 'allowActions'], 'Visible tasks', 1, 8),
  approvals: define([
    choice('primaryView', 'View', [option('summary', 'Decision summary'), option('list', 'Approval queue'), option('detail', 'Top approval')]),
    choice('filter', 'Status', [option('Pending', 'Pending'), option('Submitted', 'Submitted by me'), option('Processed', 'Processed')])
  ], { primaryView: 'summary', filter: 'Pending', density: 'comfortable', maxItems: 5, showSource: true, allowActions: true }, ['density', 'maxItems', 'showSource', 'allowActions'], 'Visible approvals', 1, 8),
  companyNews: define([
    choice('primaryView', 'Layout', [option('editorial', 'Editorial'), option('tiles', 'Hero tiles'), option('layers', 'Layers'), option('carousel', 'Carousel'), option('filmstrip', 'Filmstrip'), option('compact', 'Compact list')]),
    choice('scope', 'Edition', [option('Global', 'Global'), option('Local', 'My location'), option('All', 'Global + local')])
  ], { primaryView: 'editorial', scope: 'All', density: 'comfortable', maxItems: 8, showSource: true, showImages: true }, ['density', 'maxItems', 'showSource', 'showImages'], 'Visible stories', 3, 8),
  announcements: define([
    choice('primaryView', 'View', [option('summary', 'Active notice'), option('list', 'Notice list'), option('detail', 'Notice detail')]),
    choice('filter', 'Notices', [option('Active', 'Active'), option('History', 'History'), option('All', 'All')])
  ], { primaryView: 'summary', filter: 'Active', density: 'comfortable', maxItems: 3, showSource: true }, undefined, 'Visible notices', 1, 6),
  knowledge: define([
    choice('primaryView', 'View', [option('summary', 'Verified answer'), option('list', 'Search results'), option('detail', 'Top source')]),
    choice('scope', 'Sources', [option('Policies', 'Policies'), option('People', 'People'), option('Files', 'Files'), option('All', 'All sources')])
  ], { primaryView: 'summary', scope: 'Policies', density: 'comfortable', maxItems: 5, showSource: true }, undefined, 'Visible sources', 1, 8),
  employeeServices: define([
    choice('primaryView', 'View', [option('summary', 'Favorites'), option('list', 'Service catalog'), option('detail', 'Top service')]),
    choice('filter', 'Category', [option('All', 'All services'), option('Work', 'Work'), option('Pay', 'Pay & benefits'), option('Help', 'Help')])
  ], { primaryView: 'summary', filter: 'All', density: 'comfortable', maxItems: 6, showSource: true }, undefined, 'Visible services', 3, 8),
  companyEvents: define([
    choice('primaryView', 'Default view', [option('calendar', 'Month'), option('agenda', 'Agenda')])
  ], { primaryView: 'calendar', density: 'comfortable', maxItems: 5, showSource: true }, undefined, 'Visible agenda events', 1, 8),
  people: define([
    choice('primaryView', 'View', [option('summary', 'People cards'), option('list', 'People list'), option('detail', 'Top match')]),
    choice('filter', 'Expertise', [option('All', 'All expertise'), option('Accessibility', 'Accessibility'), option('Product', 'Product'), option('Customer', 'Customer')])
  ], { primaryView: 'summary', filter: 'All', density: 'comfortable', maxItems: 5, showSource: true, showImages: true }, ['density', 'maxItems', 'showSource', 'showImages'], 'Visible people', 1, 8),
  onboarding: define([
    choice('primaryView', 'View', [option('summary', 'Next step'), option('list', 'Journey checklist'), option('detail', 'Current step')]),
    choice('scope', 'Journey', [option('Current', 'Current journey'), option('First week', 'First week'), option('All', 'All steps')])
  ], { primaryView: 'summary', scope: 'Current', density: 'comfortable', maxItems: 5, showSource: true }, undefined, 'Visible steps', 1, 8),
  learning: define([
    choice('primaryView', 'View', [option('overview', 'Next required'), option('collection', 'Assignment list')]),
    choice('filter', 'Learning', [option('Required', 'Required'), option('In progress', 'In progress'), option('All', 'All learning')])
  ], { primaryView: 'overview', filter: 'Required', density: 'comfortable', maxItems: 3, showSource: true, allowActions: true }, ['density', 'maxItems', 'showSource', 'allowActions'], 'Visible assignments', 1, 8),
  recognition: define([
    choice('primaryView', 'View', [option('story', 'Recognition story'), option('compose', 'Send praise')]),
    choice('scope', 'Audience', [option('Company', 'Company'), option('My teams', 'My teams'), option('Following', 'Following')])
  ], { primaryView: 'story', scope: 'Company', density: 'comfortable', maxItems: 4, showSource: true, showImages: true, allowActions: true }, ['density', 'maxItems', 'showSource', 'showImages', 'allowActions'], 'Visible stories', 1, 8),
  surveys: define([
    choice('primaryView', 'View', [option('summary', 'Active survey'), option('list', 'Survey history'), option('detail', 'Current results')]),
    choice('filter', 'Surveys', [option('Active', 'Active'), option('Completed', 'Completed'), option('All', 'All surveys')])
  ], { primaryView: 'summary', filter: 'Active', density: 'comfortable', maxItems: 3, showSource: true, allowActions: true }, ['density', 'maxItems', 'showSource', 'allowActions'], 'Visible surveys', 1, 6),
  timeOff: define([
    choice('primaryView', 'View', [option('summary', 'Balance'), option('list', 'Requests'), option('detail', 'New request')]),
    choice('scope', 'Period', [option('Current year', 'Current year'), option('Upcoming', 'Upcoming leave'), option('History', 'History')])
  ], { primaryView: 'summary', scope: 'Current year', density: 'comfortable', maxItems: 4, showSource: true, allowActions: true }, ['density', 'maxItems', 'showSource', 'allowActions'], 'Visible requests', 1, 8),
  payDocuments: define([
    choice('primaryView', 'View', [option('summary', 'Latest document'), option('list', 'Document list'), option('detail', 'Latest detail')]),
    choice('scope', 'Year', [option('2026', '2026'), option('2025', '2025'), option('All', 'All years')])
  ], { primaryView: 'summary', scope: '2026', density: 'comfortable', maxItems: 4, showSource: true }, undefined, 'Visible documents', 1, 8),
  benefits: define([
    choice('primaryView', 'View', [option('summary', 'Benefits overview'), option('list', 'Plan list'), option('detail', 'Next action')]),
    choice('scope', 'Context', [option('Current', 'Current benefits'), option('Life event', 'Life event'), option('Enrollment', 'Enrollment')])
  ], { primaryView: 'summary', scope: 'Current', density: 'comfortable', maxItems: 5, showSource: true }, undefined, 'Visible benefits', 1, 8),
  equity: define([
    choice('primaryView', 'View', [option('summary', 'Equity summary'), option('list', 'Grant table'), option('detail', 'Next vest')]),
    choice('scope', 'Period', [option('Next quarter', 'Next quarter'), option('This year', 'This year'), option('All', 'All grants')])
  ], { primaryView: 'summary', scope: 'Next quarter', density: 'comfortable', maxItems: 5, showSource: true }, undefined, 'Visible grants', 1, 8),
  expensesTravel: define([
    choice('primaryView', 'View', [option('summary', 'Draft summary'), option('list', 'Claim list'), option('detail', 'Current claim')]),
    choice('filter', 'Claims', [option('Draft', 'Draft'), option('Returned', 'Returned'), option('Submitted', 'Submitted')])
  ], { primaryView: 'summary', filter: 'Draft', density: 'comfortable', maxItems: 5, showSource: true, allowActions: true }, ['density', 'maxItems', 'showSource', 'allowActions'], 'Visible claims', 1, 8),
  campusMenu: define([
    choice('location', 'Campus', [option('Redmond', 'Redmond'), option('Helsinki', 'Helsinki'), option('Singapore', 'Singapore')])
  ], { primaryView: 'summary', location: 'Helsinki', density: 'comfortable', maxItems: 3, showSource: true, showImages: true }, ['density', 'showSource', 'showImages'], 'Visible meals', 1, 3),
  workplaceSpace: define([
    choice('primaryView', 'View', [option('summary', 'Available spaces'), option('list', 'Space list'), option('detail', 'Best match')]),
    choice('filter', 'Space type', [option('All', 'Rooms + desks'), option('Rooms', 'Rooms'), option('Desks', 'Desks')])
  ], { primaryView: 'summary', filter: 'All', density: 'comfortable', maxItems: 6, showSource: true, allowActions: true }, ['location', 'density', 'maxItems', 'showSource', 'allowActions'], 'Visible spaces', 1, 8),
  itHelp: define([
    choice('primaryView', 'View', [option('summary', 'Service status'), option('list', 'My requests'), option('detail', 'Open ticket')]),
    choice('filter', 'Requests', [option('Open', 'Open'), option('Resolved', 'Resolved'), option('All', 'All requests')])
  ], { primaryView: 'summary', filter: 'Open', density: 'comfortable', maxItems: 5, showSource: true, allowActions: true }, ['density', 'maxItems', 'showSource', 'allowActions'], 'Visible requests', 1, 8),
  workplaceHelp: define([
    choice('primaryView', 'View', [option('summary', 'Local help'), option('list', 'My requests'), option('detail', 'Report issue')]),
    choice('filter', 'Help type', [option('Facilities', 'Facilities'), option('Safety', 'Safety'), option('All', 'All services')])
  ], { primaryView: 'summary', filter: 'Facilities', location: 'Helsinki', density: 'comfortable', maxItems: 5, showSource: true, allowActions: true }, ['location', 'density', 'maxItems', 'showSource', 'allowActions'], 'Visible requests', 1, 8),
  shifts: define([
    choice('primaryView', 'View', [option('summary', 'Next shift'), option('list', 'Week schedule'), option('detail', 'Shift detail')]),
    choice('scope', 'Period', [option('Today', 'Today'), option('This week', 'This week'), option('Next week', 'Next week')])
  ], { primaryView: 'summary', scope: 'Today', density: 'comfortable', maxItems: 5, showSource: true, allowActions: true }, ['density', 'maxItems', 'showSource', 'allowActions'], 'Visible shifts', 1, 8),
  projectHealth: define([
    choice('scope', 'Default project', [option('aurora', 'Project Aurora'), option('lab', 'Helsinki lab launch'), option('support', 'Support insight program')])
  ], { primaryView: 'summary', scope: 'aurora', density: 'comfortable', maxItems: 3, showSource: true }, ['density', 'showSource'], 'Visible projects', 1, 3),
  salesPerformance: define([
    choice('filter', 'Region', [option('EMEA', 'EMEA'), option('Americas', 'Americas'), option('APAC', 'APAC')]),
    choice('scope', 'Period', [option('Q1 FY27', 'Q1 FY27'), option('Q4 FY26', 'Q4 FY26'), option('Trailing 12 months', 'Trailing 12 months')])
  ], { primaryView: 'summary', scope: 'Q1 FY27', filter: 'EMEA', density: 'comfortable', maxItems: 4, showSource: true }, ['density', 'showSource'], 'Visible metrics', 1, 4),
  goalsScorecards: define([
    choice('scope', 'Reporting period', [option('Q1 FY27', 'Q1 FY27'), option('FY27', 'FY27'), option('Q4 FY26', 'Q4 FY26')])
  ], { primaryView: 'summary', scope: 'Q1 FY27', density: 'comfortable', maxItems: 3, showSource: true }, ['density', 'showSource'], 'Visible goals', 1, 3),
  workFiles: define([
    choice('primaryView', 'View', [option('summary', 'Recent files'), option('list', 'File list'), option('detail', 'Top result')]),
    choice('filter', 'Files', [option('Recent', 'Recent'), option('Pinned', 'Pinned'), option('Curated', 'Curated')])
  ], { primaryView: 'summary', filter: 'Recent', density: 'comfortable', maxItems: 5, showSource: true }, undefined, 'Visible files', 1, 8),
  teamAvailability: define([
    choice('primaryView', 'View', [option('summary', 'Coverage summary'), option('list', 'Team list'), option('detail', 'Top action')]),
    choice('scope', 'Team', [option('Direct team', 'Direct team'), option('Extended team', 'Extended team'), option('My site', 'My site')])
  ], { primaryView: 'summary', scope: 'Direct team', density: 'comfortable', maxItems: 6, showSource: true }, undefined, 'Visible people', 1, 8),
  companyStock: define([
    choice('scope', 'Default period', [option('1W', '1 week'), option('1M', '1 month'), option('3M', '3 months'), option('YTD', 'Year to date'), option('1Y', '1 year')])
  ], { primaryView: 'summary', scope: '1M', density: 'comfortable', maxItems: 5, showSource: true }, ['density', 'showSource'], 'Visible points', 1, 8),
  glossary: define([
    choice('primaryView', 'Featured term', [option('cxr', 'CXR'), option('aurora', 'Aurora'), option('one-zava', 'One Zava')]),
    choice('filter', 'Domain', [option('All', 'All domains'), option('Customer experience', 'Customer experience'), option('Product', 'Product'), option('Company', 'Company')])
  ], { primaryView: 'cxr', filter: 'All', density: 'comfortable', maxItems: 6, showSource: true }, ['maxItems', 'showSource'], 'Visible terms', 1, 8),
  securityReporting: define([
    choice('primaryView', 'Start in', [option('guidance', 'Reporting guidance'), option('report', 'Report concern')]),
    choice('filter', 'Concern', [option('Suspicious message', 'Suspicious message'), option('Lost device', 'Lost device'), option('Account concern', 'Account concern'), option('Other', 'Other')])
  ], { primaryView: 'guidance', filter: 'Suspicious message', density: 'comfortable', maxItems: 4, showSource: true, allowActions: true }, ['showSource', 'allowActions'], 'Visible reports', 1, 8),
  officeDetails: define([
    choice('primaryView', 'View', [option('map', 'World map'), option('list', 'Office list'), option('detail', 'Preferred office')]),
    choice('scope', 'Region', [option('All', 'All regions'), option('Americas', 'Americas'), option('Europe', 'Europe'), option('Asia', 'Asia')])
  ], { primaryView: 'map', scope: 'All', location: 'Helsinki', density: 'comfortable', maxItems: 6, showSource: true }, ['location', 'density', 'maxItems', 'showSource'], 'Visible offices', 1, 8),
  vacationApprovals: define([
    choice('primaryView', 'View', [option('queue', 'Decision queue'), option('compact', 'Compact queue'), option('processed', 'Processed')]),
    choice('filter', 'Status', [option('Pending', 'Pending'), option('Processed', 'Processed'), option('All', 'All requests')])
  ], { primaryView: 'queue', filter: 'Pending', density: 'comfortable', maxItems: 6, showSource: true, allowActions: true }, ['density', 'maxItems', 'showSource', 'allowActions'], 'Visible requests', 1, 8)
};

const workspaceConfiguration = define([
  choice('primaryView', 'Start in', [option('company', 'Company'), option('personal', 'Personal')]),
  choice('density', 'Density', densityOptions)
], { primaryView: 'company', density: 'comfortable', maxItems: 8, showSource: true, showAgenda: true, showTasks: true, showMail: true, showLearning: true, showCompanyHighlights: true, showPlanMyDay: true }, ['showSource', 'showAgenda', 'showTasks', 'showMail', 'showLearning', 'showCompanyHighlights', 'showPlanMyDay'], 'Visible modules', 1, 8);

export function getWebPartConfiguration(intentKey: string): IZavaWebPartConfigurationDefinition | undefined {
  return intentKey === 'workspace' ? workspaceConfiguration : zavaWebPartConfigurations[intentKey];
}

export function getConfigurationDefault(
  definition: IZavaWebPartConfigurationDefinition,
  property: ZavaWebPartProperty
): string | number | boolean | undefined {
  return definition.defaults[property];
}