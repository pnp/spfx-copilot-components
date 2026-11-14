import {
  createDefaultPersonalPortalLayout,
  movePersonalPortalPanel,
  normalizePersonalPortalLayout,
  personalPortalColumnIds
} from './personalPortalLayout';
import { zavaCapabilities } from '../catalog/capabilities';
import { companyPortalColumnAssignments, personalPortalColumnAssignments } from './workspacePortalDefaults';

const panels = ['agenda', 'mail', 'tasks', 'approvals', 'learning', 'expenses'];

describe('Personal portal layout', () => {
  test('distributes panels across three stable columns', () => {
    expect(createDefaultPersonalPortalLayout(panels)).toEqual({
      'personal-column-1': ['agenda', 'approvals'],
      'personal-column-2': ['mail', 'learning'],
      'personal-column-3': ['tasks', 'expenses']
    });
  });

  test('moves a panel across columns', () => {
    const layout = createDefaultPersonalPortalLayout(panels);
    expect(movePersonalPortalPanel(layout, 'approvals', 'mail')).toEqual({
      'personal-column-1': ['agenda'],
      'personal-column-2': ['approvals', 'mail', 'learning'],
      'personal-column-3': ['tasks', 'expenses']
    });
  });

  test('reorders a panel within one column', () => {
    const layout = createDefaultPersonalPortalLayout(panels);
    expect(movePersonalPortalPanel(layout, 'approvals', 'agenda')['personal-column-1']).toEqual(['approvals', 'agenda']);
  });

  test('repairs invalid persisted layouts and appends new panels', () => {
    expect(normalizePersonalPortalLayout({
      'personal-column-1': ['mail', 'unknown', 'mail'],
      'personal-column-2': ['agenda'],
      'personal-column-3': 'invalid'
    }, panels)).toEqual({
      'personal-column-1': ['mail', 'tasks', 'expenses'],
      'personal-column-2': ['agenda', 'approvals'],
      'personal-column-3': ['learning']
    });
  });

  test.each([
    ['company', companyPortalColumnAssignments, ['employeeServices', 'workplaceHelp']],
    ['personal', personalPortalColumnAssignments, ['timeOff', 'payDocuments']]
  ] as const)('uses the balanced %s defaults without dropping or duplicating panels', (tab, assignments, moved) => {
    const ids = zavaCapabilities.filter((capability) => capability.tab === tab && capability.intentKey !== 'myDay').map((capability) => capability.intentKey);
    const layout = createDefaultPersonalPortalLayout(ids, assignments);
    for (const id of moved) expect(layout['personal-column-3']).toContain(id);
    expect(personalPortalColumnIds.reduce<string[]>((all, column) => all.concat(layout[column]), []).sort()).toEqual([...ids].sort());
    expect(normalizePersonalPortalLayout(undefined, ids, assignments)).toEqual(layout);
  });

  test('preserves a saved layout instead of applying new default assignments', () => {
    const saved = createDefaultPersonalPortalLayout(panels);
    expect(normalizePersonalPortalLayout(saved, panels, { agenda: 'personal-column-3' })).toEqual(saved);
  });
});