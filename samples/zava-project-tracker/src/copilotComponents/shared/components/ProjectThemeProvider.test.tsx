import * as React from 'react';
import { createRoot } from 'react-dom/client';

import { makeStyles } from '@griffel/react';

import ProjectThemeProvider from './ProjectThemeProvider';

const { act } = React;

const useTestStyles = makeStyles({
  root: {
    display: 'grid',
    color: 'red'
  }
});

const StyledChild: React.FunctionComponent = () => {
  const styles = useTestStyles();
  return <div className={styles.root}>Styled in target document</div>;
};

describe('ProjectThemeProvider', () => {
  test('inserts Griffel style buckets into the supplied component document', () => {
    const targetDocument = document.implementation.createHTMLDocument('Copilot iframe');
    const target = targetDocument.createElement('div');
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    targetDocument.body.appendChild(target);
    const root = createRoot(target);

    act(() => {
      root.render(
        <ProjectThemeProvider targetDocument={targetDocument} theme="light">
          <StyledChild />
        </ProjectThemeProvider>
      );
    });

    expect(target.querySelector('[class]')).not.toBeNull();
    expect(targetDocument.head.querySelectorAll('style[data-make-styles-bucket]').length).toBeGreaterThan(0);

    act(() => {
      root.unmount();
    });
    consoleError.mockRestore();
  });
});
