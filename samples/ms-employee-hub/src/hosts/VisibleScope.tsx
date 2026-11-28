import * as React from 'react';
import type { HubInputs } from '../shared/types';

export interface HubVisibleScope {
  entry: number;
  stage: 'information' | 'selection' | 'draft' | 'review' | 'receipt' | 'denied' | 'unavailable';
  route?: string;
  filters?: HubInputs;
  receipt?: string;
  evidence?: { numerator: number; denominator: number; sourceTotal?:number; unit: 'leads' | 'requests'; asOf?: string; selected?: string };
  forecast?: { priorCut:string; currentCut:string; priorUsd:number; currentUsd:number; movementUsd:number };
  page?: { first:number; last:number; total:number; selected?:number };
  progress?: { current:number; total:number; completed?:number };
  bookings?: { bookedUsd:number; planUsd:number; asOf:string };
  trend?: { weekStart:string; received:number; resolved:number };
  section?: string;
}
type Report = (scope: HubVisibleScope) => void;
export const ScopeReporter = React.createContext<Report | undefined>(undefined);
export function useHubVisibleScope(scope?: HubVisibleScope): void {
  const report = React.useContext(ScopeReporter);
  React.useLayoutEffect(() => { if (scope && report) report(scope); }, [scope, report]);
}
