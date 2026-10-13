import Phaser from 'phaser';
import { FACILITY_LOGS, GameStateManager } from '../../state/GameState';
import { LoreLog } from '../../state/types';

export class LogViewer {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bgGraphics: Phaser.GameObjects.Graphics;
  private headerText: Phaser.GameObjects.Text;
  private logTitleText: Phaser.GameObjects.Text;
  private metaText: Phaser.GameObjects.Text;
  private contentText: Phaser.GameObjects.Text;
  private listButtons: Phaser.GameObjects.Container[] = [];
  private isVisible = false;
  private activeLogId = 'log_01_briefing';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(180);
    this.container.setVisible(false);

    this.bgGraphics = this.scene.add.graphics();
    this.container.add(this.bgGraphics);

    this.headerText = this.scene.add.text(120, 80, 'TERMINAL ARCHIVE // STATION ECHO-7 COMM LOGS', {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: '#33ff88',
      fontStyle: 'bold',
    });
    this.container.add(this.headerText);

    this.logTitleText = this.scene.add.text(420, 140, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: '#ffb833',
      fontStyle: 'bold',
    });
    this.container.add(this.logTitleText);

    this.metaText = this.scene.add.text(420, 175, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#8ab4b8',
    });
    this.container.add(this.metaText);

    this.contentText = this.scene.add.text(420, 220, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      color: '#dcf4f2',
      wordWrap: { width: 490 },
      lineSpacing: 6,
    });
    this.container.add(this.contentText);

    // Close button
    const closeBtn = this.scene.add.container(870, 80);
    const closeGfx = this.scene.add.graphics();
    closeGfx.fillStyle(0x301515, 0.9);
    closeGfx.fillRoundedRect(-40, -12, 80, 26, 4);
    closeGfx.lineStyle(1, 0xff4444);
    closeGfx.strokeRoundedRect(-40, -12, 80, 26, 4);
    const closeTxt = this.scene.add.text(0, 0, '[ CLOSE ]', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#ff6666',
    });
    closeTxt.setOrigin(0.5);
    closeBtn.add([closeGfx, closeTxt]);
    closeBtn.setSize(80, 26);
    closeBtn.setInteractive(new Phaser.Geom.Rectangle(-40, -12, 80, 26), Phaser.Geom.Rectangle.Contains);
    closeBtn.on('pointerdown', () => this.hide());
    this.container.add(closeBtn);
  }

  public show(specificLogId?: string): void {
    this.isVisible = true;
    this.container.setVisible(true);

    const state = GameStateManager.getInstance();
    const discovered = Array.from(state.discoveredLogs);
    if (specificLogId && discovered.includes(specificLogId)) {
      this.activeLogId = specificLogId;
    } else if (discovered.length > 0 && !discovered.includes(this.activeLogId)) {
      this.activeLogId = discovered[0];
    }

    this.renderView();
  }

  private renderView(): void {
    const state = GameStateManager.getInstance();
    const discovered = Array.from(state.discoveredLogs);

    // Draw main frame
    this.bgGraphics.clear();
    // Dark backdrop overlay
    this.bgGraphics.fillStyle(0x000000, 0.7);
    this.bgGraphics.fillRect(0, 0, 1024, 700);

    // Terminal casing
    this.bgGraphics.fillStyle(0x091216, 0.96);
    this.bgGraphics.fillRoundedRect(90, 60, 844, 580, 8);
    this.bgGraphics.lineStyle(2, 0x1f4438, 1);
    this.bgGraphics.strokeRoundedRect(90, 60, 844, 580, 8);

    // Left sidebar for log list
    this.bgGraphics.fillStyle(0x050a0d, 0.9);
    this.bgGraphics.fillRect(110, 120, 280, 490);
    this.bgGraphics.lineStyle(1, 0x1c3830, 1);
    this.bgGraphics.strokeRect(110, 120, 280, 490);

    // Right content display
    this.bgGraphics.fillStyle(0x070e12, 0.9);
    this.bgGraphics.fillRect(405, 120, 510, 490);
    this.bgGraphics.lineStyle(1, 0x1c3830, 1);
    this.bgGraphics.strokeRect(405, 120, 510, 490);

    // Clear old buttons
    this.listButtons.forEach((b) => b.destroy());
    this.listButtons = [];

    // Populate log entries on the left
    let yPos = 135;
    Object.keys(FACILITY_LOGS).forEach((id) => {
      const isDiscovered = discovered.includes(id);
      const log = FACILITY_LOGS[id];
      const isSelected = this.activeLogId === id;

      const btn = this.scene.add.container(120, yPos);
      const btnGfx = this.scene.add.graphics();
      const titleColor = !isDiscovered ? '#405256' : isSelected ? '#ffb833' : '#33ff88';

      btnGfx.fillStyle(isSelected ? 0x17332b : 0x0a1619, 0.85);
      btnGfx.fillRect(0, 0, 260, 45);
      btnGfx.lineStyle(1, isSelected ? 0xffb833 : 0x224a3e, 0.9);
      btnGfx.strokeRect(0, 0, 260, 45);

      const label = isDiscovered ? log.title.substring(0, 24) : '>>> ENCRYPTED MEMO <<<';
      const txt = this.scene.add.text(10, 8, label, {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: titleColor,
        fontStyle: isSelected ? 'bold' : 'normal',
      });

      const sub = this.scene.add.text(10, 26, isDiscovered ? log.sender : 'Status: LOCKED', {
        fontFamily: 'Courier New, monospace',
        fontSize: '9px',
        color: '#658085',
      });

      btn.add([btnGfx, txt, sub]);

      if (isDiscovered) {
        btn.setSize(260, 45);
        btn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 260, 45), Phaser.Geom.Rectangle.Contains);
        btn.on('pointerdown', () => {
          this.activeLogId = id;
          this.renderView();
        });
      }

      this.container.add(btn);
      this.listButtons.push(btn);
      yPos += 55;
    });

    // Display active log contents
    const activeLog: LoreLog | undefined = FACILITY_LOGS[this.activeLogId];
    if (activeLog && discovered.includes(this.activeLogId)) {
      this.logTitleText.setText(activeLog.title);
      this.metaText.setText(`SOURCE: ${activeLog.sender}\nTIMESTAMP: ${activeLog.timestamp}`);
      this.contentText.setText(activeLog.content);
    } else {
      this.logTitleText.setText('NO LOG SELECTED OR ENCRYPTED');
      this.metaText.setText('');
      this.contentText.setText('Decryption key or physical transmission reel required to inspect record.');
    }
  }

  public hide(): void {
    this.isVisible = false;
    this.container.setVisible(false);
  }

  public getVisible(): boolean {
    return this.isVisible;
  }
}
