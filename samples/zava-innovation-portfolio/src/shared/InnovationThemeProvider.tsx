import * as React from 'react';
import { FluentProvider, IdPrefixProvider, webDarkTheme, webLightTheme } from '@fluentui/react-components';
import { createDOMRenderer, makeStyles, RendererProvider } from '@griffel/react';

const useStyles = makeStyles({ root:{ width:'100%', minWidth:0, backgroundColor:'transparent' } });
const InnovationFluentProvider:React.FunctionComponent<{readonly theme?:string;readonly targetDocument:Document;readonly children?:React.ReactNode}> = ({theme,targetDocument,children}) => {
  const styles=useStyles();
  return <IdPrefixProvider value="zih-"><FluentProvider targetDocument={targetDocument} theme={theme==='dark'?webDarkTheme:webLightTheme} className={styles.root}>{children}</FluentProvider></IdPrefixProvider>;
};
const InnovationThemeProvider:React.FunctionComponent<{readonly theme?:string;readonly targetDocument:Document;readonly children?:React.ReactNode}> = ({theme,targetDocument,children}) => {
  const renderer=React.useMemo(()=>createDOMRenderer(targetDocument),[targetDocument]);
  return <RendererProvider renderer={renderer} targetDocument={targetDocument}><InnovationFluentProvider theme={theme} targetDocument={targetDocument}>{children}</InnovationFluentProvider></RendererProvider>;
};
export default InnovationThemeProvider;