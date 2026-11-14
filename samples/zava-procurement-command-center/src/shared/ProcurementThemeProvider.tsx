import * as React from 'react';
import { FluentProvider, IdPrefixProvider, createDarkTheme, createLightTheme, type BrandVariants } from '@fluentui/react-components';
import { createDOMRenderer, makeStyles, RendererProvider } from '@griffel/react';

const brand:BrandVariants={10:'#28120B',20:'#401C0B',30:'#5B250C',40:'#76300D',50:'#91390B',60:'#AC440E',70:'#C45113',80:'#DC611B',90:'#F17826',100:'#F5914E',110:'#FAA978',120:'#FBC19D',130:'#FCD5BA',140:'#FDE4D5',150:'#FFF2E9',160:'#FFFAF6'};
const light=createLightTheme(brand);
const dark=createDarkTheme(brand);
light.colorBrandForeground1='#91390B'; light.colorBrandBackground='#AC440E'; light.colorBrandBackground2='#FFF2E9';
light.colorNeutralBackground2='#F8F7F5'; light.colorNeutralBackground3='#F2EFEB';
dark.colorBrandForeground1='#FAA978'; dark.colorBrandBackground='#AC440E'; dark.colorBrandBackground2='#3D231B';
const useStyles=makeStyles({
  root:{
    width:'100%',minWidth:0,backgroundColor:'transparent',
    '--zava-orange':'#F17826', '--zava-magenta':'#D43B77', '--zava-ink':'#201C23',
    '--zava-hero-ink':'#39212D', '--zava-white':'#FFFFFF'
  }
});

const Inner:React.FunctionComponent<React.PropsWithChildren<{readonly darkMode:boolean;readonly targetDocument:Document}>>=({darkMode,targetDocument,children})=>{
  const styles=useStyles();
  return <IdPrefixProvider value="zpc-"><FluentProvider className={styles.root} targetDocument={targetDocument} theme={darkMode?dark:light}>{children}</FluentProvider></IdPrefixProvider>;
};
const ProcurementThemeProvider:React.FunctionComponent<React.PropsWithChildren<{readonly theme?:string;readonly targetDocument:Document}>>=({theme,targetDocument,children})=>{
  const renderer=React.useMemo(()=>createDOMRenderer(targetDocument),[targetDocument]);
  return <RendererProvider renderer={renderer} targetDocument={targetDocument}><Inner darkMode={theme==='dark'} targetDocument={targetDocument}>{children}</Inner></RendererProvider>;
};
export default ProcurementThemeProvider;