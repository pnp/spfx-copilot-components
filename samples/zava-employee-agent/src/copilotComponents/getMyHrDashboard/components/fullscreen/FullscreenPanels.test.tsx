import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { MockZavaEmployeeDataService } from '../../../shared/services/MockZavaEmployeeDataService';
import { DEFAULT_ZAVA_SETTINGS } from '../../../shared/utils/settings';
import { buildHrActionPlan } from '../../services/buildHrActionPlan';
import DestinationDetail from './DestinationDetail';
import MyHrActionPlanPanel from './MyHrActionPlanPanel';
import SettingsSummaryPanel from './SettingsSummaryPanel';

describe('fullscreen panels', () => {
  const now = new Date(2026, 7, 11, 12, 0, 0);
  const data = new MockZavaEmployeeDataService().getEmployeeExperience(now);
  const plan = buildHrActionPlan(data.signals, data.user, now, 'standard', false);

  test('renders the action plan in its initial thinking state with disclosure', () => {
    const markup = renderToStaticMarkup(
      <MyHrActionPlanPanel plan={plan} onDismiss={() => undefined} onNavigate={() => undefined} />
    );
    expect(markup).toContain('My HR action plan');
    expect(markup).toContain('Reviewing your HR signals...');
    expect(markup).toContain('No AI service is called');
  });

  test('uses dialog semantics for the mobile action-plan layer', () => {
    const markup = renderToStaticMarkup(
      <MyHrActionPlanPanel
        plan={plan}
        isModal
        onDismiss={() => undefined}
        onNavigate={() => undefined}
      />
    );
    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
  });

  test('renders the current session settings summary', () => {
    const markup = renderToStaticMarkup(
      <SettingsSummaryPanel
        settings={DEFAULT_ZAVA_SETTINGS}
        onSettingsChange={() => undefined}
        onToggleHomePanel={() => undefined}
        onDismiss={() => undefined}
      />
    );
    expect(markup).toContain('Currency');
    expect(markup).toContain('EUR');
    expect(markup).toContain('Privacy tier');
    expect(markup).toContain('Visible Home panels');
    expect(markup).toContain('type="checkbox"');
    expect(markup).toContain('stored for this browser session only');
  });

  test('disables the only visible panel so the layout cannot become empty', () => {
    const markup = renderToStaticMarkup(
      <SettingsSummaryPanel
        settings={{
          ...DEFAULT_ZAVA_SETTINGS,
          visibleHomePanels: ['actions']
        }}
        onSettingsChange={() => undefined}
        onToggleHomePanel={() => undefined}
        onDismiss={() => undefined}
      />
    );
    const container = document.createElement('div');
    container.innerHTML = markup;
    const checkedPanels = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked');
    expect(checkedPanels).toHaveLength(1);
    expect(checkedPanels[0].disabled).toBe(true);
    expect(checkedPanels[0].closest('label')?.textContent).toContain('Action center');
  });

  test('renders a grounded destination detail', () => {
    const signal = data.signals.find((candidate) => candidate.id === 'signal-learning-privacy');
    if (!signal) {
      throw new Error('Expected learning signal');
    }
    const markup = renderToStaticMarkup(
      <DestinationDetail
        destination={signal.destination}
        data={data}
        detailRef={React.createRef<HTMLDivElement>()}
        onDismiss={() => undefined}
      />
    );
    expect(markup).toContain('Finish privacy foundations');
    expect(markup).toContain('Grounded in Zava Learning assignment record');
    expect(markup).toContain('Back to Home dashboard');
  });
});