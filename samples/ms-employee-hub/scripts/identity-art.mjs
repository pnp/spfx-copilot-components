import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {createElement} = require('react'), {renderToStaticMarkup} = require('react-dom/server');
const fluent = require('@fluentui/react-icons');
export const colors = {hub:'#274993', company:'#086576', hr:'#69479c', tech:'#175ca1', business:'#17694d', agent:'#424297', cowork:'#73438a'};
const marks = {
  CompanyEvents:'CalendarClock', CompanyNews:'News', SalesMarketMap:'Earth', RoomBooking:'ConferenceRoom', PolicyGuidance:'BookSearch',
  GrowthActionPlan:'ClipboardTaskAdd', ForecastBridge:'BranchCompare', SalesPerformance:'DataBarVertical', LeadConversionFlow:'DataFunnel',
  RequiredLearning:'HatGraduation', BenefitsReview:'HeartPulse', MyPayslip:'ReceiptMoney', MyVesting:'CalendarStar', LeaveBalance:'CalendarLtr',
  TimeOffRequest:'CalendarEdit', TeamCoverage:'PeopleTeam', LeaveApprovals:'CalendarCheckmark', HRSupport:'PersonSupport',
  MyDevices:'Laptop', ServiceHealth:'Pulse', TechGuides:'WrenchScrewdriver', ITTicketIntake:'DesktopPulse', MyITRequests:'ChatMultiple',
  EquipmentRequest:'Box', EquipmentApprovals:'DocumentCheckmark', SupportTrends:'ArrowTrendingLines', SupportFlow:'Flow',
  AppAccessRequest:'Key', HubCapabilities:'BookCompass', EmployeeHubWorkspace:'WindowApps',
  MicrosoftHomeWorkspace:'BuildingMultiple', HRwebWorkspace:'PersonHome', TechWebWorkspace:'DesktopToolbox', BusinessSLTWorkspace:'ChartMultiple'
};
export const appMarks = {agent:'ChatSparkle', hub:'LayoutCellFour', company:'Building', hr:'PeopleCommunity', tech:'Headset', business:'DataBarVerticalAscending', cowork:'PlugConnected'};
const cache=new Map();
function glyph(name,weight) {
  const key=`${name}24${weight}`;
  if(!fluent[key])throw Error(`Missing Fluent UI glyph: ${key}`);
  if(!cache.has(key)){
    const markup=renderToStaticMarkup(createElement(fluent[key]));
    cache.set(key,markup.slice(markup.indexOf('>')+1,markup.lastIndexOf('</svg>')));
  }
  return cache.get(key);
}
const fold='<path fill="#fff" opacity=".22" d="M37 0h27v27z"/><path fill="#fff" opacity=".6" d="M52 0h12v12z"/>';
export function appSvg(key,outline=false) {
  const ink=glyph(appMarks[key],outline?'Regular':'Filled');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${outline?32:192}" height="${outline?32:192}" viewBox="0 0 64 64">${outline?'':`<rect width="64" height="64" fill="${colors[key]}"/>${fold}`}<g transform="${outline?'translate(4 4) scale(2.33333)':'translate(14 14) scale(1.5)'}" color="#fff" fill="#fff">${ink}</g></svg>`;
}
export function webPartIcon(part) {
  const name=part.landing?.part||part.row.part,group=part.landing?.landing||(part.row.workspace==='isolated'||part.row.id===30?'hub':part.row.workspace);
  const color=colors[group],ink=glyph(marks[name],'Regular');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="1" y="1" width="62" height="62" rx="11" fill="#fff" stroke="#cad2df" stroke-width="2"/><path fill="${color}" d="M39 1h13a11 11 0 0 1 11 11v13z"/><path fill="#fff" opacity=".55" d="M51 2h2a9 9 0 0 1 9 9v2z"/><g transform="translate(9 12) scale(1.7)" color="${color}" fill="${color}">${ink}</g></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
