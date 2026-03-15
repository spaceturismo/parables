// ============================================================================
// BootScene.js — Preload / texture generation scene
//
// Creates ALL textures programmatically so the game runs with zero external
// assets. Uses a warm, hand-painted aesthetic through soft colors and
// rounded shapes. Displays a loading screen with scripture.
// ============================================================================

import Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../../shared/index.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  // ---------------------------------------------------------------------------
  // Preload — show loading screen
  // ---------------------------------------------------------------------------
  preload() {
    // Warm parchment background
    this.cameras.main.setBackgroundColor('#FFF5E1');

    // Loading text
    const cx = 400;
    const cy = 300;

    this.add.text(cx, cy - 60, 'PARABLES', {
      fontFamily: 'Georgia, serif',
      fontSize: '42px',
      color: COLORS_CSS.BROWN,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cy, '"He told them many things in parables..."', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      fontStyle: 'italic',
      color: '#8B7355',
    }).setOrigin(0.5);

    this.add.text(cx, cy + 30, '— Matthew 13:3', {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: COLORS_CSS.GOLD,
    }).setOrigin(0.5);

    // Progress bar
    const barW = 300;
    const barH = 8;
    const barX = cx - barW / 2;
    const barY = cy + 80;

    const barBg = this.add.graphics();
    barBg.fillStyle(0xD4C5A9, 1);
    barBg.fillRoundedRect(barX, barY, barW, barH, 4);

    const barFill = this.add.graphics();

    this.load.on('progress', (pct) => {
      barFill.clear();
      barFill.fillStyle(COLORS.GOLD, 1);
      barFill.fillRoundedRect(barX, barY, barW * pct, barH, 4);
    });
  }

  // ---------------------------------------------------------------------------
  // Create — generate all textures, then transition to menu
  // ---------------------------------------------------------------------------
  create() {
    this._generateTextures();

    // Brief pause to let the scripture verse be visible
    this.time.delayedCall(800, () => {
      this.scene.start('MenuScene');
    });
  }

  // ---------------------------------------------------------------------------
  // Texture generation
  // ---------------------------------------------------------------------------
  _generateTextures() {
    // --- Character: Player (simple rounded figure with warm color) ---
    this._makeCharacterTexture('player', 0xC08040, 0xFFDDBB);
    this._makeCharacterTexture('father', 0x8B6914, 0xFFEECC);
    this._makeCharacterTexture('friend', 0x6688AA, 0xBBCCDD);
    this._makeCharacterTexture('priest', 0x444488, 0xCCCCEE);
    this._makeCharacterTexture('levite', 0x446644, 0xCCEECC);
    this._makeCharacterTexture('samaritan', 0x886644, 0xEEDDBB);
    this._makeCharacterTexture('traveler', 0x997755, 0xDDCCAA);
    this._makeCharacterTexture('robber', 0x333333, 0x666666);
    this._makeCharacterTexture('innkeeper', 0x885522, 0xCCAA77);
    this._makeCharacterTexture('wounded', 0xAA5555, 0xDDAA99);
    this._makeCharacterTexture('donkey', 0x998877, 0xCCBBAA);

    // --- Buildings ---
    this._makeHouseTexture('fatherHouse', 0xD4A843, 0xFFE88B, true);   // warm golden
    this._makeHouseTexture('cityBuilding', 0x556677, 0x778899, false);  // cold city
    this._makeHouseTexture('inn', 0xAA8844, 0xDDBB77, true);            // warm inn
    this._makeHouseTexture('pigPen', 0x665544, 0x887766, false);        // dull pen

    // --- Environment ---
    this._makeGroundTexture('pathWarm', 0xD4B896);     // warm path
    this._makeGroundTexture('pathCold', 0x778899);     // cold path
    this._makeGroundTexture('grass', 0x7CAA5A);        // green grass
    this._makeGroundTexture('dirt', 0x8B7355);         // brown dirt

    // --- Soil textures for Sower ---
    this._makeSoilTexture('soilPath', 0xAAAAAA, []);                               // hard path
    this._makeSoilTexture('soilRocky', 0x9B8B6B, [0x888888, 0x999999]);           // rocky
    this._makeSoilTexture('soilThorny', 0x8B7B5B, []);                             // thorny
    this._makeSoilTexture('soilGood', 0x5C4033, []);                               // rich soil

    // --- Items ---
    this._makeCoinTexture();
    this._makeSeedTexture();
    this._makePlantTexture('sprout', 0x66AA44, 10, 16);
    this._makePlantTexture('plant', 0x338822, 16, 30);
    this._makePlantTexture('fullPlant', 0x226611, 20, 40);
    this._makeThornTexture();
    this._makeBirdTexture();
    this._makeSunTexture();
    this._makeWoundTexture();
    this._makeWaterTexture();
    this._makeBandageTexture();

    // --- Obstacles (labeled blocks for Prodigal Son return) ---
    this._makeObstacleTexture('obstacle', 0x553344);

    // --- UI Elements ---
    this._makeParticleTexture('particle', 0xFFD700);
    this._makeParticleTexture('particleWhite', 0xFFFFFF);
    this._makeParticleTexture('particleWarm', 0xFFAA44);
    this._makeStarTexture();
    this._makeHeartTexture();

    // --- Road texture for Good Samaritan ---
    this._makeRoadTexture();

    // --- Episode card background ---
    this._makeCardTexture();
  }

  // ---------------------------------------------------------------------------
  // Texture helper methods
  // ---------------------------------------------------------------------------

  /**
   * Create a simple character sprite: circle head + rounded body.
   */
  _makeCharacterTexture(key, bodyColor, headColor) {
    const gfx = this.make.graphics({ add: false });

    // Body (rounded rectangle)
    gfx.fillStyle(bodyColor, 1);
    gfx.fillRoundedRect(8, 18, 16, 22, 4);

    // Head (circle)
    gfx.fillStyle(headColor, 1);
    gfx.fillCircle(16, 12, 10);

    // Eyes
    gfx.fillStyle(0x333333, 1);
    gfx.fillCircle(13, 10, 2);
    gfx.fillCircle(19, 10, 2);

    gfx.generateTexture(key, 32, 44);
    gfx.destroy();
  }

  /**
   * Create a simple house/building texture.
   */
  _makeHouseTexture(key, wallColor, roofColor, hasLight) {
    const gfx = this.make.graphics({ add: false });
    const w = 64;
    const h = 56;

    // Wall
    gfx.fillStyle(wallColor, 1);
    gfx.fillRoundedRect(4, 20, w - 8, h - 24, 4);

    // Roof (triangle approximation with filled shape)
    gfx.fillStyle(roofColor, 1);
    gfx.fillTriangle(w / 2, 2, 0, 24, w, 24);

    // Door
    gfx.fillStyle(0x553311, 1);
    gfx.fillRoundedRect(w / 2 - 6, h - 20, 12, 18, { tl: 6, tr: 6, bl: 0, br: 0 });

    // Window light
    if (hasLight) {
      gfx.fillStyle(0xFFEE88, 0.9);
      gfx.fillRect(12, 30, 10, 10);
      gfx.fillRect(w - 22, 30, 10, 10);
    }

    gfx.generateTexture(key, w, h);
    gfx.destroy();
  }

  /**
   * Create a ground tile texture.
   */
  _makeGroundTexture(key, color) {
    const gfx = this.make.graphics({ add: false });
    gfx.fillStyle(color, 1);
    gfx.fillRect(0, 0, 32, 32);

    // Subtle texture dots
    gfx.fillStyle(Phaser.Display.Color.IntegerToColor(color).brighten(15).color, 0.5);
    for (let i = 0; i < 6; i++) {
      gfx.fillCircle(Math.random() * 32, Math.random() * 32, 1.5);
    }

    gfx.generateTexture(key, 32, 32);
    gfx.destroy();
  }

  /**
   * Create a soil strip texture for the Sower episode.
   */
  _makeSoilTexture(key, color, rockColors) {
    const gfx = this.make.graphics({ add: false });
    const w = 200;
    const h = 40;

    gfx.fillStyle(color, 1);
    gfx.fillRect(0, 0, w, h);

    // Add rocks if provided
    rockColors.forEach((rc) => {
      gfx.fillStyle(rc, 0.8);
      for (let i = 0; i < 5; i++) {
        gfx.fillCircle(Math.random() * w, Math.random() * h, 3 + Math.random() * 4);
      }
    });

    gfx.generateTexture(key, w, h);
    gfx.destroy();
  }

  /**
   * Create a gold coin texture.
   */
  _makeCoinTexture() {
    const gfx = this.make.graphics({ add: false });
    gfx.fillStyle(0xFFD700, 1);
    gfx.fillCircle(8, 8, 7);
    gfx.fillStyle(0xFFEE55, 1);
    gfx.fillCircle(7, 7, 4);
    gfx.generateTexture('coin', 16, 16);
    gfx.destroy();
  }

  /**
   * Create a seed texture.
   */
  _makeSeedTexture() {
    const gfx = this.make.graphics({ add: false });
    gfx.fillStyle(0x886622, 1);
    gfx.fillCircle(4, 4, 3);
    gfx.fillStyle(0xAA8833, 1);
    gfx.fillCircle(3, 3, 1.5);
    gfx.generateTexture('seed', 8, 8);
    gfx.destroy();
  }

  /**
   * Create a plant texture at various growth stages.
   */
  _makePlantTexture(key, color, width, height) {
    const gfx = this.make.graphics({ add: false });

    // Stem
    gfx.fillStyle(0x337722, 1);
    gfx.fillRect(width / 2 - 1, height / 3, 2, height * 2 / 3);

    // Leaves / canopy
    gfx.fillStyle(color, 1);
    gfx.fillCircle(width / 2, height / 3, width / 2);

    if (height > 30) {
      // Fruit for full plants
      gfx.fillStyle(0xDD4422, 1);
      gfx.fillCircle(width / 2 - 5, height / 4, 3);
      gfx.fillCircle(width / 2 + 5, height / 4, 3);
      gfx.fillCircle(width / 2, height / 5, 3);
    }

    gfx.generateTexture(key, width, height);
    gfx.destroy();
  }

  /**
   * Create a thorn/bramble texture.
   */
  _makeThornTexture() {
    const gfx = this.make.graphics({ add: false });
    gfx.fillStyle(0x556633, 1);
    // Tangled thorny shape
    gfx.fillTriangle(8, 0, 0, 16, 16, 16);
    gfx.fillTriangle(0, 8, 16, 0, 8, 16);
    gfx.lineStyle(1, 0x334411, 1);
    gfx.strokeTriangle(8, 0, 0, 16, 16, 16);
    gfx.generateTexture('thorn', 16, 16);
    gfx.destroy();
  }

  /**
   * Create a simple bird texture.
   */
  _makeBirdTexture() {
    const gfx = this.make.graphics({ add: false });
    gfx.fillStyle(0x444444, 1);
    gfx.fillCircle(8, 8, 5);   // body
    gfx.fillCircle(13, 6, 3);  // head
    // Wings
    gfx.fillTriangle(3, 6, 8, 8, 2, 12);
    gfx.fillTriangle(13, 6, 8, 8, 14, 12);
    gfx.generateTexture('bird', 18, 16);
    gfx.destroy();
  }

  /**
   * Create a sun texture.
   */
  _makeSunTexture() {
    const gfx = this.make.graphics({ add: false });
    gfx.fillStyle(0xFFDD44, 1);
    gfx.fillCircle(16, 16, 12);
    gfx.fillStyle(0xFFEE88, 0.5);
    gfx.fillCircle(16, 16, 16);
    gfx.generateTexture('sun', 32, 32);
    gfx.destroy();
  }

  /**
   * Create a wound marker texture.
   */
  _makeWoundTexture() {
    const gfx = this.make.graphics({ add: false });
    gfx.fillStyle(0xCC3333, 0.8);
    gfx.fillCircle(6, 6, 5);
    gfx.lineStyle(1, 0x881111, 1);
    gfx.strokeCircle(6, 6, 5);
    gfx.generateTexture('wound', 12, 12);
    gfx.destroy();
  }

  /**
   * Create a water drop texture.
   */
  _makeWaterTexture() {
    const gfx = this.make.graphics({ add: false });
    gfx.fillStyle(0x4488DD, 1);
    gfx.fillCircle(6, 8, 5);
    gfx.fillTriangle(6, 1, 2, 8, 10, 8);
    gfx.generateTexture('water', 12, 14);
    gfx.destroy();
  }

  /**
   * Create a bandage texture.
   */
  _makeBandageTexture() {
    const gfx = this.make.graphics({ add: false });
    gfx.fillStyle(0xFFEEDD, 1);
    gfx.fillRoundedRect(0, 3, 16, 8, 2);
    gfx.lineStyle(1, 0xCCBBAA, 1);
    gfx.strokeRoundedRect(0, 3, 16, 8, 2);
    // Cross mark
    gfx.fillStyle(0xDD6644, 1);
    gfx.fillRect(7, 4, 2, 6);
    gfx.fillRect(5, 6, 6, 2);
    gfx.generateTexture('bandage', 16, 14);
    gfx.destroy();
  }

  /**
   * Create an obstacle block texture.
   */
  _makeObstacleTexture(key, color) {
    const gfx = this.make.graphics({ add: false });
    gfx.fillStyle(color, 0.9);
    gfx.fillRoundedRect(0, 0, 80, 60, 8);
    gfx.lineStyle(2, 0x221122, 0.6);
    gfx.strokeRoundedRect(0, 0, 80, 60, 8);
    gfx.generateTexture(key, 80, 60);
    gfx.destroy();
  }

  /**
   * Create a small particle texture.
   */
  _makeParticleTexture(key, color) {
    const gfx = this.make.graphics({ add: false });
    gfx.fillStyle(color, 1);
    gfx.fillCircle(4, 4, 4);
    gfx.generateTexture(key, 8, 8);
    gfx.destroy();
  }

  /**
   * Create a star shape texture.
   */
  _makeStarTexture() {
    const gfx = this.make.graphics({ add: false });
    gfx.fillStyle(0xFFDD44, 1);
    // Simple 4-point star
    gfx.fillTriangle(8, 0, 4, 16, 12, 16);
    gfx.fillTriangle(8, 16, 4, 0, 12, 0);
    gfx.generateTexture('star', 16, 16);
    gfx.destroy();
  }

  /**
   * Create a heart shape texture.
   */
  _makeHeartTexture() {
    const gfx = this.make.graphics({ add: false });
    gfx.fillStyle(0xDD4466, 1);
    gfx.fillCircle(6, 6, 6);
    gfx.fillCircle(14, 6, 6);
    gfx.fillTriangle(0, 8, 10, 20, 20, 8);
    gfx.generateTexture('heart', 20, 20);
    gfx.destroy();
  }

  /**
   * Create a road texture for Good Samaritan.
   */
  _makeRoadTexture() {
    const gfx = this.make.graphics({ add: false });
    gfx.fillStyle(0xC4A874, 1);
    gfx.fillRect(0, 0, 64, 32);
    // Road markings
    gfx.fillStyle(0xB09060, 0.6);
    gfx.fillRect(0, 14, 64, 4);
    gfx.generateTexture('road', 64, 32);
    gfx.destroy();
  }

  /**
   * Create an episode card background texture.
   */
  _makeCardTexture() {
    const gfx = this.make.graphics({ add: false });
    gfx.fillStyle(0x3A2F24, 0.9);
    gfx.fillRoundedRect(0, 0, 200, 260, 12);
    gfx.lineStyle(2, 0xBFA76A, 0.7);
    gfx.strokeRoundedRect(0, 0, 200, 260, 12);
    gfx.generateTexture('card', 200, 260);
    gfx.destroy();
  }
}
