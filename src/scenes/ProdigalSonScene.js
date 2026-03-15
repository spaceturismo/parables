// ============================================================================
// ProdigalSonScene.js — Full playable episode: The Prodigal Son
//
// A 3-phase narrative experience where the player IS the prodigal son,
// journeying away from home and finding the way back. Colors shift from
// warm to cold and back again as the story progresses.
// ============================================================================

import Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../../shared/index.js';
import { DialogSystem } from '../systems/DialogSystem.js';
import { ColorTransition } from '../systems/ColorTransition.js';
import { TouchInput } from '../systems/TouchInput.js';

// Scene dimensions and constants
const W = 800;
const H = 600;
const GROUND_Y = 440;     // Y of the ground/path surface
const PLAYER_SPEED = 3;   // Pixels per frame for player movement

// World extends far beyond the screen — we scroll the camera
const WORLD_LEFT = -1200;
const WORLD_RIGHT = 1200;
const HOME_X = 900;        // Father's house position
const CITY_X = -900;       // Far city position

export class ProdigalSonScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ProdigalSonScene' });
  }

  create() {
    // --- Phase tracking ---
    this.phase = 0; // 0=intro, 1=departure, 2=farCountry, 3=return, 4=reunion
    this.coins = 0;
    this.maxCoins = 0;
    this.friends = [];
    this.obstacles = [];
    this.playerTargetX = null;
    this.inputEnabled = false;

    // --- Camera ---
    this.cameras.main.setBounds(WORLD_LEFT - 100, 0, WORLD_RIGHT - WORLD_LEFT + 200, H);
    this.cameras.main.setBackgroundColor('#FFF5E1');

    // --- Systems ---
    this.dialog = new DialogSystem(this);
    this.colorTrans = new ColorTransition(this);
    this.colorTrans.init(-1);
    this.colorTrans.setMoodImmediate('warm');

    // --- Build world ---
    this._buildWorld();

    // --- Player ---
    this.player = this.add.image(HOME_X - 50, GROUND_Y - 22, 'player').setOrigin(0.5, 1);
    this.player.setDepth(10);

    // --- Camera follows player ---
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // --- Coins UI (fixed to camera) ---
    this.coinIcon = this.add.image(30, 30, 'coin').setScrollFactor(0).setDepth(100);
    this.coinText = this.add.text(46, 22, '0', {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: COLORS_CSS.GOLD,
    }).setScrollFactor(0).setDepth(100);
    this.coinIcon.setVisible(false);
    this.coinText.setVisible(false);

    // --- Phase title display (fixed to camera) ---
    this.phaseTitle = this.add.text(W / 2, 30, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      fontStyle: 'italic',
      color: '#8B7355',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);

    // --- Input: click to move ---
    this.input.on('pointerdown', (pointer) => {
      if (!this.inputEnabled) return;
      // Convert screen pointer to world coordinates
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.playerTargetX = worldPoint.x;
    });

    // Arrow key input
    this.cursors = this.input.keyboard.createCursorKeys();

    // --- Touch input ---
    this.touchInput = new TouchInput(this);
    this.touchInput.enableDPad();

    // --- Begin the story ---
    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.time.delayedCall(1000, () => this._startPhase0());
  }

  // ---------------------------------------------------------------------------
  // Update loop
  // ---------------------------------------------------------------------------

  update() {
    if (!this.inputEnabled) return;

    let dx = 0;

    // Touch d-pad movement
    const touchDir = this.touchInput ? this.touchInput.getDirection() : null;

    // Keyboard or touch d-pad movement
    if (this.cursors.left.isDown || (touchDir && touchDir.left)) {
      dx = -PLAYER_SPEED;
      this.playerTargetX = null;
    } else if (this.cursors.right.isDown || (touchDir && touchDir.right)) {
      dx = PLAYER_SPEED;
      this.playerTargetX = null;
    }

    // Click-to-move
    if (this.playerTargetX !== null) {
      const diff = this.playerTargetX - this.player.x;
      if (Math.abs(diff) > 4) {
        dx = Math.sign(diff) * PLAYER_SPEED;
      } else {
        this.playerTargetX = null;
      }
    }

    if (dx !== 0) {
      this.player.x += dx;
      // Flip sprite based on direction
      this.player.setFlipX(dx < 0);
    }

    // Clamp player to world bounds
    this.player.x = Phaser.Math.Clamp(this.player.x, WORLD_LEFT + 20, WORLD_RIGHT - 20);

    // --- Phase-specific logic ---
    if (this.phase === 1) this._updateDeparture();
    if (this.phase === 2) this._updateFarCountry();
    if (this.phase === 3) this._updateReturn();
  }

  // ---------------------------------------------------------------------------
  // World building
  // ---------------------------------------------------------------------------

  _buildWorld() {
    // --- Ground path across the entire world ---
    for (let x = WORLD_LEFT; x < WORLD_RIGHT; x += 32) {
      const progress = (x - WORLD_LEFT) / (WORLD_RIGHT - WORLD_LEFT);
      const key = progress > 0.6 ? 'pathWarm' : 'pathCold';
      this.add.image(x, GROUND_Y, key).setOrigin(0, 0).setDepth(0);
    }

    // Grass below path
    const grassGfx = this.add.graphics();
    grassGfx.fillStyle(0x7CAA5A, 0.3);
    grassGfx.fillRect(WORLD_LEFT, GROUND_Y + 32, WORLD_RIGHT - WORLD_LEFT, 200);
    grassGfx.setDepth(-2);

    // --- Father's House (right side, warm area) ---
    this.fatherHouse = this.add.image(HOME_X, GROUND_Y - 28, 'fatherHouse')
      .setOrigin(0.5, 1).setScale(1.5).setDepth(2);

    // House glow
    const houseGlow = this.add.graphics();
    houseGlow.fillStyle(0xFFDD66, 0.15);
    houseGlow.fillCircle(HOME_X, GROUND_Y - 50, 80);
    houseGlow.setDepth(1);

    // Father character (standing by the house)
    this.father = this.add.image(HOME_X - 60, GROUND_Y - 22, 'father')
      .setOrigin(0.5, 1).setDepth(5);

    // Home label
    this.add.text(HOME_X, GROUND_Y - 100, "Father's House", {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      fontStyle: 'italic',
      color: '#8B6914',
    }).setOrigin(0.5).setDepth(3);

    // --- City buildings (left side, cold area) ---
    for (let i = 0; i < 5; i++) {
      const bx = CITY_X + i * 70 - 140;
      this.add.image(bx, GROUND_Y - 28, 'cityBuilding')
        .setOrigin(0.5, 1).setScale(1.2 + Math.random() * 0.5).setDepth(2);
    }

    this.add.text(CITY_X, GROUND_Y - 120, 'The Far Country', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      fontStyle: 'italic',
      color: '#667788',
    }).setOrigin(0.5).setDepth(3);

    // --- Coins scattered along the departure path ---
    this.coinSprites = [];
    for (let i = 0; i < 10; i++) {
      const cx = HOME_X - 150 - i * 140;
      const cy = GROUND_Y - 10 + Phaser.Math.Between(-15, 15);
      const coin = this.add.image(cx, cy, 'coin').setDepth(5);
      coin.collected = false;
      this.coinSprites.push(coin);
    }

    // --- Pig pen (appears near the city) ---
    this.pigPen = this.add.image(CITY_X + 250, GROUND_Y - 20, 'pigPen')
      .setOrigin(0.5, 1).setScale(1.2).setDepth(2).setVisible(false);
    this.add.text(CITY_X + 250, GROUND_Y - 60, 'Pig Pen', {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      color: '#887766',
    }).setOrigin(0.5).setDepth(3).setVisible(false).setName('pigPenLabel');

    // --- Obstacles for the return journey ---
    const obstacleData = [
      { x: -200, label: 'SHAME', correct: 'Humility', wrong: 'Hide' },
      { x: 100, label: 'GUILT', correct: 'Repentance', wrong: 'Denial' },
      { x: 400, label: 'FEAR', correct: 'Trust', wrong: 'Run Away' },
    ];

    obstacleData.forEach((data) => {
      const obs = this.add.image(data.x, GROUND_Y - 30, 'obstacle')
        .setOrigin(0.5, 1).setDepth(8).setVisible(false);
      const label = this.add.text(data.x, GROUND_Y - 50, data.label, {
        fontFamily: 'Georgia, serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#FFCCCC',
      }).setOrigin(0.5).setDepth(9).setVisible(false);

      this.obstacles.push({ sprite: obs, label, ...data, resolved: false });
    });
  }

  // ---------------------------------------------------------------------------
  // Phase 0 — Introduction
  // ---------------------------------------------------------------------------

  async _startPhase0() {
    this._showPhaseTitle('The Father\'s House');

    await this.dialog.say('Father', 'My child, you are always welcome here.');
    await this.dialog.say('', 'The path leads west, toward a distant city...');
    await this.dialog.say('', 'Use arrow keys, tap, or the on-screen controls to move. Collect the coins along the way.');

    this.phase = 1;
    this.inputEnabled = true;
    this.coinIcon.setVisible(true);
    this.coinText.setVisible(true);
    this._showPhaseTitle('Phase I — The Departure');
  }

  // ---------------------------------------------------------------------------
  // Phase 1 — The Departure (moving left, collecting coins)
  // ---------------------------------------------------------------------------

  _updateDeparture() {
    // Color transition based on player position
    const progress = Phaser.Math.Clamp(
      (HOME_X - this.player.x) / (HOME_X - CITY_X), 0, 1
    );
    this.colorTrans.lerpMood('warm', 'cold', progress);

    // Collect coins
    this.coinSprites.forEach((coin) => {
      if (!coin.collected && Math.abs(coin.x - this.player.x) < 24) {
        coin.collected = true;
        this.coins++;
        this.maxCoins = Math.max(this.maxCoins, this.coins);
        this.coinText.setText(String(this.coins));

        // Pickup animation
        this.tweens.add({
          targets: coin,
          y: coin.y - 30,
          alpha: 0,
          scaleX: 0.3,
          scaleY: 0.3,
          duration: 300,
          onComplete: () => coin.setVisible(false),
        });
      }
    });

    // Transition to Phase 2 when reaching the city
    if (this.player.x < CITY_X + 200) {
      this.phase = 2;
      this._startPhase2();
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 2 — The Far Country
  // ---------------------------------------------------------------------------

  async _startPhase2() {
    this.inputEnabled = false;
    this._showPhaseTitle('Phase II — The Far Country');

    await this.dialog.say('', 'You have arrived in the far country with your wealth.');

    // Spawn friends
    for (let i = 0; i < 3; i++) {
      const fx = CITY_X - 80 + i * 80;
      const f = this.add.image(fx, GROUND_Y - 22, 'friend')
        .setOrigin(0.5, 1).setDepth(5).setAlpha(0);
      this.tweens.add({ targets: f, alpha: 1, duration: 500, delay: i * 300 });
      this.friends.push(f);
    }

    await this.dialog.say('', '"Friends" appear, drawn by your wealth...');

    // Drain coins one by one
    this.inputEnabled = false;
    await this._drainCoins();

    // Friends disappear
    await this.dialog.say('', 'As the money runs out, your friends vanish.');

    for (const f of this.friends) {
      this.tweens.add({ targets: f, alpha: 0, duration: 600 });
    }

    await this._wait(800);

    // Show pig pen
    this.pigPen.setVisible(true);
    const pigLabel = this.children.getByName('pigPenLabel');
    if (pigLabel) pigLabel.setVisible(true);

    this.colorTrans.setMood('dark', 1000);

    await this.dialog.say('', 'Alone and hungry, you are left with nothing.');
    await this.dialog.say('', 'Walk to the pig pen...');

    this.inputEnabled = true;
    this._waitForPlayerAt(CITY_X + 250, 40, () => this._pigPenMoment());
  }

  async _pigPenMoment() {
    this.inputEnabled = false;
    await this.dialog.say('Prodigal Son', 'Even my father\'s servants have food to spare, and here I am, starving.');
    await this.dialog.say('Prodigal Son', 'I will go back to my father and say: Father, I have sinned against heaven and against you.');

    // Transition to Phase 3
    this.phase = 3;
    this._startPhase3();
  }

  async _drainCoins() {
    while (this.coins > 0) {
      this.coins--;
      this.coinText.setText(String(this.coins));
      await this._wait(400);
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 3 — The Return (moving right, overcoming obstacles)
  // ---------------------------------------------------------------------------

  async _startPhase3() {
    this._showPhaseTitle('Phase III — The Return');

    // Make obstacles visible
    this.obstacles.forEach((obs) => {
      obs.sprite.setVisible(true);
      obs.label.setVisible(true);
    });

    await this.dialog.say('', 'Now journey back home — to the right. But the path has obstacles.');
    await this.dialog.say('', 'Face each one by choosing the right response.');

    this.inputEnabled = true;
  }

  _updateReturn() {
    // Color transition as player moves toward home
    const progress = Phaser.Math.Clamp(
      (this.player.x - CITY_X) / (HOME_X - CITY_X), 0, 1
    );
    this.colorTrans.lerpMood('dark', 'warm', progress);

    // Check for obstacle encounters
    this.obstacles.forEach((obs) => {
      if (!obs.resolved && Math.abs(obs.x - this.player.x) < 50) {
        this._encounterObstacle(obs);
      }
    });

    // Check for reunion
    if (this.player.x > HOME_X - 200 && !this._reunionTriggered) {
      this._reunionTriggered = true;
      this._startReunion();
    }
  }

  async _encounterObstacle(obs) {
    obs.resolved = true; // prevent re-trigger
    this.inputEnabled = false;

    const choice = await this.dialog.choose(
      '',
      `A wall of ${obs.label} blocks your path. How do you respond?`,
      [
        { label: obs.correct, value: 'correct' },
        { label: obs.wrong, value: 'wrong' },
      ]
    );

    if (choice === 'correct') {
      await this.dialog.say('', `You chose ${obs.correct}. The obstacle dissolves.`);

      // Dissolve animation
      this.tweens.add({
        targets: [obs.sprite, obs.label],
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 800,
        ease: 'Power2',
      });
    } else {
      await this.dialog.say('', `That didn't work. Try again with a different heart.`);
      // Show the correct answer
      await this.dialog.say('', `The answer is ${obs.correct}. The obstacle dissolves as you embrace it.`);

      this.tweens.add({
        targets: [obs.sprite, obs.label],
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 800,
        ease: 'Power2',
      });
    }

    await this._wait(500);
    this.inputEnabled = true;
  }

  // ---------------------------------------------------------------------------
  // Phase 4 — The Reunion
  // ---------------------------------------------------------------------------

  async _startReunion() {
    this.inputEnabled = false;
    this.phase = 4;
    this._showPhaseTitle('The Reunion');

    // Father runs toward the player!
    const fatherStartX = HOME_X - 60;
    const meetX = this.player.x + 80;

    // Move father sprite to starting position and animate running
    this.father.setFlipX(true);
    this.tweens.add({
      targets: this.father,
      x: meetX,
      duration: 1500,
      ease: 'Quad.easeOut',
    });

    await this._wait(1600);

    // Color burst
    this.colorTrans.setMood('joyful', 1000);

    await this.dialog.say('', 'But while he was still a long way off, his father saw him and was filled with compassion...');
    await this.dialog.say('Father', 'My son! You have come home!');
    await this.dialog.say('', 'His father ran to him, threw his arms around him, and kissed him.');

    // Particle celebration
    this._celebrationParticles();

    await this.dialog.say('Father', 'Quick! Bring the best robe and put it on him. For this son of mine was dead and is alive again; he was lost and is found!');

    await this._wait(2000);

    // Transition to reflection
    this.cameras.main.fadeOut(1200, 255, 250, 230);
    this.time.delayedCall(1300, () => {
      this.dialog.destroy();
      this.colorTrans.destroy();
      if (this.touchInput) this.touchInput.destroy();
      this.scene.start('ReflectionScene', {
        episode: 'prodigal-son',
        title: 'The Prodigal Son',
        scriptureId: 9,
        reflection: 'Is there something you need to return to God about today?',
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

  _celebrationParticles() {
    const px = this.player.x;
    const py = this.player.y - 40;
    for (let i = 0; i < 40; i++) {
      const keys = ['particle', 'particleWarm', 'star'];
      const key = keys[i % keys.length];
      const p = this.add.image(px, py, key).setDepth(50).setAlpha(0.8);
      this.tweens.add({
        targets: p,
        x: px + Phaser.Math.Between(-150, 150),
        y: py + Phaser.Math.Between(-120, 60),
        alpha: 0,
        scaleX: { from: 0.5, to: Phaser.Math.FloatBetween(0.8, 2) },
        scaleY: { from: 0.5, to: Phaser.Math.FloatBetween(0.8, 2) },
        duration: Phaser.Math.Between(800, 2000),
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
  }

  /**
   * Wait for the player to reach a target X within a threshold, then call cb.
   */
  _waitForPlayerAt(targetX, threshold, cb) {
    const check = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        if (Math.abs(this.player.x - targetX) < threshold) {
          check.remove();
          cb();
        }
      },
    });
  }

  /**
   * Promise-based delay.
   */
  _wait(ms) {
    return new Promise((resolve) => {
      this.time.delayedCall(ms, resolve);
    });
  }
}
