export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: 'tool' | 'key' | 'clue' | 'component';
}

export interface LoreLog {
  id: string;
  title: string;
  sender: string;
  timestamp: string;
  content: string;
}

export interface HiddenObjectDef {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  clue: string;
}

export interface GameSaveData {
  version: number;
  savedAt: string;
  currentScene: string;
  chapter: number;
  powerRestored: boolean;
  airlockUnlocked: boolean;
  foundHiddenObjects: string[];
  hiddenObjectsCompleted: boolean;
  oscilloscopeSolved: boolean;
  keypadSolved: boolean;
  discoveredLogs: string[];
  inventory: InventoryItem[];
  elapsedSeconds: number;
  chapterCompleted: boolean;
}
