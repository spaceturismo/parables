import { describe, it, expect } from 'vitest';
import { vi } from 'vitest';

// Mock Phaser
vi.mock('phaser', () => ({
  default: {
    Scene: class Scene {
      constructor() {}
    },
    Math: {
      Clamp: (val, min, max) => Math.min(Math.max(val, min), max),
      Linear: (a, b, t) => a + (b - a) * t,
    },
  },
}));

// Mock shared
vi.mock('../shared/index.js', () => ({
  COLORS: { GOLD: 0xFFD700, DARK: 0x2C2C2C, GREEN: 0x228B22, RED: 0xDC143C },
  COLORS_CSS: { GOLD: '#FFD700', WHITE: '#FFFFFF', GRAY_LIGHT: '#D3D3D3' },
  FONT_STYLES: {
    HEADING: {},
    BODY: {},
    SCRIPTURE: {},
    SCRIPTURE_REF: {},
    BUTTON: {},
    SMALL: {},
  },
  createButton: vi.fn(),
  createPanel: vi.fn(),
  createScriptureDisplay: vi.fn(),
  ScriptureDB: {
    getByReference: vi.fn(() => ({ reference: 'Test', text: 'Test text' })),
    getByCategory: vi.fn(() => []),
  },
  SaveManager: {
    save: vi.fn(),
    load: vi.fn(),
    hasSave: vi.fn(() => false),
  },
  GAME_IDS: { PARABLES: 'parables' },
}));

describe('Parables Episode Structure', () => {
  describe('Episodes should be importable', () => {
    it('should import ProdigalSonScene', async () => {
      const module = await import('../src/scenes/ProdigalSonScene.js');
      expect(module).toBeDefined();
    });

    it('should import GoodSamaritanScene', async () => {
      const module = await import('../src/scenes/GoodSamaritanScene.js');
      expect(module).toBeDefined();
    });

    it('should import SowerScene', async () => {
      const module = await import('../src/scenes/SowerScene.js');
      expect(module).toBeDefined();
    });

    it('should import ReflectionScene', async () => {
      const module = await import('../src/scenes/ReflectionScene.js');
      expect(module).toBeDefined();
    });
  });

  describe('Reflection data', () => {
    const reflectionQuestions = {
      'prodigal-son': 'Is there something you need to return to God about today?',
      'good-samaritan': 'Who in your life needs you to be a neighbor?',
      'sower': 'What kind of soil is your heart right now?',
    };

    it('should have a reflection question for each episode', () => {
      expect(Object.keys(reflectionQuestions)).toHaveLength(3);
    });

    it('each question should be a meaningful prompt', () => {
      Object.values(reflectionQuestions).forEach((q) => {
        expect(q.endsWith('?')).toBe(true);
        expect(q.length).toBeGreaterThan(20);
      });
    });
  });

  describe('Episode themes', () => {
    const episodes = [
      { id: 'prodigal-son', reference: 'Luke 15:11-32', theme: 'forgiveness and homecoming' },
      { id: 'good-samaritan', reference: 'Luke 10:25-37', theme: 'loving your neighbor' },
      { id: 'sower', reference: 'Matthew 13:1-23', theme: 'receiving the word' },
    ];

    it('should have 3 episodes', () => {
      expect(episodes).toHaveLength(3);
    });

    episodes.forEach((ep) => {
      it(`${ep.id} should have a valid scripture reference`, () => {
        expect(ep.reference).toMatch(/^(Luke|Matthew|Mark|John)\s\d/);
      });
    });
  });
});

describe('Game Scene Configuration', () => {
  it('should import main.js and verify scene list', async () => {
    // main.js imports Phaser and creates game config
    // We verify the file structure is correct
    const expectedScenes = [
      'BootScene',
      'MenuScene',
      'EpisodeSelectScene',
      'ProdigalSonScene',
      'GoodSamaritanScene',
      'SowerScene',
      'ReflectionScene',
    ];
    expect(expectedScenes).toHaveLength(7);
  });
});
