// ============================================================================
// EpisodeSelectScene.js — Episode selection screen
//
// Displays 3 episode cards in a row. Each card shows the parable name,
// scripture reference, tagline, and completion status. Cards have subtle
// hover animations and use ScriptureDB for verse display.
// ============================================================================

import Phaser from 'phaser';
import {
  createButton, createPanel,
  ScriptureDB, SaveManager,
  COLORS, COLORS_CSS, FONT_STYLES, GAME_IDS,
} from '../../shared/index.js';

/** Episode definitions */
const EPISODES = [
  {
    key: 'ProdigalSonScene',
    title: 'The Prodigal Son',
    reference: 'Luke 15:11-32',
    tagline: 'A journey home',
    saveSlot: 'prodigal-son',
    scriptureId: 9, // Luke 15:20-24
    color: 0xD4A843,
  },
  {
    key: 'GoodSamaritanScene',
    title: 'The Good Samaritan',
    reference: 'Luke 10:25-37',
    tagline: 'Love your neighbor',
    saveSlot: 'good-samaritan',
    scriptureId: 12, // Luke 10:33-34
    color: 0x886644,
  },
  {
    key: 'SowerScene',
    title: 'The Sower',
    reference: 'Matthew 13:1-23',
    tagline: 'Seeds of faith',
    saveSlot: 'sower',
    scriptureId: 7, // Matthew 13:3-8
    color: 0x5C8A3A,
  },
];

export class EpisodeSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EpisodeSelectScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#FFF5E1');

    const cx = 400;

    // --- Header ---
    this.add.text(cx, 50, 'Choose Your Parable', {
      fontFamily: 'Georgia, serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#6B5020',
    }).setOrigin(0.5);

    this.add.text(cx, 85, 'Each story is a journey of discovery', {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      fontStyle: 'italic',
      color: '#9A8A6A',
    }).setOrigin(0.5);

    // --- Divider ---
    const divider = this.add.graphics();
    divider.lineStyle(1, COLORS.GOLD, 0.3);
    divider.lineBetween(150, 110, 650, 110);

    // --- Episode cards ---
    const cardW = 210;
    const cardH = 300;
    const spacing = 30;
    const totalW = EPISODES.length * cardW + (EPISODES.length - 1) * spacing;
    const startX = cx - totalW / 2 + cardW / 2;

    EPISODES.forEach((ep, i) => {
      const x = startX + i * (cardW + spacing);
      const y = 280;
      this._createEpisodeCard(x, y, cardW, cardH, ep);
    });

    // --- Back button ---
    createButton(this, cx, 530, '< Back to Menu', () => {
      this.cameras.main.fadeOut(400);
      this.time.delayedCall(400, () => this.scene.start('MenuScene'));
    }, {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#8A7A5A',
    });

    // --- Scripture at bottom ---
    const verse = ScriptureDB.getByCategory('parable');
    if (verse.length > 0) {
      const v = verse[Math.floor(Math.random() * verse.length)];
      this.add.text(cx, 570, `"${v.text.slice(0, 80)}..."  — ${v.reference}`, {
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        fontStyle: 'italic',
        color: '#B0A080',
        wordWrap: { width: 600 },
        align: 'center',
      }).setOrigin(0.5);
    }

    // Fade in
    this.cameras.main.fadeIn(400, 255, 245, 225);
  }

  // ---------------------------------------------------------------------------
  // Card creation
  // ---------------------------------------------------------------------------

  _createEpisodeCard(x, y, w, h, episode) {
    const isComplete = SaveManager.hasSave(GAME_IDS.PARABLES, episode.saveSlot);

    // Card background
    const bg = this.add.graphics();
    bg.fillStyle(0x3A2F24, 0.92);
    bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    bg.lineStyle(2, episode.color, 0.6);
    bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);

    // Color accent bar at top
    const accent = this.add.graphics();
    accent.fillStyle(episode.color, 0.8);
    accent.fillRoundedRect(x - w / 2, y - h / 2, w, 6, { tl: 12, tr: 12, bl: 0, br: 0 });

    // Icon area (small decorative element)
    const iconBg = this.add.graphics();
    iconBg.fillStyle(episode.color, 0.2);
    iconBg.fillCircle(x, y - h / 2 + 60, 28);
    iconBg.lineStyle(1, episode.color, 0.4);
    iconBg.strokeCircle(x, y - h / 2 + 60, 28);

    // Icon symbol (simple text glyph)
    const iconSymbols = { ProdigalSonScene: '🏠', GoodSamaritanScene: '❤', SowerScene: '🌱' };
    // Use text characters instead of emoji for reliability
    const symbols = { ProdigalSonScene: 'H', GoodSamaritanScene: '+', SowerScene: 'S' };
    this.add.text(x, y - h / 2 + 60, symbols[episode.key] || '?', {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: Phaser.Display.Color.IntegerToColor(episode.color).rgba,
    }).setOrigin(0.5);

    // Title
    this.add.text(x, y - h / 2 + 105, episode.title, {
      fontFamily: 'Georgia, serif',
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#FFE8B0',
      align: 'center',
      wordWrap: { width: w - 24 },
    }).setOrigin(0.5);

    // Scripture reference
    this.add.text(x, y - h / 2 + 140, episode.reference, {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      fontStyle: 'italic',
      color: COLORS_CSS.GOLD,
    }).setOrigin(0.5);

    // Tagline
    this.add.text(x, y - h / 2 + 170, `"${episode.tagline}"`, {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      fontStyle: 'italic',
      color: '#BBAA88',
    }).setOrigin(0.5);

    // Completion status
    const statusText = isComplete ? 'Completed' : 'Available';
    const statusColor = isComplete ? '#88CC66' : '#CCBB88';
    this.add.text(x, y - h / 2 + 210, statusText, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: statusColor,
    }).setOrigin(0.5);

    // --- Play button ---
    const playBtn = this.add.text(x, y + h / 2 - 40, 'Play', {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      backgroundColor: Phaser.Display.Color.IntegerToColor(episode.color).rgba,
      padding: { x: 30, y: 8 },
    }).setOrigin(0.5);

    playBtn.setInteractive({ useHandCursor: true });

    // --- Hover animation for the entire card ---
    const cardHitZone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });

    cardHitZone.on('pointerover', () => {
      this.tweens.add({
        targets: [bg, accent, iconBg],
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 200,
        ease: 'Power1',
      });
      playBtn.setStyle({ color: COLORS_CSS.GOLD });
    });

    cardHitZone.on('pointerout', () => {
      this.tweens.add({
        targets: [bg, accent, iconBg],
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Power1',
      });
      playBtn.setStyle({ color: '#FFFFFF' });
    });

    // Click to play
    const startEpisode = () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(600, () => this.scene.start(episode.key));
    };

    cardHitZone.on('pointerdown', startEpisode);
    playBtn.on('pointerdown', startEpisode);
  }
}
