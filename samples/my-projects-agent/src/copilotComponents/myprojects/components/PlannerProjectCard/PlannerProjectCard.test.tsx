jest.mock('@fluentui/react-components', () => ({
  Button: jest.fn(() => null),
  Card: ({ children }: { children: React.ReactNode }) => children,
  CardHeader: ({ action }: { action: React.ReactNode }) => action,
  tokens: {},
  webLightTheme: {},
}));
jest.mock('@fluentui/react-icons', () => ({
  ArrowExpand20Regular: () => null,
  Open20Regular: () => null,
}));
jest.mock('@iconify/react', () => ({ Icon: () => null }));
jest.mock('@spteck/react-controls-v2/stack-v2', () => ({
  StackV2: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@spteck/react-controls-v2/typography-control', () => ({
  TypographyControl: () => null,
}));
jest.mock('@spteck/react-controls-v2/custom-tooltip', () => ({
  CustomTooltip: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('../PlannerProjectStatusBadges/PlannerProjectStatusBadges', () => ({
  PlannerProjectStatusBadges: () => null,
}));

import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Button } from '@fluentui/react-components';
import { webLightTheme } from '@fluentui/react-components';
import type { IPlannerProjectCardProps } from '../../models';
import { PlannerProjectCard } from './PlannerProjectCard';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const act = (React as typeof React & {
  act: (callback: () => void | Promise<void>) => Promise<void>;
}).act;

describe('Planner project card actions', () => {
  it('places the encoded Planner web link before the independent expand action', async () => {
    const onOpen = jest.fn().mockResolvedValue(undefined);
    const props: IPlannerProjectCardProps = {
      dateLocale: 'en-US',
      onOpen,
      theme: webLightTheme,
      project: {
        id: 'plan/with?special#characters', title: 'Project Alpha', owner: 'group-1',
        tasks: [], activeTasks: 0, assignedToMeTasks: 0, completedTasks: 0,
        onHoldTaskIds: [], onHoldTasks: 0, overdueTasks: 0, totalTasks: 0, urgentTasks: 0,
      },
      strings: {
        OpenPlannerWebLabel: 'Open in Planner (web)',
        OpenProjectLabel: 'Open project in Planner',
      } as IPlannerProjectCardProps['strings'],
    };
    let renderer: Root | undefined;

    try {
      renderer = createRoot(document.createElement('div'));
      await act(async () => {
        renderer!.render(<PlannerProjectCard {...props} />);
      });
      const actions = jest.mocked(Button).mock.calls.map(([buttonProps]) => buttonProps);
      expect(actions).toHaveLength(2);
      expect(actions[0]).toMatchObject({
        as: 'a',
        href: 'https://planner.cloud.microsoft/webui/plan/plan%2Fwith%3Fspecial%23characters/view/board',
        target: '_blank',
        rel: 'noopener noreferrer',
        'aria-label': 'Open in Planner (web): Project Alpha',
      });
      expect(actions[0].onClick).toBeUndefined();
      expect(onOpen).not.toHaveBeenCalled();
      expect((actions[1] as { href?: string }).href).toBeUndefined();
      const expand = actions[1].onClick as () => Promise<void>;
      await act(async () => expand());
      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onOpen).toHaveBeenCalledWith(props.project);
    } finally {
      await act(async () => renderer?.unmount());
    }
  });
});
