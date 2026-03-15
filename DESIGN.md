# Parables — Game Design Document

## Overview

**Parables** is a narrative puzzle game built with Phaser 3. Each episode is a self-contained, beautifully illustrated puzzle-story based on a parable of Jesus. The experience is inspired by Monument Valley's meditative, artistic approach — applied to the Gospels. Players engage with metaphorical puzzles that embody each parable's message, making the teaching experiential rather than merely textual.

## Vision & Artistic Direction

### Aesthetic
- **Warm, hand-painted feel** — soft colors, rounded shapes, gentle gradients
- **Parchment-and-gold palette** — cream backgrounds, golden accents, earthy tones
- **Mood-responsive coloring** — the entire scene shifts between warm and cold palettes based on narrative context (e.g., the Prodigal Son's departure vs. return)
- **Zero external assets** — all textures are generated programmatically to ensure portability

### Tone
- Contemplative, not gamified
- Personal — the player takes on roles within the parables
- Reverent but accessible — suitable for all ages
- Each episode ends with a reflection moment, not a score screen

## Architecture

### Tech Stack
- **Phaser 3** (CANVAS renderer, 800x600)
- **Plain JavaScript** with ES modules
- **Vite** for development and building
- **@faith-games/shared** — common UI components, ScriptureDB, SaveManager, color constants

### Scene Flow
```
BootScene -> MenuScene -> EpisodeSelectScene -> [Episode] -> ReflectionScene
                ^                                                |
                |________________________________________________|
```

### Core Systems

#### DialogSystem (`src/systems/DialogSystem.js`)
A queued dialog/narrative engine:
- Entries: `{ speaker, text, choices }`
- Typewriter text reveal with configurable speed
- Click/tap to advance or skip typewriter
- Choice buttons for interactive moments
- Promise-based API: `await dialog.say(speaker, text)` and `await dialog.choose(speaker, text, choices)`
- Callback system for completion and choice events

#### ColorTransition (`src/systems/ColorTransition.js`)
Smooth atmospheric mood transitions:
- Predefined moods: `warm`, `cold`, `neutral`, `joyful`, `dark`, `hopeful`
- `setMood(mood, duration)` — animated transition
- `lerpMood(from, to, progress)` — position-based interpolation (used in Prodigal Son)
- Tracks game objects and applies tint changes
- Full-screen overlay with alpha blending

## Episode Structure Template

Each episode follows this pattern:

1. **Setup** — Establish the setting and characters
2. **Rising Action** — Player experiences the parable's conflict
3. **Interactive Resolution** — Puzzle/choice mechanic that embodies the teaching
4. **Reflection** — Scripture display and personal question

## Episode Breakdowns

### Episode 1: The Prodigal Son (Luke 15:11-32)
**Theme:** The unconditional love of the Father

**Phase 1 — The Departure**
- Player starts at the father's house (warm golden tones)
- Moves left along a path toward a distant city
- Collects coins along the way (wealth accumulation)
- Colors gradually shift from warm to cold as distance increases

**Phase 2 — The Far Country**
- Dark, cold city environment
- "Friends" appear but vanish as coins drain away automatically
- Environment becomes barren; player must walk to the pig pen
- Key dialog: "Even my father's servants have food..."

**Phase 3 — The Return**
- Player journeys right, back toward home
- Three obstacles block the path (Shame, Guilt, Fear)
- Each requires choosing the right response (Humility, Repentance, Trust)
- Colors warm up with each correct choice
- The father runs to meet the player before reaching home
- Joyful reunion with particle celebration

**Puzzle Philosophy:** The obstacles are internal, not physical. The correct responses are counter-intuitive to pride but aligned with grace.

### Episode 2: The Good Samaritan (Luke 10:25-37)
**Theme:** True neighborly love crosses all boundaries

**Phase 1 — The Wounded Traveler**
- Traveler is attacked by robbers on the Jerusalem-Jericho road
- Player observes the scene unfold

**Phase 2 — Who Will Help?**
- A priest approaches and passes by on the other side
- A Levite approaches and does the same
- Player witnesses the failure of religious performance without compassion

**Phase 3 — The Samaritan (Player Control)**
- Player controls the Samaritan character
- Interactive care sequence:
  - Click wounds to bandage them
  - Click to give water
  - Click to place the wounded man on the donkey
  - Walk to the inn
- Each action visibly heals the wounded traveler

**Phase 4 — Go and Do Likewise**
- Samaritan pays the innkeeper
- Jesus asks: "Which was a neighbor?"
- Player selects from three options
- Only "The one who showed mercy" completes the episode

**Puzzle Philosophy:** The care sequence is deliberately unhurried. Each step is simple but requires intentional action — mirroring how real compassion requires stopping and choosing to help.

### Episode 3: The Sower (Matthew 13:1-23)
**Theme:** The condition of the heart determines how God's word takes root

**Phase 1 — The Seeds**
- Four strips of ground displayed: hard path, rocky soil, thorny ground, good soil
- Player has 12 seeds to distribute freely

**Phase 2 — The Growing (Animated)**
- Time-lapse shows the fate of each seed:
  - Path: birds eat them
  - Rocky: sprout fast, wilt under the sun
  - Thorny: grow but get choked by thorns
  - Good soil: grow into full, fruit-bearing plants
- Each animation includes explanatory scripture text

**Phase 3 — Understanding**
- Interactive matching puzzle: connect each soil type to its spiritual meaning
- Click-to-select mechanic with visual feedback

**Puzzle Philosophy:** The player's free choice in seed distribution creates personal investment. Watching "your" seeds fail or thrive makes the teaching visceral. The matching puzzle ensures intellectual understanding follows experiential learning.

## Dialog/Narrative System Design

### Design Principles
- Text appears via typewriter effect (25ms per character default)
- Players can click to skip the typewriter or advance to the next line
- Choice moments pause progression until the player selects
- Speaker names appear in gold; narration has no speaker label
- The dialog box sits at the bottom of the screen, styled like a translucent parchment

### Dialog Flow
```
dialog.say('Speaker', 'Text...') -> typewriter -> click to advance
dialog.choose('Speaker', 'Text...', choices) -> typewriter -> show buttons -> select -> continue
```

## Puzzle Design Philosophy

Every puzzle in Parables is a **metaphorical representation** of the parable's teaching:

| Puzzle Type | Parable | What It Teaches |
|---|---|---|
| Obstacle choices | Prodigal Son | Overcoming internal barriers to grace |
| Care sequence | Good Samaritan | Compassion requires intentional action |
| Seed distribution | Sower | Our choices affect spiritual receptivity |
| Soil matching | Sower | Understanding the heart's condition |

**Key principles:**
- Puzzles should never feel arbitrary
- The mechanic itself should teach the lesson
- Failure should redirect, not punish
- Every correct action should feel rewarding (color changes, particles, music)

## Color and Mood System

The `ColorTransition` system creates emotional atmosphere:

| Mood | Colors | Used In |
|---|---|---|
| Warm | Gold, cream, amber | Home, safety, God's presence |
| Cold | Blue-gray, dark | Separation, sin, loneliness |
| Neutral | Muted gray | Transition states, observation |
| Joyful | Bright gold, white | Celebration, completion, reunion |
| Dark | Deep purple-black | Rock bottom, despair |
| Hopeful | Soft green | Growth, new beginnings |

### Position-Based Mood (Prodigal Son)
The `lerpMood(from, to, progress)` method ties color to player position, creating a continuous visual metaphor for spiritual distance from the Father.

## Planned Future Episodes

### The Talents (Matthew 25:14-30)
- Player manages resources entrusted by a master
- Puzzle: investment/growth mechanics
- Theme: faithful stewardship

### The Pearl of Great Price (Matthew 13:45-46)
- Player searches through a marketplace
- Puzzle: evaluating worth, making the ultimate trade
- Theme: the surpassing value of the Kingdom

### The Lost Sheep (Luke 15:1-7)
- Player is the shepherd searching for one lost sheep
- Puzzle: navigation through wilderness
- Theme: God's relentless pursuit of each individual

### The Mustard Seed (Matthew 13:31-32)
- Player plants a tiny seed and watches it grow over time
- Puzzle: patience-based growth mechanic
- Theme: small faith grows into something extraordinary

## Accessibility Considerations

- **Color is never the only indicator** — text labels accompany all color-coded elements
- **Click-to-move and keyboard support** — both input methods available
- **Readable fonts** — Georgia serif at comfortable sizes with good contrast
- **Typewriter can be skipped** — click to reveal full text instantly
- **No time pressure** — all puzzles are self-paced
- **Wrong answers redirect, not punish** — incorrect choices provide the correct answer gracefully

## Scripture Integration Philosophy

Scripture is woven into the experience, not bolted on:

1. **BootScene** — Opening scripture sets the tone ("He told them many things in parables...")
2. **During gameplay** — Key verses appear as narrative text at the right moment
3. **ReflectionScene** — Full passage displayed beautifully after the experience
4. **Reflection questions** — Personal application that lingers after the game ends

The `ScriptureDB` from the shared library provides consistent access to curated verses. All scripture is KJV, presented with reverence through the `FONT_STYLES.SCRIPTURE` styling.

---

*Parables is part of the Faith Games collection — games that make faith tangible through interactive storytelling.*
