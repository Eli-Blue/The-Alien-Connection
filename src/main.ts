import Phaser from 'phaser';
import { SoundEngine } from './audio/SoundEngine';
import { gameConfig } from './config';
import { GameStateManager } from './state/GameState';

window.addEventListener('DOMContentLoaded', () => {
  // Initialize state manager and attempt local save restore
  const state = GameStateManager.getInstance();
  state.loadFromLocalStorage();

  // Initialize Phaser Game instance
  const game = new Phaser.Game(gameConfig);

  // Resume Web Audio on first user interaction
  const resumeAudio = () => {
    SoundEngine.getInstance().init();
    SoundEngine.getInstance().resume();
    window.removeEventListener('click', resumeAudio);
    window.removeEventListener('keydown', resumeAudio);
  };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  // Expose debugging / testing handle on window for automated verification
  (window as unknown as { __GAME_INSTANCE__: Phaser.Game; __GAME_STATE__: GameStateManager }).__GAME_INSTANCE__ = game;
  (window as unknown as { __GAME_INSTANCE__: Phaser.Game; __GAME_STATE__: GameStateManager }).__GAME_STATE__ = state;
});
