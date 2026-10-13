import Phaser from 'phaser';
import { SoundEngine } from '../audio/SoundEngine';
import { GameStateManager } from '../state/GameState';
import { DialogueBox } from './ui/DialogueBox';
import { HUD } from './ui/HUD';
import { LogViewer } from './ui/LogViewer';

export class KeypadScene extends Phaser.Scene {
  private hud!: HUD;
  private logViewer!: LogViewer;
  private dialogueBox!: DialogueBox;

  private enteredCode = '';
  private targetCode = '5729';
  private maxDigits = 4;
  private isUnlocked = false;

  private displayDigitsText!: Phaser.GameObjects.Text;
  private statusLedGfx!: Phaser.GameObjects.Graphics;
  private statusMessageText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'KeypadScene' });
  }

  create(): void {
    const state = GameStateManager.getInstance();
    state.currentScene = 'KeypadScene';
    this.isUnlocked = state.keypadSolved;

    this.logViewer = new LogViewer(this);
    this.dialogueBox = new DialogueBox(this);
    this.hud = new HUD(this, 'Sub-Vault 9 Isolation Lock', this.logViewer);

    this.renderChassis();
    this.renderKeypad();

    // Narrative prompt
    if (!this.isUnlocked) {
      this.time.delayedCall(350, () => {
        this.dialogueBox.show(
          'Security Keypad Console',
          'SUB-VAULT 9 ISOLATION OVERRIDE REQUIRED. Enter the 4-digit facility override sequence. Clues can be deduced from Dr. Thorne\'s field notes and the decoded oscilloscope transmission in your logs.'
        );
      });
    }
  }

  private renderChassis(): void {
    const width = 1024;
    const height = 700;

    const bg = this.add.graphics();
    // Dark room backdrop
    bg.fillStyle(0x060b0e, 1);
    bg.fillRect(0, 48, width, height - 48);

    // Wall panels and hazard borders
    bg.lineStyle(2, 0x182c35, 1);
    bg.lineBetween(0, 480, width, 480);

    // Hazard stripes around the vault lock console
    for (let x = 260; x <= 720; x += 120) {
      this.add.image(x, 100, 'tex_hazard').setScale(1, 0.7);
    }

    // Keypad heavy housing (Center: 512, 380)
    const housing = this.add.graphics();
    housing.fillStyle(0x131f24, 1);
    housing.fillRoundedRect(322, 130, 380, 520, 10);
    housing.lineStyle(3, 0x2d454f, 1);
    housing.strokeRoundedRect(322, 130, 380, 520, 10);

    // Header label plate
    housing.fillStyle(0x0c161a, 1);
    housing.fillRect(342, 150, 340, 36);
    housing.lineStyle(1, 0x1f473c, 1);
    housing.strokeRect(342, 150, 340, 36);

    this.add
      .text(512, 168, 'SUB-VAULT 9 // PNEUMATIC SEAL OVERRIDE', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#ffb833',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Return to Lab button
    const backBtn = this.add.container(140, 95);
    const backGfx = this.add.graphics();
    backGfx.fillStyle(0x0d201b, 0.9);
    backGfx.fillRoundedRect(-50, -14, 100, 28, 4);
    backGfx.lineStyle(1, 0x33ff88, 0.8);
    backGfx.strokeRoundedRect(-50, -14, 100, 28, 4);

    const backTxt = this.add.text(0, 0, '< LAB HUB', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#33ff88',
      fontStyle: 'bold',
    });
    backTxt.setOrigin(0.5);

    backBtn.add([backGfx, backTxt]);
    backBtn.setSize(100, 28);
    backBtn.setInteractive(new Phaser.Geom.Rectangle(-50, -14, 100, 28), Phaser.Geom.Rectangle.Contains);
    backBtn.on('pointerdown', () => {
      SoundEngine.getInstance().playClick();
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.time.delayedCall(370, () => {
        this.scene.start('LabScene');
      });
    });

    // LED status light on housing
    this.statusLedGfx = this.add.graphics();
    this.updateStatusLed();
  }

  private updateStatusLed(): void {
    this.statusLedGfx.clear();
    const state = GameStateManager.getInstance();
    const unlocked = this.isUnlocked || state.keypadSolved;

    // Status LED bulb
    this.statusLedGfx.fillStyle(unlocked ? 0x33ff88 : 0xee2222, 1);
    this.statusLedGfx.fillCircle(640, 168, 8);
    this.statusLedGfx.lineStyle(2, 0xffffff, 0.7);
    this.statusLedGfx.strokeCircle(640, 168, 8);

    // Faint halo glow
    this.statusLedGfx.fillStyle(unlocked ? 0x33ff88 : 0xee2222, 0.25);
    this.statusLedGfx.fillCircle(640, 168, 16);
  }

  private renderKeypad(): void {
    const startX = 352;
    const startY = 210;
    const width = 320;

    // 1. Digital LED Display Window
    const displayBox = this.add.graphics();
    displayBox.fillStyle(0x060f0d, 1);
    displayBox.fillRoundedRect(startX, startY, width, 68, 6);
    displayBox.lineStyle(2, 0x1d473c, 1);
    displayBox.strokeRoundedRect(startX, startY, width, 68, 6);

    this.displayDigitsText = this.add.text(startX + width / 2, startY + 26, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '28px',
      color: '#33ff88',
      fontStyle: 'bold',
      letterSpacing: 10,
    });
    this.displayDigitsText.setOrigin(0.5);

    this.statusMessageText = this.add.text(
      startX + width / 2,
      startY + 52,
      this.isUnlocked ? 'ACCESS AUTHORIZED // CLAMPS OPEN' : 'ENTER 4-DIGIT PIN',
      {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: this.isUnlocked ? '#33ff88' : '#8ab4b8',
      }
    );
    this.statusMessageText.setOrigin(0.5);

    this.updateDisplay();

    // 2. Tactile 3x4 Keypad Matrix
    const buttons = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['CLR', '0', 'ENT'],
    ];

    const btnW = 86;
    const btnH = 54;
    const gapX = 18;
    const gapY = 14;
    const matrixStartY = startY + 90;

    buttons.forEach((row, rIdx) => {
      row.forEach((val, cIdx) => {
        const x = startX + 16 + cIdx * (btnW + gapX);
        const y = matrixStartY + rIdx * (btnH + gapY);
        this.createKeypadButton(x, y, btnW, btnH, val);
      });
    });

    // Keyboard support (0-9, Backspace, Enter)
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (this.isUnlocked) return;
      if (event.key >= '0' && event.key <= '9') {
        this.handleDigit(event.key);
      } else if (event.key === 'Backspace' || event.key === 'Delete') {
        this.handleClear();
      } else if (event.key === 'Enter') {
        this.handleEnter();
      }
    });
  }

  private createKeypadButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const gfx = this.add.graphics();
    const isSpecial = label === 'CLR' || label === 'ENT';

    const txt = this.add.text(w / 2, h / 2, label, {
      fontFamily: 'Courier New, monospace',
      fontSize: isSpecial ? '14px' : '18px',
      color: label === 'ENT' ? '#33ff88' : label === 'CLR' ? '#ff6666' : '#d0e0e3',
      fontStyle: 'bold',
    });
    txt.setOrigin(0.5);

    const render = (isHover: boolean, isPressed: boolean) => {
      gfx.clear();
      // Button bevel shading
      const baseColor = isPressed ? 0x091216 : isHover ? 0x22363e : 0x18272e;
      gfx.fillStyle(baseColor, 1);
      gfx.fillRoundedRect(0, 0, w, h, 4);

      const strokeColor = isHover ? 0xffb833 : 0x36505c;
      gfx.lineStyle(1.5, strokeColor, 1);
      gfx.strokeRoundedRect(0, 0, w, h, 4);
    };

    render(false, false);
    container.add([gfx, txt]);
    container.setSize(w, h);
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => render(true, false));
    container.on('pointerout', () => render(false, false));
    container.on('pointerdown', () => {
      render(true, true);
      this.time.delayedCall(100, () => render(true, false));

      if (label === 'CLR') {
        this.handleClear();
      } else if (label === 'ENT') {
        this.handleEnter();
      } else {
        this.handleDigit(label);
      }
    });

    return container;
  }

  private handleDigit(digit: string): void {
    if (this.isUnlocked) return;
    if (this.enteredCode.length >= this.maxDigits) {
      SoundEngine.getInstance().playErrorBuzz();
      return;
    }

    SoundEngine.getInstance().playKeypadBeep(700 + parseInt(digit, 10) * 60);
    this.enteredCode += digit;
    this.updateDisplay();

    // Auto-check when reaching 4 digits
    if (this.enteredCode.length === this.maxDigits) {
      this.time.delayedCall(200, () => this.handleEnter());
    }
  }

  private handleClear(): void {
    if (this.isUnlocked) return;
    SoundEngine.getInstance().playClick();
    this.enteredCode = '';
    this.statusMessageText.setText('ENTER 4-DIGIT PIN');
    this.statusMessageText.setColor('#8ab4b8');
    this.updateDisplay();
  }

  private handleEnter(): void {
    if (this.isUnlocked) return;

    if (this.enteredCode === this.targetCode) {
      // Solved!
      this.isUnlocked = true;
      const state = GameStateManager.getInstance();
      state.solveKeypad();

      SoundEngine.getInstance().playSuccessChime();
      SoundEngine.getInstance().playHydraulicDoor();
      this.updateStatusLed();

      this.statusMessageText.setText('ACCESS GRANTED // VAULT UNSEALED');
      this.statusMessageText.setColor('#33ff88');
      this.hud.showToast('SUB-VAULT 9 OVERRIDE ACCEPTED');

      this.dialogueBox.show(
        'Hydraulic Interlock System',
        'CODE ACCEPTED: 5 - 7 - 2 - 9.\n\nPneumatic pressure equalized. The massive isolation blast doors of Sub-Vault 9 have retracted into the bunker floor.',
        () => {
          // Transition into the final chamber
          this.cameras.main.fadeOut(600, 0, 0, 0);
          this.time.delayedCall(650, () => {
            this.scene.start('VaultScene');
          });
        }
      );
    } else {
      SoundEngine.getInstance().playErrorBuzz();
      this.statusMessageText.setText('INVALID CODE // ACCESS DENIED');
      this.statusMessageText.setColor('#ff4444');
      this.hud.showToast('ACCESS DENIED: INCORRECT SEQUENCE', true);

      // Flash red and reset
      this.time.delayedCall(900, () => {
        if (!this.isUnlocked) {
          this.enteredCode = '';
          this.statusMessageText.setText('ENTER 4-DIGIT PIN');
          this.statusMessageText.setColor('#8ab4b8');
          this.updateDisplay();
        }
      });
    }
  }

  private updateDisplay(): void {
    if (this.isUnlocked) {
      this.displayDigitsText.setText('5 7 2 9');
      this.displayDigitsText.setColor('#33ff88');
      return;
    }

    const placeholder = ['_', '_', '_', '_'];
    for (let i = 0; i < this.enteredCode.length; i++) {
      placeholder[i] = this.enteredCode[i];
    }
    this.displayDigitsText.setText(placeholder.join(' '));
    this.displayDigitsText.setColor('#33ff88');
  }
}
