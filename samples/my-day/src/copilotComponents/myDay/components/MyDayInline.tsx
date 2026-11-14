import * as React from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';
import type { SPCopilotTheme } from '@microsoft/sp-copilot-component';

import type { IMyDayCopilotComponentProperties } from '../MyDayCopilotComponentProperties';
import type { IMyDayData } from '../models/myDay';
import { fadeIn } from '../utils/motion';
import AgendaTimeline from './fullscreen/AgendaTimeline';
import TasksPanel from './fullscreen/TasksPanel';
import ImportantMail from './fullscreen/ImportantMail';
import { planMyDay } from '../services/planMyDay';
import InlineDetailHeader from './inline/InlineDetailHeader';
import InlineSummary from './inline/InlineSummary';
import NewsList from './inline/NewsList';
import type { InlineView } from './inline/views';

/**
 * Props for the {@link MyDayInline} view rendered when the host display mode is
 * `'inline'`.
 */
export interface IMyDayInlineProps extends IMyDayCopilotComponentProperties {
  view: InlineView;
  onViewChange: (view: InlineView) => void;
  data: IMyDayData;
  now: Date;
  onTaskToggle: (id: string) => void;
  /** Color theme advertised by the Copilot host. */
  theme?: SPCopilotTheme;
  /** Requests the host to switch the component into fullscreen. */
  onRequestFullscreen?: () => void;
}

const useStyles = makeStyles({
  surface: {
    width: '100%',
    boxSizing: 'border-box',
    minWidth: 0,
    padding: '12px',
    fontFamily: tokens.fontFamilyBase
  },
  enter: {
    animationName: fadeIn,
    animationDuration: tokens.durationSlow,
    animationTimingFunction: tokens.curveDecelerateMid,
    animationFillMode: 'both',
    '@media (prefers-reduced-motion: reduce)': {
      animationName: 'none',
      animationDuration: '1ms'
    }
  },
  plan: {
    padding: '16px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2
  }
});

/**
 * Inline display-mode view. Owns the local drill-down navigation state and
 * renders the time-aware summary plus meetings / tasks / news detail views. The
 * meetings and tasks drill-downs reuse the full-screen `AgendaTimeline` and
 * `TasksPanel` controls (news keeps its own inline listing). Theme is derived
 * from the host-advertised `theme` prop (never mirrored).
 */
const MyDayInline: React.FunctionComponent<IMyDayInlineProps> = (props) => {
  const styles = useStyles();
  const { data, now, onTaskToggle, onRequestFullscreen, view, onViewChange: setView } = props;

  const back = React.useCallback(() => setView('summary'), [setView]);

  let content: React.ReactNode;
  switch (view) {
    case 'plan': {
      const plan = planMyDay(data, now);
      content = <><InlineDetailHeader onBack={back} /><section className={styles.plan}>
        <h2>Plan my day</h2><p>{plan.headline}</p>
        <ol>{plan.items.map(item => <li key={item.id}><strong>{item.title}</strong><p>{item.reason}</p>{item.suggestedTime && <p>{item.suggestedTime}</p>}</li>)}</ol>
        <p>Read-only briefing generated locally from sample data. No meeting, task, or message was changed.</p>
      </section></>;
      break;
    }
    case 'mail':
      content = <><InlineDetailHeader onBack={back} /><ImportantMail mail={data.mail} now={now} /></>;
      break;
    case 'meetings':
      content = (
        <>
          <InlineDetailHeader onBack={back} />
          <AgendaTimeline meetings={data.meetings} now={now} />
        </>
      );
      break;
    case 'tasks':
      content = (
        <>
          <InlineDetailHeader onBack={back} />
          <TasksPanel tasks={data.tasks.filter(task => task.due?.toDateString() === now.toDateString())} now={now} onToggleTask={onTaskToggle} />
        </>
      );
      break;
    case 'news':
      content = <NewsList news={data.news} now={now} onBack={back} />;
      break;
    default:
      content = (
        <InlineSummary
          data={data}
          now={now}
          onNavigate={setView}
          onRequestFullscreen={onRequestFullscreen}
        />
      );
  }

  return (
    <div className={styles.surface} data-display-mode="inline" data-my-day-view={view}>
      {view === 'summary' ? (
        content
      ) : (
        <div key={view} className={styles.enter}>
          {content}
        </div>
      )}
    </div>
  );
};

export default MyDayInline;
