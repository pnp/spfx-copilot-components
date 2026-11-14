import * as React from 'react';
import { createRoot } from 'react-dom/client';

import ProjectIntentApp from '../src/copilotComponents/shared/components/ProjectIntentApp';
import ProjectThemeProvider from '../src/copilotComponents/shared/components/ProjectThemeProvider';
import { PROJECT_INTENT_CATALOG } from '../src/copilotComponents/shared/mockData/intentCatalog';

type WidthMode = 'narrow' | 'standard' | 'wide' | 'keynote';
type DisplayMode = 'inline' | 'fullscreen';

const ReviewHarness: React.FunctionComponent = () => {
  const [intentKey, setIntentKey] = React.useState('GetMyWorkSummary');
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  const [width, setWidth] = React.useState<WidthMode>('standard');
  const [displayMode, setDisplayMode] = React.useState<DisplayMode>('inline');
  const definition = PROJECT_INTENT_CATALOG.find((item) => item.key === intentKey) || PROJECT_INTENT_CATALOG[0];
  const reviewProperties = intentKey === 'ReviewResourceAssignment' ? { projectId: 'PRJ-2601', personId: 'pradeep', allocationPercent: 20 } : {};

  React.useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <>
      <div className="review-bar">
        <strong>Zava UX review</strong>
        <label>
          Intent
          <select aria-label="Intent" value={intentKey} onChange={(event) => setIntentKey(event.target.value)}>
            {PROJECT_INTENT_CATALOG.map((item) => <option key={item.key} value={item.key}>{item.key}</option>)}
          </select>
        </label>
        <label>
          Width
          <select aria-label="Host width" value={width} onChange={(event) => setWidth(event.target.value as WidthMode)}>
            <option value="narrow">340 px</option>
            <option value="standard">760 px</option>
            <option value="wide">980 px</option>
            <option value="keynote">1360 px</option>
          </select>
        </label>
        <label>
          Mode
          <select aria-label="Display mode" value={displayMode} onChange={(event) => setDisplayMode(event.target.value as DisplayMode)}>
            <option value="inline">Inline</option>
            <option value="fullscreen">Full screen</option>
          </select>
        </label>
        <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? 'Light' : 'Dark'} theme</button>
      </div>
      <main className="stage">
        <div className={`host ${width}`}>
          <ProjectThemeProvider theme={theme} targetDocument={document}>
            <ProjectIntentApp
              definition={definition}
              properties={{ projectId: intentKey.indexOf('Project') >= 0 ? 'PRJ-2601' : undefined, ...reviewProperties }}
              currentUserName="Megan Bowen"
              containerWidth={width === 'narrow' ? 340 : width === 'wide' ? 980 : width === 'keynote' ? 1360 : 760}
              displayMode={displayMode}
              onRequestFullscreen={displayMode === 'inline' ? () => undefined : undefined}
            />
          </ProjectThemeProvider>
        </div>
      </main>
    </>
  );
};

const container = document.getElementById('root');
if (!container) {
  throw new Error('The UX review root element was not found.');
}
createRoot(container).render(<ReviewHarness />);
