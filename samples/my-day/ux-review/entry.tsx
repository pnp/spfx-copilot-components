import * as React from 'react';
import { createRoot } from 'react-dom/client';
import MyDayApp from '../src/copilotComponents/myDay/components/MyDayApp';
import type { IMyDayCopilotComponentProperties } from '../src/copilotComponents/myDay/MyDayCopilotComponentProperties';

type Focus = NonNullable<IMyDayCopilotComponentProperties['focus']>;
interface IReviewState { focus: Focus; mode: 'inline' | 'fullscreen'; theme: 'light' | 'dark'; }
declare global {
  interface Window { __MY_DAY_REVIEW__: { render: (patch: Partial<IReviewState>) => void }; }
}
function isFocus(value: string): value is Focus {
  return value === 'summary' || value === 'meetings' || value === 'tasks' || value === 'news' || value === 'mail' || value === 'plan';
}
const query = new URLSearchParams(location.search);
const requestedFocus = query.get('focus') || 'summary';
if (!isFocus(requestedFocus)) throw new Error(`Unsupported review focus: ${requestedFocus}`);
let state: IReviewState = {
  focus: requestedFocus, mode: query.get('mode') === 'fullscreen' ? 'fullscreen' : 'inline',
  theme: query.get('theme') === 'dark' ? 'dark' : 'light'
};
const container = document.getElementById('root');
if (!container) throw new Error('My Day review root is missing.');
const root = createRoot(container);
function render(patch: Partial<IReviewState>): void {
  state = { ...state, ...patch };
  document.documentElement.style.colorScheme = state.theme;
  root.render(<MyDayApp key={state.focus} focus={state.focus} displayMode={state.mode} theme={state.theme}
    targetDocument={document} availableDisplayModes={['inline', 'fullscreen']}
    onRequestFullscreen={() => render({ mode: 'fullscreen' })} />);
}
window.__MY_DAY_REVIEW__ = { render };
render({});
