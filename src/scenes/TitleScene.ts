import Phaser from 'phaser';
import { SoundEngine } from '../audio/SoundEngine';
import { GameStateManager } from '../state/GameState';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Atmospheric dark background
    const bg = this.add.graphics();
    bg.fillStyle(0x060b0e, 1);
    bg.fillRect(0, 0, width, height);

    // Grid mesh overlay
    bg.lineStyle(1, 0x0f221f, 0.4);
    for (let x = 0; x < width; x += 40) {
      bg.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 40) {
      bg.lineBetween(0, y, width, y);
    }

    // Radio waveform display in center
    const wave = this.add.graphics();
    let phase = 0;
    this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        phase += 0.08;
        wave.clear();
        wave.lineStyle(1.5, 0x33ff88, 0.45);
        wave.beginPath();
        for (let x = 80; x < width - 80; x += 4) {
          const y =
            height / 2 -
            40 +
            Math.sin(x * 0.02 + phase) * 22 * Math.sin(x * 0.005) +
            (Math.random() - 0.5) * 4;
          if (x === 80) wave.moveTo(x, y);
          else wave.lineTo(x, y);
        }
        wave.strokePath();
      },
    });

    // Sub-title header
    this.add
      .text(width / 2, 140, '>>> CLASSIFIED TRANSMISSION // RESEARCH FACILITY ECHO-7 <<<', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#ffb833',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    // Main Title
    const titleText = this.add
      .text(width / 2, 195, 'THE ALIEN CONNECTION', {
        fontFamily: 'Courier New, monospace',
        fontSize: '44px',
        color: '#33ff88',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Glow tween for title
    this.tweens.add({
      targets: titleText,
      alpha: 0.85,
      duration: 1200,
      yoyo: true,
      repeat: -1,
    });

    this.add
      .text(width / 2, 245, 'AN ANALOG HORROR & MYSTERY ADVENTURE', {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: '#7fa4a8',
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    // Lore Briefing
    const lore =
      'OCTOBER 1983. 4,000 METERS BELOW THE PERMAFROST CORE.\n' +
      'Station Echo-7 locked onto a persistent 84.7 kHz harmonic transmission.\n' +
      'Within hours, the staff evacuated or vanished behind emergency blast doors.\n' +
      'You are the sole emergency field engineer dispatched to assess the lockdown.';

    this.add
      .text(width / 2, 360, lore, {
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        color: '#b0c7c9',
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5);

    // Buttons
    const state = GameStateManager.getInstance();
    const hasSave = state.hasSave();

    this.createMenuButton(
      width / 2,
      475,
      hasSave ? 'START NEW INVESTIGATION' : 'BEGIN INVESTIGATION',
      () => {
        SoundEngine.getInstance().init();
        SoundEngine.getInstance().playClick();
        state.reset();
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.time.delayedCall(520, () => {
          this.scene.start('AirlockScene');
        });
      }
    );

    if (hasSave) {
      this.createMenuButton(width / 2, 535, 'RESUME SAVED INVESTIGATION', () => {
        SoundEngine.getInstance().init();
        SoundEngine.getInstance().playClick();
        state.loadFromLocalStorage();
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.time.delayedCall(520, () => {
          this.scene.start(state.currentScene || 'AirlockScene');
        });
      });
    }

    // Audio status note
    this.add
      .text(width / 2, 640, '[ CLICK ANYWHERE TO ENGAGE SYNTHESIZER & TELEMETRY SYSTEMS ]', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: '#496c66',
      })
      .setOrigin(0.5);

    // Click on canvas initializes sound
    this.input.once('pointerdown', () => {
      SoundEngine.getInstance().init();
    });
  }

  private createMenuButton(
    x: number,
    y: number,
    label: string,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const gfx = this.add.graphics();
    const text = this.add.text(0, 0, `[ ${label} ]`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '15px',
      color: '#33ff88',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);

    const btnWidth = Math.max(300, text.width + 40);
    const btnHeight = 44;

    const render = (isHover: boolean) => {
      gfx.clear();
      gfx.fillStyle(isHover ? 0x163428 : 0x091417, 0.9);
      gfx.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6);
      gfx.lineStyle(1.5, isHover ? 0xffb833 : 0x33ff88, 0.9);
      gfx.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6);
      text.setColor(isHover ? '#ffb833' : '#33ff88');
    };

    render(false);
    container.add([gfx, text]);
    container.setSize(btnWidth, btnHeight);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerover', () => {
      SoundEngine.getInstance().playClick();
      render(true);
    });
    container.on('pointerout', () => render(false));
    container.on('pointerdown', callback);

    return container;
  }
}
