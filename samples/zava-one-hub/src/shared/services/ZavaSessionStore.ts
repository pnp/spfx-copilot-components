import * as React from 'react';
import { initialVacationRequests } from '../mockData/vacationRequests';
import type { IVacationDecisionEvent, IVacationRequest, VacationDecision } from '../models/zavaOne';

const STORAGE_KEY = 'zava-one:vacation-requests:v1';

function cloneInitialRequests(): IVacationRequest[] {
  return initialVacationRequests.map((request) => ({
    ...request,
    history: request.history.map((event) => ({ ...event }))
  }));
}

function loadRequests(): IVacationRequest[] {
  try {
    const value = globalThis.sessionStorage?.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) as IVacationRequest[] : cloneInitialRequests();
  } catch {
    return cloneInitialRequests();
  }
}

class ZavaSessionStore {
  private _requests: readonly IVacationRequest[] = loadRequests();
  private readonly _listeners = new Set<() => void>();

  public getSnapshot = (): readonly IVacationRequest[] => this._requests;

  public subscribe = (listener: () => void): (() => void) => {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  };

  public decide(requestId: string, decision: VacationDecision, decidedBy: string, rationale?: string): IVacationDecisionEvent {
    const request = this._requests.find((candidate) => candidate.id === requestId);
    if (!request || request.status !== 'pending') {
      throw new Error('This vacation request is no longer awaiting a decision.');
    }
    if (decision === 'declined' && !rationale?.trim()) {
      throw new Error('Add a reason before declining this request.');
    }

    const event: IVacationDecisionEvent = {
      id: `decision-${request.id}-${request.revision + 1}`,
      decision,
      decidedAt: new Date().toISOString(),
      decidedBy,
      rationale: rationale?.trim() || undefined,
      reference: `ZAVA-LEAVE-${request.id.replace('vac-', '')}`
    };
    this._requests = this._requests.map((candidate) => candidate.id === requestId ? {
      ...candidate,
      status: decision,
      revision: candidate.revision + 1,
      history: [...candidate.history, event]
    } : candidate);
    this._commit();
    return event;
  }

  public reset(): void {
    this._requests = cloneInitialRequests();
    this._commit();
  }

  private _commit(): void {
    try {
      globalThis.sessionStorage?.setItem(STORAGE_KEY, JSON.stringify(this._requests));
    } catch {
      // The evented in-memory store remains functional in sandboxed hosts.
    }
    this._listeners.forEach((listener) => listener());
  }
}

export const zavaSessionStore = new ZavaSessionStore();

export function useVacationRequests(): readonly IVacationRequest[] {
  return React.useSyncExternalStore(
    zavaSessionStore.subscribe,
    zavaSessionStore.getSnapshot,
    zavaSessionStore.getSnapshot
  );
}