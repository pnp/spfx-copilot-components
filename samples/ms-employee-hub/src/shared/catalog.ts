import type { Workspace } from './types';
import definitions from '../../config/hub-catalog.json';

export interface Capability {
  id: number;
  tool: string;
  part: string;
  workspace: Workspace | 'isolated';
  route: string;
  title: string;
  examplePrompt: string;
  description: string;
  negative: string;
  fields: string[];
  access: 'employee' | 'commercial' | 'planner' | 'reviewer';
  operation: 'inspect' | 'prepare' | 'decide' | 'explore' | 'open';
  discussion: 'visible-summary' | 'screen-only';
}
export const workspaceNames: Record<Workspace, string> = {company: 'Microsoft home', hr: 'HRweb', tech: 'TechWeb', business: 'Business'};
export const workspaces: Workspace[] = ['company', 'hr', 'tech', 'business'];
export function isWorkspace(value: unknown): value is Workspace {
  return workspaces.some(w => w === value);
}
export const catalog:readonly Capability[]=definitions.map(row=>{
  if(row.workspace!=='isolated'&&!isWorkspace(row.workspace))throw new Error(`Unknown workspace for ${row.tool}`);
  return {...row,workspace:row.workspace,
    access:row.id===6?'planner':row.workspace==='business'?'commercial':[17,25,26,27].includes(row.id)?'reviewer':'employee',
    operation:row.id===30?'open':row.id===29?'explore':[17,25].includes(row.id)?'decide':[4,6,15,18,22,24,28].includes(row.id)?'prepare':'inspect',
    discussion:[12,13,18,29,30].includes(row.id)?'screen-only':'visible-summary'};
});
