# DEFINITELY NOT A BUG
### *"It's not a bug. It's a feature."*

**Game Vita 5.0 Hackathon Submission**  
**Theme:** WORST GAME WINS  
**Team:** [YOUR TEAM NAME]

---

## 🎮 Game Description

**DEFINITELY NOT A BUG** is a satirical, intentionally infuriating, yet deeply polished cartoon 2D platformer. You play as a tiny marshmallow hero trapped inside a digital simulation certified as **"100% Bug-Free"** by an extremely dishonest AI computer monitor named **BUGGY**. 

BUGGY manipulates the physics, inverts your brain's controls, writes lying tutorial signs, summons pop-up error boxes, and celebrates your failures with sarcastic dialogue. Your objective: survive through three increasingly chaotic levels, defeat BUGGY in a multi-phase boss fight, or discover the forbidden secret maintenance hatch to disable all bugs permanently.

---

## 🏆 How the Game Implements the "Worst Game Wins" Theme

Instead of delivering genuine software bugs (which would make the game unplayable), **Definitely Not A Bug** elevates **terrible game design into a comedic art form**:

1. **Hostile Tutorial Signs:**
   - Early signs encourage you to jump straight into spike pits labelled as "Shortcuts".
   - A tutorial sign boldly claims: *"Press SPACE to fly into the sky!"*—only for your hero to jump like a stone while BUGGY mocks your gullibility.
2. **Brain Inversion Protocol:**
   - Level 2 features temporary control inversion (Left becomes Right, Right becomes Left) accompanied by an obnoxiously flashing yellow-and-black hazard siren.
3. **Deceptive Environment & Trolling Exits:**
   - Disappearing platforms count down from 3 seconds before vanishing beneath your feet with a cartoon puff of smoke.
   - Wobbling platforms shake nervously with sweat drops before collapsing.
   - The exit door in Level 2 is a fake prop that punches the hero backwards with a giant cartoon "NOPE!", revealing the real trapdoor exit below.
4. **Absurd Scoring & Death Bonuses:**
   - Dying doesn't just display a failure message; it awards **+500 Emotional Damage Points** and reduces your score further into negative numbers (e.g. `-$420.00`).
5. **Decoy Collectibles:**
   - Spending 15 seconds doing difficult platforming for a shiny golden token triggers BUGGY's maniacal laughter: *"You risked your digital life for a fake coin that does nothing!"*
6. **Existential Software Boss:**
   - BUGGY attacks with literal `Error 404` projectiles, falling `Syntax Error` anvils, and attempts to defeat you by installing a mandatory `400GB Update`.

---

## 🕹️ Controls

| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Move Left** | `A` or `Left Arrow (◀)` | Left D-Pad Button |
| **Move Right** | `D` or `Right Arrow (▶)` | Right D-Pad Button |
| **Jump** (Variable height) | `W`, `Space`, or `Up Arrow (▲)` | Round Jump Button |
| **Interact / Stomp Switch** | `E` or `Space` | Action Button `[E]` |
| **Quick Level Restart** | `R` | Pause Menu / Touch Action |
| **Pause / Resume** | `Escape` | HUD Pause Button |
| **Toggle Sound** | `M` | HUD Speaker Button |

*Note: Keyboard input listeners automatically prevent default browser scrolling for arrow keys and spacebar.*

---

## 🚀 How to Run the Game

### Method 1: Direct File Open (Offline Ready)
1. Double-click `index.html` or drag it into any modern web browser (**Chrome**, **Edge**, **Firefox**, **Brave**, **Safari**).
2. The game runs completely offline without any external CDNs, remote fonts, or network requests.

### Method 2: Local Static Server (Recommended for development)
If your browser restricts ES module imports over the `file://` protocol:
```bash
# Using Python 3:
python3 -m http.server 3000

# OR using Node / npx:
npx serve .

# OR using Vite (built-in):
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Technical Stack & Architecture

- **Rendering Engine:** Pure HTML5 Canvas 2D (`CanvasRenderingContext2D`) with delta-time clamping (`dt <= 0.05s`) to prevent tunneling on frame drops or tab switching.
- **Screen Shake System:** `ScreenShakeManager` hooks into the game loop to apply canvas context translation transformations (`ctx.translate`) with configurable intensity and exponential decay whenever explosions, player deaths, boss hits, or impacts occur.
- **Audio & Sound Synthesizer:** Custom Web Audio API synthesizer (`SoundManager` + `SoundGenerator`) producing dynamic procedural cartoon waveforms (sine, square, triangle, low-pass filtered white noise) with zero external audio dependencies.
- **Physics:** Custom kinematic platformer controller with coyote time (140ms), jump buffering (150ms), variable-jump release cuts, and separated AABB axis resolution.
- **Storage:** HTML5 `localStorage` for persistent stats, achievements, high scores, and accessibility settings.
- **Styling:** CSS3 variables, responsive viewport clamping, flexbox/grid modals, and animated scanline filters.

### Project File Structure:
```
/
├── index.html       # Semantic HTML5 markup, HUD, modals, touch controls, canvas containers
├── style.css        # Cartoon game aesthetics, rounded panels, responsive layouts, animations
├── game.js          # Core engine: Physics, SoundManager, SoundGenerator, ScreenShakeManager, Levels 1-3
├── server.ts        # Express full-stack backend with Vite middleware
└── README.md        # Comprehensive game documentation & hackathon submission details
```

---

## 🗺️ Levels & Secret Ending Walkthrough

### Level 1 — The Tutorial Lies
- **Objective:** Reach the exit portal.
- **Traps:** Misleading shortcut signs pointing into spikes; fake flying tutorials; disappearing countdown ledges.
- **Checkpoint:** Safe haven before the disappearing platforms.

### Level 2 — Trust Issues
- **Objective:** Navigate the inverted sectors and uncover the true exit.
- **Traps:** Brain Inversion Protocol zone; crumbly wobbling ledges; decoy shiny coins; fake exit boxing glove.
- **Checkpoint:** Safe island halfway across the inversion field.

### Level 3 — The Final Bug (Boss Fight)
- **Phase 1 (Error 404):** Dodge bouncing error dialog boxes; scale the high platforms to stomp the **KILL PROCESS** button.
- **Phase 2 (Settings Betrayal):** Reverses controls while dropping Syntax Error anvils; activate both **SERVER A** and **SERVER B** switches.
- **Phase 3 (The Final Patch):** BUGGY installs a fatal software update. Stomp the **CANCEL UPDATE** button 3 times before the update bar reaches 100%.

### 🕵️ Secret Mechanic — "Exploit the Bug"
- During Level 3, jump to the high upper-right platform above BUGGY's arena.
- Locate the flickering **DEBUG / MAINTENANCE HATCH**.
- Interact with or jump into the hatch **3 times** using `[E]` or Jump.
- Flipping the secret emergency switch triggers the **"QA ENGINEER OF THE YEAR"** secret ending: BUGGY breaks down in tears because removing all bugs turns the entire game into an empty corporate spreadsheet!

---

## 🏅 Achievements List

1. 💀 **First Failure** — Welcome to the club.
2. 🔍 **Professional Floor Inspector** — Fall or die 10 times.
3. 🌀 **Trust Issues** — Survive reversed controls and question reality.
4. 🥔 **Persistent Potato** — Restart or retry 5 times.
5. 🪨 **Fly Like A Brick** — Believe the "Press SPACE to fly" sign.
6. 🪙 **Shiny Trash Collector** — Collect 5 comedy BugCoins.
7. 🐛 **Bug Exterminator** — Defeat BUGGY and save absolutely nothing.
8. 📋 **QA Engineer of the Year** — Discover the hidden maintenance panel and disable all bugs.

---

## 🧪 Verification & Testing Checklist

- [x] Main menu opens cleanly with high-contrast comic visuals.
- [x] All menu buttons (Play, How to Play, Bad Settings, Achievements, Credits) work.
- [x] Pre-game humorous health & sanity advisory modal displays before gameplay starts.
- [x] Player movement, acceleration, jumping, and squash/stretch render at smooth 60 FPS.
- [x] Solid collisions, one-way moving platforms, and hazards function properly without clipping.
- [x] All 3 levels are completable with progression transitions.
- [x] Control reversal activates/deactivates cleanly with visible overhead indicator and warning banner.
- [x] Checkpoints save position and trigger respawn without game reload.
- [x] Boss BUGGY animates across 3 phases with health bar and distinct attack patterns.
- [x] Both standard Victory ending and secret ISO-9001 Spreadsheet ending function reliably.
- [x] Web Audio API sounds synthesize properly on first user interaction and obey the Mute toggle.
- [x] Achievements and settings persist in `localStorage`.
- [x] Touch controls allow full gameplay on mobile/touch screens.

---

## 📜 Credits

- **Game Vita 5.0 Entry:** "Definitely Not A Bug"
- **Theme:** Worst Game Wins
- **Team Name:** [YOUR TEAM NAME]
- **Lead Programmer:** A cat walking across the keyboard at 3 AM
- **Chief QA Inspector:** One sweet Russet Potato (found 0 bugs)
- **Voice of BUGGY:** A dishonest toaster running v0.0.1b
