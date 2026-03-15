# Parables

Narrative puzzle episodes based on the parables of Jesus. Experience three beloved stories through interactive gameplay with hand-painted visuals, scripture integration, and reflective moments.

![Screenshot](screenshot.png)

## Install and Run Locally

```bash
npm install
npm run dev
```

The game runs at `http://localhost:5173` by default.

To build for production:

```bash
npm run build
npm run preview
```

## Install as PWA on Mobile

1. Open the game URL in your mobile browser (Safari on iOS, Chrome on Android).
2. Tap the **Share** button (iOS) or the **three-dot menu** (Android).
3. Select **Add to Home Screen**.
4. The game will appear as an app icon and run in full-screen mode.

## Episodes

### The Prodigal Son
A 3-phase narrative experience where you play as the prodigal son, journeying away from home and finding the way back. Colors shift from warm to cold and back as the story progresses.

### The Good Samaritan
Top-down view of the road from Jerusalem to Jericho. Watch as a priest and Levite pass by a wounded traveler, then take control of the Samaritan to provide care and bring the man to an inn.

### The Sower
Play as the sower, distributing 12 seeds across 4 types of soil. After planting, an animated time-lapse shows what happens in each soil, followed by an interactive matching puzzle connecting each soil to its meaning.

## Game Controls

- **Keyboard**: Arrow keys or WASD to move, Enter/Space to interact and advance dialog.
- **Touch**: On-screen touch controls for movement and interaction on mobile devices.

## Tech Stack

- **Phaser 3** -- 2D game framework
- **Vite** -- Development server and build tool
- **JavaScript (ES Modules)** -- No transpilation required

## License

MIT
