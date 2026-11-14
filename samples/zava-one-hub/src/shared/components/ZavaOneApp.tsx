import * as React from 'react';
import type { IZavaExperienceProps } from '../models/zavaOne';
import { ZavaThemeProvider } from '../theme/ZavaThemeProvider';
import { CatalogCapabilityExperience } from './CatalogCapabilityExperience';
import {
  CampusMenuExperience,
  CompanyEventsExperience,
  CompanyStockExperience,
  EmployeeSurveysExperience,
  GoalsScorecardsExperience,
  OfficeDetailsExperience,
  PeopleExperience,
  ProjectHealthExperience,
  SalesPerformanceExperience
} from './CompanyCapabilityExperiences';
import {
  AgendaExperience,
  GlossaryExperience,
  MyDayExperience,
  SecurityReportingExperience
} from './FocusedCapabilityExperiences';
import {
  ExpensesTravelExperience,
  ImportantMailExperience,
  PersonalLearningExperience,
  ShiftsExperience,
  TasksExperience,
  WorkFilesExperience
} from './PersonalDetailExperiences';
import {
  ApprovalsExperience,
  EquityExperience,
  ItHelpExperience,
  TimeOffExperience,
  WorkplaceSpaceExperience
} from './PersonalWorkflowExperiences';
import {
  CapabilityExplorerExperience,
  CompanyNewsExperience,
  RecognitionExperience,
  VacationApprovalsExperience,
  ZavaOneWorkspace
} from './ZavaOneExperiences';
import { ZavaErrorBoundary } from './ZavaErrorBoundary';

function FocusedExperience(props: IZavaExperienceProps): React.ReactElement {
  switch (props.intent) {
    case 'myDay':
      return <MyDayExperience {...props} />;
    case 'agenda':
      return <AgendaExperience {...props} />;
    case 'importantMail':
      return <ImportantMailExperience {...props} />;
    case 'tasks':
      return <TasksExperience {...props} />;
    case 'approvals':
      return <ApprovalsExperience {...props} />;
    case 'expensesTravel':
      return <ExpensesTravelExperience {...props} />;
    case 'timeOff':
      return <TimeOffExperience {...props} />;
    case 'equity':
      return <EquityExperience {...props} />;
    case 'workplaceSpace':
      return <WorkplaceSpaceExperience {...props} />;
    case 'itHelp':
      return <ItHelpExperience {...props} />;
    case 'shifts':
      return <ShiftsExperience {...props} />;
    case 'workFiles':
      return <WorkFilesExperience {...props} />;
    case 'companyEvents':
      return <CompanyEventsExperience {...props} />;
    case 'people':
      return <PeopleExperience {...props} />;
    case 'surveys':
      return <EmployeeSurveysExperience {...props} />;
    case 'campusMenu':
      return <CampusMenuExperience {...props} />;
    case 'projectHealth':
      return <ProjectHealthExperience {...props} />;
    case 'salesPerformance':
      return <SalesPerformanceExperience {...props} />;
    case 'goalsScorecards':
      return <GoalsScorecardsExperience {...props} />;
    case 'companyStock':
      return <CompanyStockExperience {...props} />;
    case 'officeDetails':
      return <OfficeDetailsExperience {...props} />;
    case 'glossary':
      return <GlossaryExperience {...props} />;
    case 'securityReporting':
      return <SecurityReportingExperience {...props} />;
    case 'companyNews':
      return <CompanyNewsExperience {...props} />;
    case 'learning':
      return <PersonalLearningExperience {...props} />;
    case 'recognition':
      return <RecognitionExperience {...props} />;
    case 'vacationApprovals':
      return <VacationApprovalsExperience {...props} />;
    case 'capabilities':
      return <CapabilityExplorerExperience {...props} />;
    case 'workspace':
      return <ZavaOneWorkspace {...props} />;
    default:
      return <CatalogCapabilityExperience {...props} />;
  }
}

export function ZavaOneApp(props: IZavaExperienceProps): React.ReactElement {
  const useWorkspace = props.surface === 'workspace' || props.displayMode === 'fullscreen';
  const resetKey = `${props.intent}|${props.surface}|${props.displayMode}|${props.workspaceMode}|${props.theme}`;

  return (
    <ZavaThemeProvider targetDocument={props.targetDocument} theme={props.theme}>
      <ZavaErrorBoundary resetKey={resetKey}>
        {useWorkspace
          ? <ZavaOneWorkspace {...props} surface="workspace" />
          : <FocusedExperience {...props} />}
      </ZavaErrorBoundary>
    </ZavaThemeProvider>
  );
}