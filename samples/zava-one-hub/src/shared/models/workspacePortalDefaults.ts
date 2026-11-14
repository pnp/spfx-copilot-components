import type { PersonalPortalColumnId } from './personalPortalLayout';

export const companyPortalColumnAssignments: Readonly<Record<string, PersonalPortalColumnId>> = {
  employeeServices: 'personal-column-3',
  workplaceHelp: 'personal-column-3'
};

export const personalPortalColumnAssignments: Readonly<Record<string, PersonalPortalColumnId>> = {
  timeOff: 'personal-column-3',
  payDocuments: 'personal-column-3'
};
