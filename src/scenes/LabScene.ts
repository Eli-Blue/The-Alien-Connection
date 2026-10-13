import Phaser from 'phaser';
import { SoundEngine } from '../audio/SoundEngine';
import { GameStateManager } from '../state/GameState';
import { HiddenObjectDef, InventoryItem } from '../state/types';
import { DialogueBox } from './ui/DialogueBox';
import { HUD } from './ui/HUD';
import { LogViewer } from './ui/LogViewer';

export class LabScene extends Phaser.Scene {
  private hud!: HUD;
  private logViewer!: LogViewer;
  private dialogueBox!: DialogueBox;
  private hiddenObjects: HiddenObjectDef[] = [
    {
      id: 'data_reel',
      name: 'De-gaussed Data Reel',
      description: 'Magnetic recording tape from the primary borehole hydrophone array.',
      x: 180,
      y: 450,
      width: 48,
      height: 48,
      clue: 'Search among the fallen magnetic tape racks on the lower left floor.',
    },
    {
      id: 'dial_knob',
      name: 'Emergency Tuner Dial',
      description: 'Precision potentiometer knob. Essential to calibrate the receiver frequency.',
      x: 370,
      y: 350,
      width: 44,
      height: 44,
      clue: 'Lying beside the overturned coffee mug on the communications bench.',
    },
    {
      id: 'bio_keycard',
      name: 'Bio-Safety Pass (Lvl 2)',
      description: "Dr. Thorne's personal access badge. Coated in a faint iridescent powder.",
      x: 290,
      y: 430,
      width: 40,
      height: 50,
      clue: 'Slipped halfway under the fallen clipboard near the console chair.',
    },
    {
      id: 'vacuum_tube',
      name: 'Thermionic Vacuum Tube',
      description: 'High-frequency amplifier valve. Needed to boost the carrier wave signal.',
      x: 520,
      y: 280,
      width: 36,
      height: 54,
      clue: 'Resting on the component shelf above the oscilloscope rack.',
    },
    {
      id: 'diary_fragment',
      name: "Dr. Thorne's Notes",
      description: 'Scribbled formulas: "84.7 kHz harmonic carrier. Vault code: Core-Array-Pass-Vault".',
      x: 620,
      y: 380,
      width: 46,
      height: 50,
      clue: 'Pinned beneath the magnetic tape drive housing.',
    },
    {
      id: 'dosimeter',
      name: 'EMF / Radiation Dosimeter',
      description: 'Analog electromagnetic field counter. The needle trembles toward max scale.',
      x: 710,
      y: 470,
      width: 34,
      height: 52,
      clue: 'Tucked inside the open cable trough near the vault entryway.',
    },
  ];

  private objectSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private listChecklistItems: Map<string, Phaser.GameObjects.Text> = new Map();
  private listPanelGfx!: Phaser.GameObjects.Graphics;
  private oscConsoleGfx!: Phaser.GameObjects.Graphics;
  private oscLabelText!: Phaser.GameObjects.Text;
  private vaultDoorGfx!: Phaser.GameObjects.Graphics;
  private vaultLabelText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'LabScene' });
  }

  create(): void {
    const state = GameStateManager.getInstance();
    state.currentScene = 'LabScene';

    this.logViewer = new LogViewer(this);
    this.dialogueBox = new DialogueBox(this);
    this.hud = new HUD(this, 'Communications Lab & Archive', this.logViewer);

    this.renderEnvironment();
    this.renderHiddenObjects();
    this.renderChecklistPanel();
    this.renderOscilloscopeStation();
    this.renderVaultEntrance();
    this.renderExits();

    // Narrative intro if first arrival
    if (!state.hiddenObjectsCompleted) {
      this.time.delayedCall(400, () => {
        this.dialogueBox.show(
          'Field Investigator',
          'The main communications room is in disarray. Telemetry charts, magnetic reels, and broken hardware litter the desks. A low extraterrestrial acoustic signal is murmuring through the wall speaker. I need to recover the missing components to tune the main receiver.'
        );
      });
    }
  }

  private renderEnvironment(): void {
    const width = 1024;
    const height = 700;

    const bg = this.add.graphics();
    // Dark room base
    bg.fillStyle(0x070e12, 1);
    bg.fillRect(0, 48, width, height - 48);

    // Computer mainframe racks along back wall
    for (let x = 60; x < 400; x += 110) {
      bg.fillStyle(0x111c22, 1);
      bg.fillRect(x, 70, 95, 320);
      bg.lineStyle(2, 0x1d2e37, 1);
      bg.strokeRect(x, 70, 95, 320);

      // Blinking terminal LEDs
      for (let row = 0; row < 6; row++) {
        bg.fillStyle(0x0a1014, 1);
        bg.fillRect(x + 10, 90 + row * 45, 75, 32);
        bg.fillStyle(row % 2 === 0 ? 0x33ff88 : 0xffb833, 0.7);
        bg.fillCircle(x + 20, 105 + row * 45, 3);
        bg.fillCircle(x + 32, 105 + row * 45, 3);
      }
    }

    // Creeping alien bioluminescent mycelium on right wall / ceiling
    const bioGfx = this.add.graphics();
    bioGfx.fillStyle(0x18e8a0, 0.08);
    bioGfx.fillCircle(820, 110, 90);
    bioGfx.fillCircle(870, 160, 60);
    bioGfx.fillCircle(780, 140, 70);

    // Glowing organic tendrils
    bioGfx.lineStyle(1.5, 0x33ffaa, 0.4);
    bioGfx.beginPath();
    bioGfx.moveTo(850, 48);
    bioGfx.lineTo(820, 110);
    bioGfx.lineTo(790, 170);
    bioGfx.lineTo(750, 220);
    bioGfx.moveTo(890, 80);
    bioGfx.lineTo(880, 190);
    bioGfx.strokePath();

    // Workstation desk in center-left
    bg.fillStyle(0x131f24, 1);
    bg.fillRect(80, 390, 660, 150);
    bg.lineStyle(2, 0x22363f, 1);
    bg.strokeRect(80, 390, 660, 150);

    // Clutter: Overturned coffee cup, scattered printout sheets
    bg.fillStyle(0xd5ddd8, 0.25);
    bg.fillRect(220, 410, 40, 30);
    bg.fillRect(340, 405, 55, 35);
    bg.fillRect(440, 420, 50, 32);

    // Cable bundles hanging from ceiling
    bg.lineStyle(2, 0x090e11, 0.9);
    bg.beginPath();
    bg.moveTo(250, 48);
    bg.lineTo(260, 150);
    bg.lineTo(310, 240);
    bg.lineTo(340, 390);
    bg.moveTo(610, 48);
    bg.lineTo(630, 180);
    bg.lineTo(580, 260);
    bg.lineTo(600, 390);
    bg.strokePath();
  }

  private renderHiddenObjects(): void {
    const state = GameStateManager.getInstance();

    this.hiddenObjects.forEach((obj) => {
      if (state.isHiddenObjectFound(obj.id)) {
        return; // Already picked up
      }

      const container = this.add.container(obj.x, obj.y);

      // Sprite image based on item type
      let texKey = 'item_data_reel';
      if (obj.id === 'dial_knob') texKey = 'item_dial_knob';
      else if (obj.id === 'bio_keycard') texKey = 'item_bio_keycard';
      else if (obj.id === 'vacuum_tube') texKey = 'item_vacuum_tube';
      else if (obj.id === 'diary_fragment') texKey = 'item_diary_fragment';
      else if (obj.id === 'dosimeter') texKey = 'item_dosimeter';

      const sprite = this.add.image(0, 0, texKey);
      container.add(sprite);

      // Subtle atmospheric hover glow
      const glowGfx = this.add.graphics();
      glowGfx.fillStyle(0x33ff88, 0.15);
      glowGfx.fillCircle(0, 0, Math.max(obj.width, obj.height) * 0.7);
      glowGfx.setVisible(false);
      container.addAt(glowGfx, 0);

      container.setSize(obj.width + 16, obj.height + 16);
      container.setInteractive(
        new Phaser.Geom.Rectangle(-obj.width / 2 - 8, -obj.height / 2 - 8, obj.width + 16, obj.height + 16),
        Phaser.Geom.Rectangle.Contains
      );

      container.on('pointerover', () => {
        glowGfx.setVisible(true);
      });
      container.on('pointerout', () => {
        glowGfx.setVisible(false);
      });

      container.on('pointerdown', () => {
        this.collectHiddenObject(obj, container);
      });

      this.objectSprites.set(obj.id, container);
    });
  }

  private collectHiddenObject(obj: HiddenObjectDef, container: Phaser.GameObjects.Container): void {
    const state = GameStateManager.getInstance();

    SoundEngine.getInstance().playItemFound();
    state.markHiddenObjectFound(obj.id);

    // Create item definition for inventory
    const inventoryItem: InventoryItem = {
      id: obj.id,
      name: obj.name,
      description: obj.description,
      category:
        obj.id === 'bio_keycard'
          ? 'key'
          : obj.id === 'diary_fragment'
          ? 'clue'
          : obj.id === 'dosimeter'
          ? 'tool'
          : 'component',
    };
    state.addItem(inventoryItem);

    if (obj.id === 'diary_fragment') {
      state.discoverLog('log_03_thorne_notes');
    }

    // Sparkle collection tween
    for (let i = 0; i < 10; i++) {
      const spark = this.add.image(obj.x, obj.y, 'particle_spark');
      this.tweens.add({
        targets: spark,
        x: obj.x + (Math.random() - 0.5) * 60,
        y: obj.y + (Math.random() - 0.5) * 60,
        alpha: 0,
        scale: 0.2,
        duration: 400 + Math.random() * 200,
        onComplete: () => spark.destroy(),
      });
    }

    this.tweens.add({
      targets: container,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0,
      y: obj.y - 20,
      duration: 300,
      onComplete: () => {
        container.destroy();
        this.objectSprites.delete(obj.id);
      },
    });

    // Update checklist UI
    this.updateChecklist();
    this.hud.showToast(`ACQUIRED: ${obj.name}`);

    // Show brief dialogue / lore card
    this.dialogueBox.show('ITEM DISCOVERED: ' + obj.name, `${obj.description}\n\n[ Added to Field Inventory ]`);

    // Check completion condition
    if (state.foundHiddenObjects.size >= this.hiddenObjects.length) {
      state.completeHiddenObjects();
      SoundEngine.getInstance().playSuccessChime();
      this.time.delayedCall(700, () => {
        this.dialogueBox.show(
          'Communications Lab',
          'ALL MISSING COMPONENTS RECOVERED! The frequency dial and amplifier tube have been slotted into the oscilloscope array. The receiver is powered and emitting an active carrier frequency!'
        );
        this.updateOscilloscopeDisplay();
      });
    }
  }

  private renderChecklistPanel(): void {
    const container = this.add.container(770, 70);
    this.listPanelGfx = this.add.graphics();
    container.add(this.listPanelGfx);

    // Frame
    this.listPanelGfx.fillStyle(0x0a1417, 0.94);
    this.listPanelGfx.fillRoundedRect(0, 0, 240, 270, 6);
    this.listPanelGfx.lineStyle(1.5, 0x1d3d34, 1);
    this.listPanelGfx.strokeRoundedRect(0, 0, 240, 270, 6);

    const title = this.add.text(12, 12, 'RECOVERY CHECKLIST', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#ffb833',
      fontStyle: 'bold',
    });
    container.add(title);

    let yOffset = 42;
    this.hiddenObjects.forEach((obj) => {
      const itemTxt = this.add.text(14, yOffset, `[ ] ${obj.name}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: '#8ab4b8',
      });
      container.add(itemTxt);
      this.listChecklistItems.set(obj.id, itemTxt);
      yOffset += 36;
    });

    this.updateChecklist();
  }

  private updateChecklist(): void {
    const state = GameStateManager.getInstance();
    this.hiddenObjects.forEach((obj) => {
      const txt = this.listChecklistItems.get(obj.id);
      if (txt) {
        if (state.isHiddenObjectFound(obj.id)) {
          txt.setText(`[✓] ${obj.name}`);
          txt.setColor('#33ff88');
        } else {
          txt.setText(`[ ] ${obj.name}`);
          txt.setColor('#7a999e');
        }
      }
    });
  }

  private renderOscilloscopeStation(): void {
    const state = GameStateManager.getInstance();
    const container = this.add.container(470, 310);

    this.oscConsoleGfx = this.add.graphics();
    container.add(this.oscConsoleGfx);

    this.oscLabelText = this.add.text(0, -65, 'SIGNAL RECEIVER 03', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#ffb833',
      fontStyle: 'bold',
    });
    this.oscLabelText.setOrigin(0.5);
    container.add(this.oscLabelText);

    this.updateOscilloscopeDisplay();

    container.setSize(180, 110);
    container.setInteractive(new Phaser.Geom.Rectangle(-90, -50, 180, 100), Phaser.Geom.Rectangle.Contains);

    container.on('pointerdown', () => {
      SoundEngine.getInstance().playClick();

      if (!state.hiddenObjectsCompleted) {
        this.dialogueBox.show(
          'Signal Receiver Console',
          'The receiver is missing its calibration dial and amplifier vacuum tube. Check the recovery list to find the components in the lab.'
        );
        return;
      }

      // Transition to Puzzle 1: Oscilloscope Scene
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.time.delayedCall(370, () => {
        this.scene.start('OscilloscopeScene');
      });
    });
  }

  private updateOscilloscopeDisplay(): void {
    const state = GameStateManager.getInstance();
    this.oscConsoleGfx.clear();

    // Outer case
    this.oscConsoleGfx.fillStyle(0x19282f, 1);
    this.oscConsoleGfx.fillRoundedRect(-90, -50, 180, 100, 4);
    this.oscConsoleGfx.lineStyle(2, 0x364f5c, 1);
    this.oscConsoleGfx.strokeRoundedRect(-90, -50, 180, 100, 4);

    // CRT Bezel & Screen
    const screenBg = state.oscilloscopeSolved ? 0x052a1b : state.hiddenObjectsCompleted ? 0x0b1f1a : 0x060c0e;
    this.oscConsoleGfx.fillStyle(screenBg, 1);
    this.oscConsoleGfx.fillRoundedRect(-75, -40, 100, 80, 4);
    this.oscConsoleGfx.lineStyle(1.5, state.oscilloscopeSolved ? 0x33ff88 : 0x1f473c, 0.8);
    this.oscConsoleGfx.strokeRoundedRect(-75, -40, 100, 80, 4);

    if (state.oscilloscopeSolved) {
      // Steady synchronized sine wave
      this.oscConsoleGfx.lineStyle(2, 0x33ff88, 1);
      this.oscConsoleGfx.beginPath();
      for (let x = -70; x <= 20; x += 3) {
        const y = Math.sin((x + 70) * 0.15) * 16;
        if (x === -70) this.oscConsoleGfx.moveTo(x, y);
        else this.oscConsoleGfx.lineTo(x, y);
      }
      this.oscConsoleGfx.strokePath();
    } else if (state.hiddenObjectsCompleted) {
      // Distorted jagged waveform
      this.oscConsoleGfx.lineStyle(1.5, 0xffb833, 0.8);
      this.oscConsoleGfx.beginPath();
      for (let x = -70; x <= 20; x += 4) {
        const y = (Math.sin((x + 70) * 0.3) + (Math.random() - 0.5) * 0.8) * 18;
        if (x === -70) this.oscConsoleGfx.moveTo(x, y);
        else this.oscConsoleGfx.lineTo(x, y);
      }
      this.oscConsoleGfx.strokePath();
    }

    // Tuning knobs on right
    this.oscConsoleGfx.fillStyle(0x3d5059, 1);
    this.oscConsoleGfx.fillCircle(50, -18, 14);
    this.oscConsoleGfx.fillCircle(50, 22, 14);
    this.oscConsoleGfx.lineStyle(1, 0xffffff, 0.6);
    this.oscConsoleGfx.lineBetween(50, -18, 50, -28);
    this.oscConsoleGfx.lineBetween(50, 22, 50, 12);
  }

  private renderVaultEntrance(): void {
    const state = GameStateManager.getInstance();
    const container = this.add.container(880, 520);

    this.vaultDoorGfx = this.add.graphics();
    container.add(this.vaultDoorGfx);

    this.vaultLabelText = this.add.text(
      0,
      -140,
      state.keypadSolved ? 'SUB-VAULT 9 [ UNLOCKED ]' : 'SUB-VAULT 9 [ KEYPAD SEALED ]',
      {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: state.keypadSolved ? '#33ff88' : '#ff4444',
        fontStyle: 'bold',
      }
    );
    this.vaultLabelText.setOrigin(0.5);
    container.add(this.vaultLabelText);

    const drawVault = () => {
      this.vaultDoorGfx.clear();
      // Massive octagonal isolation gate
      this.vaultDoorGfx.fillStyle(0x111c21, 1);
      this.vaultDoorGfx.fillRoundedRect(-90, -120, 180, 230, 8);
      this.vaultDoorGfx.lineStyle(3, 0x2b4652, 1);
      this.vaultDoorGfx.strokeRoundedRect(-90, -120, 180, 230, 8);

      if (state.keypadSolved) {
        // Vault opening revealing the abyss
        this.vaultDoorGfx.fillStyle(0x020708, 1);
        this.vaultDoorGfx.fillRect(-70, -100, 140, 200);

        // Alien glow emanating from within
        this.vaultDoorGfx.fillStyle(0x18e8a0, 0.25);
        this.vaultDoorGfx.fillCircle(0, 0, 60);
      } else {
        // Heavy interlocking steel teeth
        this.vaultDoorGfx.fillStyle(0x19272d, 1);
        this.vaultDoorGfx.fillRect(-75, -100, 150, 200);
        this.vaultDoorGfx.lineStyle(2, 0x0a1013, 1);
        this.vaultDoorGfx.lineBetween(0, -100, 0, 100);

        // Biohazard emblem & warning sign
        this.vaultDoorGfx.fillStyle(0xd99818, 0.9);
        this.vaultDoorGfx.fillTriangle(0, -50, -20, -15, 20, -15);
        this.vaultDoorGfx.fillStyle(0x000000, 1);
        this.vaultDoorGfx.fillCircle(0, -32, 6);
      }

      // Electronic Keypad Mount on wall beside door
      this.vaultDoorGfx.fillStyle(0x27353a, 1);
      this.vaultDoorGfx.fillRoundedRect(-75, 45, 50, 45, 3);
      this.vaultDoorGfx.fillStyle(state.keypadSolved ? 0x33ff88 : 0xff3333, 1);
      this.vaultDoorGfx.fillCircle(-50, 68, 5);
    };

    drawVault();

    container.setSize(180, 230);
    container.setInteractive(new Phaser.Geom.Rectangle(-90, -120, 180, 230), Phaser.Geom.Rectangle.Contains);

    container.on('pointerdown', () => {
      SoundEngine.getInstance().playClick();

      if (!state.keypadSolved) {
        // Must solve keypad (Puzzle 2)
        this.cameras.main.fadeOut(350, 0, 0, 0);
        this.time.delayedCall(370, () => {
          this.scene.start('KeypadScene');
        });
        return;
      }

      // Enter the Deep Vault Climax
      SoundEngine.getInstance().playHydraulicDoor();
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => {
        this.scene.start('VaultScene');
      });
    });
  }

  private renderExits(): void {
    // Back to Airlock button / doorway on left
    const backBtn = this.add.container(60, 560);
    const bgGfx = this.add.graphics();
    bgGfx.fillStyle(0x0a1417, 0.9);
    bgGfx.fillRoundedRect(-40, -16, 80, 32, 4);
    bgGfx.lineStyle(1, 0x1f473c, 1);
    bgGfx.strokeRoundedRect(-40, -16, 80, 32, 4);

    const txt = this.add.text(0, 0, '< AIRLOCK', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#8ab4b8',
    });
    txt.setOrigin(0.5);

    backBtn.add([bgGfx, txt]);
    backBtn.setSize(80, 32);
    backBtn.setInteractive(new Phaser.Geom.Rectangle(-40, -16, 80, 32), Phaser.Geom.Rectangle.Contains);

    backBtn.on('pointerdown', () => {
      SoundEngine.getInstance().playClick();
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.time.delayedCall(370, () => {
        this.scene.start('AirlockScene');
      });
    });
  }
}
