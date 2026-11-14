import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import InnovationApp from './PremiumInnovationApp';
import InnovationThemeProvider from './InnovationThemeProvider';
import { getIntent, type IInnovationProperties, type InnovationIntentKey } from './catalog';
import type { IVisibleState } from './InnovationContext';

abstract class InnovationCopilotComponentBase<TProperties extends IInnovationProperties> extends BaseCopilotComponent<TProperties> {
  protected abstract intentKey:InnovationIntentKey;
  private _root: Root | undefined;
  private _hostError: string | undefined;
  private _disposed=false;
  protected render():void {
    const definition=getIntent(this.intentKey);
    const canExpand=this.hostContext.displayMode!=='fullscreen'&&(this.hostContext.availableDisplayModes||[]).indexOf('fullscreen')>=0;
    if (!this._root) this._root = createRoot(this.context.domElement);
    this._root.render(React.createElement(InnovationThemeProvider,{theme:this.hostContext.theme,targetDocument:this.context.domElement.ownerDocument},
      React.createElement(InnovationApp,{definition,properties:this.properties,currentUserName:this.context.pageContext.user.displayName||definition.role,displayMode:this.hostContext.displayMode,onRequestFullscreen:canExpand?this._expand:undefined,onVisibleState:this._publish,hostError:this._hostError})));
  }
  protected async onTeardown(reason:string|undefined):Promise<void>{this._disposed=true;this._root?.unmount();this._root=undefined;await super.onTeardown(reason);}
  private _showError=(error:unknown):void=>{if(this._disposed)return;this._hostError=error instanceof Error?error.message:String(error);this.render();};
  private _publish=(state:IVisibleState):void=>{
    if(this._disposed)return;
    this.context.copilotBridge.updateModelContextAsync({structuredContent:{intent:state.intent,state:state.state,detail:state.detail,offline:true}}).catch((error:Error)=>this._showError(error));
  };
  private _expand=():void=>{
    this.requestDisplayModeAsync('fullscreen').then(result=>{
      if(result.mode!=='fullscreen')this._showError(new Error('The host did not grant full screen. Your draft remains inline.'));
    }).catch((error:Error)=>this._showError(error));
  };
}
export default InnovationCopilotComponentBase;