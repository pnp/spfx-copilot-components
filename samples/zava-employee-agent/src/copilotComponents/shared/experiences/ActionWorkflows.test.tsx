import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';

import { MockZavaEmployeeDataService } from '../services/MockZavaEmployeeDataService';
import { ConfiguredFamilyDashboard, ConfiguredFamilyInline } from './ConfiguredFamilyExperience';

const findButton = (container: HTMLElement, label: string): HTMLButtonElement => {
  const button = Array.from(container.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === label);
  if (!button) {
    throw new Error(`Expected button: ${label}`);
  }
  return button;
};

const click = (button: HTMLButtonElement): void => {
  act(() => { button.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
};

let root: Root;
const render = (element: React.ReactElement, _container: HTMLDivElement): void => {
  act(() => { root.render(element); });
};

describe('shared action workflows', () => {
  const user = new MockZavaEmployeeDataService().getEmployeeExperience().user;
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => { root.unmount(); });
    container.remove();
  });

  test.each(['inline', 'fullscreen'])('reviews and submits time off in %s mode', (mode) => {
    render(mode === 'inline'
      ? <ConfiguredFamilyInline intentKey="requestTimeOff" params={{ leaveType: 'vacation', startDate: '2027-08-04', endDate: '2027-08-12', reason: 'Family trip' }} />
      : <ConfiguredFamilyDashboard family="time" user={user} initialParams={{ leaveType: 'vacation', startDate: '2027-08-04', endDate: '2027-08-12', reason: 'Family trip' }} />, container);
    click(findButton(container, 'Review request'));
    expect(container.textContent).toContain('Review your time-off request');
    expect(container.textContent).toContain('Family trip');
    click(findButton(container, 'Submit for approval'));
    expect(container.textContent).toContain('Time-off request sent for approval');
    expect(container.textContent).toContain('PTO-2027-0812');
  });

  test.each(['inline', 'fullscreen'])('reviews and opens a private HR case in %s mode', (mode) => {
    const params = { category: 'payroll', privacyLevel: 'sensitive', subject: 'Private deduction question', description: 'Please review my July deduction.' };
    render(mode === 'inline'
      ? <ConfiguredFamilyInline intentKey="createHrCase" params={params} />
      : <ConfiguredFamilyDashboard family="support" user={user} initialParams={params} />, container);
    click(findButton(container, 'Review private case'));
    expect(container.textContent).toContain('Review your private HR case');
    expect(container.textContent).toContain('Please review my July deduction.');
    click(findButton(container, 'Open case with HR'));
    expect(container.textContent).toContain('Private HR case opened');
    expect(container.textContent).toContain('HR-2049');
  });

  test('reviews and approves a manager request inline', () => {
    render(<ConfiguredFamilyInline intentKey="approvalInbox" params={{ approvalType: 'leave' }} currentUser={user} />, container);
    const review = container.querySelector<HTMLButtonElement>('[aria-label="Review Lee Gu Vacation request"]');
    if (!review) {
      throw new Error('Expected Lee approval review action');
    }
    click(review);
    expect(container.textContent).toContain('Customer review · Aug 6');
    click(findButton(container, 'Approve'));
    expect(container.textContent).toContain('Confirm approval');
    click(findButton(container, 'Confirm approval'));
    expect(container.textContent).toContain('Vacation request approved');
  });

  test('reviews and declines a manager request full screen', () => {
    render(<ConfiguredFamilyDashboard family="team" user={user} />, container);
    const review = container.querySelector<HTMLButtonElement>('[aria-label="Review Lee Gu Vacation request"]');
    if (!review) {
      throw new Error('Expected Lee approval review action');
    }
    click(review);
    click(findButton(container, 'Decline'));
    expect(container.textContent).toContain('Reason shared with Lee Gu');
    click(findButton(container, 'Confirm decline'));
    expect(container.textContent).toContain('Vacation request declined');
  });
});