import { describe, expect, it } from 'vitest';
import { FACILITY_LOGS } from '../src/state/GameState';

describe('Puzzle Logic Verification', () => {
  describe('Puzzle 1: Oscilloscope Signal Alignment', () => {
    const TARGET_FREQ = 84.7;
    const TARGET_HARMONIC = 65;
    const FREQ_TOLERANCE = 0.3;
    const HARMONIC_TOLERANCE = 3;

    function isSignalAligned(freq: number, harmonic: number): boolean {
      const fDelta = Math.abs(freq - TARGET_FREQ);
      const hDelta = Math.abs(harmonic - TARGET_HARMONIC);
      return fDelta <= FREQ_TOLERANCE && hDelta <= HARMONIC_TOLERANCE;
    }

    it('validates exact target frequency and harmonic', () => {
      expect(isSignalAligned(84.7, 65)).toBe(true);
    });

    it('accepts signals within tolerance limits', () => {
      expect(isSignalAligned(84.5, 63)).toBe(true);
      expect(isSignalAligned(84.9, 67)).toBe(true);
      expect(isSignalAligned(84.4, 65)).toBe(true);
      expect(isSignalAligned(85.0, 65)).toBe(true);
    });

    it('rejects signals outside tolerance', () => {
      expect(isSignalAligned(84.3, 65)).toBe(false); // frequency too low
      expect(isSignalAligned(85.1, 65)).toBe(false); // frequency too high
      expect(isSignalAligned(84.7, 61)).toBe(false); // harmonic too low
      expect(isSignalAligned(84.7, 69)).toBe(false); // harmonic too high
      expect(isSignalAligned(74.2, 22)).toBe(false); // initial default values
    });

    it('matches target stated in Dr. Thorne diary note log', () => {
      const log = FACILITY_LOGS['log_03_thorne_notes'];
      expect(log.content).toContain('84.7 kHz');
      expect(log.content).toContain('65%');
    });
  });

  describe('Puzzle 2: Sub-Vault 9 Keypad Lock', () => {
    const TARGET_CODE = '5729';

    function testKeypadInput(code: string): boolean {
      return code === TARGET_CODE;
    }

    it('authenticates the correct 4-digit override PIN', () => {
      expect(testKeypadInput('5729')).toBe(true);
    });

    it('rejects incorrect codes and lengths', () => {
      expect(testKeypadInput('0000')).toBe(false);
      expect(testKeypadInput('1234')).toBe(false);
      expect(testKeypadInput('572')).toBe(false);
      expect(testKeypadInput('57290')).toBe(false);
      expect(testKeypadInput('')).toBe(false);
    });

    it('corresponds to narrative clues in decoded intercept transmission', () => {
      const log = FACILITY_LOGS['log_04_intercept'];
      expect(log.content).toContain('5 - 7 - 2 - 9');
    });

    it('corresponds to station coordinate hints in Dr. Thorne notes', () => {
      const log = FACILITY_LOGS['log_03_thorne_notes'];
      expect(log.content).toContain('Core [5]');
      expect(log.content).toContain('Array [7]');
      expect(log.content).toContain('Bio-Pass [2]');
      expect(log.content).toContain('Vault [9]');
    });
  });
});
