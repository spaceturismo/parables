// ============================================================================
// ReflectionScene.js — Post-episode reflection screen
//
// Displays the full scripture passage, parable title, a personal reflection
// question, and marks the episode as complete in SaveManager.
// ============================================================================

import Phaser from 'phaser';
import {
  createButton, createScriptureDisplay,
  ScriptureDB, SaveManager,
  COLORS, COLORS_CSS, FONT_STYLES, GAME_IDS,
} from '../../shared/index.js';

// Game dimensions
const W = 800;
const H = 600;

export class ReflectionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ReflectionScene' });
  }

  /**
   * Expected data:
   * {
   *   episode: string,       // e.g. 'prodigal-son'
   *   title: string,         // e.g. 'The Prodigal Son'
   *   scriptureId: number,   // ScriptureDB id
   *   reflection: string,    // Reflection question
   * }
   */
  init(data) {
    this.episodeData = data || {};
  }

  create() {
    const cx = W / 2;
    const {
      episode = 'unknown',
      title = 'Parable',
      scriptureId = 7,
      reflection = 'What has God spoken to your heart?',
    } = this.episodeData;

    this.cameras.main.setBackgroundColor('#2A2218');
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // --- Save completion ---
    SaveManager.save(GAME_IDS.PARABLES, episode, { completed: true });

    // --- Decorative border ---
    const border = this.add.graphics();
    border.lineStyle(2, COLORS.GOLD, 0.3);
    border.strokeRoundedRect(30, 30, W - 60, H - 60, 16);
    border.lineStyle(1, COLORS.GOLD, 0.15);
    border.strokeRoundedRect(40, 40, W - 80, H - 80, 12);

    // --- Title ---
    this.add.text(cx, 70, title, {
      fontFamily: 'Georgia, serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: COLORS_CSS.GOLD,
    }).setOrigin(0.5);

    // --- Decorative divider ---
    const divider = this.add.graphics();
    divider.lineStyle(1, COLORS.GOLD, 0.4);
    divider.lineBetween(cx - 100, 100, cx + 100, 100);
    divider.fillStyle(COLORS.GOLD, 0.5);
    divider.fillCircle(cx, 100, 3);

    // --- Scripture passage ---
    const scripture = ScriptureDB.getById(scriptureId);
    if (scripture) {
      createScriptureDisplay(this, cx, 240, 520, scripture);
    }

    // --- Floating particles for ambiance ---
    this._createAmbientParticles();

    // --- Reflection question ---
    this.add.text(cx, 410, 'Reflect', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: COLORS_CSS.GOLD,
    }).setOrigin(0.5);

    this.add.text(cx, 445, reflection, {
      fontFamily: 'Georgia, serif',
      fontSize: '17px',
      fontStyle: 'italic',
      color: '#DDCCAA',
      wordWrap: { width: 460 },
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5);

    // --- Completion badge ---
    this.add.text(cx, 500, 'Episode Complete', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#88CC66',
    }).setOrigin(0.5);

    // --- Return button ---
    createButton(this, cx, 548, 'Return to Episodes', () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(600, () => this.scene.start('EpisodeSelectScene'));
    }, {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: COLORS_CSS.GOLD,
    });
  }

  // ---------------------------------------------------------------------------
  // Ambient particles
  // ---------------------------------------------------------------------------

  _createAmbientParticles() {
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(50, W - 50);
      const y = Phaser.Math.Between(50, H - 50);
      const p = this.add.image(x, y, 'particle').setAlpha(0).setDepth(-1);

      this.tweens.add({
        targets: p,
        alpha: { from: 0, to: Phaser.Math.FloatBetween(0.1, 0.25) },
        y: y - Phaser.Math.Between(20, 60),
        scaleX: { from: 0.2, to: Phaser.Math.FloatBetween(0.4, 0.8) },
        scaleY: { from: 0.2, to: Phaser.Math.FloatBetween(0.4, 0.8) },
        duration: Phaser.Math.Between(3000, 6000),
        delay: Phaser.Math.Between(0, 2000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }
}
