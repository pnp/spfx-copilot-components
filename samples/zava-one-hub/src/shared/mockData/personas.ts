import { embeddedMedia } from '../media/embeddedMedia';
import type { IZavaPerson } from '../models/zavaOne';

export const zavaPeople: Readonly<Record<string, IZavaPerson>> = {
  megan: {
    id: 'person-megan', displayName: 'Megan Bowen', firstName: 'Megan', email: 'meganb@zava.example',
    jobTitle: 'Director, Customer Experience', department: 'Customer Experience', office: 'Seattle',
    managerId: 'person-patti', photoUrl: embeddedMedia.meganBowen
  },
  patti: {
    id: 'person-patti', displayName: 'Patti Fernandez', firstName: 'Patti', email: 'pattif@zava.example',
    jobTitle: 'Chief People Officer', department: 'People', office: 'New York',
    photoUrl: embeddedMedia.pattiFernandez
  },
  diego: {
    id: 'person-diego', displayName: 'Diego Siciliani', firstName: 'Diego', email: 'diegos@zava.example',
    jobTitle: 'Principal Product Manager', department: 'Product', office: 'Singapore',
    managerId: 'person-megan', photoUrl: embeddedMedia.diegoSiciliani
  },
  johanna: {
    id: 'person-johanna', displayName: 'Johanna Lorenz', firstName: 'Johanna', email: 'johannal@zava.example',
    jobTitle: 'Accessibility Program Lead', department: 'Design', office: 'Helsinki',
    managerId: 'person-megan', photoUrl: embeddedMedia.johannaLorenz
  },
  joni: {
    id: 'person-joni', displayName: 'Joni Sherman', firstName: 'Joni', email: 'jonis@zava.example',
    jobTitle: 'Senior Customer Engineer', department: 'Engineering', office: 'London',
    managerId: 'person-megan', photoUrl: embeddedMedia.joniSherman
  },
  nestor: {
    id: 'person-nestor', displayName: 'Nestor Wilke', firstName: 'Nestor', email: 'nestorw@zava.example',
    jobTitle: 'Workplace Experience Lead', department: 'Workplace', office: 'Seattle',
    managerId: 'person-patti', photoUrl: embeddedMedia.nestorWilke
  },
  pradeep: {
    id: 'person-pradeep', displayName: 'Pradeep Gupta', firstName: 'Pradeep', email: 'pradeepg@zava.example',
    jobTitle: 'Regional Sales Director', department: 'Sales', office: 'Singapore',
    managerId: 'person-megan', photoUrl: embeddedMedia.pradeepGupta
  },
  grady: {
    id: 'person-grady', displayName: 'Grady Archie', firstName: 'Grady', email: 'gradya@zava.example',
    jobTitle: 'Service Design Manager', department: 'Design', office: 'Helsinki',
    managerId: 'person-megan', photoUrl: embeddedMedia.gradyArchie
  },
  isaiah: {
    id: 'person-isaiah', displayName: 'Isaiah Langer', firstName: 'Isaiah', email: 'isaiahl@zava.example',
    jobTitle: 'Engineering Manager', department: 'Engineering', office: 'Seattle',
    managerId: 'person-megan', photoUrl: embeddedMedia.isaiahLanger
  },
  lee: {
    id: 'person-lee', displayName: 'Lee Gu', firstName: 'Lee', email: 'leeg@zava.example',
    jobTitle: 'Product Designer', department: 'Design', office: 'Singapore',
    managerId: 'person-megan', photoUrl: embeddedMedia.leeGu
  },
  miriam: {
    id: 'person-miriam', displayName: 'Miriam Graham', firstName: 'Miriam', email: 'miriamg@zava.example',
    jobTitle: 'Communications Director', department: 'Communications', office: 'New York',
    managerId: 'person-patti', photoUrl: embeddedMedia.miriamGraham
  }
};

const zavaPersonList: readonly IZavaPerson[] = [
  zavaPeople.megan,
  zavaPeople.patti,
  zavaPeople.diego,
  zavaPeople.johanna,
  zavaPeople.joni,
  zavaPeople.nestor,
  zavaPeople.pradeep,
  zavaPeople.grady,
  zavaPeople.isaiah,
  zavaPeople.lee,
  zavaPeople.miriam
];

export function getZavaPerson(id: string): IZavaPerson {
  const person = zavaPersonList.find((candidate: IZavaPerson) => candidate.id === id);
  return person || zavaPeople.megan;
}