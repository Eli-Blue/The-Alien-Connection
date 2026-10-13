import { beforeEach, describe, expect, it } from 'vitest';
import { GameStateManager } from '../src/state/GameState';
import { InventoryItem } from '../src/state/types';

describe('GameStateManager', () => {
  let state: GameStateManager;

  beforeEach(() => {
    state = GameStateManager.getInstance();
    state.reset();
  });

  it('initializes with default chapter 1 state', () => {
    expect(state.chapter).toBe(1);
    expect(state.currentScene).toBe('AirlockScene');
    expect(state.powerRestored).toBe(false);
    expect(state.airlockUnlocked).toBe(false);
    expect(state.hiddenObjectsCompleted).toBe(false);
    expect(state.oscilloscopeSolved).toBe(false);
    expect(state.keypadSolved).toBe(false);
    expect(state.chapterCompleted).toBe(false);
    expect(state.inventory).toHaveLength(0);
    expect(state.discoveredLogs.has('log_01_briefing')).toBe(true);
  });

  it('manages inventory correctly', () => {
    const item: InventoryItem = {
      id: 'dial_knob',
      name: 'Emergency Tuner Dial',
      description: 'Analog tuner dial',
      category: 'component',
    };

    expect(state.addItem(item)).toBe(true);
    expect(state.hasItem('dial_knob')).toBe(true);
    expect(state.inventory).toHaveLength(1);

    // Duplicate item should not be added twice
    expect(state.addItem(item)).toBe(false);
    expect(state.inventory).toHaveLength(1);

    // Removal
    expect(state.removeItem('dial_knob')).toBe(true);
    expect(state.hasItem('dial_knob')).toBe(false);
    expect(state.inventory).toHaveLength(0);
  });

  it('tracks hidden objects collection and completion', () => {
    const objects = ['data_reel', 'dial_knob', 'bio_keycard', 'vacuum_tube', 'diary_fragment', 'dosimeter'];

    objects.forEach((id) => {
      expect(state.isHiddenObjectFound(id)).toBe(false);
      expect(state.markHiddenObjectFound(id)).toBe(true);
      expect(state.isHiddenObjectFound(id)).toBe(true);
      // Repeated mark returns false
      expect(state.markHiddenObjectFound(id)).toBe(false);
    });

    expect(state.foundHiddenObjects.size).toBe(6);
    state.completeHiddenObjects();
    expect(state.hiddenObjectsCompleted).toBe(true);
  });

  it('progresses power and airlock unlock', () => {
    expect(state.powerRestored).toBe(false);
    state.restorePower();
    expect(state.powerRestored).toBe(true);

    expect(state.airlockUnlocked).toBe(false);
    state.unlockAirlock();
    expect(state.airlockUnlocked).toBe(true);
  });

  it('solves oscilloscope and automatically unlocks intercepted log', () => {
    expect(state.oscilloscopeSolved).toBe(false);
    expect(state.discoveredLogs.has('log_04_intercept')).toBe(false);

    state.solveOscilloscope();

    expect(state.oscilloscopeSolved).toBe(true);
    expect(state.discoveredLogs.has('log_04_intercept')).toBe(true);
  });

  it('solves keypad and completes chapter', () => {
    expect(state.keypadSolved).toBe(false);
    state.solveKeypad();
    expect(state.keypadSolved).toBe(true);

    expect(state.chapterCompleted).toBe(false);
    state.completeChapter();
    expect(state.chapterCompleted).toBe(true);
    expect(state.discoveredLogs.has('log_05_vault_revelation')).toBe(true);
  });

  it('serializes and deserializes save data round-trip', () => {
    state.restorePower();
    state.unlockAirlock();
    state.markHiddenObjectFound('data_reel');
    state.markHiddenObjectFound('dial_knob');
    state.addItem({
      id: 'data_reel',
      name: 'Data Reel',
      description: 'Reel',
      category: 'component',
    });
    state.solveOscilloscope();
    state.solveKeypad();

    const snapshot = state.serialize();
    expect(snapshot.version).toBe(1);
    expect(snapshot.powerRestored).toBe(true);
    expect(snapshot.oscilloscopeSolved).toBe(true);
    expect(snapshot.keypadSolved).toBe(true);
    expect(snapshot.inventory).toHaveLength(1);

    // Reset and deserialize
    state.reset();
    expect(state.powerRestored).toBe(false);

    const success = state.deserialize(snapshot);
    expect(success).toBe(true);
    expect(state.powerRestored).toBe(true);
    expect(state.oscilloscopeSolved).toBe(true);
    expect(state.keypadSolved).toBe(true);
    expect(state.hasItem('data_reel')).toBe(true);
  });

  it('safely handles invalid save data', () => {
    // @ts-expect-error test invalid payload
    const result = state.deserialize(null);
    expect(result).toBe(false);

    // @ts-expect-error test wrong version
    const wrongVersion = state.deserialize({ version: 99 });
    expect(wrongVersion).toBe(false);
  });
});
