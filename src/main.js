// ============================================================================
// main.js — Phaser 3 game configuration for Parables
// ============================================================================

import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { EpisodeSelectScene } from './scenes/EpisodeSelectScene.js';
import { ProdigalSonScene } from './scenes/ProdigalSonScene.js';
import { GoodSamaritanScene } from './scenes/GoodSamaritanScene.js';
import { SowerScene } from './scenes/SowerScene.js';
import { ReflectionScene } from './scenes/ReflectionScene.js';

/** @type {Phaser.Types.Core.GameConfig} */
const config = {
  type: Phaser.CANVAS,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#FFF5E1', // Warm cream / parchment
  scene: [
    BootScene,
    MenuScene,
    EpisodeSelectScene,
    ProdigalSonScene,
    GoodSamaritanScene,
    SowerScene,
    ReflectionScene,
  ],
  input: {
    activePointers: 3, // support multi-touch for d-pad
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
    parent: 'game-container',
  },
};

const game = new Phaser.Game(config);

export default game;
