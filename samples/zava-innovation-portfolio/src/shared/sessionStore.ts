export interface ISessionReceipt {
  readonly id:string; readonly intent:string; readonly actor:string; readonly detail:string; readonly createdAt:string;
  readonly operation:string; readonly values:Readonly<Record<string,string|number>>;
}
let memory:readonly ISessionReceipt[]=[];
let sequence=0;
export const addReceipt=(intent:string,actor:string,detail:string,operation='gate-decision',values:Readonly<Record<string,string|number>>={}):ISessionReceipt=>{
  const receipt:ISessionReceipt={id:`ZIH-${++sequence}`,intent,actor,detail,operation,values:{...values},createdAt:new Date().toISOString()};
  memory=[...memory,receipt];
  return receipt;
};
export const getReceipts=():readonly ISessionReceipt[]=>memory;
export const resetReceipts=():void=>{memory=[];};