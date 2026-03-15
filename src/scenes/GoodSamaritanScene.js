// ============================================================================
// GoodSamaritanScene.js — Full playable episode: The Good Samaritan
//
// Top-down view of the road from Jerusalem to Jericho. The player watches
// as a priest and Levite pass by a wounded traveler, then takes control of
// the Samaritan to provide care and bring the man to an inn.
// ============================================================================

import Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../../shared/index.js';
import { DialogSystem } from '../systems/DialogSystem.js';
import { ColorTransition } from '../systems/ColorTransition.js';
import { TouchInput } from '../systems/TouchInput.js';

const W = 800;
const H = 600;
const ROAD_Y = 340;   // Center of the road
const SPEED = 2.5;

export class GoodSamaritanScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GoodSamaritanScene' });
  }

  create() {
    this.phase = 0;
    this.inputEnabled = false;
    this.playerTargetX = null;
    this.playerTargetY = null;
    this.woundsHealed = 0;
    this.totalWounds = 3;
    this.careStep = 0;

    // Systems
    this.dialog = new DialogSystem(this);
    this.colorTrans = new ColorTransition(this);
    this.colorTrans.init(-1);
    this.colorTrans.setMoodImmediate('warm');

    // Camera
    this.cameras.main.setBackgroundColor('#E8D8B8');

    // Build the scene
    this._buildScene();

    // Input
    this.input.on('pointerdown', (pointer) => {
      if (!this.inputEnabled) return;
      this.playerTargetX = pointer.x;
      this.playerTargetY = pointer.y;
    });
    this.cursors = this.input.keyboard.createCursorKeys();

    // --- Touch input ---
    this.touchInput = new TouchInput(this);
    this.touchInput.enableDPad();

    // Start
    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.time.delayedCall(800, () => this._startPhase1());
  }

  update() {
    if (!this.inputEnabled || !this.controlledChar) return;

    let dx = 0;
    let dy = 0;

    // Touch d-pad movement
    const touchDir = this.touchInput ? this.touchInput.getDirection() : null;

    if (this.cursors.left.isDown || (touchDir && touchDir.left)) { dx = -SPEED; this.playerTargetX = null; }
    else if (this.cursors.right.isDown || (touchDir && touchDir.right)) { dx = SPEED; this.playerTargetX = null; }
    if (this.cursors.up.isDown || (touchDir && touchDir.up)) { dy = -SPEED; this.playerTargetY = null; }
    else if (this.cursors.down.isDown || (touchDir && touchDir.down)) { dy = SPEED; this.playerTargetY = null; }

    // Click-to-move
    if (this.playerTargetX !== null) {
      const ddx = this.playerTargetX - this.controlledChar.x;
      const ddy = this.playerTargetY - this.controlledChar.y;
      const dist = Math.sqrt(ddx * ddx + ddy * ddy);
      if (dist > 4) {
        dx = (ddx / dist) * SPEED;
        dy = (ddy / dist) * SPEED;
      } else {
        this.playerTargetX = null;
        this.playerTargetY = null;
      }
    }

    if (dx !== 0 || dy !== 0) {
      this.controlledChar.x += dx;
      this.controlledChar.y += dy;
      this.controlledChar.setFlipX(dx < 0);
    }

    // Clamp
    this.controlledChar.x = Phaser.Math.Clamp(this.controlledChar.x, 20, W - 20);
    this.controlledChar.y = Phaser.Math.Clamp(this.controlledChar.y, 100, H - 80);
  }

  // ---------------------------------------------------------------------------
  // Scene building
  // ---------------------------------------------------------------------------

  _buildScene() {
    // --- Terrain (desert/rocky landscape) ---
    const terrain = this.add.graphics();
    // Sandy ground
    terrain.fillStyle(0xD4C4A0, 1);
    terrain.fillRect(0, 0, W, H);
    // Road
    terrain.fillStyle(0xC4A874, 1);
    terrain.fillRoundedRect(0, ROAD_Y - 30, W, 60, 0);
    // Road edges
    terrain.lineStyle(2, 0xA08850, 0.5);
    terrain.lineBetween(0, ROAD_Y - 30, W, ROAD_Y - 30);
    terrain.lineBetween(0, ROAD_Y + 30, W, ROAD_Y + 30);
    terrain.setDepth(-2);

    // Scattered rocks
    for (let i = 0; i < 15; i++) {
      const rx = Phaser.Math.Between(20, W - 20);
      const ry = Phaser.Math.Between(50, H - 50);
      if (Math.abs(ry - ROAD_Y) < 40) continue; // don't put on road
      const rock = this.add.graphics();
      rock.fillStyle(0xAA9977, 0.6);
      rock.fillCircle(rx, ry, Phaser.Math.Between(4, 10));
      rock.setDepth(-1);
    }

    // Location labels
    this.add.text(50, ROAD_Y - 55, 'Jerusalem', {
      fontFamily: 'Georgia, serif', fontSize: '13px', fontStyle: 'italic', color: '#8A7A5A',
    });
    this.add.text(680, ROAD_Y - 55, 'Jericho', {
      fontFamily: 'Georgia, serif', fontSize: '13px', fontStyle: 'italic', color: '#8A7A5A',
    });

    // --- Inn (right side) ---
    this.inn = this.add.image(720, ROAD_Y - 50, 'inn')
      .setOrigin(0.5, 1).setScale(1.3).setDepth(2).setVisible(false);
    this.innLabel = this.add.text(720, ROAD_Y - 100, 'Inn', {
      fontFamily: 'Georgia, serif', fontSize: '13px', color: '#886633',
    }).setOrigin(0.5).setDepth(3).setVisible(false);

    // --- Traveler (will be placed on the road, wounded) ---
    this.traveler = this.add.image(400, ROAD_Y, 'traveler')
      .setOrigin(0.5, 1).setDepth(5).setVisible(false);

    // Wound markers on the traveler
    this.wounds = [];
    const woundPositions = [
      { x: -8, y: -30 }, { x: 6, y: -20 }, { x: -4, y: -10 },
    ];
    woundPositions.forEach((pos) => {
      const w = this.add.image(this.traveler.x + pos.x, ROAD_Y + pos.y, 'wound')
        .setDepth(6).setVisible(false).setInteractive({ useHandCursor: true });
      w.healed = false;
      this.wounds.push(w);
    });

    // --- Characters that will walk by ---
    this.priest = this.add.image(-40, ROAD_Y, 'priest')
      .setOrigin(0.5, 1).setDepth(5).setVisible(false);
    this.levite = this.add.image(-40, ROAD_Y, 'levite')
      .setOrigin(0.5, 1).setDepth(5).setVisible(false);
    this.samaritan = this.add.image(-40, ROAD_Y, 'samaritan')
      .setOrigin(0.5, 1).setDepth(5).setVisible(false);

    // --- Robbers ---
    this.robbers = [];
    for (let i = 0; i < 3; i++) {
      const r = this.add.image(350 + i * 30, ROAD_Y - 60 - i * 20, 'robber')
        .setOrigin(0.5, 1).setDepth(5).setVisible(false).setAlpha(0.8);
      this.robbers.push(r);
    }

    // --- Donkey (for carrying the wounded) ---
    this.donkey = this.add.image(0, 0, 'donkey')
      .setOrigin(0.5, 1).setDepth(4).setVisible(false);

    // --- Innkeeper ---
    this.innkeeper = this.add.image(720, ROAD_Y, 'innkeeper')
      .setOrigin(0.5, 1).setDepth(5).setVisible(false);

    // --- Phase title ---
    this.phaseTitle = this.add.text(W / 2, 30, '', {
      fontFamily: 'Georgia, serif', fontSize: '20px', fontStyle: 'italic', color: '#6B5B3B',
    }).setOrigin(0.5).setDepth(100).setAlpha(0);
  }

  // ---------------------------------------------------------------------------
  // Phase 1 — The Wounded Traveler
  // ---------------------------------------------------------------------------

  async _startPhase1() {
    this.phase = 1;
    this._showPhaseTitle('The Wounded Traveler');

    // Traveler walks along the road
    this.traveler.setVisible(true);
    this.traveler.x = 100;
    this.traveler.setAlpha(1);

    await this._animateWalk(this.traveler, 350, 2000);

    // Robbers appear
    this.robbers.forEach((r) => r.setVisible(true));
    await this.dialog.say('', 'A man was going down from Jerusalem to Jericho, when he was attacked by robbers.');

    // Flash screen
    this.cameras.main.flash(300, 200, 50, 50);
    await this._wait(400);

    // Robbers disappear
    this.robbers.forEach((r) => {
      this.tweens.add({ targets: r, alpha: 0, duration: 500 });
    });

    // Traveler becomes wounded
    this.traveler.x = 400;
    this.traveler.setTexture('wounded');
    this.wounds.forEach((w) => w.setVisible(true));

    this.colorTrans.setMood('cold', 1000);

    await this.dialog.say('', 'They stripped him of his clothes, beat him, and went away, leaving him half dead.');
    await this._wait(500);

    this._startPhase2();
  }

  // ---------------------------------------------------------------------------
  // Phase 2 — Who Will Help?
  // ---------------------------------------------------------------------------

  async _startPhase2() {
    this.phase = 2;
    this._showPhaseTitle('Who Will Help?');

    // --- Priest ---
    this.priest.setVisible(true);
    this.priest.x = -30;
    this.priest.y = ROAD_Y;

    await this.dialog.say('', 'A priest happened to be going down the same road...');
    await this._animateWalk(this.priest, 380, 2500);

    // Priest sees the wounded man, then moves to the other side
    await this._wait(600);
    await this.dialog.say('', 'He saw the man... and passed by on the other side.');

    this.tweens.add({ targets: this.priest, y: ROAD_Y - 80, duration: 600 });
    await this._wait(600);
    await this._animateWalk(this.priest, W + 40, 2500);
    this.priest.setVisible(false);

    // --- Levite ---
    await this._wait(500);
    this.levite.setVisible(true);
    this.levite.x = -30;
    this.levite.y = ROAD_Y;

    await this.dialog.say('', 'So too, a Levite came to the place...');
    await this._animateWalk(this.levite, 380, 2500);

    await this._wait(600);
    await this.dialog.say('', 'He saw him... and passed by on the other side.');

    this.tweens.add({ targets: this.levite, y: ROAD_Y + 70, duration: 600 });
    await this._wait(600);
    await this._animateWalk(this.levite, W + 40, 2500);
    this.levite.setVisible(false);

    await this._wait(500);
    this._startPhase3();
  }

  // ---------------------------------------------------------------------------
  // Phase 3 — The Samaritan (player takes control)
  // ---------------------------------------------------------------------------

  async _startPhase3() {
    this.phase = 3;
    this._showPhaseTitle('The Samaritan');
    this.colorTrans.setMood('neutral', 1000);

    this.samaritan.setVisible(true);
    this.samaritan.x = -30;
    this.samaritan.y = ROAD_Y;

    await this.dialog.say('', 'But a Samaritan, as he traveled, came where the man was...');
    await this._animateWalk(this.samaritan, 200, 2000);

    await this.dialog.say('', 'You are the Samaritan. Walk to the wounded man and help him.');
    await this.dialog.say('', 'Click on the wounded man to begin caring for him.');

    this.controlledChar = this.samaritan;
    this.inputEnabled = true;

    // Wait for player to reach the wounded traveler
    this._waitForProximity(this.samaritan, this.traveler, 60, () => {
      this._startCareSequence();
    });
  }

  async _startCareSequence() {
    this.inputEnabled = false;
    this.careStep = 0;

    await this.dialog.say('', 'When he saw him, he took pity on him.');

    // --- Step 1: Bandage wounds (click on wound markers) ---
    await this.dialog.say('', 'Click on each wound to bandage it.');
    this.inputEnabled = false; // disable movement during care

    let healed = 0;
    const healPromise = new Promise((resolve) => {
      this.wounds.forEach((w) => {
        w.on('pointerdown', () => {
          if (w.healed) return;
          w.healed = true;
          healed++;

          // Replace wound with bandage
          this.tweens.add({
            targets: w,
            alpha: 0,
            duration: 300,
            onComplete: () => {
              const b = this.add.image(w.x, w.y, 'bandage').setDepth(7);
              this.tweens.add({
                targets: b,
                alpha: { from: 0, to: 1 },
                duration: 300,
              });
            },
          });

          if (healed >= this.totalWounds) {
            resolve();
          }
        });
      });
    });

    await healPromise;
    await this._wait(500);

    // --- Step 2: Give water ---
    await this.dialog.say('', 'Click on the traveler to give him water.');

    const waterIcon = this.add.image(this.traveler.x - 30, this.traveler.y - 50, 'water')
      .setDepth(8).setScale(1.5).setInteractive({ useHandCursor: true });

    await new Promise((resolve) => {
      waterIcon.on('pointerdown', () => {
        this.tweens.add({
          targets: waterIcon,
          x: this.traveler.x,
          y: this.traveler.y - 20,
          alpha: 0,
          duration: 500,
          onComplete: () => { waterIcon.destroy(); resolve(); },
        });
      });
    });

    // Traveler becomes more colorful (healing)
    this.traveler.setTint(0xFFDDBB);
    await this._wait(400);

    // --- Step 3: Place on donkey ---
    await this.dialog.say('', 'He put him on his own donkey. Click and hold the traveler to lift him.');

    this.donkey.setVisible(true);
    this.donkey.setPosition(this.samaritan.x + 40, ROAD_Y);

    const travelerSprite = this.traveler;
    travelerSprite.setInteractive({ useHandCursor: true });

    await new Promise((resolve) => {
      travelerSprite.on('pointerdown', () => {
        // Lift animation
        this.tweens.add({
          targets: travelerSprite,
          y: ROAD_Y - 20,
          x: this.donkey.x,
          duration: 800,
          ease: 'Power2',
          onComplete: () => {
            travelerSprite.setDepth(5);
            resolve();
          },
        });
      });
    });

    await this._wait(400);
    this.traveler.clearTint();

    // --- Step 4: Walk to the inn ---
    this.inn.setVisible(true);
    this.innLabel.setVisible(true);

    await this.dialog.say('', 'Now walk to the inn on the right to bring him to safety.');

    this.controlledChar = this.samaritan;
    this.inputEnabled = true;

    // Donkey and traveler follow the samaritan
    this._startFollowChain();

    this._waitForProximity(this.samaritan, this.inn, 70, () => {
      this._arriveAtInn();
    });
  }

  _startFollowChain() {
    // Make donkey + traveler follow the samaritan
    this._followEvent = this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        if (!this.controlledChar) return;
        const dx = this.controlledChar.x + 40 - this.donkey.x;
        const dy = this.controlledChar.y - this.donkey.y;
        this.donkey.x += dx * 0.08;
        this.donkey.y += dy * 0.08;
        this.traveler.x = this.donkey.x;
        this.traveler.y = this.donkey.y - 10;
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Phase 4 — Go and Do Likewise
  // ---------------------------------------------------------------------------

  async _arriveAtInn() {
    this.inputEnabled = false;
    if (this._followEvent) this._followEvent.remove();

    this.phase = 4;
    this._showPhaseTitle('Go and Do Likewise');
    this.colorTrans.setMood('warm', 1500);

    // Innkeeper appears
    this.innkeeper.setVisible(true);

    await this.dialog.say('Samaritan', 'Take care of him. Whatever extra you spend, I will repay you when I return.');
    await this.dialog.say('', 'The Samaritan paid the innkeeper and entrusted the wounded man to his care.');

    // Jesus speaks
    await this.dialog.say('Jesus', 'Which of these three do you think was a neighbor to the man who fell into the hands of robbers?');

    const choice = await this.dialog.choose(
      '',
      'Choose your answer:',
      [
        { label: 'The priest who walked by', value: 'priest' },
        { label: 'The Levite who looked away', value: 'levite' },
        { label: 'The one who showed mercy', value: 'mercy' },
      ]
    );

    if (choice === 'mercy') {
      await this.dialog.say('Jesus', '"Go and do likewise."');
    } else {
      await this.dialog.say('', 'Not quite. Think about who actually helped.');
      await this.dialog.say('Jesus', 'The one who had mercy on him. "Go and do likewise."');
    }

    // Celebration
    this.colorTrans.setMood('joyful', 1000);
    this._celebrationParticles();

    await this._wait(2500);

    // Transition to reflection
    this.cameras.main.fadeOut(1200, 255, 250, 230);
    this.time.delayedCall(1300, () => {
      this.dialog.destroy();
      this.colorTrans.destroy();
      if (this.touchInput) this.touchInput.destroy();
      this.scene.start('ReflectionScene', {
        episode: 'good-samaritan',
        title: 'The Good Samaritan',
        scriptureId: 12,
        reflection: 'Who in your life needs you to be a neighbor?',
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

  _animateWalk(sprite, targetX, duration) {
    return new Promise((resolve) => {
      sprite.setFlipX(targetX < sprite.x);
      this.tweens.add({
        targets: sprite,
        x: targetX,
        duration,
        ease: 'Linear',
        onComplete: resolve,
      });
    });
  }

  _waitForProximity(a, b, threshold, cb) {
    const check = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        if (Math.sqrt(dx * dx + dy * dy) < threshold) {
          check.remove();
          cb();
        }
      },
    });
  }

  _celebrationParticles() {
    for (let i = 0; i < 30; i++) {
      const px = Phaser.Math.Between(200, 600);
      const py = Phaser.Math.Between(150, 400);
      const key = ['particle', 'particleWarm', 'heart'][i % 3];
      const p = this.add.image(px, py, key).setDepth(50).setAlpha(0);
      this.tweens.add({
        targets: p,
        alpha: { from: 0, to: 0.8 },
        y: py - Phaser.Math.Between(40, 100),
        scaleX: { from: 0.3, to: Phaser.Math.FloatBetween(0.6, 1.5) },
        scaleY: { from: 0.3, to: Phaser.Math.FloatBetween(0.6, 1.5) },
        duration: Phaser.Math.Between(800, 1800),
        delay: Phaser.Math.Between(0, 600),
        yoyo: true,
        onComplete: () => p.destroy(),
      });
    }
  }

  _wait(ms) {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }
}
