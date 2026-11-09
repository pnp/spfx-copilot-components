import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ConfiguredFamilyDashboard, ConfiguredFamilyInline } from '../shared/experiences/ConfiguredFamilyExperience';
import { MockZavaEmployeeDataService } from '../shared/services/MockZavaEmployeeDataService';
import { normalizeRequestTimeOffProperties } from '../requestTimeOff/RequestTimeOffCopilotComponentProperties';

describe('Time experience', () => {
  test('renders leave composition and carryover guidance', () => {
    const markup = renderToStaticMarkup(<ConfiguredFamilyInline intentKey="leaveBalance" params={{}} />);
    expect(markup).toContain('data-family-intent="leaveBalance"');
    expect(markup).toContain('18 vacation days, 10 sick days, and 3 carryover days');
  });

  test('prefills request dates and keeps confirmation explicit', () => {
    const params = normalizeRequestTimeOffProperties({ startDate: '2027-08-04', endDate: '2027-08-12', reason: 'Family trip' });
    const markup = renderToStaticMarkup(<ConfiguredFamilyInline intentKey="requestTimeOff" params={params} />);
    expect(markup).toContain('2027-08-04');
    expect(markup).toContain('One calendar conflict');
    expect(markup).toContain('7 working days.');
    expect(markup).toContain('No request is submitted until you confirm.');
  });

  test('places full-width leave type before paired dates and full-width reason', () => {
    const markup = renderToStaticMarkup(<ConfiguredFamilyInline intentKey="requestTimeOff" params={{}} />);
    const fields: RegExpExecArray[] = [];
    const fieldPattern = /<label class="([^"]+)">.*?aria-label="([^"]+)".*?<\/label>/g;
    let field = fieldPattern.exec(markup);
    while (field) {
      fields.push(field);
      field = fieldPattern.exec(markup);
    }
    expect(fields.map((field) => field[2])).toEqual(['Leave type', 'Start date', 'End date', 'Reason']);
    expect(fields[0][1]).toBe(fields[3][1]);
    expect(fields[1][1]).toBe(fields[2][1]);
    expect(fields[0][1]).not.toBe(fields[1][1]);
  });

  test('renders an implemented Time dashboard', () => {
    const user = new MockZavaEmployeeDataService().getEmployeeExperience().user;
    const markup = renderToStaticMarkup(<ConfiguredFamilyDashboard family="time" user={user} />);
    expect(markup).toContain('data-family-view="time"');
    expect(markup).toContain('time/balance');
    expect(markup).toContain('time/request');
  });
});