import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Generate loading indicator
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 20,
      text: 'INITIALIZING STATION ECHO-7 TELEMETRY...',
      style: {
        font: '14px Courier New, monospace',
        color: '#33ff88',
      },
    });
    loadingText.setOrigin(0.5, 0.5);

    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x0a1619, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 + 10, 320, 20);
    progressBox.lineStyle(1, 0x33ff88, 1);
    progressBox.strokeRect(width / 2 - 160, height / 2 + 10, 320, 20);

    const progressBar = this.add.graphics();
    progressBar.fillStyle(0x33ff88, 1);
    progressBar.fillRect(width / 2 - 156, height / 2 + 14, 312, 12);
  }

  create(): void {
    this.generateProceduralTextures();
    this.time.delayedCall(400, () => {
      this.scene.start('TitleScene');
    });
  }

  private generateProceduralTextures(): void {
    // 1. Metal Panel texture (64x64)
    const panel = this.make.graphics({ x: 0, y: 0 });
    panel.fillStyle(0x0e171b, 1);
    panel.fillRect(0, 0, 64, 64);
    panel.lineStyle(1, 0x1f2e34, 1);
    panel.strokeRect(0, 0, 64, 64);
    // Rivets
    panel.fillStyle(0x283d45, 1);
    panel.fillCircle(4, 4, 2);
    panel.fillCircle(60, 4, 2);
    panel.fillCircle(4, 60, 2);
    panel.fillCircle(60, 60, 2);
    panel.generateTexture('tex_panel', 64, 64);
    panel.destroy();

    // 2. Hazard Stripes (120x30)
    const hazard = this.make.graphics({ x: 0, y: 0 });
    hazard.fillStyle(0x181814, 1);
    hazard.fillRect(0, 0, 120, 30);
    for (let x = -20; x < 140; x += 20) {
      hazard.fillStyle(0xd99818, 1);
      hazard.beginPath();
      hazard.moveTo(x, 0);
      hazard.lineTo(x + 10, 0);
      hazard.lineTo(x + 22, 30);
      hazard.lineTo(x + 12, 30);
      hazard.closePath();
      hazard.fillPath();
    }
    hazard.lineStyle(1, 0x4a3a10, 1);
    hazard.strokeRect(0, 0, 120, 30);
    hazard.generateTexture('tex_hazard', 120, 30);
    hazard.destroy();

    // 3. Item: Data Reel (48x48)
    const dataReel = this.make.graphics({ x: 0, y: 0 });
    dataReel.fillStyle(0x222a30, 1);
    dataReel.fillCircle(24, 24, 22);
    dataReel.fillStyle(0x422a18, 1); // Brown magnetic tape
    dataReel.fillCircle(24, 24, 18);
    dataReel.fillStyle(0x60727a, 1); // Aluminum hub
    dataReel.fillCircle(24, 24, 10);
    dataReel.fillStyle(0x0a1012, 1);
    dataReel.fillCircle(24, 24, 4);
    dataReel.fillCircle(18, 22, 2);
    dataReel.fillCircle(30, 22, 2);
    dataReel.fillCircle(24, 30, 2);
    dataReel.generateTexture('item_data_reel', 48, 48);
    dataReel.destroy();

    // 4. Item: Dial Knob (44x44)
    const knob = this.make.graphics({ x: 0, y: 0 });
    knob.fillStyle(0x1f292e, 1);
    knob.fillCircle(22, 22, 20);
    knob.lineStyle(2, 0x6e8791, 1);
    knob.strokeCircle(22, 22, 20);
    // Indicator line
    knob.lineStyle(3, 0xffffff, 1);
    knob.lineBetween(22, 22, 22, 5);
    knob.generateTexture('item_dial_knob', 44, 44);
    knob.destroy();

    // 5. Item: Bio Keycard (36x50)
    const card = this.make.graphics({ x: 0, y: 0 });
    card.fillStyle(0xd4af37, 1);
    card.fillRoundedRect(0, 0, 36, 50, 4);
    card.fillStyle(0x111111, 1);
    card.fillRect(0, 35, 36, 8); // Magstripe
    card.fillStyle(0xffffff, 1);
    card.fillRect(6, 6, 12, 14); // Photo silhouette
    card.fillStyle(0xcc2222, 1);
    card.fillCircle(26, 14, 5); // Bio hazard badge
    card.generateTexture('item_bio_keycard', 36, 50);
    card.destroy();

    // 6. Item: Vacuum Tube (30x54)
    const tube = this.make.graphics({ x: 0, y: 0 });
    tube.fillStyle(0x384248, 1);
    tube.fillRect(6, 40, 18, 14); // Base
    tube.fillStyle(0x60a0c0, 0.4);
    tube.fillRoundedRect(4, 4, 22, 38, 8); // Glass envelope
    tube.lineStyle(1, 0x88d4f0, 0.8);
    tube.strokeRoundedRect(4, 4, 22, 38, 8);
    tube.fillStyle(0xffaa22, 0.9); // Glowing filament
    tube.fillRect(13, 14, 4, 18);
    tube.generateTexture('item_vacuum_tube', 30, 54);
    tube.destroy();

    // 7. Item: Diary Fragment (44x50)
    const note = this.make.graphics({ x: 0, y: 0 });
    note.fillStyle(0xded7b4, 1);
    note.fillRoundedRect(0, 0, 44, 50, 2);
    note.lineStyle(1, 0x827050, 1);
    note.strokeRoundedRect(0, 0, 44, 50, 2);
    // Handwritten lines
    note.fillStyle(0x403828, 1);
    note.fillRect(6, 10, 32, 2);
    note.fillRect(6, 16, 28, 2);
    note.fillRect(6, 22, 30, 2);
    // Sine wave diagram
    note.lineStyle(1, 0x882222, 1);
    note.beginPath();
    for (let x = 6; x <= 38; x += 2) {
      const y = 36 + Math.sin((x - 6) * 0.4) * 4;
      if (x === 6) note.moveTo(x, y);
      else note.lineTo(x, y);
    }
    note.strokePath();
    note.generateTexture('item_diary_fragment', 44, 50);
    note.destroy();

    // 8. Item: Dosimeter (26x52)
    const dosimeter = this.make.graphics({ x: 0, y: 0 });
    dosimeter.fillStyle(0xb08f26, 1);
    dosimeter.fillRoundedRect(0, 0, 26, 52, 4);
    dosimeter.fillStyle(0x18241e, 1);
    dosimeter.fillRect(4, 8, 18, 18); // Meter window
    dosimeter.lineStyle(1, 0x33ff88, 1);
    dosimeter.strokeRect(4, 8, 18, 18);
    dosimeter.lineStyle(1, 0xff4444, 1);
    dosimeter.lineBetween(13, 24, 18, 12); // Needle
    dosimeter.generateTexture('item_dosimeter', 26, 52);
    dosimeter.destroy();

    // 9. Particle Spark (8x8)
    const spark = this.make.graphics({ x: 0, y: 0 });
    spark.fillStyle(0x33ff88, 1);
    spark.fillCircle(4, 4, 3);
    spark.fillStyle(0xffffff, 1);
    spark.fillCircle(4, 4, 1.5);
    spark.generateTexture('particle_spark', 8, 8);
    spark.destroy();
  }
}
