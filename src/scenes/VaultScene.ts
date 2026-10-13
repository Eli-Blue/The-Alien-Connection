import Phaser from 'phaser';
import { SoundEngine } from '../audio/SoundEngine';
import { GameStateManager } from '../state/GameState';
import { DialogueBox } from './ui/DialogueBox';
import { HUD } from './ui/HUD';
import { LogViewer } from './ui/LogViewer';

export class VaultScene extends Phaser.Scene {
  private hud!: HUD;
  private logViewer!: LogViewer;
  private dialogueBox!: DialogueBox;
  private entityGfx!: Phaser.GameObjects.Graphics;
  private pulsePhase = 0;
  private endSummaryContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'VaultScene' });
  }

  create(): void {
    const state = GameStateManager.getInstance();
    state.currentScene = 'VaultScene';

    this.logViewer = new LogViewer(this);
    this.dialogueBox = new DialogueBox(this);
    this.hud = new HUD(this, 'Sub-Vault 9 Borehole Chamber', this.logViewer);

    SoundEngine.getInstance().setDroneTension('high');

    this.renderEnvironment();
    this.renderAlienEntity();
    this.renderTerminalConsole();
    this.renderEndSummary();

    // Narrative introduction upon stepping into the vault
    this.time.delayedCall(500, () => {
      this.dialogueBox.show(
        'Field Investigator',
        'Dear God... The borehole doesn\'t terminate in rock. There is something suspended in the central containment shaft... pulsating with the exact 84.7 kHz harmonic rhythm we received.'
      );
    });
  }

  private renderEnvironment(): void {
    const width = 1024;
    const height = 700;

    const bg = this.add.graphics();
    // Subterranean cavern dark base
    bg.fillStyle(0x04080a, 1);
    bg.fillRect(0, 48, width, height - 48);

    // Deep pit chasm in center
    bg.fillStyle(0x020405, 1);
    bg.fillEllipse(512, 420, 680, 290);
    bg.lineStyle(3, 0x0f2228, 1);
    bg.strokeEllipse(512, 420, 680, 290);

    // Industrial catwalk / observation bridge in foreground
    bg.fillStyle(0x0e171b, 1);
    bg.fillRect(180, 520, 664, 140);
    bg.lineStyle(2, 0x1f3640, 1);
    bg.strokeRect(180, 520, 664, 140);

    // Catwalk guardrails
    bg.lineStyle(2, 0xd99818, 0.7);
    bg.lineBetween(180, 520, 844, 520);
    for (let x = 180; x <= 844; x += 40) {
      bg.lineBetween(x, 520, x, 545);
    }

    // Heavy drilling conduits entering the chasm
    bg.lineStyle(6, 0x1a2e37, 1);
    bg.beginPath();
    bg.moveTo(100, 48);
    bg.lineTo(380, 320);
    bg.moveTo(924, 48);
    bg.lineTo(644, 320);
    bg.strokePath();

    // Floating luminescent spore particles
    for (let i = 0; i < 24; i++) {
      const p = this.add.image(300 + Math.random() * 424, 250 + Math.random() * 200, 'particle_spark');
      p.setScale(0.8 + Math.random() * 0.8);
      p.setAlpha(0.2 + Math.random() * 0.5);

      this.tweens.add({
        targets: p,
        y: p.y - 60 - Math.random() * 40,
        x: p.x + (Math.random() - 0.5) * 40,
        alpha: 0.1,
        duration: 2500 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private renderAlienEntity(): void {
    // Alien Monolith suspended in containment field
    const entityContainer = this.add.container(512, 280);
    this.entityGfx = this.add.graphics();
    entityContainer.add(this.entityGfx);

    this.time.addEvent({
      delay: 40,
      loop: true,
      callback: () => {
        this.pulsePhase += 0.05;
        this.entityGfx.clear();

        // Pulsing bioluminescent containment aura
        const glowRadius = 85 + Math.sin(this.pulsePhase) * 12;
        this.entityGfx.fillStyle(0x18e8a0, 0.12 + Math.sin(this.pulsePhase) * 0.05);
        this.entityGfx.fillCircle(0, 0, glowRadius);

        // Ancient obsidian monolith core
        this.entityGfx.fillStyle(0x0a1012, 1);
        this.entityGfx.beginPath();
        this.entityGfx.moveTo(0, -90);
        this.entityGfx.lineTo(45, -20);
        this.entityGfx.lineTo(35, 80);
        this.entityGfx.lineTo(-35, 80);
        this.entityGfx.lineTo(-45, -20);
        this.entityGfx.closePath();
        this.entityGfx.fillPath();

        this.entityGfx.lineStyle(2, 0x1f443c, 1);
        this.entityGfx.strokePath();

        // Pulsating bio-fractal veins
        const veinAlpha = 0.5 + Math.sin(this.pulsePhase * 1.5) * 0.35;
        this.entityGfx.lineStyle(2, 0x33ffaa, veinAlpha);
        this.entityGfx.beginPath();
        this.entityGfx.moveTo(0, -70);
        this.entityGfx.lineTo(-12, -25);
        this.entityGfx.lineTo(15, 10);
        this.entityGfx.lineTo(-8, 55);

        this.entityGfx.moveTo(0, -70);
        this.entityGfx.lineTo(16, -20);
        this.entityGfx.lineTo(-10, 15);
        this.entityGfx.lineTo(12, 60);
        this.entityGfx.strokePath();

        // Tendrils tapping into research cables
        this.entityGfx.lineStyle(1.5, 0x33ffaa, 0.4);
        this.entityGfx.beginPath();
        this.entityGfx.moveTo(-35, 70);
        this.entityGfx.lineTo(-90, 120);
        this.entityGfx.moveTo(35, 70);
        this.entityGfx.lineTo(90, 120);
        this.entityGfx.strokePath();
      },
    });

    entityContainer.setSize(120, 180);
    entityContainer.setInteractive(new Phaser.Geom.Rectangle(-60, -90, 120, 180), Phaser.Geom.Rectangle.Contains);

    entityContainer.on('pointerdown', () => {
      SoundEngine.getInstance().playAlienResonance(0);
      this.dialogueBox.show(
        'Sub-Vault 9 Anomaly',
        'The organism responds to proximity. High-frequency acoustic vibrations pulse through the floor plating, vibrating through your ribcage. It is woven directly into the station\'s broadcast transmitters.'
      );
    });
  }

  private renderTerminalConsole(): void {
    // Dr. Thorne's Black Box Station on Catwalk
    const container = this.add.container(512, 570);
    const box = this.add.graphics();

    box.fillStyle(0x132128, 1);
    box.fillRoundedRect(-140, -35, 280, 70, 6);
    box.lineStyle(2, 0x33ff88, 1);
    box.strokeRoundedRect(-140, -35, 280, 70, 6);
    container.add(box);

    const txt = this.add.text(0, -12, 'DR. THORNE BLACK BOX TERMINAL', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#ffb833',
      fontStyle: 'bold',
    });
    txt.setOrigin(0.5);
    container.add(txt);

    const sub = this.add.text(0, 12, '[ CLICK TO PLAY FINAL TRANSMISSION ]', {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      color: '#33ff88',
    });
    sub.setOrigin(0.5);
    container.add(sub);

    container.setSize(280, 70);
    container.setInteractive(new Phaser.Geom.Rectangle(-140, -35, 280, 70), Phaser.Geom.Rectangle.Contains);

    container.on('pointerdown', () => {
      SoundEngine.getInstance().playClick();
      SoundEngine.getInstance().playRevealStinger();

      const state = GameStateManager.getInstance();
      state.completeChapter();
      state.saveToLocalStorage();

      this.dialogueBox.show(
        'Dr. Aris Thorne - Final Broadcast',
        'If someone from the surface is listening to this... do not send rescue teams.\n\nThe object in Vault 9 is not a meteor or inactive artifact. It is a dormant neural node of a planetary organism. The radio signals we broadcast into space for decades acted like an irritant... like an alarm bell.\n\nIt has connected to our communication relay. It is using our own antennas to broadcast outside... It is calling the rest of them.',
        () => {
          this.showEndSummary();
        }
      );
    });
  }

  private renderEndSummary(): void {
    this.endSummaryContainer = this.add.container(512, 350);
    this.endSummaryContainer.setDepth(200);
    this.endSummaryContainer.setVisible(false);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.88);
    bg.fillRect(-512, -350, 1024, 700);

    bg.fillStyle(0x081318, 0.98);
    bg.fillRoundedRect(-280, -230, 560, 460, 8);
    bg.lineStyle(2, 0x33ff88, 1);
    bg.strokeRoundedRect(-280, -230, 560, 460, 8);
    this.endSummaryContainer.add(bg);
  }

  private showEndSummary(): void {
    const state = GameStateManager.getInstance();
    this.hud.showToast('CHAPTER 1 INVESTIGATION COMPLETE');
    this.endSummaryContainer.setVisible(true);

    // Title
    const title = this.add.text(0, -180, 'CHAPTER 1 INVESTIGATION COMPLETE', {
      fontFamily: 'Courier New, monospace',
      fontSize: '17px',
      color: '#ffb833',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.endSummaryContainer.add(title);

    const sub = this.add.text(0, -150, 'CASE FILE: THE ALIEN CONNECTION // STATION ECHO-7', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#8ab4b8',
    });
    sub.setOrigin(0.5);
    this.endSummaryContainer.add(sub);

    // Stats Box
    const elapsedSec = state.getElapsedTime();
    const minutes = Math.floor(elapsedSec / 60);
    const seconds = elapsedSec % 60;
    const timeFormatted = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;

    const statsText =
      `INVESTIGATION REPORT:\n\n` +
      `• FACILITY POWER RELAY        : [ RESTORED ]\n` +
      `• ARCHIVE COMPONENTS RECOVERED: [ 6 / 6 COMPLETED ]\n` +
      `• OSCILLOSCOPE CARRIER LOCK   : [ 84.7 kHz / 65% SOLVED ]\n` +
      `• SUB-VAULT 9 CODE OVERRIDE   : [ 5 - 7 - 2 - 9 UNLOCKED ]\n` +
      `• LOGS & TRANSMISSIONS        : [ ${state.discoveredLogs.size} / 5 DECIPHERED ]\n` +
      `• TIME ELAPSED                : [ ${timeFormatted} ]\n\n` +
      `ANOMALY CLASSIFICATION: AWAKENED PLANETARY NEURAL NODE\n` +
      `BROADCAST STATUS       : TRANSMITTING INTO DEEP SPACE...`;

    const stats = this.add.text(-230, -115, statsText, {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#d4ece7',
      lineSpacing: 6,
    });
    this.endSummaryContainer.add(stats);

    // Buttons: Review Logs or Replay
    this.createActionButton(0, 130, 'READ ALL ARCHIVE LOGS', () => {
      this.logViewer.show('log_05_vault_revelation');
    });

    this.createActionButton(0, 180, 'RESTART INVESTIGATION', () => {
      SoundEngine.getInstance().playClick();
      state.reset();
      state.clearLocalStorage();
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => {
        this.scene.start('TitleScene');
      });
    });
  }

  private createActionButton(x: number, y: number, label: string, callback: () => void): void {
    const container = this.add.container(x, y);
    const gfx = this.add.graphics();
    const w = 320;
    const h = 36;

    const txt = this.add.text(0, 0, `[ ${label} ]`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#33ff88',
      fontStyle: 'bold',
    });
    txt.setOrigin(0.5);

    const render = (isHover: boolean) => {
      gfx.clear();
      gfx.fillStyle(isHover ? 0x163428 : 0x0c1e19, 1);
      gfx.fillRoundedRect(-w / 2, -h / 2, w, h, 4);
      gfx.lineStyle(1.5, isHover ? 0xffb833 : 0x33ff88, 1);
      gfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 4);
      txt.setColor(isHover ? '#ffb833' : '#33ff88');
    };

    render(false);
    container.add([gfx, txt]);
    container.setSize(w, h);
    container.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => render(true));
    container.on('pointerout', () => render(false));
    container.on('pointerdown', callback);

    this.endSummaryContainer.add(container);
  }
}
