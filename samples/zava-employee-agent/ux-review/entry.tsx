import * as React from 'react';
import { createRoot } from 'react-dom/client';

import HomeInline from '../src/copilotComponents/getMyHrDashboard/components/HomeInline';
import HomeThemeProvider from '../src/copilotComponents/getMyHrDashboard/components/HomeThemeProvider';
import ZavaDashboardShell from '../src/copilotComponents/getMyHrDashboard/components/ZavaDashboardShell';
import type { HomeView } from '../src/copilotComponents/getMyHrDashboard/normalizeHomeProperties';
import { normalizeHomeProperties } from '../src/copilotComponents/getMyHrDashboard/normalizeHomeProperties';
import { PolicyInline } from '../src/copilotComponents/policyAnswer/PolicyExperience';
import { normalizePolicyAnswerProperties } from '../src/copilotComponents/policyAnswer/PolicyAnswerCopilotComponentProperties';
import { normalizePolicyComparisonProperties } from '../src/copilotComponents/policyComparison/PolicyComparisonCopilotComponentProperties';
import { ConfiguredFamilyInline } from '../src/copilotComponents/shared/experiences/ConfiguredFamilyExperience';
import { getFamilyExperience } from '../src/copilotComponents/shared/experiences/familyExperienceCatalog';
import { isZavaFamilyId, ZAVA_FAMILIES, type ZavaFamilyId } from '../src/copilotComponents/shared/models/families';
import { MockZavaEmployeeDataService } from '../src/copilotComponents/shared/services/MockZavaEmployeeDataService';
import EmployeeCapabilityExplorer from '../src/copilotComponents/exploreAgentCapabilities/components/EmployeeCapabilityExplorer';

type WidthMode = 'narrow' | 'standard' | 'wide' | 'keynote';
type DisplayMode = 'inline' | 'fullscreen';
type ThemeMode = 'light' | 'dark';

interface IReviewIntent {
  key: string;
  label: string;
  family: ZavaFamilyId;
  route: string;
  params?: Record<string, string | number | boolean | string[]>;
  homeView?: HomeView;
  policyKind?: 'answer' | 'comparison';
  explorer?: boolean;
}

const intents: ReadonlyArray<IReviewIntent> = [
  { key: 'getMyHrDashboard', label: 'My HR dashboard', family: 'home', route: 'home/summary', homeView: 'summary' },
  { key: 'getProfileHealth', label: 'Profile health', family: 'home', route: 'home/profile', homeView: 'profile' },
  { key: 'getNextBestActions', label: 'Next best actions', family: 'home', route: 'home/actions', homeView: 'actions' },
  { key: 'getWorklifeSnapshot', label: 'Worklife snapshot', family: 'home', route: 'home/timeline', homeView: 'timeline' },
  { key: 'getEmployeeMilestones', label: 'Employee milestones', family: 'home', route: 'home/milestones', homeView: 'milestones' },
  { key: 'policyAnswer', label: 'Policy answer', family: 'policy', route: 'policy/answer', policyKind: 'answer' },
  { key: 'policyComparison', label: 'Policy comparison', family: 'policy', route: 'policy/compare', policyKind: 'comparison' },
  { key: 'leaveBalance', label: 'Leave balance', family: 'time', route: 'time/balance' },
  { key: 'requestTimeOff', label: 'Request time off', family: 'time', route: 'time/request', params: { leaveType: 'vacation', startDate: '2027-08-04', endDate: '2027-08-12', reason: 'Family trip' } },
  { key: 'latestPay', label: 'Latest pay', family: 'money', route: 'money/latest' },
  { key: 'explainPayChange', label: 'Explain pay change', family: 'money', route: 'money/explain-change', params: { period: '2026-07', compareTo: '2026-06', includeDeductions: true } },
  { key: 'compareBenefitPlans', label: 'Compare benefit plans', family: 'benefits', route: 'benefits/compare', params: { coverageTier: 'employeeChildren', dependentCount: 2, priorities: ['deductible', 'dental'] } },
  { key: 'startLifeEvent', label: 'Start life event', family: 'benefits', route: 'benefits/life-event', params: { lifeEvent: 'birth', effectiveDate: '2026-09-01', dependentCount: 2 } },
  { key: 'createHrCase', label: 'Create private HR case', family: 'support', route: 'support/create', params: { category: 'payroll', subject: 'July deduction question', privacyLevel: 'sensitive' } },
  { key: 'requiredLearning', label: 'Required learning', family: 'learning', route: 'learning/required', params: { dueWithinDays: 14, includeOptional: false } },
  { key: 'totalRewardsSummary', label: 'Total rewards', family: 'rewards', route: 'rewards/summary', params: { year: 2026, currency: 'EUR', includeEquity: true, includeBenefitsValue: true } },
  { key: 'approvalInbox', label: 'Approval inbox', family: 'team', route: 'team/approvals', params: { approvalType: 'leave' } },
  { key: 'teamAbsenceCalendar', label: 'Team absence calendar', family: 'team', route: 'team/absence', params: { startDate: '2026-08-17', endDate: '2026-08-21' } },
  { key: 'findExpert', label: 'Find expert', family: 'people', route: 'people/expert', params: { expertise: 'accessibility for a customer keynote', location: 'Helsinki' } },
  { key: 'exploreOrganization', label: 'Explore organization', family: 'people', route: 'people/organization', params: { personId: 'megan-bowen', organizationId: 'customer-experience', depth: 3 } },
  { key: 'exploreAgentCapabilities', label: 'Explore employee features', family: 'home', route: 'education/features', explorer: true }
];

const query = new URLSearchParams(window.location.search);
const initialIntent = intents.find((item) => item.key === query.get('intent')) || intents[0];
const initialFamily = query.get('family');
const cleanCapture = query.get('clean') === '1';
const dataService = new MockZavaEmployeeDataService();

const widthPixels: Record<WidthMode, number> = {
  narrow: 340,
  standard: 760,
  wide: 980,
  keynote: 1440
};

const InlineExperience: React.FunctionComponent<{ intent: IReviewIntent; width: number; user: ReturnType<MockZavaEmployeeDataService['getEmployeeExperience']>['user'] }> = ({ intent, width, user }) => {
  const dimensions = { width, height: 900 };
  if (intent.explorer) return <EmployeeCapabilityExplorer />;
  if (intent.homeView) {
    return <HomeInline properties={normalizeHomeProperties({ view: intent.homeView })} propertiesVersion={1} currentUser={user} availableDisplayModes={['fullscreen']} containerDimensions={dimensions} onRequestFullscreen={() => undefined} fixedView={intent.homeView} />;
  }
  if (intent.policyKind === 'answer') {
    return <PolicyInline intent={{ kind: 'answer', properties: normalizePolicyAnswerProperties({ question: 'What parental leave applies to me in Finland?', jurisdiction: 'Finland', includeSources: true }) }} onRequestFullscreen={() => undefined} />;
  }
  if (intent.policyKind === 'comparison') {
    return <PolicyInline intent={{ kind: 'comparison', properties: normalizePolicyComparisonProperties({ topic: 'Parental leave', jurisdictions: ['Finland', 'Sweden'] }) }} onRequestFullscreen={() => undefined} />;
  }
  getFamilyExperience(intent.key);
  return <ConfiguredFamilyInline intentKey={intent.key} params={intent.params || {}} currentUser={user} onRequestFullscreen={() => undefined} />;
};

const ReviewHarness: React.FunctionComponent = () => {
  const [intentKey, setIntentKey] = React.useState(initialIntent.key);
  const [family, setFamily] = React.useState<ZavaFamilyId>(isZavaFamilyId(initialFamily || '') ? initialFamily as ZavaFamilyId : initialIntent.family);
  const [theme, setTheme] = React.useState<ThemeMode>(query.get('theme') === 'dark' ? 'dark' : 'light');
  const [width, setWidth] = React.useState<WidthMode>((['narrow', 'standard', 'wide', 'keynote'].includes(query.get('width') || '') ? query.get('width') : 'wide') as WidthMode);
  const [displayMode, setDisplayMode] = React.useState<DisplayMode>(query.get('mode') === 'fullscreen' ? 'fullscreen' : 'inline');
  const intent = intents.find((item) => item.key === intentKey) || intents[0];
  const user = React.useMemo(() => dataService.getEmployeeExperience(new Date('2026-08-21T09:00:00Z')).user, []);
  const pixels = widthPixels[width];

  React.useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    document.body.classList.toggle('clean', cleanCapture);
  }, [theme]);

  const selectIntent = (key: string): void => {
    const selected = intents.find((item) => item.key === key) || intents[0];
    setIntentKey(selected.key);
    setFamily(selected.family);
  };

  return (
    <>
      <div className="review-bar">
        <strong>Zava Employee Agent UX review</strong>
        <label>Intent<select aria-label="Intent" value={intentKey} onChange={(event) => selectIntent(event.target.value)}>{intents.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
        <label>Family<select aria-label="Family" value={family} onChange={(event) => setFamily(event.target.value as ZavaFamilyId)}>{ZAVA_FAMILIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Width<select aria-label="Host width" value={width} onChange={(event) => setWidth(event.target.value as WidthMode)}><option value="narrow">340 px</option><option value="standard">760 px</option><option value="wide">980 px</option><option value="keynote">1440 px</option></select></label>
        <label>Mode<select aria-label="Display mode" value={displayMode} onChange={(event) => setDisplayMode(event.target.value as DisplayMode)}><option value="inline">Inline</option><option value="fullscreen">Full screen</option></select></label>
        <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? 'Light' : 'Dark'} theme</button>
      </div>
      <main className="stage">
        <div className={`host ${width} ${displayMode}`} data-review-ready="true">
          <HomeThemeProvider theme={theme} targetDocument={document}>
            {displayMode === 'inline' || intent.explorer ? <InlineExperience intent={intent} width={pixels} user={user} /> : <ZavaDashboardShell properties={normalizeHomeProperties({ view: 'summary' })} propertiesVersion={1} currentUser={user} containerDimensions={{ width: pixels, height: 1000 }} initialFamily={family} initialRoute={intent.route} initialParams={intent.params} />}
          </HomeThemeProvider>
        </div>
      </main>
    </>
  );
};

const container = document.getElementById('root');
if (!container) {
  throw new Error('UX review root element is missing.');
}
createRoot(container).render(<ReviewHarness />);
