import { describe, it, expect, beforeAll } from 'vitest';
import { vi } from 'vitest';

// ColorTransition.js uses Phaser as a global (not imported), so we must set it globally
globalThis.Phaser = {
  Math: {
    Clamp: (val, min, max) => Math.min(Math.max(val, min), max),
    Linear: (a, b, t) => a + (b - a) * t,
  },
};

const { ColorTransition } = await import('../src/systems/ColorTransition.js');

describe('ColorTransition', () => {
  function createMockScene() {
    return {
      add: {
        graphics: vi.fn(() => ({
          setDepth: vi.fn().mockReturnThis(),
          clear: vi.fn().mockReturnThis(),
          fillStyle: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        })),
      },
      tweens: {
        add: vi.fn(() => ({
          stop: vi.fn(),
          totalProgress: 0,
        })),
      },
    };
  }

  describe('constructor', () => {
    it('should initialize with warm mood', () => {
      const scene = createMockScene();
      const ct = new ColorTransition(scene);
      expect(ct.currentMood).toBe('warm');
      expect(ct.currentBg).toEqual({ r: 255, g: 245, b: 220 });
    });

    it('should start with empty tracked objects', () => {
      const scene = createMockScene();
      const ct = new ColorTransition(scene);
      expect(ct.trackedObjects).toEqual([]);
    });

    it('should have no overlay until init', () => {
      const scene = createMockScene();
      const ct = new ColorTransition(scene);
      expect(ct.overlay).toBeNull();
    });
  });

  describe('init()', () => {
    it('should create an overlay graphics object', () => {
      const scene = createMockScene();
      const ct = new ColorTransition(scene);
      ct.init();
      expect(scene.add.graphics).toHaveBeenCalled();
      expect(ct.overlay).not.toBeNull();
    });
  });

  describe('setMoodImmediate()', () => {
    it('should change mood to cold', () => {
      const scene = createMockScene();
      const ct = new ColorTransition(scene);
      ct.init();
      ct.setMoodImmediate('cold');
      expect(ct.currentMood).toBe('cold');
      expect(ct.currentBg).toEqual({ r: 80, g: 85, b: 110 });
    });

    it('should change mood to joyful', () => {
      const scene = createMockScene();
      const ct = new ColorTransition(scene);
      ct.init();
      ct.setMoodImmediate('joyful');
      expect(ct.currentMood).toBe('joyful');
      expect(ct.currentBg).toEqual({ r: 255, g: 250, b: 200 });
    });

    it('should ignore unknown mood', () => {
      const scene = createMockScene();
      const ct = new ColorTransition(scene);
      ct.init();
      ct.setMoodImmediate('unknown');
      expect(ct.currentMood).toBe('warm');
    });
  });

  describe('setMood()', () => {
    it('should start a tween transition', () => {
      const scene = createMockScene();
      const ct = new ColorTransition(scene);
      ct.init();
      ct.setMood('dark', 1000);
      expect(scene.tweens.add).toHaveBeenCalled();
      expect(ct.currentMood).toBe('dark');
    });

    it('should warn on unknown mood', () => {
      const scene = createMockScene();
      const ct = new ColorTransition(scene);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      ct.setMood('invalidmood');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('invalidmood'));
      warnSpy.mockRestore();
    });
  });

  describe('track() / untrack()', () => {
    it('should add objects to tracked list', () => {
      const scene = createMockScene();
      const ct = new ColorTransition(scene);
      const obj = { setTint: vi.fn() };
      ct.track(obj);
      expect(ct.trackedObjects).toContain(obj);
    });

    it('should not add duplicates', () => {
      const scene = createMockScene();
      const ct = new ColorTransition(scene);
      const obj = { setTint: vi.fn() };
      ct.track(obj);
      ct.track(obj);
      expect(ct.trackedObjects).toHaveLength(1);
    });

    it('should remove objects from tracked list', () => {
      const scene = createMockScene();
      const ct = new ColorTransition(scene);
      const obj = { setTint: vi.fn() };
      ct.track(obj);
      ct.untrack(obj);
      expect(ct.trackedObjects).toHaveLength(0);
    });
  });

  describe('lerpMood()', () => {
    it('should interpolate between two moods at progress 0', () => {
      const scene = createMockScene();
      const ct = new ColorTransition(scene);
      ct.init();
      ct.lerpMood('warm', 'cold', 0);
      expect(ct.currentBg.r).toBeCloseTo(255, 0);
      expect(ct.currentBg.g).toBeCloseTo(245, 0);
      expect(ct.currentBg.b).toBeCloseTo(220, 0);
    });

    it('should interpolate between two moods at progress 1', () => {
      const scene = createMockScene();
      const ct = new ColorTransition(scene);
      ct.init();
      ct.lerpMood('warm', 'cold', 1);
      expect(ct.currentBg.r).toBeCloseTo(80, 0);
      expect(ct.currentBg.g).toBeCloseTo(85, 0);
      expect(ct.currentBg.b).toBeCloseTo(110, 0);
    });

    it('should interpolate at progress 0.5', () => {
      const scene = createMockScene();
      const ct = new ColorTransition(scene);
      ct.init();
      ct.lerpMood('warm', 'cold', 0.5);
      expect(ct.currentBg.r).toBeCloseTo(167.5, 0);
      expect(ct.currentBg.g).toBeCloseTo(165, 0);
      expect(ct.currentBg.b).toBeCloseTo(165, 0);
    });

    it('should clamp progress to 0-1', () => {
      const scene = createMockScene();
      const ct = new ColorTransition(scene);
      ct.init();
      ct.lerpMood('warm', 'cold', 5);
      expect(ct.currentBg.r).toBeCloseTo(80, 0);
    });
  });

  describe('_lerpColor()', () => {
    it('should interpolate between two hex colors', () => {
      const scene = createMockScene();
      const ct = new ColorTransition(scene);
      const result = ct._lerpColor(0x000000, 0xFFFFFF, 0.5);
      const r = (result >> 16) & 0xFF;
      const g = (result >> 8) & 0xFF;
      const b = result & 0xFF;
      expect(r).toBeCloseTo(128, 0);
      expect(g).toBeCloseTo(128, 0);
      expect(b).toBeCloseTo(128, 0);
    });

    it('should return colorA at t=0', () => {
      const scene = createMockScene();
      const ct = new ColorTransition(scene);
      expect(ct._lerpColor(0xFF0000, 0x0000FF, 0)).toBe(0xFF0000);
    });

    it('should return colorB at t=1', () => {
      const scene = createMockScene();
      const ct = new ColorTransition(scene);
      expect(ct._lerpColor(0xFF0000, 0x0000FF, 1)).toBe(0x0000FF);
    });
  });

  describe('destroy()', () => {
    it('should clean up overlay and tracked objects', () => {
      const scene = createMockScene();
      const ct = new ColorTransition(scene);
      ct.init();
      ct.track({ setTint: vi.fn() });
      ct.destroy();
      expect(ct.trackedObjects).toEqual([]);
    });
  });
});
