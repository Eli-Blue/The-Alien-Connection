import Phaser from 'phaser';

export class DialogueBox {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bgGraphics: Phaser.GameObjects.Graphics;
  private speakerText: Phaser.GameObjects.Text;
  private messageText: Phaser.GameObjects.Text;
  private promptText: Phaser.GameObjects.Text;
  private typingTimer?: Phaser.Time.TimerEvent;
  private isVisible = false;
  private onCloseCallback?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(150);
    this.container.setVisible(false);

    this.bgGraphics = this.scene.add.graphics();
    this.container.add(this.bgGraphics);

    this.speakerText = this.scene.add.text(120, 500, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '15px',
      color: '#ffb833',
      fontStyle: 'bold',
    });
    this.container.add(this.speakerText);

    this.messageText = this.scene.add.text(120, 528, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#e6f7f2',
      wordWrap: { width: 780 },
      lineSpacing: 5,
    });
    this.container.add(this.messageText);

    this.promptText = this.scene.add.text(820, 642, '[ CLICK / SPACE TO CONTINUE ]', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#33ff88',
    });
    this.container.add(this.promptText);

    // Click handler to dismiss or skip
    this.container.setSize(1024, 700);
    this.container.setInteractive(
      new Phaser.Geom.Rectangle(80, 480, 864, 180),
      Phaser.Geom.Rectangle.Contains
    );
    this.container.on('pointerdown', () => this.handleAdvance());

    this.scene.input.keyboard?.on('keydown-SPACE', () => {
      if (this.isVisible) this.handleAdvance();
    });
  }

  public show(speaker: string, fullMessage: string, onComplete?: () => void): void {
    this.onCloseCallback = onComplete;
    this.isVisible = true;
    this.container.setVisible(true);

    // Draw retro dialogue box
    this.bgGraphics.clear();
    // Backdrop shadow
    this.bgGraphics.fillStyle(0x050a0d, 0.92);
    this.bgGraphics.fillRoundedRect(90, 490, 844, 175, 6);
    this.bgGraphics.lineStyle(2, 0x33ff88, 0.85);
    this.bgGraphics.strokeRoundedRect(90, 490, 844, 175, 6);

    // Header tab for speaker
    this.bgGraphics.fillStyle(0x102520, 0.9);
    this.bgGraphics.fillRect(110, 475, 260, 26);
    this.bgGraphics.lineStyle(1, 0x33ff88, 0.85);
    this.bgGraphics.strokeRect(110, 475, 260, 26);

    this.speakerText.setText(speaker.toUpperCase());
    this.messageText.setText('');

    // Typewriter effect
    let charIndex = 0;
    if (this.typingTimer) {
      this.typingTimer.remove();
    }

    this.typingTimer = this.scene.time.addEvent({
      delay: 18,
      repeat: fullMessage.length - 1,
      callback: () => {
        charIndex++;
        this.messageText.setText(fullMessage.substring(0, charIndex));
      },
    });
  }

  private handleAdvance(): void {
    if (!this.isVisible) return;
    if (this.typingTimer && this.typingTimer.getProgress() < 1) {
      // Complete text immediately
      this.typingTimer.remove();
      // Keep existing text
      return;
    }
    this.hide();
  }

  public hide(): void {
    this.isVisible = false;
    this.container.setVisible(false);
    if (this.typingTimer) {
      this.typingTimer.remove();
    }
    if (this.onCloseCallback) {
      const cb = this.onCloseCallback;
      this.onCloseCallback = undefined;
      cb();
    }
  }

  public getVisible(): boolean {
    return this.isVisible;
  }
}
