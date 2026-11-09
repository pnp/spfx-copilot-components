import type { Expert, ExpertSkill } from '../models/Expert';
import alex from '../assets/alex.png';
import sam from '../assets/sam.png';
import jamie from '../assets/jamie.png';
import priya from '../assets/priya.png';
import daniel from '../assets/daniel.png';
import noor from '../assets/noor.png';
import leo from '../assets/leo.png';
import elena from '../assets/elena.png';

const people = [
  { displayName: 'Alex Morgan', jobTitle: 'Senior M365 Developer', department: 'Digital Workplace', photoUrl: alex,
    shortCV: 'Builds thoughtful Microsoft 365 experiences with SPFx and React. Loves turning complex requirements into simple, useful applications.' },
  { displayName: 'Sam Carter', jobTitle: 'Solution Architect', department: 'Enterprise Architecture', photoUrl: sam,
    shortCV: 'Connects SharePoint, Microsoft Graph and Azure to solve everyday business challenges. Helps teams choose practical architecture.' },
  { displayName: 'Jamie Taylor', jobTitle: 'M365 Consultant', department: 'Modern Work', photoUrl: jamie,
    shortCV: 'Helps organizations get more from Microsoft 365 through approachable solutions, thoughtful adoption and hands-on guidance.' },
  { displayName: 'Priya Shah', jobTitle: 'Frontend Engineer', department: 'Digital Workplace', photoUrl: priya,
    shortCV: 'Creates accessible interfaces with React, TypeScript and Fluent UI. Brings a careful eye for usability to every collaboration experience.' },
  { displayName: 'Daniel Kim', jobTitle: 'Platform Engineer', department: 'Engineering', photoUrl: daniel,
    shortCV: 'Builds reliable platforms and integrations. Enjoys helping developers ship useful extensions to Microsoft 365.' },
  { displayName: 'Noor Ahmed', jobTitle: 'Technical Consultant', department: 'Modern Work', photoUrl: noor,
    shortCV: 'Makes collaboration technology work for people. Guides teams from an early prototype to a clear and practical solution.' },
  { displayName: 'Leo Brooks', jobTitle: 'AI Solutions Lead', department: 'Innovation', photoUrl: leo,
    shortCV: 'Explores how Copilot and declarative agents can remove friction from daily work, with a focus on useful, responsible experiences.' },
  { displayName: 'Elena Rossi', jobTitle: 'Data Architect', department: 'Enterprise Architecture', photoUrl: elena,
    shortCV: 'Designs data solutions that people can trust. Helps teams connect business questions to well-structured information.' }
];

function records(skill: ExpertSkill, count: number): Expert[] {
  return people.slice(0, count).map((person, index) => ({ ...person, id: `${skill}-${index + 1}`, skill }));
}

// One record per person and primary skill. Some fictional people have more than one specialty.
export const mockExperts: readonly Expert[] = [
  ...records('SPFx', 6),
  ...records('Copilot', 8),
  { ...people[7], id: 'DB-1', skill: 'DB' }
];
