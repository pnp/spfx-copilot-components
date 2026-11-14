import { CONVERSATION_STARTERS } from './conversationStarters';
import { intentFromProperties } from './prefill';
import { createSession } from '../models/session';
import { MockDocumentStoreService } from '../services/MockDocumentStoreService';

/**
 * The gate's testable half: each starter maps to the intent its props imply,
 * and every starter that invokes the component lands on a non-empty state
 * against the mock seeds. The "a first-time user can tell what to ask for"
 * half is a human review (Kurt), recorded in todo.md.
 */

const NOW: Date = new Date(2026, 7, 18, 9, 0, 0);

describe('conversation starters (capability-education gate)', () => {
  it('offers the five the brief approved, in order', () => {
    expect(CONVERSATION_STARTERS.map(s => s.text)).toEqual([
      'File this invoice for the Programs team',
      'Upload these expense reports from last month',
      'What have I filed this week?',
      'Show recent filings for Finance that are still pending',
      'What information does an expense report need before I file it?'
    ]);
  });

  it('has exactly one prose (capability-education) starter, and it is last', () => {
    expect(CONVERSATION_STARTERS.filter(s => s.outcome === 'prose').length).toBe(1);
    expect(CONVERSATION_STARTERS[CONVERSATION_STARTERS.length - 1].outcome).toBe('prose');
  });

  it('routes every component starter to the intent its props imply', () => {
    for (const starter of CONVERSATION_STARTERS) {
      if (starter.outcome === 'prose') {
        continue;
      }
      expect(intentFromProperties(starter.props)).toBe(starter.outcome);
    }
  });

  it('lands every recent starter on a non-empty list against the mock data', async () => {
    const store = new MockDocumentStoreService({ latencyMs: 0 });
    for (const starter of CONVERSATION_STARTERS) {
      if (starter.outcome !== 'recent') {
        continue;
      }
      const session = createSession(starter.props, 1);
      const rows = await store.getRecent(session.recent.filter, NOW);
      expect(rows.length).toBeGreaterThan(0);
    }
  });

  it('opens every file starter on the filing flow at its positive empty state', () => {
    for (const starter of CONVERSATION_STARTERS) {
      if (starter.outcome !== 'file') {
        continue;
      }
      const session = createSession(starter.props, 1);
      expect(session.intent).toBe('file');
      expect(session.filing.stage).toBe('empty'); // the file picker, not a dead end
    }
  });
});
