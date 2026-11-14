export type ProjectStatus = 'onTrack' | 'atRisk' | 'blocked' | 'done';

export interface IProject {
  id: string;
  title: string;
  owner: string;
  status: ProjectStatus;
  /** Due date in the YYYY-MM-DD format. */
  dueDate: string;
  summary: string;
}

/**
 * Mock records bundled with the component. The component makes no
 * network calls. The second title is long on purpose, to show how a
 * card wraps text in a narrow container.
 */
export const PROJECTS: ReadonlyArray<IProject> = [
  {
    id: 'p1',
    title: 'Intranet redesign',
    owner: 'Megan Bowen',
    status: 'onTrack',
    dueDate: '2026-10-15',
    summary: 'Move the intranet home page and the five department sites to the new layout.'
  },
  {
    id: 'p2',
    title: 'Expense policy update for the 2027 fiscal year and regional subsidiaries',
    owner: 'Adele Vance',
    status: 'atRisk',
    dueDate: '2026-10-30',
    summary: 'Legal review of the travel section is two weeks late.'
  },
  {
    id: 'p3',
    title: 'Vendor onboarding portal',
    owner: 'Alex Wilber',
    status: 'blocked',
    dueDate: '2026-11-12',
    summary: 'Waiting for the security assessment of the document upload service.'
  },
  {
    id: 'p4',
    title: 'Quarterly business review',
    owner: 'Lidia Holloway',
    status: 'done',
    dueDate: '2026-09-18',
    summary: 'The review deck and the action list were sent to the leadership team.'
  },
  {
    id: 'p5',
    title: 'Device refresh',
    owner: 'Nestor Wilke',
    status: 'onTrack',
    dueDate: '2026-12-01',
    summary: 'Replace 240 laptops that are older than four years.'
  },
  {
    id: 'p6',
    title: 'Security awareness training',
    owner: 'Isaiah Langer',
    status: 'atRisk',
    dueDate: '2026-11-20',
    summary: 'Completion is at 61 percent. The target is 95 percent.'
  },
  {
    id: 'p7',
    title: 'Records retention cleanup',
    owner: 'Joni Sherman',
    status: 'onTrack',
    dueDate: '2027-01-15',
    summary: 'Apply retention labels to the finance and legal document libraries.'
  },
  {
    id: 'p8',
    title: 'New hire onboarding',
    owner: 'Pradeep Gupta',
    status: 'done',
    dueDate: '2026-09-05',
    summary: 'The onboarding checklist and the welcome site are live.'
  }
];
