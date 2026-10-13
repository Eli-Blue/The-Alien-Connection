import { GameSaveData, InventoryItem, LoreLog } from './types';

const STORAGE_KEY = 'tac_station_echo7_save_v1';

export const FACILITY_LOGS: Record<string, LoreLog> = {
  log_01_briefing: {
    id: 'log_01_briefing',
    title: 'DIRECTIVE: DEEP HORIZON - OCT 1983',
    sender: 'Sub-Surface Monitoring Cmd',
    timestamp: '1983-10-04 03:14:00',
    content:
      'STATION ECHO-7 STATUS: Commissioned for deep seismic acoustic telemetry.\n\nPrimary mandate: listen to low-frequency anomalous harmonic pulses emanating from borehole shaft 9.\nStrict quarantine protocol in effect. All surface elevators locked until review.',
  },
  log_02_containment: {
    id: 'log_02_containment',
    title: 'INCIDENT LOG: SUB-LEVEL BREACH',
    sender: 'Security Chief Vance',
    timestamp: '1983-10-11 22:45:18',
    content:
      'The array picked up a modulated waveform at 84.7 kHz. It is NOT seismic.\n\nFive minutes after lock, the communications lab terminal began printing unsolicited transmissions. Dr. Thorne refused to cut the receiver power. He claims the signal is "responding to our heartbeats".\nEmergency circuit breaker tripped in the Airlock.',
  },
  log_03_thorne_notes: {
    id: 'log_03_thorne_notes',
    title: "DR. THORNE'S FIELD SCRAP",
    sender: 'Dr. Aris Thorne',
    timestamp: '1983-10-12 04:02:11',
    content:
      'We assumed the transmission was traveling downward from an orbital satellite or deep space.\n\nGod help us. The telemetry antennas are pointing 4,000 meters STRAIGHT DOWN into the permafrost core.\nThe carrier wave is resonant at 84.7 kHz with 65% harmonic modulation.\nThe isolation vault lock sequence is tied to the station coordinates: Core [5], Array [7], Bio-Pass [2], Vault [9].',
  },
  log_04_intercept: {
    id: 'log_04_intercept',
    title: 'DECODED TRANSMISSION ECHO',
    sender: 'Oscilloscope Receiver Node 3',
    timestamp: '1983-10-12 05:30:44',
    content:
      '>>> CARRIER SYNCHRONIZED <<<\nTRANS-ACOUSTIC SIGNATURE: BIOLOGICAL / METALLIC HYBRID.\n\n"WE DO NOT COME FROM ABOVE. WE HAVE BEEN ASLEEP UNDER YOUR CONTINENT FOR THREE HUNDRED MILLION YEARS. YOUR DRILL AWAKENED THE NERVE ENDINGS."\n\nEMERGENCY OVERRIDE CODE FOR SUB-VAULT 9 CONFIRMED: 5 - 7 - 2 - 9.',
  },
  log_05_vault_revelation: {
    id: 'log_05_vault_revelation',
    title: 'BLACK BOX TRANSMISSION: VAULT INTERIOR',
    sender: 'Dr. Aris Thorne - Final Broadcast',
    timestamp: '1983-10-12 06:12:00',
    content:
      'If someone from the surface is listening to this... do not send rescue teams.\n\nThe object in Vault 9 is not a meteor or inactive artifact. It is a dormant neural node of a planetary organism. The radio signals we broadcast into space for decades acted like an irritant... like an alarm bell.\n\nIt has connected to our communication relay. It is using our own antennas to broadcast outside... It is calling the rest of them.',
  },
};

export class GameStateManager {
  private static instance: GameStateManager;

  public currentScene = 'AirlockScene';
  public chapter = 1;
  public powerRestored = false;
  public airlockUnlocked = false;
  public foundHiddenObjects: Set<string> = new Set();
  public hiddenObjectsCompleted = false;
  public oscilloscopeSolved = false;
  public keypadSolved = false;
  public chapterCompleted = false;
  public discoveredLogs: Set<string> = new Set();
  public inventory: InventoryItem[] = [];
  public startTime: number = Date.now();
  public elapsedSeconds = 0;

  private listeners: Map<string, Set<() => void>> = new Map();

  private constructor() {
    this.discoveredLogs.add('log_01_briefing');
  }

  public static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  public reset(): void {
    this.currentScene = 'AirlockScene';
    this.chapter = 1;
    this.powerRestored = false;
    this.airlockUnlocked = false;
    this.foundHiddenObjects.clear();
    this.hiddenObjectsCompleted = false;
    this.oscilloscopeSolved = false;
    this.keypadSolved = false;
    this.chapterCompleted = false;
    this.discoveredLogs.clear();
    this.discoveredLogs.add('log_01_briefing');
    this.inventory = [];
    this.startTime = Date.now();
    this.elapsedSeconds = 0;
    this.emit('change');
  }

  public subscribe(event: string, callback: () => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  public emit(event: string): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error(`Error in event listener for ${event}:`, err);
      }
    });
  }

  public addItem(item: InventoryItem): boolean {
    if (this.inventory.some((i) => i.id === item.id)) {
      return false;
    }
    this.inventory.push(item);
    this.emit('inventory');
    this.emit('change');
    return true;
  }

  public hasItem(itemId: string): boolean {
    return this.inventory.some((i) => i.id === itemId);
  }

  public removeItem(itemId: string): boolean {
    const idx = this.inventory.findIndex((i) => i.id === itemId);
    if (idx >= 0) {
      this.inventory.splice(idx, 1);
      this.emit('inventory');
      this.emit('change');
      return true;
    }
    return false;
  }

  public discoverLog(logId: string): boolean {
    if (!FACILITY_LOGS[logId]) return false;
    if (!this.discoveredLogs.has(logId)) {
      this.discoveredLogs.add(logId);
      this.emit('logs');
      this.emit('change');
      return true;
    }
    return false;
  }

  public markHiddenObjectFound(objectId: string): boolean {
    if (this.foundHiddenObjects.has(objectId)) return false;
    this.foundHiddenObjects.add(objectId);
    this.emit('hidden-objects');
    this.emit('change');
    return true;
  }

  public isHiddenObjectFound(objectId: string): boolean {
    return this.foundHiddenObjects.has(objectId);
  }

  public restorePower(): void {
    this.powerRestored = true;
    this.emit('power');
    this.emit('change');
  }

  public unlockAirlock(): void {
    this.airlockUnlocked = true;
    this.emit('airlock');
    this.emit('change');
  }

  public completeHiddenObjects(): void {
    this.hiddenObjectsCompleted = true;
    this.emit('hidden-objects-complete');
    this.emit('change');
  }

  public solveOscilloscope(): void {
    this.oscilloscopeSolved = true;
    this.discoverLog('log_04_intercept');
    this.emit('oscilloscope');
    this.emit('change');
  }

  public solveKeypad(): void {
    this.keypadSolved = true;
    this.emit('keypad');
    this.emit('change');
  }

  public completeChapter(): void {
    this.chapterCompleted = true;
    this.discoverLog('log_05_vault_revelation');
    this.emit('chapter-complete');
    this.emit('change');
  }

  public getElapsedTime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000) + this.elapsedSeconds;
  }

  public serialize(): GameSaveData {
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      currentScene: this.currentScene,
      chapter: this.chapter,
      powerRestored: this.powerRestored,
      airlockUnlocked: this.airlockUnlocked,
      foundHiddenObjects: Array.from(this.foundHiddenObjects),
      hiddenObjectsCompleted: this.hiddenObjectsCompleted,
      oscilloscopeSolved: this.oscilloscopeSolved,
      keypadSolved: this.keypadSolved,
      discoveredLogs: Array.from(this.discoveredLogs),
      inventory: [...this.inventory],
      elapsedSeconds: this.getElapsedTime(),
      chapterCompleted: this.chapterCompleted,
    };
  }

  public deserialize(data: GameSaveData): boolean {
    try {
      if (!data || data.version !== 1) return false;
      this.currentScene = data.currentScene || 'AirlockScene';
      this.chapter = data.chapter || 1;
      this.powerRestored = !!data.powerRestored;
      this.airlockUnlocked = !!data.airlockUnlocked;
      this.foundHiddenObjects = new Set(data.foundHiddenObjects || []);
      this.hiddenObjectsCompleted = !!data.hiddenObjectsCompleted;
      this.oscilloscopeSolved = !!data.oscilloscopeSolved;
      this.keypadSolved = !!data.keypadSolved;
      this.discoveredLogs = new Set(data.discoveredLogs || ['log_01_briefing']);
      this.inventory = data.inventory || [];
      this.elapsedSeconds = data.elapsedSeconds || 0;
      this.startTime = Date.now();
      this.chapterCompleted = !!data.chapterCompleted;
      this.emit('change');
      return true;
    } catch (e) {
      console.error('Failed to load save data:', e);
      return false;
    }
  }

  public saveToLocalStorage(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const json = JSON.stringify(this.serialize());
      window.localStorage.setItem(STORAGE_KEY, json);
      return true;
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
      return false;
    }
  }

  public loadFromLocalStorage(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as GameSaveData;
      return this.deserialize(parsed);
    } catch (e) {
      console.warn('LocalStorage load failed:', e);
      return false;
    }
  }

  public clearLocalStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  }

  public hasSave(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      return !!window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return false;
    }
  }

  public async saveToRemote(): Promise<boolean> {
    try {
      const payload = this.serialize();
      const res = await fetch('/api/saveState', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async loadFromRemote(): Promise<boolean> {
    try {
      const res = await fetch('/api/loadState');
      if (!res.ok) return false;
      const data = (await res.json()) as GameSaveData;
      return this.deserialize(data);
    } catch {
      return false;
    }
  }
}
