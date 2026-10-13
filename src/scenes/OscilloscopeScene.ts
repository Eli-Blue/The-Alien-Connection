import Phaser from 'phaser';
import { SoundEngine } from '../audio/SoundEngine';
import { GameStateManager } from '../state/GameState';
import { DialogueBox } from './ui/DialogueBox';
import { HUD } from './ui/HUD';
import { LogViewer } from './ui/LogViewer';

export class OscilloscopeScene extends Phaser.Scene {
  private hud!: HUD;
  private logViewer!: LogViewer;
  private dialogueBox!: DialogueBox;

  private currentFreq = 74.2;
  private targetFreq = 84.7;
  private currentHarmonic = 22;
  private targetHarmonic = 65;

  private crtScreenGfx!: Phaser.GameObjects.Graphics;
  private freqReadoutText!: Phaser.GameObjects.Text;
  private harmonicReadoutText!: Phaser.GameObjects.Text;
  private lockStatusText!: Phaser.GameObjects.Text;
  private decodedMessageContainer!: Phaser.GameObjects.Container;
  private isLocked = false;
  private phase = 0;

  constructor() {
    super({ key: 'OscilloscopeScene' });
  }

  create(): void {
    const state = GameStateManager.getInstance();
    state.currentScene = 'OscilloscopeScene';

    this.isLocked = state.oscilloscopeSolved;
    if (this.isLocked) {
      this.currentFreq = this.targetFreq;
      this.currentHarmonic = this.targetHarmonic;
    }

    this.logViewer = new LogViewer(this);
    this.dialogueBox = new DialogueBox(this);
    this.hud = new HUD(this, 'Signal Receiver // Oscilloscope Node 3', this.logViewer);

    this.renderChassis();
    this.renderCrtScreen();
    this.renderControls();
    this.renderDecodedDisplay();

    // Narrative prompt
    if (!this.isLocked) {
      this.time.delayedCall(400, () => {
        this.dialogueBox.show(
          'Telemetry Terminal',
          'ANALOG RECEIVER ONLINE. Calibrate Carrier Frequency and Harmonic Resonance to match the borehole acoustic wave. Consult Dr. Thorne\'s field notes in the log archive for calibration targets.'
        );
      });
    }
  }

  private renderChassis(): void {
    const width = 1024;
    const height = 700;

    const bg = this.add.graphics();
    // Dark room backdrop
    bg.fillStyle(0x060c0f, 1);
    bg.fillRect(0, 48, width, height - 48);

    // Main steel equipment rack housing
    bg.fillStyle(0x131e24, 1);
    bg.fillRoundedRect(60, 65, 904, 600, 10);
    bg.lineStyle(3, 0x243944, 1);
    bg.strokeRoundedRect(60, 65, 904, 600, 10);

    // Bevel shading and screws
    const screwColor = 0x486470;
    bg.fillStyle(screwColor, 1);
    bg.fillCircle(75, 80, 4);
    bg.fillCircle(945, 80, 4);
    bg.fillCircle(75, 650, 4);
    bg.fillCircle(945, 650, 4);

    // Header label plate
    bg.fillStyle(0x091418, 1);
    bg.fillRect(90, 80, 844, 34);
    bg.lineStyle(1, 0x1f473c, 1);
    bg.strokeRect(90, 80, 844, 34);

    this.add.text(105, 89, 'MODEL 83-E OSCILLOSCOPE // BOREHOLE ACOUSTIC SENSOR ARRAY', {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      color: '#33ff88',
      fontStyle: 'bold',
    });

    // Back to Lab button
    const backBtn = this.add.container(870, 97);
    const backGfx = this.add.graphics();
    backGfx.fillStyle(0x0f2420, 0.9);
    backGfx.fillRoundedRect(-45, -12, 90, 24, 3);
    backGfx.lineStyle(1, 0x33ff88, 0.8);
    backGfx.strokeRoundedRect(-45, -12, 90, 24, 3);

    const backTxt = this.add.text(0, 0, '< RETURN', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#33ff88',
      fontStyle: 'bold',
    });
    backTxt.setOrigin(0.5);

    backBtn.add([backGfx, backTxt]);
    backBtn.setSize(90, 24);
    backBtn.setInteractive(new Phaser.Geom.Rectangle(-45, -12, 90, 24), Phaser.Geom.Rectangle.Contains);
    backBtn.on('pointerdown', () => {
      SoundEngine.getInstance().playClick();
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.time.delayedCall(370, () => {
        this.scene.start('LabScene');
      });
    });
  }

  private renderCrtScreen(): void {
    // CRT Screen Housing on left
    const screenX = 90;
    const screenY = 130;
    const screenW = 540;
    const screenH = 380;

    const housing = this.add.graphics();
    housing.fillStyle(0x081014, 1);
    housing.fillRoundedRect(screenX, screenY, screenW, screenH, 12);
    housing.lineStyle(4, 0x1a2e37, 1);
    housing.strokeRoundedRect(screenX, screenY, screenW, screenH, 12);

    // Cathode ray tube phosphorescent face
    this.crtScreenGfx = this.add.graphics();

    // Oscilloscope Grid & Wave loop
    this.time.addEvent({
      delay: 35,
      loop: true,
      callback: () => this.drawOscilloscopeWave(screenX, screenY, screenW, screenH),
    });

    // Digital readout panel under CRT
    const readoutBox = this.add.graphics();
    readoutBox.fillStyle(0x050a0d, 1);
    readoutBox.fillRect(screenX, screenY + screenH + 15, screenW, 90);
    readoutBox.lineStyle(2, 0x1d3d34, 1);
    readoutBox.strokeRect(screenX, screenY + screenH + 15, screenW, 90);

    this.freqReadoutText = this.add.text(screenX + 20, screenY + screenH + 28, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '15px',
      color: '#33ff88',
      fontStyle: 'bold',
    });

    this.harmonicReadoutText = this.add.text(screenX + 20, screenY + screenH + 58, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      color: '#ffb833',
    });

    this.lockStatusText = this.add.text(screenX + 320, screenY + screenH + 35, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      fontStyle: 'bold',
    });

    this.updateReadout();
  }

  private drawOscilloscopeWave(sx: number, sy: number, sw: number, sh: number): void {
    this.phase += 0.08;
    this.crtScreenGfx.clear();

    // Screen phosphorescence background
    this.crtScreenGfx.fillStyle(0x051b14, 1);
    this.crtScreenGfx.fillRoundedRect(sx + 8, sy + 8, sw - 16, sh - 16, 8);

    // Reticle / Graticule grid
    this.crtScreenGfx.lineStyle(1, 0x0f3627, 0.7);
    const midX = sx + sw / 2;
    const midY = sy + sh / 2;

    for (let x = sx + 20; x < sx + sw - 20; x += 35) {
      this.crtScreenGfx.lineBetween(x, sy + 15, x, sy + sh - 15);
    }
    for (let y = sy + 20; y < sy + sh - 20; y += 35) {
      this.crtScreenGfx.lineBetween(sx + 15, y, sx + sw - 15, y);
    }

    // Center crosshairs
    this.crtScreenGfx.lineStyle(1.5, 0x1d5f47, 0.9);
    this.crtScreenGfx.lineBetween(sx + 15, midY, sx + sw - 15, midY);
    this.crtScreenGfx.lineBetween(midX, sy + 15, midX, sy + sh - 15);

    // Delta between current and target
    const freqDelta = Math.abs(this.currentFreq - this.targetFreq);
    const harmonicDelta = Math.abs(this.currentHarmonic - this.targetHarmonic);
    const isHarmonized = freqDelta <= 0.3 && harmonicDelta <= 3;

    // 1. Target extraterrestrial carrier wave (amber / cyan reference pulse)
    this.crtScreenGfx.lineStyle(1.5, 0xffb833, 0.55);
    this.crtScreenGfx.beginPath();
    for (let x = sx + 20; x <= sx + sw - 20; x += 3) {
      const t = (x - (sx + 20)) / (sw - 40);
      const y = midY + Math.sin(t * 18 + this.phase) * 60 * Math.sin(t * Math.PI);
      if (x === sx + 20) this.crtScreenGfx.moveTo(x, y);
      else this.crtScreenGfx.lineTo(x, y);
    }
    this.crtScreenGfx.strokePath();

    // 2. Player receiver wave (bright green phosphor trace)
    this.crtScreenGfx.lineStyle(2, isHarmonized ? 0x33ff88 : 0x2be47c, 0.95);
    this.crtScreenGfx.beginPath();

    const freqFactor = (this.currentFreq / 84.7) * 18;
    const harmFactor = this.currentHarmonic / 65;
    const noise = isHarmonized ? 0 : (freqDelta * 0.4 + harmonicDelta * 0.1) * (Math.random() - 0.5) * 8;

    for (let x = sx + 20; x <= sx + sw - 20; x += 2) {
      const t = (x - (sx + 20)) / (sw - 40);
      const wavePrimary = Math.sin(t * freqFactor + this.phase);
      const waveHarmonic = Math.sin(t * freqFactor * 2 - this.phase * 0.5) * 0.35 * harmFactor;
      const y = midY + (wavePrimary + waveHarmonic) * 60 * Math.sin(t * Math.PI) + noise;

      if (x === sx + 20) this.crtScreenGfx.moveTo(x, y);
      else this.crtScreenGfx.lineTo(x, y);
    }
    this.crtScreenGfx.strokePath();
  }

  private renderControls(): void {
    const ctrlX = 660;
    const ctrlY = 130;
    const ctrlW = 280;
    const ctrlH = 380;

    const box = this.add.graphics();
    box.fillStyle(0x0e171b, 1);
    box.fillRoundedRect(ctrlX, ctrlY, ctrlW, ctrlH, 8);
    box.lineStyle(2, 0x22363f, 1);
    box.strokeRoundedRect(ctrlX, ctrlY, ctrlW, ctrlH, 8);

    this.add.text(ctrlX + 20, ctrlY + 20, 'ANALOG CALIBRATION', {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      color: '#ffb833',
      fontStyle: 'bold',
    });

    // 1. Carrier Frequency Controls
    this.add.text(ctrlX + 20, ctrlY + 60, 'CARRIER FREQUENCY (kHz)', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#8ab4b8',
    });

    this.createAdjustButton(ctrlX + 20, ctrlY + 90, '- 5.0', () => this.adjustFrequency(-5.0));
    this.createAdjustButton(ctrlX + 80, ctrlY + 90, '- 0.5', () => this.adjustFrequency(-0.5));
    this.createAdjustButton(ctrlX + 140, ctrlY + 90, '+ 0.5', () => this.adjustFrequency(+0.5));
    this.createAdjustButton(ctrlX + 200, ctrlY + 90, '+ 5.0', () => this.adjustFrequency(+5.0));

    // Fine tune single step
    this.createAdjustButton(ctrlX + 50, ctrlY + 135, 'FINE -0.1', () => this.adjustFrequency(-0.1));
    this.createAdjustButton(ctrlX + 150, ctrlY + 135, 'FINE +0.1', () => this.adjustFrequency(+0.1));

    // 2. Harmonic Resonance Controls
    this.add.text(ctrlX + 20, ctrlY + 195, 'HARMONIC MODULATION (%)', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#8ab4b8',
    });

    this.createAdjustButton(ctrlX + 20, ctrlY + 225, '- 10%', () => this.adjustHarmonic(-10));
    this.createAdjustButton(ctrlX + 80, ctrlY + 225, '- 1%', () => this.adjustHarmonic(-1));
    this.createAdjustButton(ctrlX + 140, ctrlY + 225, '+ 1%', () => this.adjustHarmonic(+1));
    this.createAdjustButton(ctrlX + 200, ctrlY + 225, '+ 10%', () => this.adjustHarmonic(+10));

    // Synchronize / Lock Button
    this.createMenuButton(ctrlX + 140, ctrlY + 320, 'ENGAGE CARRIER LOCK', () => {
      this.checkAlignment();
    });
  }

  private createAdjustButton(
    x: number,
    y: number,
    label: string,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const gfx = this.add.graphics();
    const btnW = 54;
    const btnH = 30;

    const txt = this.add.text(btnW / 2, btnH / 2, label, {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      color: '#33ff88',
      fontStyle: 'bold',
    });
    txt.setOrigin(0.5);

    const render = (isHover: boolean) => {
      gfx.clear();
      gfx.fillStyle(isHover ? 0x163428 : 0x132227, 0.95);
      gfx.fillRoundedRect(0, 0, btnW, btnH, 3);
      gfx.lineStyle(1, isHover ? 0xffb833 : 0x2e5046, 1);
      gfx.strokeRoundedRect(0, 0, btnW, btnH, 3);
      txt.setColor(isHover ? '#ffb833' : '#33ff88');
    };

    render(false);
    container.add([gfx, txt]);
    container.setSize(btnW, btnH);
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, btnW, btnH), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => render(true));
    container.on('pointerout', () => render(false));
    container.on('pointerdown', () => {
      callback();
      render(true);
    });

    return container;
  }

  private createMenuButton(
    x: number,
    y: number,
    label: string,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const gfx = this.add.graphics();
    const txt = this.add.text(0, 0, `[ ${label} ]`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#33ff88',
      fontStyle: 'bold',
    });
    txt.setOrigin(0.5);

    const w = 240;
    const h = 36;

    const render = (isHover: boolean) => {
      gfx.clear();
      gfx.fillStyle(isHover ? 0x1d4638 : 0x0c1e19, 1);
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

    return container;
  }

  private adjustFrequency(delta: number): void {
    if (this.isLocked) return;
    this.currentFreq = Math.round((this.currentFreq + delta) * 10) / 10;
    this.currentFreq = Math.max(70.0, Math.min(100.0, this.currentFreq));
    const dist = Math.abs(this.currentFreq - this.targetFreq) / 15;
    SoundEngine.getInstance().playAlienResonance(dist);
    this.updateReadout();
  }

  private adjustHarmonic(delta: number): void {
    if (this.isLocked) return;
    this.currentHarmonic = Math.max(0, Math.min(100, this.currentHarmonic + delta));
    SoundEngine.getInstance().playClick();
    this.updateReadout();
  }

  private updateReadout(): void {
    this.freqReadoutText.setText(`CARRIER FREQ : ${this.currentFreq.toFixed(1)} kHz`);
    this.harmonicReadoutText.setText(`MODULATION   : ${this.currentHarmonic}%`);

    const freqDelta = Math.abs(this.currentFreq - this.targetFreq);
    const harmonicDelta = Math.abs(this.currentHarmonic - this.targetHarmonic);
    const aligned = freqDelta <= 0.3 && harmonicDelta <= 3;

    if (this.isLocked || aligned) {
      this.lockStatusText.setText('[ CARRIER SYNCHRONIZED ]');
      this.lockStatusText.setColor('#33ff88');
    } else {
      this.lockStatusText.setText('[ CARRIER UNLOCKED ]');
      this.lockStatusText.setColor('#ff4444');
    }
  }

  private checkAlignment(): void {
    const state = GameStateManager.getInstance();
    const freqDelta = Math.abs(this.currentFreq - this.targetFreq);
    const harmonicDelta = Math.abs(this.currentHarmonic - this.targetHarmonic);

    if (freqDelta <= 0.3 && harmonicDelta <= 3) {
      this.isLocked = true;
      SoundEngine.getInstance().playSuccessChime();
      SoundEngine.getInstance().playRevealStinger();
      state.solveOscilloscope();
      this.updateReadout();
      this.hud.showToast('EXTRATERRESTRIAL SIGNAL DECODED');

      this.decodedMessageContainer.setVisible(true);
      this.dialogueBox.show(
        'Decoded Transmission',
        'CARRIER HARMONIC SYNCHRONIZED!\n\nThe oscilloscope printer begins spitting out continuous telemetry:\n"WE DO NOT COME FROM ABOVE. WE HAVE BEEN ASLEEP UNDER YOUR CONTINENT FOR THREE HUNDRED MILLION YEARS. YOUR DRILL AWAKENED THE NERVE ENDINGS."\n\nEMERGENCY OVERRIDE CODE FOR SUB-VAULT 9 CONFIRMED: 5 - 7 - 2 - 9.'
      );
    } else {
      SoundEngine.getInstance().playErrorBuzz();
      this.hud.showToast('SIGNAL OUT OF ALIGNMENT', true);
      this.dialogueBox.show(
        'System Warning',
        `Carried wave mismatched. Offset: ${freqDelta.toFixed(1)} kHz, Harmonic: ${harmonicDelta}%. Check Dr. Thorne's diary fragment in your logs for exact frequency targets (Target: 84.7 kHz / 65%).`
      );
    }
  }

  private renderDecodedDisplay(): void {
    const state = GameStateManager.getInstance();
    this.decodedMessageContainer = this.add.container(660, 520);
    this.decodedMessageContainer.setVisible(state.oscilloscopeSolved);

    const box = this.add.graphics();
    box.fillStyle(0x061811, 0.95);
    box.fillRoundedRect(0, 0, 280, 95, 6);
    box.lineStyle(1.5, 0x33ff88, 1);
    box.strokeRoundedRect(0, 0, 280, 95, 6);
    this.decodedMessageContainer.add(box);

    const txt = this.add.text(
      12,
      12,
      'DECRYPTED OVERRIDE:\nSUB-VAULT 9 CODE: [ 5 - 7 - 2 - 9 ]\n\nClick to inspect full transcript.',
      {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: '#ffb833',
        lineSpacing: 4,
      }
    );
    this.decodedMessageContainer.add(txt);

    this.decodedMessageContainer.setSize(280, 95);
    this.decodedMessageContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, 280, 95), Phaser.Geom.Rectangle.Contains);
    this.decodedMessageContainer.on('pointerdown', () => {
      SoundEngine.getInstance().playClick();
      this.logViewer.show('log_04_intercept');
    });
  }
}
