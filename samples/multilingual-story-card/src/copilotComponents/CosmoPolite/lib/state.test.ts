import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { cardKey, hash, loadCardState, loadPreferences, nextMount, saveCardState, savePreferences } from './state';

describe('card state', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it('hashes deterministically', () => {
    expect(hash('de-AT|Wien|text')).toBe(hash('de-AT|Wien|text'));
    expect(hash('a')).not.toBe(hash('b'));
  });

  it('keys cards by language, title and text', () => {
    expect(cardKey('de', 'Wien', 'x')).not.toBe(cardKey('fi', 'Wien', 'x'));
    expect(cardKey('de', 'Wien', 'x')).toMatch(/^cosmopolite:v1:card:/);
  });

  it('round-trips and validates stored state', () => {
    const key: string = cardKey('sv', 'Stockholm', 'text');
    saveCardState(key, { design: 'classic', sentence: 3 });
    expect(loadCardState(key)).toEqual({ design: 'classic', sentence: 3 });

    window.sessionStorage.setItem(key, JSON.stringify({ design: 'neon', sentence: -2 }));
    expect(loadCardState(key)).toEqual({ design: undefined, sentence: undefined });

    window.sessionStorage.setItem(key, '{broken');
    expect(loadCardState(key)).toEqual({});
  });

  it('counts mounts', () => {
    expect(nextMount()).toBe(1);
    expect(nextMount()).toBe(2);
  });

  it('stores preferences in localStorage and merges changes', () => {
    expect(loadPreferences()).toEqual({ theme: 'auto' });
    savePreferences({ design: 'classic' });
    savePreferences({ layout: 'lead', theme: 'dark' });
    expect(loadPreferences()).toEqual({ design: 'classic', layout: 'lead', theme: 'dark' });
    expect(window.localStorage.getItem('cosmopolite:v1:preferences')).toContain('classic');
  });

  it('falls back to sessionStorage when localStorage is blocked', () => {
    const spy: MockInstance = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('blocked');
    });
    savePreferences({ design: 'compact' });
    spy.mockRestore();
    expect(window.localStorage.getItem('cosmopolite:v1:preferences')).toBeNull();
    expect(loadPreferences().design).toBe('compact');
  });

  it('ignores corrupt preferences', () => {
    window.localStorage.setItem('cosmopolite:v1:preferences', '{broken');
    window.sessionStorage.setItem('cosmopolite:v1:preferences', JSON.stringify({ design: 'neon', layout: 'beside' }));
    expect(loadPreferences()).toEqual({ design: undefined, layout: 'beside', theme: 'auto' });
  });

});
