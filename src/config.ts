import Phaser from 'phaser';
import { AirlockScene } from './scenes/AirlockScene';
import { BootScene } from './scenes/BootScene';
import { KeypadScene } from './scenes/KeypadScene';
import { LabScene } from './scenes/LabScene';
import { OscilloscopeScene } from './scenes/OscilloscopeScene';
import { TitleScene } from './scenes/TitleScene';
import { VaultScene } from './scenes/VaultScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1024,
  height: 700,
  backgroundColor: '#060b0e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    TitleScene,
    AirlockScene,
    LabScene,
    OscilloscopeScene,
    KeypadScene,
    VaultScene,
  ],
};
