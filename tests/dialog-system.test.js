import { describe, it, expect } from 'vitest';
import { vi } from 'vitest';

// Mock Phaser and shared imports
vi.mock('phaser', () => ({
  default: {
    GameObjects: {
      Container: class {},
    },
  },
}));

vi.mock('../shared/index.js', () => ({
  COLORS: { GOLD: 0xFFD700 },
  COLORS_CSS: { GOLD: '#FFD700', GRAY_LIGHT: '#D3D3D3' },
  FONT_STYLES: {},
}));

import { DialogSystem } from '../src/systems/DialogSystem.js';

describe('DialogSystem', () => {
  function createMockScene() {
    return {
      add: {
        graphics: vi.fn(() => ({
          fillStyle: vi.fn().mockReturnThis(),
          fillRoundedRect: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          strokeRoundedRect: vi.fn().mockReturnThis(),
        })),
        text: vi.fn(() => ({
          setOrigin: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setText: vi.fn().mockReturnThis(),
          setStyle: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        })),
        container: vi.fn(() => ({
          setDepth: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          setSize: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          add: vi.fn(),
          destroy: vi.fn(),
        })),
      },
      time: {
        addEvent: vi.fn(() => ({
          remove: vi.fn(),
        })),
      },
      tweens: {
        add: vi.fn(() => ({
          stop: vi.fn(),
        })),
      },
    };
  }

  describe('constructor', () => {
    it('should initialize with empty queue and inactive state', () => {
      const scene = createMockScene();
      const dialog = new DialogSystem(scene);
      expect(dialog.queue).toEqual([]);
      expect(dialog.isActive).toBe(false);
      expect(dialog.isTextComplete).toBe(false);
      expect(dialog.container).toBeNull();
    });

    it('should store the scene reference', () => {
      const scene = createMockScene();
      const dialog = new DialogSystem(scene);
      expect(dialog.scene).toBe(scene);
    });

    it('should have default char delay of 25ms', () => {
      const scene = createMockScene();
      const dialog = new DialogSystem(scene);
      expect(dialog.charDelay).toBe(25);
    });
  });

  describe('show()', () => {
    it('should add a single entry to the queue and activate', () => {
      const scene = createMockScene();
      const dialog = new DialogSystem(scene);
      dialog.show({ speaker: 'Jesus', text: 'Follow me.' });
      expect(dialog.isActive).toBe(true);
    });

    it('should accept an array of entries', () => {
      const scene = createMockScene();
      const dialog = new DialogSystem(scene);
      dialog.show([
        { speaker: 'A', text: 'Hello' },
        { speaker: 'B', text: 'World' },
      ]);
      expect(dialog.isActive).toBe(true);
      expect(dialog.queue).toHaveLength(1);
    });
  });

  describe('say()', () => {
    it('should return a Promise', () => {
      const scene = createMockScene();
      const dialog = new DialogSystem(scene);
      const result = dialog.say('Narrator', 'Once upon a time...');
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('choose()', () => {
    it('should return a Promise', () => {
      const scene = createMockScene();
      const dialog = new DialogSystem(scene);
      const result = dialog.choose('Jesus', 'Which path?', [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ]);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('clear()', () => {
    it('should reset all state', () => {
      const scene = createMockScene();
      const dialog = new DialogSystem(scene);
      dialog.show({ speaker: 'A', text: 'Test' });

      dialog.clear();
      expect(dialog.queue).toEqual([]);
      expect(dialog.isActive).toBe(false);
      expect(dialog._currentEntry).toBeNull();
    });
  });

  describe('destroy()', () => {
    it('should clear and destroy container', () => {
      const scene = createMockScene();
      const dialog = new DialogSystem(scene);
      dialog.show({ speaker: 'A', text: 'Test' });
      expect(dialog.container).not.toBeNull();

      dialog.destroy();
      expect(dialog.container).toBeNull();
    });
  });
});
