import Phaser from 'phaser';
import { SoundEngine } from '../../audio/SoundEngine';
import { GameStateManager } from '../../state/GameState';
import { InventoryItem } from '../../state/types';
import { LogViewer } from './LogViewer';

export class HUD {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private topBarGfx: Phaser.GameObjects.Graphics;
  private locationText: Phaser.GameObjects.Text;
  private objectiveText: Phaser.GameObjects.Text;
  private logBtnText: Phaser.GameObjects.Text;
  private invBtnText: Phaser.GameObjects.Text;
  private muteBtnText: Phaser.GameObjects.Text;
  private inventoryDrawer: Phaser.GameObjects.Container;
  private inventoryDrawerGfx: Phaser.GameObjects.Graphics;
  private toastContainer: Phaser.GameObjects.Container;
  private toastGfx: Phaser.GameObjects.Graphics;
  private toastText: Phaser.GameObjects.Text;
  private toastTimer?: Phaser.Time.TimerEvent;
  private isInventoryOpen = false;
  private logViewer: LogViewer;
  private unsubscribe?: () => void;

  constructor(scene: Phaser.Scene, locationName: string, logViewer: LogViewer) {
    this.scene = scene;
    this.logViewer = logViewer;
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(100);

    this.topBarGfx = this.scene.add.graphics();
    this.container.add(this.topBarGfx);

    // Location & Objective display
    this.locationText = this.scene.add.text(18, 12, `STATION ECHO-7 // ${locationName.toUpperCase()}`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#33ff88',
      fontStyle: 'bold',
    });
    this.container.add(this.locationText);

    this.objectiveText = this.scene.add.text(18, 29, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#ffb833',
    });
    this.container.add(this.objectiveText);

    // Navigation and utility buttons
    this.logBtnText = this.createButton(560, 15, '[ LOGS (1) ]', () => {
      SoundEngine.getInstance().playClick();
      this.logViewer.show();
    });

    this.invBtnText = this.createButton(670, 15, '[ INVENTORY (0) ]', () => {
      SoundEngine.getInstance().playClick();
      this.toggleInventory();
    });

    this.createButton(810, 15, '[ SAVE ]', () => {
      SoundEngine.getInstance().playClick();
      const state = GameStateManager.getInstance();
      const ok = state.saveToLocalStorage();
      state.saveToRemote().catch(() => {});
      this.showToast(ok ? 'PROGRESS ARCHIVED TO LOCAL TERMINAL' : 'ARCHIVE FAILED');
    });

    this.muteBtnText = this.createButton(900, 15, '[ SOUND ]', () => {
      const sound = SoundEngine.getInstance();
      sound.init();
      const muted = sound.toggleMute();
      this.muteBtnText.setText(muted ? '[ AUDIO: OFF ]' : '[ AUDIO: ON ]');
      this.showToast(muted ? 'AUDIO MUTED' : 'AUDIO ACTIVE');
    });

    // Inventory Drawer
    this.inventoryDrawer = this.scene.add.container(0, 700);
    this.inventoryDrawerGfx = this.scene.add.graphics();
    this.inventoryDrawer.add(this.inventoryDrawerGfx);
    this.container.add(this.inventoryDrawer);

    // Toast Notification Banner
    this.toastContainer = this.scene.add.container(512, 80);
    this.toastContainer.setAlpha(0);
    this.toastGfx = this.scene.add.graphics();
    this.toastText = this.scene.add.text(0, 0, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#33ff88',
      fontStyle: 'bold',
    });
    this.toastText.setOrigin(0.5);
    this.toastContainer.add([this.toastGfx, this.toastText]);
    this.container.add(this.toastContainer);

    this.drawTopBar();
    this.updateHUD();

    const state = GameStateManager.getInstance();
    this.unsubscribe = state.subscribe('change', () => this.updateHUD());
  }

  private drawTopBar(): void {
    this.topBarGfx.clear();
    // Background bar
    this.topBarGfx.fillStyle(0x060c0f, 0.94);
    this.topBarGfx.fillRect(0, 0, 1024, 48);
    // Green bottom border line
    this.topBarGfx.lineStyle(1, 0x1d4d3d, 1);
    this.topBarGfx.lineBetween(0, 48, 1024, 48);
    // Amber accent tick
    this.topBarGfx.fillStyle(0xffb833, 1);
    this.topBarGfx.fillRect(0, 0, 6, 48);
  }

  private createButton(x: number, y: number, text: string, onClick: () => void): Phaser.GameObjects.Text {
    const btn = this.scene.add.text(x, y, text, {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#8ab4b8',
    });
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setColor('#33ff88'));
    btn.on('pointerout', () => btn.setColor('#8ab4b8'));
    btn.on('pointerdown', onClick);
    this.container.add(btn);
    return btn;
  }

  public setLocation(name: string): void {
    this.locationText.setText(`STATION ECHO-7 // ${name.toUpperCase()}`);
  }

  public updateHUD(): void {
    const state = GameStateManager.getInstance();
    const logCount = state.discoveredLogs.size;
    const invCount = state.inventory.length;

    this.logBtnText.setText(`[ LOGS (${logCount}) ]`);
    this.invBtnText.setText(`[ INVENTORY (${invCount}) ]`);

    // Dynamic objective determination
    let currentObjective = '';
    if (!state.powerRestored) {
      currentObjective = 'OBJECTIVE: Investigate power breaker in Airlock and restore emergency generator';
    } else if (!state.airlockUnlocked) {
      currentObjective = 'OBJECTIVE: Access terminal console to release Airlock quarantine seal';
    } else if (!state.hiddenObjectsCompleted) {
      const remaining = 6 - state.foundHiddenObjects.size;
      currentObjective = `OBJECTIVE: Search Communications Lab archive for missing parts (${remaining} items remaining)`;
    } else if (!state.oscilloscopeSolved) {
      currentObjective = 'OBJECTIVE: Tune analog oscilloscope receiver to align extraterrestrial carrier wave';
    } else if (!state.keypadSolved) {
      currentObjective = 'OBJECTIVE: Input override sequence into Sub-Vault 9 isolation keypad';
    } else if (!state.chapterCompleted) {
      currentObjective = 'OBJECTIVE: Enter Sub-Vault 9 and investigate the deep borehole anomaly';
    } else {
      currentObjective = 'OBJECTIVE: Chapter 1 Complete. Review final station transmission.';
    }
    this.objectiveText.setText(currentObjective);

    if (this.isInventoryOpen) {
      this.renderInventoryDrawer();
    }
  }

  public toggleInventory(): void {
    this.isInventoryOpen = !this.isInventoryOpen;
    if (this.isInventoryOpen) {
      this.renderInventoryDrawer();
      this.scene.tweens.add({
        targets: this.inventoryDrawer,
        y: 560,
        duration: 200,
        ease: 'Cubic.easeOut',
      });
    } else {
      this.scene.tweens.add({
        targets: this.inventoryDrawer,
        y: 700,
        duration: 200,
        ease: 'Cubic.easeIn',
      });
    }
  }

  private renderInventoryDrawer(): void {
    const state = GameStateManager.getInstance();
    this.inventoryDrawerGfx.clear();

    // Drawer container background
    this.inventoryDrawerGfx.fillStyle(0x060c0f, 0.96);
    this.inventoryDrawerGfx.fillRect(0, 0, 1024, 140);
    this.inventoryDrawerGfx.lineStyle(2, 0x1f4438, 1);
    this.inventoryDrawerGfx.strokeRect(0, 0, 1024, 140);

    // Title label
    this.inventoryDrawerGfx.fillStyle(0x11221b, 1);
    this.inventoryDrawerGfx.fillRect(20, 8, 200, 24);
    this.inventoryDrawerGfx.strokeRect(20, 8, 200, 24);

    // Remove old dynamic item elements
    this.inventoryDrawer.list
      .filter((obj) => obj !== this.inventoryDrawerGfx)
      .forEach((obj) => obj.destroy());

    const title = this.scene.add.text(30, 12, 'FIELD INVENTORY PACK', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#33ff88',
      fontStyle: 'bold',
    });
    this.inventoryDrawer.add(title);

    const closeBtn = this.scene.add.text(950, 12, '[X]', {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      color: '#ff6666',
    });
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.toggleInventory());
    this.inventoryDrawer.add(closeBtn);

    if (state.inventory.length === 0) {
      const emptyTxt = this.scene.add.text(350, 65, 'PACK EMPTY - NO EQUIPMENT COLLECTED YET', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#4f6c70',
      });
      this.inventoryDrawer.add(emptyTxt);
      return;
    }

    let xPos = 40;
    state.inventory.forEach((item: InventoryItem) => {
      const itemContainer = this.scene.add.container(xPos, 45);
      const itemGfx = this.scene.add.graphics();
      itemGfx.fillStyle(0x0c1a1e, 0.9);
      itemGfx.fillRoundedRect(0, 0, 140, 80, 4);
      itemGfx.lineStyle(1, 0x33ff88, 0.6);
      itemGfx.strokeRoundedRect(0, 0, 140, 80, 4);

      const nameTxt = this.scene.add.text(8, 8, item.name, {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#ffb833',
        fontStyle: 'bold',
        wordWrap: { width: 124 },
      });

      const catTxt = this.scene.add.text(8, 48, `[${item.category.toUpperCase()}]`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '9px',
        color: '#8ab4b8',
      });

      itemContainer.add([itemGfx, nameTxt, catTxt]);
      itemContainer.setSize(140, 80);
      itemContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, 140, 80), Phaser.Geom.Rectangle.Contains);
      itemContainer.on('pointerdown', () => {
        SoundEngine.getInstance().playClick();
        this.showToast(`${item.name}: ${item.description}`);
      });

      this.inventoryDrawer.add(itemContainer);
      xPos += 155;
    });
  }

  public showToast(message: string, isAlert = false): void {
    if (this.toastTimer) {
      this.toastTimer.remove();
    }

    this.toastText.setText(message.toUpperCase());
    const width = Math.max(340, this.toastText.width + 40);

    this.toastGfx.clear();
    this.toastGfx.fillStyle(isAlert ? 0x2e0808 : 0x071512, 0.95);
    this.toastGfx.fillRoundedRect(-width / 2, -18, width, 36, 4);
    this.toastGfx.lineStyle(1, isAlert ? 0xff4444 : 0x33ff88, 0.9);
    this.toastGfx.strokeRoundedRect(-width / 2, -18, width, 36, 4);

    this.toastText.setColor(isAlert ? '#ff6666' : '#33ff88');

    this.toastContainer.setAlpha(1);
    this.toastTimer = this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({
        targets: this.toastContainer,
        alpha: 0,
        duration: 350,
      });
    });
  }

  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
