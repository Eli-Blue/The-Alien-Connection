import Phaser from 'phaser';
import { SoundEngine } from '../audio/SoundEngine';
import { GameStateManager } from '../state/GameState';
import { DialogueBox } from './ui/DialogueBox';
import { HUD } from './ui/HUD';
import { LogViewer } from './ui/LogViewer';

export class AirlockScene extends Phaser.Scene {
  private hud!: HUD;
  private logViewer!: LogViewer;
  private dialogueBox!: DialogueBox;
  private breakerGfx!: Phaser.GameObjects.Graphics;
  private doorGfx!: Phaser.GameObjects.Graphics;
  private terminalGfx!: Phaser.GameObjects.Graphics;
  private ambientLightGfx!: Phaser.GameObjects.Graphics;
  private statusText!: Phaser.GameObjects.Text;
  private doorStatusText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'AirlockScene' });
  }

  create(): void {
    const state = GameStateManager.getInstance();
    state.currentScene = 'AirlockScene';

    this.logViewer = new LogViewer(this);
    this.dialogueBox = new DialogueBox(this);
    this.hud = new HUD(this, 'Airlock Monitoring Antechamber', this.logViewer);

    this.renderEnvironment();

    // Opening monologue on first entry
    if (!state.powerRestored) {
      this.time.delayedCall(600, () => {
        this.dialogueBox.show(
          'Field Investigator',
          'Sub-Level 4. The emergency quarantine sirens stopped hours ago. Thick frost is creeping along the conduit pipes, and the main power grid is down. I need to locate the auxiliary breaker before I can open the inner lab doors.'
        );
      });
    }
  }

  private renderEnvironment(): void {
    const width = 1024;
    const height = 700;

    // 1. Background walls and floor
    const bg = this.add.graphics();
    bg.fillStyle(0x081014, 1);
    bg.fillRect(0, 48, width, height - 48);

    // Wall panels
    for (let x = 0; x < width; x += 128) {
      bg.lineStyle(1, 0x132228, 1);
      bg.lineBetween(x, 48, x, 480);
    }
    // Floor grid
    bg.fillStyle(0x0c161a, 1);
    bg.fillRect(0, 480, width, 220);
    bg.lineStyle(2, 0x182c33, 1);
    bg.lineBetween(0, 480, width, 480);
    for (let x = 0; x < width; x += 64) {
      bg.lineStyle(1, 0x142429, 0.7);
      bg.lineBetween(x, 480, x - 40, height);
    }

    // Hazard line on floor
    for (let x = 60; x < width - 60; x += 120) {
      this.add.image(x + 60, 495, 'tex_hazard').setScale(1, 0.6);
    }

    // 2. Ambient lighting overlay (red tint if no power, cool teal if restored)
    this.ambientLightGfx = this.add.graphics();
    this.updateLighting();

    // 3. Electrical Breaker Panel (Left Wall: x=140, y=280)
    this.renderBreakerPanel();

    // 4. Security Terminal Console (Center-Left Desk: x=420, y=360)
    this.renderTerminalDesk();

    // 5. Heavy Airlock Quarantine Blast Door (Right: x=780, y=290)
    this.renderQuarantineDoor();

    // 6. Overhead Warning Siren / Beacon (x=512, y=85)
    this.renderOverheadBeacon();
  }

  private updateLighting(): void {
    const state = GameStateManager.getInstance();
    this.ambientLightGfx.clear();
    if (!state.powerRestored) {
      // Emergency red pulse
      this.ambientLightGfx.fillStyle(0x661010, 0.15);
      this.ambientLightGfx.fillRect(0, 48, 1024, 652);
    } else {
      // Restored green/cyan glow
      this.ambientLightGfx.fillStyle(0x103328, 0.08);
      this.ambientLightGfx.fillRect(0, 48, 1024, 652);
    }
  }

  private renderBreakerPanel(): void {
    const state = GameStateManager.getInstance();
    const container = this.add.container(160, 290);

    this.breakerGfx = this.add.graphics();
    container.add(this.breakerGfx);

    const title = this.add.text(0, -95, 'AUX POWER BREAKER', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#8ab4b8',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    container.add(title);

    this.statusText = this.add.text(0, -75, state.powerRestored ? '[ POWER ONLINE ]' : '[ TRIPPED / OFFLINE ]', {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      color: state.powerRestored ? '#33ff88' : '#ff4444',
      fontStyle: 'bold',
    });
    this.statusText.setOrigin(0.5);
    container.add(this.statusText);

    const drawBreaker = () => {
      this.breakerGfx.clear();
      // Outer steel enclosure
      this.breakerGfx.fillStyle(0x162429, 1);
      this.breakerGfx.fillRoundedRect(-70, -60, 140, 150, 4);
      this.breakerGfx.lineStyle(2, 0x2d434a, 1);
      this.breakerGfx.strokeRoundedRect(-70, -60, 140, 150, 4);

      // Warning hazard stripes at top of box
      this.breakerGfx.fillStyle(0xd99818, 0.8);
      this.breakerGfx.fillRect(-60, -52, 120, 8);

      // Breaker switch track
      this.breakerGfx.fillStyle(0x0a1012, 1);
      this.breakerGfx.fillRect(-20, -30, 40, 90);
      this.breakerGfx.lineStyle(1, 0x3d5860, 1);
      this.breakerGfx.strokeRect(-20, -30, 40, 90);

      // Lever handle (DOWN = off, UP = on)
      const leverY = state.powerRestored ? -10 : 35;
      this.breakerGfx.fillStyle(state.powerRestored ? 0x33ff88 : 0xcc3333, 1);
      this.breakerGfx.fillRoundedRect(-16, leverY, 32, 22, 3);
      this.breakerGfx.lineStyle(1, 0xffffff, 0.8);
      this.breakerGfx.strokeRoundedRect(-16, leverY, 32, 22, 3);

      // Voltage indicator dial
      this.breakerGfx.fillStyle(0x0e171b, 1);
      this.breakerGfx.fillCircle(0, -38, 10);
      this.breakerGfx.lineStyle(1, state.powerRestored ? 0x33ff88 : 0x662222, 1);
      this.breakerGfx.strokeCircle(0, -38, 10);
    };

    drawBreaker();

    // Click interactive
    container.setSize(140, 150);
    container.setInteractive(new Phaser.Geom.Rectangle(-70, -60, 140, 150), Phaser.Geom.Rectangle.Contains);

    container.on('pointerdown', () => {
      if (state.powerRestored) {
        SoundEngine.getInstance().playClick();
        this.dialogueBox.show('System', 'Main auxiliary power is already energized. The station sub-grid is active.');
        return;
      }

      // Restore power
      SoundEngine.getInstance().playPowerRestore();
      state.restorePower();
      this.statusText.setText('[ POWER ONLINE ]');
      this.statusText.setColor('#33ff88');
      drawBreaker();
      this.updateLighting();

      // Sparks animation
      for (let i = 0; i < 12; i++) {
        const p = this.add.image(160 + (Math.random() - 0.5) * 40, 290 + (Math.random() - 0.5) * 40, 'particle_spark');
        this.tweens.add({
          targets: p,
          x: p.x + (Math.random() - 0.5) * 80,
          y: p.y + Math.random() * 50,
          alpha: 0,
          duration: 350 + Math.random() * 200,
          onComplete: () => p.destroy(),
        });
      }

      this.hud.showToast('FACILITY AUXILIARY POWER ONLINE');
      this.dialogueBox.show(
        'Field Investigator',
        'The magnetic relay engaged. The cooling fans and terminal displays are coming back to life. I can now access the security console to unlock the airlock.'
      );
    });
  }

  private renderTerminalDesk(): void {
    const state = GameStateManager.getInstance();
    const container = this.add.container(440, 360);

    // Desk structure
    const deskGfx = this.add.graphics();
    deskGfx.fillStyle(0x121d22, 1);
    deskGfx.fillRect(-120, 40, 240, 120);
    deskGfx.lineStyle(2, 0x22363e, 1);
    deskGfx.strokeRect(-120, 40, 240, 120);
    container.add(deskGfx);

    // CRT Monitor chassis
    this.terminalGfx = this.add.graphics();
    container.add(this.terminalGfx);

    const drawMonitor = () => {
      this.terminalGfx.clear();
      // Outer beige/grey casing
      this.terminalGfx.fillStyle(0x232f35, 1);
      this.terminalGfx.fillRoundedRect(-85, -60, 170, 110, 6);
      this.terminalGfx.lineStyle(2, 0x3b4e56, 1);
      this.terminalGfx.strokeRoundedRect(-85, -60, 170, 110, 6);

      // CRT screen interior
      const screenColor = state.powerRestored ? 0x071e16 : 0x06090a;
      this.terminalGfx.fillStyle(screenColor, 1);
      this.terminalGfx.fillRoundedRect(-75, -50, 150, 90, 4);
      this.terminalGfx.lineStyle(1.5, state.powerRestored ? 0x33ff88 : 0x1d2f2b, 0.8);
      this.terminalGfx.strokeRoundedRect(-75, -50, 150, 90, 4);

      if (state.powerRestored) {
        // Screen text lines simulation
        this.terminalGfx.fillStyle(0x33ff88, 0.85);
        this.terminalGfx.fillRect(-65, -38, 70, 4);
        this.terminalGfx.fillRect(-65, -28, 120, 3);
        this.terminalGfx.fillRect(-65, -20, 100, 3);
        this.terminalGfx.fillRect(-65, -12, 115, 3);
        this.terminalGfx.fillStyle(0xffb833, 1);
        this.terminalGfx.fillRect(-65, 8, 80, 18);
      }
    };

    drawMonitor();

    const monitorLabel = this.add.text(0, 17, 'TERMINAL 01', {
      fontFamily: 'Courier New, monospace',
      fontSize: '9px',
      color: '#000000',
      fontStyle: 'bold',
    });
    monitorLabel.setOrigin(0.5);
    container.add(monitorLabel);

    // Click interactive
    container.setSize(180, 140);
    container.setInteractive(new Phaser.Geom.Rectangle(-85, -60, 170, 110), Phaser.Geom.Rectangle.Contains);

    container.on('pointerdown', () => {
      SoundEngine.getInstance().playClick();
      if (!state.powerRestored) {
        this.dialogueBox.show('System', 'The monitoring terminal has no power. Turn on the breaker switch first.');
        return;
      }

      state.discoverLog('log_02_containment');
      this.hud.showToast('NEW LOG RECOVERED: INCIDENT LOG');
      this.logViewer.show('log_02_containment');
    });

    // Update terminal monitor when power state changes
    state.subscribe('power', () => drawMonitor());
  }

  private renderQuarantineDoor(): void {
    const state = GameStateManager.getInstance();
    const container = this.add.container(790, 275);

    this.doorGfx = this.add.graphics();
    container.add(this.doorGfx);

    const doorTitle = this.add.text(0, -185, 'SECTOR 4 COMMUNICATIONS LAB', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#ffb833',
      fontStyle: 'bold',
    });
    doorTitle.setOrigin(0.5);
    container.add(doorTitle);

    this.doorStatusText = this.add.text(
      0,
      -165,
      state.airlockUnlocked ? '[ UNLOCKED - CLICK TO ENTER ]' : '[ QUARANTINE SEAL ACTIVE ]',
      {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: state.airlockUnlocked ? '#33ff88' : '#ff4444',
        fontStyle: 'bold',
      }
    );
    this.doorStatusText.setOrigin(0.5);
    container.add(this.doorStatusText);

    const drawDoor = () => {
      this.doorGfx.clear();
      // Massive steel door frame
      this.doorGfx.fillStyle(0x152227, 1);
      this.doorGfx.fillRoundedRect(-110, -150, 220, 310, 4);
      this.doorGfx.lineStyle(3, 0x293f47, 1);
      this.doorGfx.strokeRoundedRect(-110, -150, 220, 310, 4);

      if (state.airlockUnlocked) {
        // Door split open showing dark corridor
        this.doorGfx.fillStyle(0x04080a, 1);
        this.doorGfx.fillRect(-90, -135, 180, 280);

        // Green access light
        this.doorGfx.fillStyle(0x33ff88, 1);
        this.doorGfx.fillCircle(0, -110, 8);
      } else {
        // Sealed blast door panels
        this.doorGfx.fillStyle(0x1d2c32, 1);
        this.doorGfx.fillRect(-95, -135, 93, 280);
        this.doorGfx.fillRect(2, -135, 93, 280);
        this.doorGfx.lineStyle(2, 0x0b1316, 1);
        this.doorGfx.lineBetween(0, -135, 0, 145);

        // Circular locking wheel
        this.doorGfx.fillStyle(0x283d45, 1);
        this.doorGfx.fillCircle(0, 10, 36);
        this.doorGfx.lineStyle(3, 0x486673, 1);
        this.doorGfx.strokeCircle(0, 10, 36);

        // Red lockdown light
        this.doorGfx.fillStyle(0xcc2222, 1);
        this.doorGfx.fillCircle(0, -110, 8);
      }
    };

    drawDoor();

    // Click interaction
    container.setSize(220, 310);
    container.setInteractive(new Phaser.Geom.Rectangle(-110, -150, 220, 310), Phaser.Geom.Rectangle.Contains);

    container.on('pointerdown', () => {
      if (!state.powerRestored) {
        SoundEngine.getInstance().playErrorBuzz();
        this.dialogueBox.show('System', 'The pneumatic blast door is locked down. Aux power is required to disengage clamps.');
        return;
      }

      if (!state.airlockUnlocked) {
        SoundEngine.getInstance().playHydraulicDoor();
        state.unlockAirlock();
        this.doorStatusText.setText('[ UNLOCKED - CLICK TO ENTER ]');
        this.doorStatusText.setColor('#33ff88');
        drawDoor();
        this.hud.showToast('QUARANTINE CLAMPS DISENGAGED');
        this.dialogueBox.show(
          'Field Investigator',
          'The pneumatic seals hissed open. The air rushing from the communications lab is freezing cold... and carries a strange electronic static taste.'
        );
        return;
      }

      // Enter Communications Lab
      SoundEngine.getInstance().playClick();
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(420, () => {
        this.scene.start('LabScene');
      });
    });
  }

  private renderOverheadBeacon(): void {
    const beacon = this.add.graphics();
    let angle = 0;

    this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        angle += 0.08;
        const state = GameStateManager.getInstance();
        beacon.clear();

        // Beacon lamp mount
        beacon.fillStyle(0x203038, 1);
        beacon.fillRect(502, 48, 20, 16);

        // Rotating light beam
        const color = state.powerRestored ? 0xffb833 : 0xff3333;
        const alpha = Math.abs(Math.sin(angle)) * 0.35 + 0.1;
        beacon.fillStyle(color, alpha);
        beacon.fillCircle(512, 60, 24);
      },
    });
  }
}
