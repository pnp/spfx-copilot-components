import * as React from 'react';

import { FluentProvider } from '@fluentui/react-provider';
import { createDOMRenderer, RendererProvider } from '@griffel/react';
import { webDarkTheme, webLightTheme } from '@fluentui/react-theme';
import type { SPCopilotTheme } from '@microsoft/sp-copilot-component';

export interface IProjectThemeProviderProps {
  theme?: SPCopilotTheme;
  targetDocument?: Document;
  children?: React.ReactNode;
}

const ProjectThemeProvider: React.FunctionComponent<IProjectThemeProviderProps> = (props) => {
  const renderer = React.useMemo(
    () => createDOMRenderer(props.targetDocument),
    [props.targetDocument]
  );
  const [mountGeneration, setMountGeneration] = React.useState(0);

  React.useEffect(() => {
    setMountGeneration(1);
  }, []);

  return (
    <RendererProvider renderer={renderer} targetDocument={props.targetDocument}>
      <FluentProvider
        key={mountGeneration}
        theme={props.theme === 'dark' ? webDarkTheme : webLightTheme}
        targetDocument={props.targetDocument}
      >
        {props.children}
      </FluentProvider>
    </RendererProvider>
  );
};

export default ProjectThemeProvider;