// ============================================================================
// TouchInput.js — Touch input handling for the Parables narrative puzzle game
//
// Provides:
//   - Swipe detection (left/right/up/down) for scene navigation
//   - Virtual D-Pad for scenes requiring directional input (e.g. ProdigalSonScene)
//   - Touch-device detection (only shows UI on touch devices)
//
// Tap-to-move and tap-to-interact already work through Phaser's pointerdown
// events, so this module focuses on swipe + d-pad.
// ============================================================================

export class TouchInput {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.isTouchDevice = scene.sys.game.device.input.touch;

    // --- Swipe tracking ---
    this._touchStartX = 0;
    this._touchStartY = 0;
    this._lastSwipe = null;

    // --- D-Pad state ---
    this._dpadVisible = false;
    this._direction = { left: false, right: false, up: false, down: false };
    this._dpadButtons = [];
    this._dpadContainer = null;

    if (this.isTouchDevice) {
      this._setupSwipeDetection();
    }
  }

  // ---------------------------------------------------------------------------
  // Swipe detection
  // ---------------------------------------------------------------------------

  _setupSwipeDetection() {
    this.scene.input.on('pointerdown', (pointer) => {
      this._touchStartX = pointer.x;
      this._touchStartY = pointer.y;
    });

    this.scene.input.on('pointerup', (pointer) => {
      const dx = pointer.x - this._touchStartX;
      const dy = pointer.y - this._touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Must travel at least 50px to count as a swipe
      if (absDx < 50 && absDy < 50) return;

      if (absDx > absDy) {
        // Horizontal swipe
        this._lastSwipe = dx > 0 ? 'right' : 'left';
      } else {
        // Vertical swipe
        this._lastSwipe = dy > 0 ? 'down' : 'up';
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Virtual D-Pad
  // ---------------------------------------------------------------------------

  enableDPad() {
    if (!this.isTouchDevice) return;
    if (this._dpadContainer) {
      this._dpadContainer.setVisible(true);
      this._dpadVisible = true;
      return;
    }

    this._dpadVisible = true;

    const scene = this.scene;
    const btnSize = 48;
    const padding = 4;
    // Position on the left side of the screen
    const centerX = 80;
    const centerY = scene.scale.height - 120;

    this._dpadContainer = scene.add.container(0, 0).setDepth(2000).setScrollFactor(0);

    // Semi-transparent background circle
    const bgCircle = scene.add.graphics();
    bgCircle.fillStyle(0x000000, 0.15);
    bgCircle.fillCircle(centerX, centerY, btnSize * 1.8);
    this._dpadContainer.add(bgCircle);

    const directions = [
      { key: 'up',    label: '\u25B2', x: centerX, y: centerY - btnSize - padding },
      { key: 'down',  label: '\u25BC', x: centerX, y: centerY + btnSize + padding },
      { key: 'left',  label: '\u25C0', x: centerX - btnSize - padding, y: centerY },
      { key: 'right', label: '\u25B6', x: centerX + btnSize + padding, y: centerY },
    ];

    directions.forEach((dir) => {
      // Button background
      const bg = scene.add.graphics();
      bg.fillStyle(0x000000, 0.35);
      bg.fillRoundedRect(dir.x - btnSize / 2, dir.y - btnSize / 2, btnSize, btnSize, 8);
      bg.lineStyle(1, 0xFFFFFF, 0.3);
      bg.strokeRoundedRect(dir.x - btnSize / 2, dir.y - btnSize / 2, btnSize, btnSize, 8);

      // Arrow label
      const txt = scene.add.text(dir.x, dir.y, dir.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#FFFFFF',
      }).setOrigin(0.5).setAlpha(0.7);

      // Interactive zone
      const zone = scene.add.zone(dir.x, dir.y, btnSize, btnSize)
        .setInteractive()
        .setScrollFactor(0);

      zone.on('pointerdown', () => {
        this._direction[dir.key] = true;
        bg.clear();
        bg.fillStyle(0xFFFFFF, 0.3);
        bg.fillRoundedRect(dir.x - btnSize / 2, dir.y - btnSize / 2, btnSize, btnSize, 8);
      });

      zone.on('pointerup', () => {
        this._direction[dir.key] = false;
        bg.clear();
        bg.fillStyle(0x000000, 0.35);
        bg.fillRoundedRect(dir.x - btnSize / 2, dir.y - btnSize / 2, btnSize, btnSize, 8);
        bg.lineStyle(1, 0xFFFFFF, 0.3);
        bg.strokeRoundedRect(dir.x - btnSize / 2, dir.y - btnSize / 2, btnSize, btnSize, 8);
      });

      zone.on('pointerout', () => {
        this._direction[dir.key] = false;
        bg.clear();
        bg.fillStyle(0x000000, 0.35);
        bg.fillRoundedRect(dir.x - btnSize / 2, dir.y - btnSize / 2, btnSize, btnSize, 8);
        bg.lineStyle(1, 0xFFFFFF, 0.3);
        bg.strokeRoundedRect(dir.x - btnSize / 2, dir.y - btnSize / 2, btnSize, btnSize, 8);
      });

      // Set scroll factor on the graphics objects
      bg.setScrollFactor(0);
      txt.setScrollFactor(0);

      this._dpadContainer.add(bg);
      this._dpadContainer.add(txt);
      this._dpadContainer.add(zone);
      this._dpadButtons.push({ bg, txt, zone, key: dir.key });
    });
  }

  disableDPad() {
    if (this._dpadContainer) {
      this._dpadContainer.setVisible(false);
    }
    this._dpadVisible = false;
    // Reset all directions
    this._direction = { left: false, right: false, up: false, down: false };
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Returns the current d-pad direction state.
   * @returns {{ left: boolean, right: boolean, up: boolean, down: boolean }}
   */
  getDirection() {
    return { ...this._direction };
  }

  /**
   * Returns the last detected swipe direction, then clears it (consumed on read).
   * @returns {'left'|'right'|'up'|'down'|null}
   */
  getLastSwipe() {
    const swipe = this._lastSwipe;
    this._lastSwipe = null;
    return swipe;
  }

  /**
   * Show all touch UI elements.
   */
  show() {
    if (this._dpadContainer && this._dpadVisible) {
      this._dpadContainer.setVisible(true);
    }
  }

  /**
   * Hide all touch UI elements.
   */
  hide() {
    if (this._dpadContainer) {
      this._dpadContainer.setVisible(false);
    }
  }

  /**
   * Clean up all touch UI and listeners.
   */
  destroy() {
    if (this._dpadContainer) {
      this._dpadContainer.destroy();
      this._dpadContainer = null;
    }
    this._dpadButtons = [];
    this._direction = { left: false, right: false, up: false, down: false };
    this._lastSwipe = null;
  }
}
