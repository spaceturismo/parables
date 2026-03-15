// ============================================================================
// DialogSystem.js — Queued dialog/narrative system with typewriter effect
//
// Manages a queue of dialog entries. Each entry can have a speaker name,
// body text, and optional choices. Supports typewriter reveal, click-to-
// advance, and callback hooks for completion and choice selection.
// ============================================================================

import { COLORS, COLORS_CSS, FONT_STYLES } from '../../shared/index.js';

/**
 * @typedef {Object} DialogEntry
 * @property {string}   speaker    - Name of the speaker (or '' for narration)
 * @property {string}   text       - The dialog text to display
 * @property {Array<{label:string, value:string}>} [choices] - Optional choice buttons
 * @property {Function} [onComplete]  - Called when this entry finishes (after click or choice)
 * @property {Function} [onChoice]    - Called with the chosen value when a choice is picked
 */

export class DialogSystem {
  /**
   * @param {Phaser.Scene} scene - The scene this system belongs to
   */
  constructor(scene) {
    /** @type {Phaser.Scene} */
    this.scene = scene;

    /** @type {DialogEntry[]} */
    this.queue = [];

    /** @type {boolean} Whether a dialog is currently being displayed */
    this.isActive = false;

    /** @type {boolean} Whether the typewriter has finished revealing text */
    this.isTextComplete = false;

    // UI elements (created lazily)
    /** @type {Phaser.GameObjects.Container|null} */
    this.container = null;
    /** @type {Phaser.GameObjects.Graphics|null} */
    this.panel = null;
    /** @type {Phaser.GameObjects.Text|null} */
    this.speakerText = null;
    /** @type {Phaser.GameObjects.Text|null} */
    this.bodyText = null;
    /** @type {Phaser.GameObjects.Text|null} */
    this.continueHint = null;
    /** @type {Phaser.GameObjects.Text[]} */
    this.choiceButtons = [];
    /** @type {Phaser.Time.TimerEvent|null} */
    this.typewriterTimer = null;

    /** @type {number} Milliseconds per character in typewriter effect */
    this.charDelay = 25;

    /** Current entry being displayed */
    this._currentEntry = null;
    this._charIndex = 0;

    // Global callback when the entire queue is drained
    /** @type {Function|null} */
    this.onQueueComplete = null;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Add one or more dialog entries to the queue and start if not already active.
   * @param {DialogEntry|DialogEntry[]} entries
   */
  show(entries) {
    const arr = Array.isArray(entries) ? entries : [entries];
    this.queue.push(...arr);
    if (!this.isActive) {
      this._next();
    }
  }

  /**
   * Convenience: show a single line and return a Promise that resolves when
   * the player dismisses it.
   * @param {string} speaker
   * @param {string} text
   * @returns {Promise<void>}
   */
  say(speaker, text) {
    return new Promise((resolve) => {
      this.show({ speaker, text, onComplete: resolve });
    });
  }

  /**
   * Show a dialog with choices. Returns a Promise that resolves with the
   * chosen value.
   * @param {string} speaker
   * @param {string} text
   * @param {Array<{label:string, value:string}>} choices
   * @returns {Promise<string>}
   */
  choose(speaker, text, choices) {
    return new Promise((resolve) => {
      this.show({ speaker, text, choices, onChoice: resolve });
    });
  }

  /**
   * Immediately clear all dialogs and hide the UI.
   */
  clear() {
    this.queue = [];
    this._currentEntry = null;
    this.isActive = false;
    if (this.typewriterTimer) {
      this.typewriterTimer.remove(false);
      this.typewriterTimer = null;
    }
    if (this.container) {
      this.container.setVisible(false);
    }
    this._clearChoices();
  }

  /**
   * Destroy the dialog system and all its UI elements.
   */
  destroy() {
    this.clear();
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  /** Build UI elements if they don't exist yet. */
  _ensureUI() {
    if (this.container) return;

    const w = 700;
    const h = 150;
    const x = 400; // center of 800-wide game
    const y = 520; // near bottom

    // Panel background
    this.panel = this.scene.add.graphics();
    this.panel.fillStyle(0x1a1a2e, 0.92);
    this.panel.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    this.panel.lineStyle(2, COLORS.GOLD, 0.5);
    this.panel.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);

    // Speaker name
    this.speakerText = this.scene.add.text(-w / 2 + 20, -h / 2 + 12, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '17px',
      fontStyle: 'bold',
      color: COLORS_CSS.GOLD,
    }).setOrigin(0, 0);

    // Body text
    this.bodyText = this.scene.add.text(-w / 2 + 20, -h / 2 + 38, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#FFFFFF',
      wordWrap: { width: w - 40 },
      lineSpacing: 4,
    }).setOrigin(0, 0);

    // "Click to continue" hint
    this.continueHint = this.scene.add.text(w / 2 - 20, h / 2 - 16, '[ click to continue ]', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: COLORS_CSS.GRAY_LIGHT,
    }).setOrigin(1, 1).setAlpha(0);

    // Container
    this.container = this.scene.add.container(x, y, [
      this.panel, this.speakerText, this.bodyText, this.continueHint,
    ]);
    this.container.setDepth(1000);
    this.container.setVisible(false);

    // Click to advance
    this.container.setSize(w, h);
    this.container.setInteractive();
    this.container.on('pointerdown', () => this._onTap());
  }

  /** Advance to the next entry in the queue. */
  _next() {
    this._ensureUI();
    this._clearChoices();

    if (this.queue.length === 0) {
      this.isActive = false;
      this.container.setVisible(false);
      if (this.onQueueComplete) this.onQueueComplete();
      return;
    }

    this.isActive = true;
    this.isTextComplete = false;
    this._currentEntry = this.queue.shift();
    this._charIndex = 0;

    // Update speaker
    this.speakerText.setText(this._currentEntry.speaker || '');

    // Clear body text — typewriter will fill it in
    this.bodyText.setText('');
    this.continueHint.setAlpha(0);

    this.container.setVisible(true);

    // Start typewriter
    const fullText = this._currentEntry.text;
    if (this.typewriterTimer) this.typewriterTimer.remove(false);

    this.typewriterTimer = this.scene.time.addEvent({
      delay: this.charDelay,
      repeat: fullText.length - 1,
      callback: () => {
        this._charIndex++;
        this.bodyText.setText(fullText.slice(0, this._charIndex));
        if (this._charIndex >= fullText.length) {
          this._onTextRevealed();
        }
      },
    });
  }

  /** Called when the full text has been revealed. */
  _onTextRevealed() {
    this.isTextComplete = true;
    if (this.typewriterTimer) {
      this.typewriterTimer.remove(false);
      this.typewriterTimer = null;
    }
    this.bodyText.setText(this._currentEntry.text);

    // If there are choices, show them instead of the continue hint
    if (this._currentEntry.choices && this._currentEntry.choices.length > 0) {
      this._showChoices(this._currentEntry.choices);
    } else {
      // Show continue hint with a gentle pulse
      this.continueHint.setAlpha(1);
      this.scene.tweens.add({
        targets: this.continueHint,
        alpha: { from: 1, to: 0.4 },
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  /** Handle a tap/click on the dialog. */
  _onTap() {
    if (!this.isActive || !this._currentEntry) return;

    if (!this.isTextComplete) {
      // Skip typewriter — reveal all text immediately
      this._charIndex = this._currentEntry.text.length;
      this.bodyText.setText(this._currentEntry.text);
      if (this.typewriterTimer) this.typewriterTimer.remove(false);
      this._onTextRevealed();
      return;
    }

    // If there are choices, don't advance on plain click
    if (this._currentEntry.choices && this._currentEntry.choices.length > 0) {
      return;
    }

    // Advance
    const cb = this._currentEntry.onComplete;
    this._currentEntry = null;
    if (cb) cb();
    this._next();
  }

  /** Display choice buttons above the dialog. */
  _showChoices(choices) {
    this._clearChoices();
    const startY = -100;
    const spacing = 44;

    choices.forEach((choice, i) => {
      const btn = this.scene.add.text(0, startY + i * spacing, choice.label, {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#FFFFFF',
        backgroundColor: '#3a3a5c',
        padding: { x: 20, y: 8 },
      }).setOrigin(0.5);

      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => {
        btn.setStyle({ backgroundColor: '#5a5a8c', color: COLORS_CSS.GOLD });
      });
      btn.on('pointerout', () => {
        btn.setStyle({ backgroundColor: '#3a3a5c', color: '#FFFFFF' });
      });
      btn.on('pointerdown', () => {
        const onChoice = this._currentEntry ? this._currentEntry.onChoice : null;
        const onComplete = this._currentEntry ? this._currentEntry.onComplete : null;
        this._currentEntry = null;
        this._clearChoices();
        if (onChoice) onChoice(choice.value);
        if (onComplete) onComplete();
        this._next();
      });

      this.container.add(btn);
      this.choiceButtons.push(btn);
    });
  }

  /** Remove all choice buttons. */
  _clearChoices() {
    this.choiceButtons.forEach((btn) => btn.destroy());
    this.choiceButtons = [];
  }
}
