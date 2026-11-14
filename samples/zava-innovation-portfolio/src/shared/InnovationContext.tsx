import * as React from 'react';
export interface IVisibleState {readonly intent:string;readonly state:string;readonly detail:string;}
export const InnovationContext=React.createContext<(state:IVisibleState)=>void>(()=>undefined);
export function useVisibleState(intent:string,state:string,detail:string):void{
  const publish=React.useContext(InnovationContext);
  React.useEffect(()=>{publish({intent,state,detail});},[publish,intent,state,detail]);
}
