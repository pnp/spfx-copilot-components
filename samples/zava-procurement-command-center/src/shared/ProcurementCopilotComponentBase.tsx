import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BaseCopilotComponent, createCopilotTextContent } from '@microsoft/sp-copilot-component';
import ProcurementApp, { type IModelContextSnapshot } from './ProcurementApp';
import ProcurementThemeProvider from './ProcurementThemeProvider';
import { getIntent, type IProcurementProperties, type ProcurementIntentKey } from './catalog';

abstract class ProcurementCopilotComponentBase<T extends IProcurementProperties> extends BaseCopilotComponent<T>{
  protected abstract intentKey:ProcurementIntentKey;
  private root:Root|undefined;
  protected render():void{const definition=getIntent(this.intentKey);const canExpand=this.hostContext.displayMode!=='fullscreen'&&(this.hostContext.availableDisplayModes||[]).indexOf('fullscreen')>=0;const app=<ProcurementThemeProvider theme={String(this.hostContext.theme||'')} targetDocument={this.context.domElement.ownerDocument}><ProcurementApp definition={definition} properties={this.properties} currentUserName={this.context.pageContext.user.displayName||definition.role} displayMode={this.hostContext.displayMode} onRequestFullscreen={canExpand?this.expand:undefined} onUpdateModelContext={this.updateContext} onSendFollowUp={this.sendFollowUp}/></ProcurementThemeProvider>;if(!this.root)this.root=createRoot(this.context.domElement);this.root.render(app);}
  protected async onTeardown(reason?:string):Promise<void>{this.root?.unmount();this.root=undefined;await super.onTeardown(reason);}
  private expand=async():Promise<void>=>{await this.requestDisplayModeAsync('fullscreen');};
  private updateContext=async(value:IModelContextSnapshot):Promise<void>=>this.context.copilotBridge.updateModelContextAsync({content:[createCopilotTextContent(value.summary)],structuredContent:value});
  private sendFollowUp=async(message:string):Promise<boolean>=>{const result=await this.context.copilotBridge.sendFollowUpMessageAsync([createCopilotTextContent(message)]);return !result.isError;};
}
export default ProcurementCopilotComponentBase;