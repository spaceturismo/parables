// ============================================================================
// MenuScene.js — Main menu with elegant title and warm golden glow
// ============================================================================

import Phaser from 'phaser';
import { createButton, COLORS, COLORS_CSS, FONT_STYLES } from '../../shared/index.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const cx = 400;
    const cy = 300;

    this.cameras.main.setBackgroundColor('#FFF5E1');

    // --- Golden glow particle effect (soft, floating particles) ---
    this._createGlowParticles();

    // --- Decorative border lines ---
    const deco = this.add.graphics();
    deco.lineStyle(2, COLORS.GOLD, 0.3);
    deco.strokeRoundedRect(40, 40, 720, 520, 20);
    deco.lineStyle(1, COLORS.GOLD, 0.15);
    deco.strokeRoundedRect(50, 50, 700, 500, 16);

    // --- Title: "PARABLES" ---
    const title = this.add.text(cx, 150, 'PARABLES', {
      fontFamily: 'Georgia, serif',
      fontSize: '64px',
      fontStyle: 'bold',
      color: '#8B6914',
      stroke: '#D4A843',
      strokeThickness: 1,
    }).setOrigin(0.5);

    // Subtle floating animation on the title
    this.tweens.add({
      targets: title,
      y: 145,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // --- Subtitle ---
    this.add.text(cx, 215, 'The Stories Jesus Told', {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      fontStyle: 'italic',
      color: '#A08050',
    }).setOrigin(0.5);

    // --- Decorative divider ---
    const divider = this.add.graphics();
    divider.lineStyle(1, COLORS.GOLD, 0.4);
    divider.lineBetween(cx - 120, 250, cx + 120, 250);
    divider.fillStyle(COLORS.GOLD, 0.5);
    divider.fillCircle(cx, 250, 3);

    // --- Scripture quote ---
    this.add.text(cx, 280, '"For the word of God is living and active."', {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      fontStyle: 'italic',
      color: '#9A8A6A',
    }).setOrigin(0.5);

    this.add.text(cx, 300, '— Hebrews 4:12', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: COLORS_CSS.GOLD,
    }).setOrigin(0.5);

    // --- Menu buttons ---
    const btnStyle = {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#6B5B3B',
      fontStyle: 'bold',
    };

    createButton(this, cx, 370, 'Begin Journey', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => this.scene.start('EpisodeSelectScene'));
    }, btnStyle);

    createButton(this, cx, 420, 'Episodes', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => this.scene.start('EpisodeSelectScene'));
    }, btnStyle);

    createButton(this, cx, 470, 'About', () => {
      this._showAbout();
    }, { ...btnStyle, fontSize: '20px', color: '#8A7A5A' });

    // --- Fade in ---
    this.cameras.main.fadeIn(600, 255, 245, 225);
  }

  // ---------------------------------------------------------------------------
  // Golden glow particles
  // ---------------------------------------------------------------------------
  _createGlowParticles() {
    // Create a set of floating golden particles using simple sprites
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(50, 750);
      const y = Phaser.Math.Between(50, 550);
      const p = this.add.image(x, y, 'particle').setAlpha(0);

      const delay = Phaser.Math.Between(0, 3000);
      const dur = Phaser.Math.Between(3000, 6000);

      this.tweens.add({
        targets: p,
        alpha: { from: 0, to: Phaser.Math.FloatBetween(0.15, 0.4) },
        y: y - Phaser.Math.Between(30, 80),
        x: x + Phaser.Math.Between(-20, 20),
        scaleX: { from: 0.3, to: Phaser.Math.FloatBetween(0.5, 1.2) },
        scaleY: { from: 0.3, to: Phaser.Math.FloatBetween(0.5, 1.2) },
        duration: dur,
        delay,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  // ---------------------------------------------------------------------------
  // About overlay
  // ---------------------------------------------------------------------------
  _showAbout() {
    if (this._aboutContainer) {
      this._aboutContainer.destroy();
      this._aboutContainer = null;
      return;
    }

    const cx = 400;
    const cy = 300;

    // Semi-transparent backdrop
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRect(0, 0, 800, 600);
    bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 800, 600), Phaser.Geom.Rectangle.Contains);

    // Panel
    const panel = this.add.graphics();
    panel.fillStyle(0x2A2218, 0.95);
    panel.fillRoundedRect(-220, -160, 440, 320, 14);
    panel.lineStyle(2, COLORS.GOLD, 0.5);
    panel.strokeRoundedRect(-220, -160, 440, 320, 14);

    const title = this.add.text(0, -130, 'About Parables', {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: COLORS_CSS.GOLD,
    }).setOrigin(0.5);

    const body = this.add.text(0, -20, [
      'Parables is a narrative puzzle game that',
      'brings the stories Jesus told to life.',
      '',
      'Each episode is a self-contained experience',
      'with puzzles that are metaphorical',
      'representations of each parable\'s message.',
      '',
      'Made with love as part of the',
      'Faith Games collection.',
    ].join('\n'), {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: '#DDCCAA',
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5);

    const closeBtn = this.add.text(0, 130, '[ Close ]', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: COLORS_CSS.GOLD,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this._aboutContainer = this.add.container(cx, cy, [bg, panel, title, body, closeBtn]);
    this._aboutContainer.setDepth(100);

    closeBtn.on('pointerdown', () => {
      this._aboutContainer.destroy();
      this._aboutContainer = null;
    });

    bg.on('pointerdown', () => {
      this._aboutContainer.destroy();
      this._aboutContainer = null;
    });
  }
}
