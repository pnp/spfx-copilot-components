import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

import { makeStyles } from '@griffel/react';

import MyDayThemeProvider from './MyDayThemeProvider';

const useTestStyles = makeStyles({
  root: {
    display: 'grid'
  }
});

const StyledChild: React.FunctionComponent = () => {
  const styles = useTestStyles();
  return <div className={styles.root}>Styled in target document</div>;
};

describe('MyDayThemeProvider', () => {
  test('inserts Griffel styles into the supplied component document', () => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const targetDocument = iframe.contentDocument;
    if (!targetDocument) throw new Error('Test iframe document is unavailable.');
    const target = targetDocument.createElement('div');
    targetDocument.body.appendChild(target);

    const root = createRoot(target);
    act(() => {
      root.render(
        <MyDayThemeProvider targetDocument={targetDocument} theme="light">
          <StyledChild />
        </MyDayThemeProvider>
      );
    });

    expect(target.querySelector('[class]')).not.toBeNull();
    expect(
      targetDocument.head.querySelectorAll('style[data-make-styles-bucket]').length
    ).toBeGreaterThan(0);

    act(() => {
      root.unmount();
    });
    iframe.remove();
  });
});