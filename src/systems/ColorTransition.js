// ============================================================================
// ColorTransition.js — Gradual color/mood transition system
//
// Provides smooth transitions between warm, cold, neutral, and joyful moods.
// Used extensively in the Prodigal Son episode for the departure/return
// color journey, and available to any scene that needs atmospheric shifts.
// ============================================================================

/**
 * Predefined mood palettes. Each mood has a background tint color and
 * a tint value to apply to game objects.
 */
const MOOD_PALETTES = {
  warm: {
    bg: { r: 255, g: 245, b: 220 },      // Warm cream
    tint: 0xFFEECC,                         // Warm golden tint
    objectTint: 0xFFDDAA,
  },
  cold: {
    bg: { r: 80, g: 85, b: 110 },         // Cold dark blue-gray
    tint: 0x6677AA,                         // Cold blue tint
    objectTint: 0x8899BB,
  },
  neutral: {
    bg: { r: 180, g: 175, b: 165 },       // Muted gray
    tint: 0xBBBBAA,                         // Neutral tint
    objectTint: 0xCCCCBB,
  },
  joyful: {
    bg: { r: 255, g: 250, b: 200 },       // Bright warm gold
    tint: 0xFFFFDD,                         // Bright golden tint
    objectTint: 0xFFEE88,
  },
  dark: {
    bg: { r: 50, g: 45, b: 55 },          // Very dark
    tint: 0x443355,                         // Dark purple tint
    objectTint: 0x665577,
  },
  hopeful: {
    bg: { r: 200, g: 220, b: 180 },       // Soft green
    tint: 0xCCDDBB,                         // Light green tint
    objectTint: 0xAACC99,
  },
};

export class ColorTransition {
  /**
   * @param {Phaser.Scene} scene - The scene to apply color transitions to
   */
  constructor(scene) {
    /** @type {Phaser.Scene} */
    this.scene = scene;

    /** Current mood RGB values (for interpolation) */
    this.currentBg = { ...MOOD_PALETTES.warm.bg };
    this.currentTint = MOOD_PALETTES.warm.tint;

    /** Target mood name */
    this.currentMood = 'warm';

    /** Tracked objects that receive tint changes */
    /** @type {Phaser.GameObjects.GameObject[]} */
    this.trackedObjects = [];

    /** Overlay graphics for background tinting */
    this.overlay = null;

    /** Active tween for smooth transitions */
    this._tween = null;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Set up the color overlay. Call once after scene creation.
   * @param {number} [depth=0] - Depth of the overlay (place behind game objects)
   */
  init(depth = 0) {
    this.overlay = this.scene.add.graphics();
    this.overlay.setDepth(depth);
    this._drawOverlay();
  }

  /**
   * Smoothly transition to a named mood.
   * @param {'warm'|'cold'|'neutral'|'joyful'|'dark'|'hopeful'} mood
   * @param {number} [duration=1500] - Transition duration in ms
   * @param {Function} [onComplete] - Called when the transition finishes
   */
  setMood(mood, duration = 1500, onComplete) {
    const target = MOOD_PALETTES[mood];
    if (!target) {
      console.warn(`[ColorTransition] Unknown mood: "${mood}"`);
      return;
    }

    this.currentMood = mood;

    // Cancel any running transition
    if (this._tween) {
      this._tween.stop();
    }

    // Animate the background RGB
    this._tween = this.scene.tweens.add({
      targets: this.currentBg,
      r: target.bg.r,
      g: target.bg.g,
      b: target.bg.b,
      duration,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        this._drawOverlay();
        this._updateTrackedTints(target.objectTint, this._getTweenProgress());
      },
      onComplete: () => {
        this.currentTint = target.tint;
        this._applyTrackedTint(target.objectTint);
        if (onComplete) onComplete();
      },
    });
  }

  /**
   * Instantly set a mood (no animation).
   * @param {'warm'|'cold'|'neutral'|'joyful'|'dark'|'hopeful'} mood
   */
  setMoodImmediate(mood) {
    const target = MOOD_PALETTES[mood];
    if (!target) return;

    this.currentMood = mood;
    this.currentBg = { ...target.bg };
    this.currentTint = target.tint;
    this._drawOverlay();
    this._applyTrackedTint(target.objectTint);
  }

  /**
   * Transition between two moods based on a progress value (0 to 1).
   * Useful for gradual transitions tied to player position.
   * @param {'warm'|'cold'|'neutral'|'joyful'|'dark'|'hopeful'} fromMood
   * @param {'warm'|'cold'|'neutral'|'joyful'|'dark'|'hopeful'} toMood
   * @param {number} progress - 0 = fully fromMood, 1 = fully toMood
   */
  lerpMood(fromMood, toMood, progress) {
    const from = MOOD_PALETTES[fromMood];
    const to = MOOD_PALETTES[toMood];
    if (!from || !to) return;

    const t = Phaser.Math.Clamp(progress, 0, 1);

    this.currentBg.r = Phaser.Math.Linear(from.bg.r, to.bg.r, t);
    this.currentBg.g = Phaser.Math.Linear(from.bg.g, to.bg.g, t);
    this.currentBg.b = Phaser.Math.Linear(from.bg.b, to.bg.b, t);

    this._drawOverlay();

    // Lerp tint for tracked objects
    const fromTint = from.objectTint;
    const toTint = to.objectTint;
    const lerpedTint = this._lerpColor(fromTint, toTint, t);
    this._applyTrackedTint(lerpedTint);
  }

  /**
   * Register a game object to receive tint updates during mood transitions.
   * @param {Phaser.GameObjects.GameObject} obj
   */
  track(obj) {
    if (!this.trackedObjects.includes(obj)) {
      this.trackedObjects.push(obj);
    }
  }

  /**
   * Remove a game object from tint tracking.
   * @param {Phaser.GameObjects.GameObject} obj
   */
  untrack(obj) {
    this.trackedObjects = this.trackedObjects.filter((o) => o !== obj);
  }

  /**
   * Clean up resources.
   */
  destroy() {
    if (this._tween) this._tween.stop();
    if (this.overlay) this.overlay.destroy();
    this.trackedObjects = [];
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  /** Redraw the full-screen overlay based on currentBg. */
  _drawOverlay() {
    if (!this.overlay) return;
    this.overlay.clear();
    const r = Math.round(this.currentBg.r);
    const g = Math.round(this.currentBg.g);
    const b = Math.round(this.currentBg.b);
    const color = (r << 16) | (g << 8) | b;
    this.overlay.fillStyle(color, 0.35);
    this.overlay.fillRect(0, 0, 800, 600);
  }

  /** Apply a tint color to all tracked objects. */
  _applyTrackedTint(tintColor) {
    this.trackedObjects.forEach((obj) => {
      if (obj && obj.setTint) {
        obj.setTint(tintColor);
      }
    });
  }

  /** Update tracked tints during a tween based on partial progress. */
  _updateTrackedTints(targetTint, progress) {
    // During the tween we approximate the tint by lerping
    const lerpedTint = this._lerpColor(this.currentTint, targetTint, progress);
    this._applyTrackedTint(lerpedTint);
  }

  /** Get the approximate progress of the current tween (0-1). */
  _getTweenProgress() {
    if (!this._tween || !this._tween.totalProgress) return 1;
    return this._tween.totalProgress;
  }

  /**
   * Linearly interpolate between two hex colors.
   * @param {number} colorA - Hex color (0xRRGGBB)
   * @param {number} colorB - Hex color (0xRRGGBB)
   * @param {number} t - Interpolation factor (0-1)
   * @returns {number} Interpolated hex color
   */
  _lerpColor(colorA, colorB, t) {
    const rA = (colorA >> 16) & 0xFF;
    const gA = (colorA >> 8) & 0xFF;
    const bA = colorA & 0xFF;
    const rB = (colorB >> 16) & 0xFF;
    const gB = (colorB >> 8) & 0xFF;
    const bB = colorB & 0xFF;

    const r = Math.round(Phaser.Math.Linear(rA, rB, t));
    const g = Math.round(Phaser.Math.Linear(gA, gB, t));
    const b = Math.round(Phaser.Math.Linear(bA, bB, t));

    return (r << 16) | (g << 8) | b;
  }
}
