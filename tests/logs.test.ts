import { describe, expect, it } from 'vitest';
import { FACILITY_LOGS } from '../src/state/GameState';

describe('Narrative & Lore Logs Progression', () => {
  it('contains all 5 core story logs', () => {
    const requiredLogs = [
      'log_01_briefing',
      'log_02_containment',
      'log_03_thorne_notes',
      'log_04_intercept',
      'log_05_vault_revelation',
    ];

    requiredLogs.forEach((id) => {
      const log = FACILITY_LOGS[id];
      expect(log).toBeDefined();
      expect(log.title).toBeTruthy();
      expect(log.sender).toBeTruthy();
      expect(log.timestamp).toBeTruthy();
      expect(log.content.length).toBeGreaterThan(50);
    });
  });

  it('builds narrative tension leading to the alien contact reveal', () => {
    // 1. Briefing sets the stage
    expect(FACILITY_LOGS['log_01_briefing'].content).toContain('STATION ECHO-7');

    // 2. Incident report details breach & frequency lock
    expect(FACILITY_LOGS['log_02_containment'].content).toContain('84.7 kHz');
    expect(FACILITY_LOGS['log_02_containment'].content).toContain('Dr. Thorne');

    // 3. Field notes reveal transmitter points down into the earth, not space
    expect(FACILITY_LOGS['log_03_thorne_notes'].content).toContain('4,000 meters STRAIGHT DOWN');

    // 4. Decoded transmission reveals the organism was awakened by drilling
    expect(FACILITY_LOGS['log_04_intercept'].content).toContain('WE DO NOT COME FROM ABOVE');

    // 5. Final black box revelation confirms alien connection broadcasting to deep space
    expect(FACILITY_LOGS['log_05_vault_revelation'].content).toContain('neural node of a planetary organism');
    expect(FACILITY_LOGS['log_05_vault_revelation'].content).toContain('It is calling the rest of them');
  });
});
