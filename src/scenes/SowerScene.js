// ============================================================================
// SowerScene.js — Full playable episode: The Sower
//
// The player IS the sower, distributing 12 seeds across 4 types of soil.
// After planting, an animated time-lapse shows what happens in each soil.
// Finally, an interactive matching puzzle connects each soil to its meaning.
// ============================================================================

import Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../../shared/index.js';
import { DialogSystem } from '../systems/DialogSystem.js';
import { ColorTransition } from '../systems/ColorTransition.js';

const W = 800;
const H = 600;

// Soil strip layout
const STRIP_X = 100;
const STRIP_W = 600;
const STRIP_H = 80;
const STRIP_START_Y = 140;
const STRIP_GAP = 20;

const SOIL_TYPES = [
  { key: 'path',   label: 'Hard Path',     color: 0xAAAAAA, y: 0 },
  { key: 'rocky',  label: 'Rocky Soil',    color: 0x9B8B6B, y: 0 },
  { key: 'thorny', label: 'Thorny Ground', color: 0x8B7B5B, y: 0 },
  { key: 'good',   label: 'Good Soil',     color: 0x5C4033, y: 0 },
];

// Meanings for the matching puzzle
const MEANINGS = [
  { key: 'path',   text: 'Those who hear but don\'t understand' },
  { key: 'rocky',  text: 'Those who receive with joy but have no root' },
  { key: 'thorny', text: 'Worries of life choke the word' },
  { key: 'good',   text: 'Those who hear, understand, and produce fruit' },
];

export class SowerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SowerScene' });
  }

  create() {
    this.phase = 0;
    this.seedsRemaining = 12;
    this.seedsPlanted = { path: 0, rocky: 0, thorny: 0, good: 0 };
    this.plantedSeeds = []; // { soilKey, sprite, x, y }

    // Systems
    this.dialog = new DialogSystem(this);
    this.colorTrans = new ColorTransition(this);
    this.colorTrans.init(-1);
    this.colorTrans.setMoodImmediate('warm');

    this.cameras.main.setBackgroundColor('#F0E8D0');

    // Build
    this._buildScene();

    // Fade in + start
    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.time.delayedCall(800, () => this._startPhase1());
  }

  // ---------------------------------------------------------------------------
  // Scene building
  // ---------------------------------------------------------------------------

  _buildScene() {
    // Title
    this.add.text(W / 2, 30, 'The Parable of the Sower', {
      fontFamily: 'Georgia, serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#5C4033',
    }).setOrigin(0.5).setDepth(10);

    // --- Sky area ---
    const sky = this.add.graphics();
    sky.fillStyle(0xCCDDEE, 0.3);
    sky.fillRect(0, 0, W, 100);
    sky.setDepth(-3);

    // --- Soil strips ---
    this.soilZones = [];
    SOIL_TYPES.forEach((soil, i) => {
      const y = STRIP_START_Y + i * (STRIP_H + STRIP_GAP);
      soil.y = y;

      // Background strip
      const strip = this.add.graphics();
      strip.fillStyle(soil.color, 1);
      strip.fillRoundedRect(STRIP_X, y, STRIP_W, STRIP_H, 8);
      strip.lineStyle(1, 0x444444, 0.3);
      strip.strokeRoundedRect(STRIP_X, y, STRIP_W, STRIP_H, 8);
      strip.setDepth(0);

      // Decorations based on type
      if (soil.key === 'rocky') {
        for (let r = 0; r < 8; r++) {
          strip.fillStyle(0x888888, 0.6);
          strip.fillCircle(
            STRIP_X + 30 + Math.random() * (STRIP_W - 60),
            y + 15 + Math.random() * (STRIP_H - 30),
            3 + Math.random() * 5
          );
        }
      }
      if (soil.key === 'thorny') {
        for (let t = 0; t < 6; t++) {
          const tx = STRIP_X + 40 + t * 95;
          const ty = y + 20 + Math.random() * 40;
          const thorn = this.add.image(tx, ty, 'thorn').setDepth(1).setAlpha(0.5).setScale(0.8);
        }
      }

      // Label
      this.add.text(STRIP_X - 8, y + STRIP_H / 2, soil.label, {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#666655',
      }).setOrigin(1, 0.5).setDepth(2);

      // Interactive zone for planting
      const zone = this.add.zone(STRIP_X + STRIP_W / 2, y + STRIP_H / 2, STRIP_W, STRIP_H)
        .setInteractive({ useHandCursor: true });

      zone.soilKey = soil.key;
      zone.soilY = y;

      // Hover highlight
      const highlight = this.add.graphics();
      highlight.lineStyle(3, COLORS.GOLD, 0.6);
      highlight.strokeRoundedRect(STRIP_X - 2, y - 2, STRIP_W + 4, STRIP_H + 4, 10);
      highlight.setDepth(1).setAlpha(0);

      zone.on('pointerover', () => { if (this.phase === 1) highlight.setAlpha(1); });
      zone.on('pointerout', () => highlight.setAlpha(0));
      zone.on('pointerdown', (pointer) => {
        if (this.phase !== 1 || this.seedsRemaining <= 0) return;
        this._plantSeed(zone.soilKey, pointer.x, zone.soilY);
      });

      this.soilZones.push(zone);
    });

    // --- Seed counter UI ---
    this.seedBag = this.add.image(W / 2 - 30, H - 40, 'seed').setScale(2).setDepth(10);
    this.seedCountText = this.add.text(W / 2, H - 40, `Seeds: ${this.seedsRemaining}`, {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#5C4033',
    }).setOrigin(0, 0.5).setDepth(10);

    // --- Phase title ---
    this.phaseTitle = this.add.text(W / 2, 70, '', {
      fontFamily: 'Georgia, serif', fontSize: '16px', fontStyle: 'italic', color: '#8A7A5A',
    }).setOrigin(0.5).setDepth(10).setAlpha(0);
  }

  // ---------------------------------------------------------------------------
  // Phase 1 — The Seeds
  // ---------------------------------------------------------------------------

  async _startPhase1() {
    this.phase = 1;
    this._showPhaseTitle('Scatter your seeds');

    await this.dialog.say('Jesus', 'A farmer went out to sow his seed...');
    await this.dialog.say('', 'You have 12 seeds. Click on any soil strip to plant a seed.');
    await this.dialog.say('', 'You can distribute them however you wish across all four types of ground.');
  }

  _plantSeed(soilKey, x, soilY) {
    if (this.seedsRemaining <= 0) return;

    this.seedsRemaining--;
    this.seedsPlanted[soilKey]++;
    this.seedCountText.setText(`Seeds: ${this.seedsRemaining}`);

    // Clamp x within the strip
    const sx = Phaser.Math.Clamp(x, STRIP_X + 15, STRIP_X + STRIP_W - 15);
    const sy = soilY + 20 + Phaser.Math.Between(5, STRIP_H - 30);

    // Create seed sprite with a planting animation
    const seed = this.add.image(sx, sy - 30, 'seed').setDepth(3).setAlpha(0).setScale(0.8);
    this.tweens.add({
      targets: seed,
      y: sy,
      alpha: 1,
      duration: 400,
      ease: 'Bounce.easeOut',
    });

    this.plantedSeeds.push({ soilKey, sprite: seed, x: sx, y: sy });

    // Check if all seeds planted
    if (this.seedsRemaining <= 0) {
      this.time.delayedCall(600, () => this._startPhase2());
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 2 — The Scattering (growth animation)
  // ---------------------------------------------------------------------------

  async _startPhase2() {
    this.phase = 2;
    this._showPhaseTitle('Watch what happens...');

    await this.dialog.say('', 'All seeds are planted. Now watch what happens to each...');
    await this._wait(500);

    // --- Path seeds: birds eat them ---
    const pathSeeds = this.plantedSeeds.filter((s) => s.soilKey === 'path');
    if (pathSeeds.length > 0) {
      await this._showSoilText(SOIL_TYPES[0].y, 'Some fell along the path, and the birds came and ate it up.');

      for (const ps of pathSeeds) {
        // Bird swoops in
        const bird = this.add.image(ps.x - 60, ps.y - 60, 'bird').setDepth(5).setScale(1.2);
        this.tweens.add({
          targets: bird,
          x: ps.x,
          y: ps.y - 10,
          duration: 600,
          ease: 'Power2',
        });
        await this._wait(700);
        // Seed disappears
        this.tweens.add({ targets: ps.sprite, alpha: 0, duration: 300 });
        // Bird flies away
        this.tweens.add({
          targets: bird,
          x: ps.x + 100,
          y: ps.y - 80,
          alpha: 0,
          duration: 600,
          onComplete: () => bird.destroy(),
        });
        await this._wait(400);
      }
    }
    await this._wait(400);

    // --- Rocky soil seeds: sprout but wilt ---
    const rockySeeds = this.plantedSeeds.filter((s) => s.soilKey === 'rocky');
    if (rockySeeds.length > 0) {
      await this._showSoilText(SOIL_TYPES[1].y, 'Some fell on rocky places. It sprang up quickly but had no root.');

      for (const ps of rockySeeds) {
        // Quick sprout
        ps.sprite.setTexture('sprout');
        this.tweens.add({
          targets: ps.sprite,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 500,
        });
        await this._wait(300);
      }

      // Sun appears and scorches
      const sun = this.add.image(W - 80, 50, 'sun').setDepth(6).setScale(2).setAlpha(0);
      this.tweens.add({ targets: sun, alpha: 0.9, duration: 800 });
      await this._wait(1000);

      for (const ps of rockySeeds) {
        // Wilt: shrink and brown
        ps.sprite.setTint(0xAA8844);
        this.tweens.add({
          targets: ps.sprite,
          scaleX: 0.3,
          scaleY: 0.3,
          alpha: 0.3,
          duration: 800,
        });
      }
      this.tweens.add({ targets: sun, alpha: 0, duration: 600, delay: 500 });
      await this._wait(1500);
    }
    await this._wait(400);

    // --- Thorny ground seeds: grow but get choked ---
    const thornySeeds = this.plantedSeeds.filter((s) => s.soilKey === 'thorny');
    if (thornySeeds.length > 0) {
      await this._showSoilText(SOIL_TYPES[2].y, 'Some fell among thorns, which grew up and choked the plants.');

      for (const ps of thornySeeds) {
        ps.sprite.setTexture('plant');
        this.tweens.add({
          targets: ps.sprite,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 600,
        });
      }
      await this._wait(700);

      // Thorns grow and overtake
      for (const ps of thornySeeds) {
        const thorn = this.add.image(ps.x, ps.y, 'thorn').setDepth(4).setScale(0.3).setAlpha(0);
        this.tweens.add({
          targets: thorn,
          scaleX: 2.5,
          scaleY: 2.5,
          alpha: 1,
          duration: 1000,
        });
        this.tweens.add({
          targets: ps.sprite,
          alpha: 0.2,
          scaleX: 0.4,
          scaleY: 0.4,
          duration: 1000,
          delay: 300,
        });
      }
      await this._wait(1500);
    }
    await this._wait(400);

    // --- Good soil seeds: full growth with fruit ---
    const goodSeeds = this.plantedSeeds.filter((s) => s.soilKey === 'good');
    if (goodSeeds.length > 0) {
      await this._showSoilText(SOIL_TYPES[3].y, 'But some fell on good soil and produced a crop — a hundred, sixty, or thirty times what was sown!');

      for (const ps of goodSeeds) {
        // Stage 1: sprout
        ps.sprite.setTexture('sprout');
        await this._wait(400);
        // Stage 2: plant
        ps.sprite.setTexture('plant');
        this.tweens.add({
          targets: ps.sprite,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 500,
        });
        await this._wait(400);
        // Stage 3: full plant with fruit
        ps.sprite.setTexture('fullPlant');
        this.tweens.add({
          targets: ps.sprite,
          scaleX: 1.5,
          scaleY: 1.5,
          duration: 500,
        });
        await this._wait(200);
      }

      this.colorTrans.setMood('joyful', 1000);
      await this._wait(1000);
    }

    // If no good seeds were planted
    if (goodSeeds.length === 0) {
      await this.dialog.say('', 'You planted no seeds in the good soil! But the lesson remains...');
    }

    await this._wait(800);
    this._startPhase3();
  }

  // ---------------------------------------------------------------------------
  // Phase 3 — Understanding (matching puzzle)
  // ---------------------------------------------------------------------------

  async _startPhase3() {
    this.phase = 3;
    this._showPhaseTitle('What does it mean?');
    this.colorTrans.setMood('warm', 1000);

    await this.dialog.say('Jesus', 'Listen then to what the parable of the sower means...');
    await this.dialog.say('', 'Match each soil type to its meaning. Click a soil, then click its meaning.');

    // Clear the field and show matching puzzle
    this._clearField();
    this._createMatchingPuzzle();
  }

  _clearField() {
    // Fade out planted seeds and decorations
    this.plantedSeeds.forEach((ps) => {
      if (ps.sprite) this.tweens.add({ targets: ps.sprite, alpha: 0, duration: 400 });
    });
    this.soilZones.forEach((z) => z.disableInteractive());
    this.seedBag.setVisible(false);
    this.seedCountText.setVisible(false);
  }

  _createMatchingPuzzle() {
    this.matchState = {
      selectedSoil: null,
      matched: new Set(),
      soilButtons: [],
      meaningButtons: [],
    };

    const leftX = 120;
    const rightX = 480;
    const startY = 160;
    const btnH = 50;
    const gap = 18;

    // --- Soil type buttons on the left ---
    SOIL_TYPES.forEach((soil, i) => {
      const y = startY + i * (btnH + gap);
      const bg = this.add.graphics();
      bg.fillStyle(soil.color, 0.8);
      bg.fillRoundedRect(leftX, y, 200, btnH, 8);
      bg.lineStyle(2, 0x555555, 0.3);
      bg.strokeRoundedRect(leftX, y, 200, btnH, 8);
      bg.setDepth(20);

      const txt = this.add.text(leftX + 100, y + btnH / 2, soil.label, {
        fontFamily: 'Georgia, serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#FFFFFF',
      }).setOrigin(0.5).setDepth(21);

      const zone = this.add.zone(leftX + 100, y + btnH / 2, 200, btnH)
        .setInteractive({ useHandCursor: true }).setDepth(22);

      zone.soilKey = soil.key;
      zone.bg = bg;
      zone.txt = txt;

      zone.on('pointerdown', () => this._selectSoil(soil.key));

      this.matchState.soilButtons.push(zone);
    });

    // --- Meaning buttons on the right (shuffled) ---
    const shuffled = Phaser.Utils.Array.Shuffle([...MEANINGS]);

    shuffled.forEach((meaning, i) => {
      const y = startY + i * (btnH + gap);
      const bg = this.add.graphics();
      bg.fillStyle(0x3A3A2A, 0.85);
      bg.fillRoundedRect(rightX, y, 280, btnH, 8);
      bg.lineStyle(1, COLORS.GOLD, 0.3);
      bg.strokeRoundedRect(rightX, y, 280, btnH, 8);
      bg.setDepth(20);

      const txt = this.add.text(rightX + 140, y + btnH / 2, meaning.text, {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#DDCCAA',
        wordWrap: { width: 260 },
        align: 'center',
      }).setOrigin(0.5).setDepth(21);

      const zone = this.add.zone(rightX + 140, y + btnH / 2, 280, btnH)
        .setInteractive({ useHandCursor: true }).setDepth(22);

      zone.meaningKey = meaning.key;
      zone.bg = bg;
      zone.txt = txt;

      zone.on('pointerdown', () => this._selectMeaning(meaning.key));

      this.matchState.meaningButtons.push(zone);
    });

    // Instructions
    this.matchInstruction = this.add.text(W / 2, 130, 'Click a soil type, then click its meaning', {
      fontFamily: 'Georgia, serif', fontSize: '14px', fontStyle: 'italic', color: '#8A7A5A',
    }).setOrigin(0.5).setDepth(20);
  }

  _selectSoil(key) {
    if (this.matchState.matched.has(key)) return;

    // Highlight the selected soil
    this.matchState.selectedSoil = key;
    this.matchState.soilButtons.forEach((z) => {
      const highlight = (z.soilKey === key) ? COLORS.GOLD : 0x555555;
      z.bg.clear();
      const soil = SOIL_TYPES.find((s) => s.key === z.soilKey);
      z.bg.fillStyle(soil.color, 0.8);
      const idx = SOIL_TYPES.indexOf(soil);
      const y = 160 + idx * 68;
      z.bg.fillRoundedRect(120, y, 200, 50, 8);
      z.bg.lineStyle(3, highlight, 0.8);
      z.bg.strokeRoundedRect(120, y, 200, 50, 8);
    });
  }

  _selectMeaning(key) {
    if (!this.matchState.selectedSoil) return;
    if (this.matchState.matched.has(key)) return;

    const soilKey = this.matchState.selectedSoil;

    if (soilKey === key) {
      // Correct match!
      this.matchState.matched.add(key);

      // Green flash on both
      const soilBtn = this.matchState.soilButtons.find((z) => z.soilKey === key);
      const meanBtn = this.matchState.meaningButtons.find((z) => z.meaningKey === key);

      if (soilBtn) soilBtn.txt.setColor('#88DD66');
      if (meanBtn) meanBtn.txt.setColor('#88DD66');

      // Draw connection line
      const line = this.add.graphics();
      line.lineStyle(2, 0x88DD66, 0.6);
      line.lineBetween(
        soilBtn ? soilBtn.x + 100 : 320,
        soilBtn ? soilBtn.y : 0,
        meanBtn ? meanBtn.x - 140 : 480,
        meanBtn ? meanBtn.y : 0
      );
      line.setDepth(19);

      this.matchState.selectedSoil = null;

      // Check if all matched
      if (this.matchState.matched.size >= 4) {
        this.time.delayedCall(600, () => this._puzzleComplete());
      }
    } else {
      // Wrong match — brief red flash
      const meanBtn = this.matchState.meaningButtons.find((z) => z.meaningKey === key);
      if (meanBtn) {
        meanBtn.txt.setColor('#DD6644');
        this.time.delayedCall(400, () => meanBtn.txt.setColor('#DDCCAA'));
      }
    }
  }

  async _puzzleComplete() {
    this.colorTrans.setMood('joyful', 1000);
    this._celebrationParticles();

    await this.dialog.say('', 'Well done! You understand the parable of the sower.');
    await this.dialog.say('Jesus', 'But the seed falling on good soil refers to someone who hears the word and understands it. This is the one who produces a crop, yielding a hundred, sixty or thirty times what was sown.');

    await this._wait(1500);

    // Transition to reflection
    this.cameras.main.fadeOut(1200, 255, 250, 230);
    this.time.delayedCall(1300, () => {
      this.dialog.destroy();
      this.colorTrans.destroy();
      this.scene.start('ReflectionScene', {
        episode: 'sower',
        title: 'The Sower',
        scriptureId: 7,
        reflection: 'What kind of soil is your heart right now?',
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  _showPhaseTitle(text) {
    this.phaseTitle.setText(text);
    this.tweens.killTweensOf(this.phaseTitle);
    this.tweens.add({
      targets: this.phaseTitle,
      alpha: { from: 0, to: 1 },
      duration: 600,
      yoyo: true,
      hold: 2000,
    });
  }

  async _showSoilText(y, text) {
    const txt = this.add.text(W / 2, y - 20, text, {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      fontStyle: 'italic',
      color: '#5C4033',
      wordWrap: { width: STRIP_W - 20 },
      align: 'center',
    }).setOrigin(0.5, 1).setDepth(10).setAlpha(0);

    this.tweens.add({
      targets: txt,
      alpha: { from: 0, to: 1 },
      duration: 500,
      yoyo: true,
      hold: 2500,
      onComplete: () => txt.destroy(),
    });

    await this._wait(3200);
  }

  _celebrationParticles() {
    for (let i = 0; i < 25; i++) {
      const px = Phaser.Math.Between(100, 700);
      const py = Phaser.Math.Between(100, 500);
      const key = ['particle', 'particleWarm', 'star'][i % 3];
      const p = this.add.image(px, py, key).setDepth(50).setAlpha(0);
      this.tweens.add({
        targets: p,
        alpha: { from: 0, to: 0.7 },
        y: py - Phaser.Math.Between(30, 80),
        scaleX: { from: 0.3, to: Phaser.Math.FloatBetween(0.6, 1.5) },
        scaleY: { from: 0.3, to: Phaser.Math.FloatBetween(0.6, 1.5) },
        duration: Phaser.Math.Between(600, 1500),
        delay: Phaser.Math.Between(0, 400),
        yoyo: true,
        onComplete: () => p.destroy(),
      });
    }
  }

  _wait(ms) {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }
}
