import * as React from 'react';

import type { SPCopilotDisplayMode, SPCopilotTheme } from '@microsoft/sp-copilot-component';

import type { IMyDayCopilotComponentProperties } from '../MyDayCopilotComponentProperties';
import type { IUser, IMyDayModelSnapshot } from '../models/myDay';
import { MockMyDayDataService } from '../services/MockMyDayDataService';
import MyDayFullscreen, { type MyDayPanel } from './MyDayFullscreen';
import MyDayInline from './MyDayInline';
import MyDayThemeProvider from './MyDayThemeProvider';
import type { InlineView } from './inline/views';

/**
 * Props for the {@link MyDayApp} root React component.
 *
 * Tool inputs supplied by Copilot ({@link IMyDayCopilotComponentProperties}) are
 * spread in directly, while host state (theme, display mode) and host-driven
 * actions are passed alongside them. The component derives all of its UI from
 * these props — it never mirrors host state internally.
 */
export interface IMyDayAppProps extends IMyDayCopilotComponentProperties {
  /** Signed-in user resolved from the SPFx page context. */
  currentUser?: IUser;
  /** Color theme advertised by the Copilot host. */
  theme?: SPCopilotTheme;
  /** Document that owns the Copilot component's host element. */
  targetDocument?: Document;
  /** Container display mode advertised by the Copilot host. */
  displayMode?: SPCopilotDisplayMode;
  /** Display modes the host supports. */
  availableDisplayModes?: SPCopilotDisplayMode[];
  /** Requests the host to switch the component into fullscreen. */
  onRequestFullscreen?: () => void;
  onUpdateModelContext?: (snapshot: IMyDayModelSnapshot) => Promise<void>;
}

/**
 * Baseline root component rendered into the Copilot host DOM element.
 *
 * Selects the display-mode-specific view ({@link MyDayInline} or
 * {@link MyDayFullscreen}) from the host-advertised display mode.
 */
const MyDayApp: React.FunctionComponent<IMyDayAppProps> = (props) => {
  const { focus, currentUser, theme, targetDocument, displayMode, onRequestFullscreen } = props;
  const [view, setView] = React.useState<InlineView>(focus || 'summary');
  const [openPanel, setOpenPanel] = React.useState<MyDayPanel>(focus === 'plan' ? 'plan' : 'none');
  const [error, setError] = React.useState('');
  const lastSnapshot = React.useRef('');
  const now = React.useMemo(() => new Date(), []);
  const [snapshot, setSnapshot] = React.useState(() => new MockMyDayDataService().getMyDay(now));
  const data = React.useMemo(() => currentUser ? { ...snapshot, user: currentUser } : snapshot, [snapshot, currentUser]);
  const toggleTask = (id: string): void => {
    setSnapshot(previous => ({ ...previous, tasks: previous.tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task) }));
  };
  const remaining = data.tasks.filter(task => !task.completed && task.due?.toDateString() === now.toDateString()).length;
  const completed = data.tasks.filter(task => task.completed).length;
  const summary = `Mock daily cockpit: ${data.meetings.length} meetings, ${remaining} uncompleted tasks due today, ${completed} locally checked tasks, ${data.mail.length} sample messages. No calendar, task, or mail service was changed.`;
  React.useEffect(() => {
    const model: IMyDayModelSnapshot = {
      source: 'mock', mode: displayMode || 'inline', focus: displayMode === 'fullscreen' ? (openPanel === 'plan' ? 'plan' : 'summary') : view,
      panel: displayMode === 'fullscreen' ? openPanel : 'none', summary
    };
    const signature = JSON.stringify(model);
    if (signature === lastSnapshot.current) return;
    lastSnapshot.current = signature;
    let active = true;
    props.onUpdateModelContext?.(model).catch(reason => {
      if (active) setError(`Copilot context update failed: ${String(reason)}`);
    });
    return () => { active = false; };
  }, [displayMode, view, openPanel, summary, props.onUpdateModelContext]);

  const content =
    displayMode === 'fullscreen' ? (
      <MyDayFullscreen focus={focus} data={data} now={now} onTaskToggle={toggleTask} openPanel={openPanel} onPanelChange={setOpenPanel} theme={theme} />
    ) : (
      <MyDayInline
        focus={focus}
        view={view}
        onViewChange={setView}
        data={data}
        now={now}
        onTaskToggle={toggleTask}
        theme={theme}
        onRequestFullscreen={onRequestFullscreen}
      />
    );

  return (
    <MyDayThemeProvider theme={theme} targetDocument={targetDocument}>
      {error && <p role="alert">{error}</p>}
      {content}
    </MyDayThemeProvider>
  );
};

export default MyDayApp;
