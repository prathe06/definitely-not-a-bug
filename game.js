/**
 * DEFINITELY NOT A BUG — "It's not a bug. It's a feature."
 * Game Vita 5.0 Hackathon Entry: WORST GAME WINS
 *
 * Full standalone game engine written in pure JavaScript.
 * Features:
 * - Canvas 2D procedural cartoon rendering & particle system
 * - Web Audio API synthesized procedural SFX & victory fanfare
 * - Physics with coyote time, jump buffering, and delta-time clamping
 * - 3 Full Levels:
 *    Level 1: The Tutorial Lies (lying signs, space to fly joke, countdown vanishing blocks)
 *    Level 2: Trust Issues (brain inversion controls, wobbling blocks, decoy coin, fake exit)
 *    Level 3: The Final Bug (3-phase interactive boss BUGGY + Secret QA Maintenance Hatch)
 * - Persistent achievements, stats, and settings via LocalStorage
 * - Touch & keyboard controls with scroll prevention
 */

// ============================================================================
// 1. SOUND MANAGER (WEB AUDIO API)
// ============================================================================

/**
 * SoundGenerator helper using Web Audio API AudioContext to produce
 * unique, cartoonish waveform sounds (sine, square, triangle, sawtooth, noise)
 * for various game events with zero external audio dependencies.
 */
class SoundGenerator {
  constructor(audioContext = null) {
    this.ctx = audioContext;
  }

  setContext(audioContext) {
    this.ctx = audioContext;
  }

  /**
   * Produces an oscillator tone with frequency sweep and exponential gain decay.
   * Supports 'sine', 'square', 'triangle', and 'sawtooth' waveforms.
   */
  tone(destination, startFreq, endFreq, duration, type = 'sine', volume = 0.3) {
    if (!this.ctx || !destination) return null;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, startFreq), now);
      if (endFreq && endFreq !== startFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
      }

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(now);
      osc.stop(now + duration + 0.01);
      return osc;
    } catch (e) {
      return null;
    }
  }

  /**
   * Produces filtered white noise for cartoon thuds, splats, explosions.
   */
  noise(destination, duration, volume = 0.2, filterFreq = 800) {
    if (!this.ctx || !destination) return null;
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(destination);

      whiteNoise.start(now);
      return whiteNoise;
    } catch (e) {
      return null;
    }
  }

  /** Cartoon bouncy jump sound: upward triangle waveform sweep */
  generateJump(destination) {
    return this.tone(destination, 180, 540, 0.18, 'triangle', 0.28);
  }

  /** Sparkling coin pickup: bright sine wave arpeggio */
  generateCoin(destination) {
    this.tone(destination, 587.33, 880, 0.12, 'sine', 0.28);
    setTimeout(() => {
      this.tone(destination, 880, 1174.66, 0.16, 'sine', 0.25);
    }, 55);
  }

  /** Cartoon damage/splat: descending sawtooth slide whistle + crunch noise */
  generateDamage(destination) {
    this.tone(destination, 340, 65, 0.35, 'sawtooth', 0.35);
    this.noise(destination, 0.22, 0.28, 650);
  }

  /** Level complete fanfare: triumphant musical arpeggio with tuned intervals */
  generateLevelComplete(destination) {
    const notes = [
      { f: 523.25, d: 0.14, t: 'triangle' }, // C5
      { f: 659.25, d: 0.14, t: 'triangle' }, // E5
      { f: 783.99, d: 0.16, t: 'sine' },     // G5
      { f: 1046.5, d: 0.38, t: 'square' },   // C6
    ];
    let delay = 0;
    notes.forEach((n) => {
      setTimeout(() => {
        this.tone(destination, n.f, n.f, n.d, n.t, 0.32);
      }, delay);
      delay += n.d * 880;
    });
  }

  /** Checkpoint jingle: cheerful dual sine chime */
  generateCheckpoint(destination) {
    this.tone(destination, 440, 554, 0.1, 'sine', 0.22);
    setTimeout(() => {
      this.tone(destination, 554, 659, 0.15, 'sine', 0.25);
    }, 85);
  }

  /** Inversion alert: alternating robotic square wave siren */
  generateInversion(destination) {
    this.tone(destination, 740, 440, 0.22, 'square', 0.2);
    setTimeout(() => {
      this.tone(destination, 440, 740, 0.22, 'square', 0.2);
    }, 170);
  }

  /** Boss hit: heavy sub-bass sawtooth drop + explosive noise crunch */
  generateBossHit(destination) {
    this.tone(destination, 180, 40, 0.35, 'sawtooth', 0.42);
    this.noise(destination, 0.35, 0.45, 500);
  }

  /** Boss laser shot: descending sci-fi sawtooth zap */
  generateBossShoot(destination) {
    this.tone(destination, 650, 220, 0.18, 'sawtooth', 0.22);
  }

  /** Tactile button click pop using sine pulse */
  generateButtonClick(destination) {
    this.tone(destination, 440, 520, 0.05, 'sine', 0.18);
  }

  /** Secret reveal fanfare: 6-tone ascending pentatonic chime */
  generateSecret(destination) {
    const notes = [440, 554, 659, 880, 1108, 1318];
    notes.forEach((f, i) => {
      setTimeout(() => {
        this.tone(destination, f, f * 1.05, 0.18, 'sine', 0.24);
      }, i * 75);
    });
  }
}

/**
 * SoundManager handles procedural audio synthesis using the Web Audio API.
 * Coordinates SoundGenerator with user settings, master volume,
 * and audio context persistence across the game loop.
 */
class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.enabled = true;
    this.volume = 0.7;
    this.initialized = false;
    this.generator = new SoundGenerator(null);
  }

  /**
   * Initializes the AudioContext and Master Gain node on the first user interaction.
   */
  init() {
    if (this.initialized && this.ctx) {
      this.resume();
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();

        // Master Gain Node routing all sounds
        this.masterGain = this.ctx.createGain();
        const effectiveGain = this.enabled ? this.volume : 0.0001;
        this.masterGain.gain.setValueAtTime(effectiveGain, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // Bind AudioContext to SoundGenerator helper
        this.generator.setContext(this.ctx);
        this.initialized = true;
      }
    } catch (e) {
      console.warn('Web Audio initialization not supported or blocked:', e);
    }
  }

  /**
   * Resumes the AudioContext if suspended by browser autoplay policy.
   */
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Updates user toggle state and smoothly adjusts master gain.
   */
  setEnabled(enabled) {
    this.enabled = !!enabled;
    if (this.masterGain && this.ctx) {
      const targetGain = this.enabled ? this.volume : 0.0001;
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.05);
    }
  }

  /**
   * Toggles sound on/off and returns the new state.
   */
  toggleSound() {
    this.init();
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  /**
   * Sets master volume level (0.0 to 1.0).
   */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.enabled && this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.05);
    }
  }

  /**
   * Core synthesizer delegate
   */
  playTone(freqStart, freqEnd, duration, type = 'sine', gainVal = 0.3) {
    if (!this.enabled) return;
    this.init();
    this.resume();
    this.generator.tone(this.masterGain, freqStart, freqEnd, duration, type, gainVal);
  }

  /**
   * Core noise delegate
   */
  playNoise(duration, gainVal = 0.2, filterFreq = 800) {
    if (!this.enabled) return;
    this.init();
    this.resume();
    this.generator.noise(this.masterGain, duration, gainVal, filterFreq);
  }

  // ==========================================================================
  // SPECIFIC PROCEDURAL SOUND EFFECTS
  // ==========================================================================

  playJump() {
    if (!this.enabled) return;
    this.init();
    this.resume();
    this.generator.generateJump(this.masterGain);
  }
  jump() {
    this.playJump();
  }

  playCollectCoin() {
    if (!this.enabled) return;
    this.init();
    this.resume();
    this.generator.generateCoin(this.masterGain);
  }
  collectCoin() {
    this.playCollectCoin();
  }
  coin() {
    this.playCollectCoin();
  }

  playTakeDamage() {
    if (!this.enabled) return;
    this.init();
    this.resume();
    this.generator.generateDamage(this.masterGain);
  }
  takeDamage() {
    this.playTakeDamage();
  }
  die() {
    this.playTakeDamage();
  }

  playLevelComplete() {
    if (!this.enabled) return;
    this.init();
    this.resume();
    this.generator.generateLevelComplete(this.masterGain);
  }
  levelComplete() {
    this.playLevelComplete();
  }
  victory() {
    this.playLevelComplete();
  }

  checkpoint() {
    if (!this.enabled) return;
    this.init();
    this.resume();
    this.generator.generateCheckpoint(this.masterGain);
  }

  inversion() {
    if (!this.enabled) return;
    this.init();
    this.resume();
    this.generator.generateInversion(this.masterGain);
  }

  bossHit() {
    if (!this.enabled) return;
    this.init();
    this.resume();
    this.generator.generateBossHit(this.masterGain);
  }

  bossShoot() {
    if (!this.enabled) return;
    this.init();
    this.resume();
    this.generator.generateBossShoot(this.masterGain);
  }

  buttonClick() {
    if (!this.enabled) return;
    this.init();
    this.resume();
    this.generator.generateButtonClick(this.masterGain);
  }

  secret() {
    if (!this.enabled) return;
    this.init();
    this.resume();
    this.generator.generateSecret(this.masterGain);
  }
}

// Backward compatibility alias
const SoundSystem = SoundManager;

// ============================================================================
// 1B. SCREEN SHAKE MANAGER
// ============================================================================

/**
 * ScreenShakeManager hooks into the game loop to apply canvas context
 * transformations (ctx.translate) whenever an explosion occurs.
 * Features configurable intensity and decay.
 *
 * @param {Object} [initialConfig]
 * @param {number} [initialConfig.defaultIntensity=18] - Default shake displacement in pixels
 * @param {number} [initialConfig.decayRate=0.86] - Exponential decay rate
 * @param {boolean} [initialConfig.enabled=true] - User toggle state
 */
function ScreenShakeManager(initialConfig = {}) {
  let intensity = 0;
  let defaultIntensity = initialConfig.defaultIntensity || 18;
  let decayRate = initialConfig.decayRate || 0.86;
  let offsetX = 0;
  let offsetY = 0;
  let enabled = initialConfig.enabled !== undefined ? initialConfig.enabled : true;

  const instance = {
    /**
     * Triggers screen shake whenever an explosion or impact occurs.
     * @param {number} [customIntensity] - Max shake displacement in pixels
     * @param {number} [customDecay] - Configurable decay multiplier per frame
     */
    addShake(customIntensity, customDecay) {
      if (!enabled) return;
      const amount = customIntensity !== undefined ? customIntensity : defaultIntensity;
      intensity = Math.min(45, Math.max(intensity, amount));
      if (customDecay !== undefined) {
        decayRate = customDecay;
      }
    },

    /**
     * Event trigger alias for explosions and collisions.
     */
    trigger(customIntensity, customDecay) {
      this.addShake(customIntensity, customDecay);
    },

    /**
     * Hooks into the game loop to decay intensity and compute offset each frame.
     * @param {number} dt - Clamped delta time in seconds
     */
    update(dt) {
      if (!enabled || intensity < 0.2) {
        intensity = 0;
        offsetX = 0;
        offsetY = 0;
        return;
      }

      // Compute randomized translation offset
      offsetX = (Math.random() * 2 - 1) * intensity;
      offsetY = (Math.random() * 2 - 1) * intensity;

      // Exponential decay normalized by frame time
      const decayFactor = Math.pow(decayRate, dt * 60);
      intensity *= decayFactor;

      if (intensity < 0.2) {
        intensity = 0;
        offsetX = 0;
        offsetY = 0;
      }
    },

    /**
     * Applies canvas context transformation (translate) in the render loop.
     * @param {CanvasRenderingContext2D} ctx
     */
    apply(ctx) {
      if (!enabled) return;
      if (offsetX !== 0 || offsetY !== 0) {
        ctx.translate(Math.round(offsetX), Math.round(offsetY));
      }
    },

    /**
     * Updates configuration options dynamically.
     */
    configure({ defaultIntensity: dInt, decayRate: dDec, enabled: en } = {}) {
      if (dInt !== undefined) defaultIntensity = dInt;
      if (dDec !== undefined) decayRate = dDec;
      if (en !== undefined) this.setEnabled(en);
    },

    setEnabled(val) {
      enabled = !!val;
      if (!enabled) {
        intensity = 0;
        offsetX = 0;
        offsetY = 0;
      }
    },

    isEnabled() {
      return enabled;
    },

    getIntensity() {
      return intensity;
    },

    getOffset() {
      return { x: offsetX, y: offsetY };
    }
  };

  return instance;
}

// ============================================================================
// 2. ACHIEVEMENTS & STORAGE MANAGER
// ============================================================================

const ACHIEVEMENTS_DATA = [
  {
    id: 'first_death',
    title: 'First Failure',
    desc: 'Welcome to the club. The floor is made of bad life choices.',
    icon: '💀',
  },
  {
    id: 'floor_inspector',
    title: 'Professional Floor Inspector',
    desc: 'Fell or died 10 times. Certified ground quality evaluator.',
    icon: '🔍',
  },
  {
    id: 'trust_issues',
    title: 'Trust Issues',
    desc: 'Survived reversed controls and questioned the fabric of reality.',
    icon: '🌀',
  },
  {
    id: 'persistent_potato',
    title: 'Persistent Potato',
    desc: 'Restarted or retried 5 times. Dedication or insanity?',
    icon: '🥔',
  },
  {
    id: 'fly_brick',
    title: 'Fly Like A Brick',
    desc: 'Believed the "Press SPACE to Fly" tutorial sign. Iconic.',
    icon: '🪨',
  },
  {
    id: 'shiny_trash',
    title: 'Shiny Trash Collector',
    desc: 'Collected comedy BugCoins despite them having zero market value.',
    icon: '🪙',
  },
  {
    id: 'bug_exterminator',
    title: 'Bug Exterminator',
    desc: 'Defeated the treacherous BUGGY and fixed absolutely nothing.',
    icon: '🐛',
  },
  {
    id: 'qa_engineer',
    title: 'QA Engineer of the Year',
    desc: 'Discovered the hidden maintenance panel and disabled the bugs!',
    icon: '📋',
  },
];

class StorageManager {
  constructor() {
    this.storageKey = 'dna_bug_data_v1';
    this.data = this.load();
  }

  getDefaults() {
    return {
      deaths: 0,
      restarts: 0,
      coins: 0,
      score: -42,
      achievements: {},
      settings: {
        sound: true,
        volume: 70,
        shake: true,
        difficulty: 'normal',
        touch: ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 900),
        touchSize: 'normal',
        haptics: true,
      },
    };
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        return Object.assign(this.getDefaults(), JSON.parse(raw));
      }
    } catch (e) {
      console.warn('Storage read error:', e);
    }
    return this.getDefaults();
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Storage write error:', e);
    }
  }

  unlockAchievement(id, onUnlock) {
    if (!this.data.achievements[id]) {
      this.data.achievements[id] = Date.now();
      this.save();
      const meta = ACHIEVEMENTS_DATA.find((a) => a.id === id);
      if (meta && onUnlock) {
        onUnlock(meta);
      }
      return true;
    }
    return false;
  }

  reset() {
    this.data = this.getDefaults();
    this.save();
  }
}

// ============================================================================
// 3. PARTICLE & CONFETTI ENGINE
// ============================================================================

class ParticleEngine {
  constructor() {
    this.particles = [];
    this.onExplosion = null;
  }

  add(x, y, vx, vy, color, size, life, shape = 'circle') {
    this.particles.push({
      x,
      y,
      vx,
      vy,
      color,
      size,
      maxLife: life,
      life,
      shape,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 6,
    });
  }

  emitDust(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * 1.2;
      const spd = 40 + Math.random() * 70;
      this.add(
        x,
        y,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd * 0.4,
        'rgba(240, 244, 255, 0.7)',
        3 + Math.random() * 3,
        0.35 + Math.random() * 0.2
      );
    }
  }

  emitSparkles(x, y, count = 8, color = '#ffe600') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 120;
      this.add(
        x,
        y,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd,
        color,
        3 + Math.random() * 3,
        0.5 + Math.random() * 0.3,
        'star'
      );
    }
  }

  emitExplosion(x, y, count = 25, intensity = 18, decay = 0.86) {
    if (this.onExplosion) {
      this.onExplosion(intensity, decay);
    }
    const colors = ['#ff477e', '#ffe600', '#00f0ff', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 80 + Math.random() * 220;
      const col = colors[Math.floor(Math.random() * colors.length)];
      this.add(
        x,
        y,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd,
        col,
        4 + Math.random() * 5,
        0.6 + Math.random() * 0.5,
        'square'
      );
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.rotSpeed * dt;
      p.vy += 300 * dt; // light gravity
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;

      if (p.shape === 'star') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.shape === 'square') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

// ============================================================================
// 4. CONFETTI CANNON (FOR CELEBRATIONS)
// ============================================================================

class ConfettiCannon {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pieces = [];
    this.active = false;
  }

  start(count = 90) {
    this.active = true;
    this.pieces = [];
    const colors = ['#ff477e', '#ffe600', '#00f0ff', '#00ff88', '#ffffff'];
    for (let i = 0; i < count; i++) {
      this.pieces.push({
        x: Math.random() * this.canvas.width,
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 200,
        vy: 120 + Math.random() * 240,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 7 + Math.random() * 6,
        rot: Math.random() * Math.PI * 2,
        rotSpd: (Math.random() - 0.5) * 8,
      });
    }
  }

  stop() {
    this.active = false;
    this.pieces = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  update(dt) {
    if (!this.active && this.pieces.length === 0) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const c = this.pieces[i];
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rot += c.rotSpd * dt;

      if (c.y > this.canvas.height + 20) {
        if (this.active) {
          c.y = -20;
          c.x = Math.random() * this.canvas.width;
        } else {
          this.pieces.splice(i, 1);
          continue;
        }
      }

      this.ctx.save();
      this.ctx.translate(c.x, c.y);
      this.ctx.rotate(c.rot);
      this.ctx.fillStyle = c.color;
      this.ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
      this.ctx.restore();
    }
  }
}

// ============================================================================
// 5. PLAYER CHARACTER
// ============================================================================

class Player {
  constructor(x, y) {
    this.spawnX = x;
    this.spawnY = y;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 28;
    this.height = 36;
    this.grounded = false;
    this.wasGrounded = false;
    this.coyoteTimer = 0;
    this.jumpBuffer = 0;
    this.facing = 1; // 1 = right, -1 = left
    this.isDead = false;

    // Animation states
    this.walkAnim = 0;
    this.squashX = 1;
    this.squashY = 1;
    this.blinkTimer = 2.5;
    this.isBlinking = false;
  }

  respawn(x, y) {
    this.x = x !== undefined ? x : this.spawnX;
    this.y = y !== undefined ? y : this.spawnY;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.wasGrounded = false;
    this.coyoteTimer = 0;
    this.jumpBuffer = 0;
    this.isDead = false;
    this.squashX = 1;
    this.squashY = 1;
  }

  update(dt, input, isInverted, sound, particles) {
    if (this.isDead) return;

    // Calculate effective horizontal input
    let moveDir = 0;
    if (input.left) moveDir -= 1;
    if (input.right) moveDir += 1;

    // Comedic Brain Inversion Mechanic
    if (isInverted) {
      moveDir = -moveDir;
    }

    if (moveDir !== 0) {
      this.facing = moveDir;
      const accel = 2600;
      this.vx += moveDir * accel * dt;
      const maxSpd = 280;
      if (Math.abs(this.vx) > maxSpd) {
        this.vx = Math.sign(this.vx) * maxSpd;
      }
      this.walkAnim += dt * 14;
    } else {
      // Friction
      this.vx *= Math.pow(0.001, dt);
      if (Math.abs(this.vx) < 5) this.vx = 0;
    }

    // Coyote timer & Jump buffer
    if (this.grounded) {
      this.coyoteTimer = 0.14;
      if (!this.wasGrounded) {
        // Just landed! Squash effect
        this.squashX = 1.35;
        this.squashY = 0.7;
        particles.emitDust(this.x + this.width / 2, this.y + this.height, 4);
      }
    } else {
      this.coyoteTimer -= dt;
    }
    this.wasGrounded = this.grounded;

    if (input.jumpPressed) {
      this.jumpBuffer = 0.15;
    } else {
      this.jumpBuffer -= dt;
    }

    // Jump execution
    if (this.jumpBuffer > 0 && this.coyoteTimer > 0) {
      this.vy = -620;
      this.jumpBuffer = 0;
      this.coyoteTimer = 0;
      this.grounded = false;
      this.squashX = 0.75;
      this.squashY = 1.35;
      sound.playJump();
      particles.emitDust(this.x + this.width / 2, this.y + this.height, 6);
    }

    // Variable jump height (releasing jump cuts upward velocity)
    if (!input.jumpHold && this.vy < -150) {
      this.vy += 1200 * dt;
    }

    // Gravity
    const gravity = 1500;
    this.vy += gravity * dt;
    if (this.vy > 850) this.vy = 850;

    // Squash & Stretch restitution
    this.squashX += (1 - this.squashX) * 12 * dt;
    this.squashY += (1 - this.squashY) * 12 * dt;

    // Blinking
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.isBlinking = true;
      if (this.blinkTimer <= -0.15) {
        this.isBlinking = false;
        this.blinkTimer = 2.0 + Math.random() * 3.0;
      }
    }
  }

  draw(ctx, isInverted) {
    if (this.isDead) return;

    ctx.save();
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    ctx.translate(cx, cy);
    ctx.scale(this.facing * this.squashX, this.squashY);

    // Cute Marshmallow Body
    const bodyW = 26;
    const bodyH = 34;
    const radius = 9;

    // Soft Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, bodyH / 2 + 1, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body Gradient
    const grad = ctx.createLinearGradient(0, -bodyH / 2, 0, bodyH / 2);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#dfe6f5');

    ctx.fillStyle = grad;
    ctx.strokeStyle = '#1e243b';
    ctx.lineWidth = 3;

    // Rounded hero shape
    ctx.beginPath();
    ctx.roundRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH, radius);
    ctx.fill();
    ctx.stroke();

    // Antenna on head with glowing cyan orb
    ctx.beginPath();
    ctx.moveTo(0, -bodyH / 2);
    ctx.lineTo(0, -bodyH / 2 - 8);
    ctx.strokeStyle = '#1e243b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -bodyH / 2 - 9, 4, 0, Math.PI * 2);
    ctx.fillStyle = isInverted ? '#ffe600' : '#00f0ff';
    ctx.fill();
    ctx.stroke();

    // Eyes
    const eyeOffsetX = 4;
    const eyeY = -4;

    if (this.isBlinking) {
      // Blink lines
      ctx.strokeStyle = '#1e243b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-eyeOffsetX - 3, eyeY);
      ctx.lineTo(-eyeOffsetX + 3, eyeY);
      ctx.moveTo(eyeOffsetX - 3, eyeY);
      ctx.lineTo(eyeOffsetX + 3, eyeY);
      ctx.stroke();
    } else if (isInverted) {
      // Swirly / dizzy eyes when inverted
      ctx.strokeStyle = '#ff477e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-eyeOffsetX, eyeY, 3.5, 0, Math.PI * 2);
      ctx.arc(eyeOffsetX, eyeY, 3.5, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Big expressive cartoon anime eyes
      ctx.fillStyle = '#1e243b';
      ctx.beginPath();
      ctx.ellipse(-eyeOffsetX, eyeY, 3, 4.5, 0, 0, Math.PI * 2);
      ctx.ellipse(eyeOffsetX, eyeY, 3, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye glints
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-eyeOffsetX + 1, eyeY - 2, 1.5, 0, Math.PI * 2);
      ctx.arc(eyeOffsetX + 1, eyeY - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cute Rosy Cheeks
    ctx.fillStyle = 'rgba(255, 71, 126, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-8, 1, 3, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(8, 1, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tiny Smile or "O" mouth when jumping
    ctx.strokeStyle = '#1e243b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (!this.grounded) {
      ctx.arc(0, 3, 2.5, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.arc(0, 2, 3, 0.1, Math.PI - 0.1);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ============================================================================
// 6. BOSS CHARACTER: "BUGGY"
// ============================================================================

class BossBuggy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.originY = y;
    this.width = 110;
    this.height = 90;
    this.phase = 1; // 1, 2, 3
    this.maxHp = 3;
    this.hp = 3;
    this.hoverTimer = 0;
    this.attackTimer = 2.0;
    this.isHurt = false;
    this.hurtTimer = 0;
    this.mouthOpen = false;
    this.projectiles = [];
    this.anvils = [];
    this.updateProgress = 0; // Phase 3 update bar (0 to 100)
    this.updateCancelHits = 0; // Hits to cancel update
    this.secretHatchHits = 0; // Hits on secret maintenance hatch
    this.isDefeated = false;
  }

  update(dt, player, onShoot, sound, particles) {
    if (this.isDefeated) return;

    this.hoverTimer += dt * 2.2;
    this.y = this.originY + Math.sin(this.hoverTimer) * 16;

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      this.isHurt = this.hurtTimer > 0;
    }

    // Phase specific attacks
    this.attackTimer -= dt;

    if (this.phase === 1) {
      // Phase 1: Launches "Error 404" bouncing projectiles
      if (this.attackTimer <= 0) {
        this.attackTimer = 2.4;
        const dir = Math.sign(player.x - this.x) || -1;
        this.projectiles.push({
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
          vx: dir * (160 + Math.random() * 50),
          vy: -120 - Math.random() * 80,
          label: Math.random() > 0.5 ? '404' : 'NULL',
          width: 44,
          height: 26,
          life: 8,
        });
        this.mouthOpen = true;
        setTimeout(() => (this.mouthOpen = false), 400);
        sound.bossShoot();
        if (onShoot) onShoot('Error 404 popup incoming! Dodge or suffer!');
      }
    } else if (this.phase === 2) {
      // Phase 2: Drops "Syntax Error" falling anvils above player's general position
      if (this.attackTimer <= 0) {
        this.attackTimer = 2.2;
        const targetX = Math.max(100, Math.min(1300, player.x + (Math.random() - 0.5) * 80));
        this.anvils.push({
          x: targetX,
          y: 40,
          vy: 0,
          targetY: 480,
          warning: 0.9, // Seconds of warning shadow before dropping
          width: 40,
          height: 34,
        });
        sound.bossShoot();
      }
    } else if (this.phase === 3) {
      // Phase 3: Update bar ticks up!
      this.updateProgress += dt * 5.8; // ~17 seconds to fill
      if (this.updateProgress >= 100) {
        this.updateProgress = 100;
        // Update installs! BUGGY wipes screen
      }
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 450 * dt; // gravity

      // Bounce on floor
      if (p.y > 470) {
        p.y = 470;
        p.vy = -Math.abs(p.vy) * 0.75;
      }

      if (p.life <= 0 || p.x < -100 || p.x > 1600) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update anvils
    for (let i = this.anvils.length - 1; i >= 0; i--) {
      const a = this.anvils[i];
      if (a.warning > 0) {
        a.warning -= dt;
      } else {
        a.vy += 1200 * dt;
        a.y += a.vy * dt;
        if (a.y >= a.targetY) {
          particles.emitExplosion(a.x + a.width / 2, a.y + a.height, 8);
          sound.bossHit();
          this.anvils.splice(i, 1);
        }
      }
    }
  }

  takeDamage(sound, particles) {
    this.hp--;
    this.isHurt = true;
    this.hurtTimer = 0.8;
    sound.bossHit();
    particles.emitExplosion(this.x + this.width / 2, this.y + this.height / 2, 30);

    if (this.hp <= 0) {
      this.isDefeated = true;
    } else {
      this.phase = 4 - this.hp; // 3 hp -> phase 1; 2 hp -> phase 2; 1 hp -> phase 3
    }
  }

  draw(ctx) {
    if (this.isDefeated) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // CRT Monitor Bezel
    ctx.fillStyle = this.isHurt ? '#ff477e' : '#222943';
    ctx.strokeStyle = '#0e1222';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(0, 0, this.width, this.height, 16);
    ctx.fill();
    ctx.stroke();

    // Antenna on monitor
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 0);
    ctx.lineTo(this.width / 2 - 14, -18);
    ctx.moveTo(this.width / 2, 0);
    ctx.lineTo(this.width / 2 + 14, -18);
    ctx.strokeStyle = '#3a446c';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Red alert light on monitor top
    ctx.beginPath();
    ctx.arc(this.width / 2, -4, 6, 0, Math.PI * 2);
    ctx.fillStyle = this.phase === 3 ? '#ff2a6d' : '#00f0ff';
    ctx.fill();

    // Screen Glass
    const screenMargin = 10;
    const sw = this.width - screenMargin * 2;
    const sh = this.height - screenMargin * 2 - 6;

    ctx.fillStyle = this.phase === 3 ? '#3a0d18' : '#0c1626';
    ctx.beginPath();
    ctx.roundRect(screenMargin, screenMargin, sw, sh, 8);
    ctx.fill();

    // Scanlines
    ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
    for (let sy = screenMargin; sy < screenMargin + sh; sy += 4) {
      ctx.fillRect(screenMargin, sy, sw, 1.5);
    }

    // Expressive Cartoon Face on Screen
    const faceCenterX = this.width / 2;
    const faceCenterY = screenMargin + sh / 2;

    if (this.isHurt) {
      // Glitch / Dead eyes >_<
      ctx.strokeStyle = '#ffe600';
      ctx.lineWidth = 3;
      ctx.beginPath();
      // Left eye X
      ctx.moveTo(faceCenterX - 22, faceCenterY - 8);
      ctx.lineTo(faceCenterX - 10, faceCenterY + 4);
      ctx.moveTo(faceCenterX - 10, faceCenterY - 8);
      ctx.lineTo(faceCenterX - 22, faceCenterY + 4);
      // Right eye X
      ctx.moveTo(faceCenterX + 10, faceCenterY - 8);
      ctx.lineTo(faceCenterX + 22, faceCenterY + 4);
      ctx.moveTo(faceCenterX + 22, faceCenterY - 8);
      ctx.lineTo(faceCenterX + 10, faceCenterY + 4);
      ctx.stroke();

      // Wavy zigzag mouth
      ctx.beginPath();
      ctx.moveTo(faceCenterX - 14, faceCenterY + 14);
      ctx.lineTo(faceCenterX - 6, faceCenterY + 10);
      ctx.lineTo(faceCenterX, faceCenterY + 16);
      ctx.lineTo(faceCenterX + 6, faceCenterY + 10);
      ctx.lineTo(faceCenterX + 14, faceCenterY + 14);
      ctx.stroke();
    } else if (this.phase === 3) {
      // Enraged Red Glitch Face
      ctx.fillStyle = '#ff2a6d';
      // Angled demonic eyes
      ctx.beginPath();
      ctx.moveTo(faceCenterX - 24, faceCenterY - 12);
      ctx.lineTo(faceCenterX - 8, faceCenterY - 4);
      ctx.lineTo(faceCenterX - 20, faceCenterY + 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(faceCenterX + 24, faceCenterY - 12);
      ctx.lineTo(faceCenterX + 8, faceCenterY - 4);
      ctx.lineTo(faceCenterX + 20, faceCenterY + 2);
      ctx.fill();

      // Jagged sharp teeth mouth
      ctx.fillStyle = '#ffe600';
      ctx.beginPath();
      ctx.arc(faceCenterX, faceCenterY + 12, 12, 0, Math.PI);
      ctx.fill();
    } else {
      // Smug mischievous grin
      ctx.fillStyle = '#00f0ff';
      // Slanted smug digital eyes
      ctx.beginPath();
      ctx.ellipse(faceCenterX - 16, faceCenterY - 4, 6, 8, -0.2, 0, Math.PI * 2);
      ctx.ellipse(faceCenterX + 16, faceCenterY - 4, 6, 8, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Smug smirk or wide laughter mouth
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (this.mouthOpen) {
        ctx.fillStyle = '#ff477e';
        ctx.arc(faceCenterX, faceCenterY + 10, 10, 0, Math.PI);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.arc(faceCenterX + 2, faceCenterY + 8, 12, 0.2, Math.PI - 0.4);
        ctx.stroke();
      }
    }

    ctx.restore();

    // Draw Boss Health Bar above BUGGY
    const barW = 160;
    const barH = 14;
    const barX = this.x + this.width / 2 - barW / 2;
    const barY = this.y - 32;

    ctx.fillStyle = '#0e1222';
    ctx.strokeStyle = '#2d3862';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 6);
    ctx.fill();
    ctx.stroke();

    const hpPercent = Math.max(0, this.hp / this.maxHp);
    const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    grad.addColorStop(0, '#00f0ff');
    grad.addColorStop(1, '#ff477e');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(barX + 2, barY + 2, (barW - 4) * hpPercent, barH - 4, 4);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`BUGGY OS v0.0.1b - STABILITY: ${Math.round(hpPercent * 100)}%`, barX + barW / 2, barY - 4);

    // Draw Projectiles
    for (const p of this.projectiles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = '#ff477e';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-p.width / 2, -p.height / 2, p.width, p.height, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.label, 0, 4);
      ctx.restore();
    }

    // Draw Anvils / Syntax Errors
    for (const a of this.anvils) {
      if (a.warning > 0) {
        // Red warning reticle on ground
        ctx.strokeStyle = 'rgba(255, 71, 126, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(a.x, a.targetY, a.width, 10);
        ctx.setLineDash([]);
        ctx.fillStyle = '#ff477e';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('⚠️ DROP', a.x + a.width / 2, a.targetY - 6);
      } else {
        ctx.fillStyle = '#3a446c';
        ctx.strokeStyle = '#ffe600';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(a.x, a.y, a.width, a.height, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffe600';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SYNTAX', a.x + a.width / 2, a.y + 14);
        ctx.fillText('ERROR', a.x + a.width / 2, a.y + 26);
      }
    }
  }
}

// ============================================================================
// 7. LEVEL DEFINITIONS & BUILDER
// ============================================================================

function createLevel1() {
  return {
    id: 1,
    name: 'LEVEL 1: THE TUTORIAL LIES',
    width: 2200,
    height: 540,
    spawn: { x: 80, y: 380 },
    platforms: [
      // Floor starting segment
      { x: 0, y: 440, w: 420, h: 100, type: 'solid' },
      // Spike pit 1 (fake shortcut points here!)
      { x: 420, y: 460, w: 180, h: 80, type: 'hazard' },
      // Island over spike pit
      { x: 600, y: 440, w: 260, h: 100, type: 'solid' },
      // Upper ledge (space to fly)
      { x: 740, y: 340, w: 160, h: 26, type: 'solid' },
      // Checkpoint platform
      { x: 960, y: 420, w: 200, h: 120, type: 'solid' },
      // Disappearing countdown platform 1
      {
        x: 1220,
        y: 400,
        w: 90,
        h: 24,
        type: 'disappearing',
        timer: 3.0,
        maxTimer: 3.0,
        hidden: false,
        cooldown: 0,
      },
      // Disappearing countdown platform 2
      {
        x: 1370,
        y: 380,
        w: 90,
        h: 24,
        type: 'disappearing',
        timer: 2.2,
        maxTimer: 2.2,
        hidden: false,
        cooldown: 0,
      },
      // Deep pit hazards
      { x: 1160, y: 500, w: 440, h: 40, type: 'hazard' },
      // Safe landing platform
      { x: 1540, y: 410, w: 240, h: 130, type: 'solid' },
      // Step to exit
      { x: 1820, y: 360, w: 140, h: 26, type: 'solid' },
      // Exit platform
      { x: 1980, y: 320, w: 220, h: 220, type: 'solid' },
    ],
    movingPlatforms: [
      // Gentle floating helper platform
      {
        x: 1600,
        y: 330,
        w: 90,
        h: 20,
        startX: 1600,
        endX: 1780,
        speed: 70,
        dir: 1,
        type: 'moving',
      },
    ],
    signs: [
      {
        x: 140,
        y: 390,
        text: 'TUTORIAL: Press A / D to walk! It works 99% of the time.',
        id: 'sign_walk',
      },
      {
        x: 370,
        y: 390,
        text: 'SHORTCUT TO VICTORY! JUMP RIGHT IN! ->',
        id: 'sign_fake_jump',
      },
      {
        x: 770,
        y: 290,
        text: 'PRO-TIP: Press SPACE to fly into the sky!',
        id: 'sign_space_fly',
      },
      {
        x: 1120,
        y: 370,
        text: 'DISAPPEARING GROUND AHEAD: Do not blink.',
        id: 'sign_blink',
      },
    ],
    coins: [
      { x: 260, y: 390, collected: false },
      { x: 800, y: 290, collected: false },
      { x: 1260, y: 340, collected: false },
      { x: 1680, y: 280, collected: false },
    ],
    checkpoints: [{ x: 1020, y: 360, active: false }],
    exit: { x: 2080, y: 240, w: 46, h: 80 },
  };
}

function createLevel2() {
  return {
    id: 2,
    name: 'LEVEL 2: TRUST ISSUES',
    width: 2600,
    height: 540,
    spawn: { x: 80, y: 380 },
    platforms: [
      // Starting platform
      { x: 0, y: 440, w: 320, h: 100, type: 'solid' },
      // Hazard pit
      { x: 320, y: 500, w: 300, h: 40, type: 'hazard' },
      // Island into inversion zone
      { x: 580, y: 430, w: 180, h: 110, type: 'solid' },
      // Stepping stones in inversion field
      { x: 820, y: 390, w: 100, h: 24, type: 'solid' },
      { x: 1000, y: 360, w: 110, h: 24, type: 'solid' },
      // Mid checkpoint floor
      { x: 1200, y: 420, w: 220, h: 120, type: 'solid' },
      // Deep pit
      { x: 1420, y: 500, w: 460, h: 40, type: 'hazard' },
      // Wobbling crumbly platform 1
      {
        x: 1460,
        y: 380,
        w: 90,
        h: 24,
        type: 'wobble',
        wobbleTimer: 0,
        falling: false,
        vy: 0,
        originY: 380,
      },
      // Wobbling crumbly platform 2
      {
        x: 1620,
        y: 360,
        w: 90,
        h: 24,
        type: 'wobble',
        wobbleTimer: 0,
        falling: false,
        vy: 0,
        originY: 360,
      },
      // Safe platform
      { x: 1800, y: 420, w: 180, h: 120, type: 'solid' },
      // Fake exit platform
      { x: 2040, y: 380, w: 180, h: 160, type: 'solid' },
      // Real secret trapdoor exit floor below!
      { x: 2280, y: 460, w: 280, h: 80, type: 'solid' },
    ],
    movingPlatforms: [
      // Moving vertical platform
      {
        x: 380,
        y: 380,
        w: 90,
        h: 20,
        startY: 320,
        endY: 420,
        speed: 60,
        dir: 1,
        axis: 'y',
        type: 'moving',
      },
      // Moving horizontal platform across inversion area
      {
        x: 1040,
        y: 280,
        w: 100,
        h: 20,
        startX: 980,
        endX: 1180,
        speed: 75,
        dir: 1,
        axis: 'x',
        type: 'moving',
      },
    ],
    inversionZones: [
      // Trigger zone that inverts controls!
      { x: 740, w: 700 },
    ],
    signs: [
      {
        x: 620,
        y: 380,
        text: '⚠️ WARNING: BRAIN INVERSION SECTOR AHEAD! LEFT IS RIGHT.',
        id: 'sign_invert',
      },
      {
        x: 1240,
        y: 370,
        text: 'Wobbly platforms have feelings too. Step lightly.',
        id: 'sign_wobble',
      },
      {
        x: 2060,
        y: 330,
        text: 'DEFINITELY THE REAL EXIT. TOTALLY NOT A TRAP.',
        id: 'sign_fake_door',
      },
    ],
    coins: [
      { x: 420, y: 280, collected: false },
      { x: 920, y: 320, collected: false },
      { x: 1500, y: 310, collected: false },
      // Decoy Super Shiny Diamond!
      { x: 1100, y: 200, collected: false, isDecoy: true },
    ],
    checkpoints: [{ x: 1280, y: 370, active: false }],
    fakeExit: { x: 2120, y: 300, w: 46, h: 80, triggered: false },
    realExit: { x: 2420, y: 380, w: 46, h: 80, revealed: false },
  };
}

function createLevel3() {
  return {
    id: 3,
    name: 'LEVEL 3: THE FINAL BUG',
    width: 1400,
    height: 540,
    spawn: { x: 100, y: 400 },
    platforms: [
      // Main arena floor
      { x: 0, y: 470, w: 1400, h: 70, type: 'solid' },
      // Left high tier
      { x: 80, y: 340, w: 200, h: 24, type: 'solid' },
      // Right high tier
      { x: 1120, y: 340, w: 200, h: 24, type: 'solid' },
      // Center middle bridge
      { x: 500, y: 370, w: 400, h: 24, type: 'solid' },
      // Upper middle platform (closer to boss)
      { x: 580, y: 250, w: 240, h: 24, type: 'solid' },
      // Secret maintenance ledge far upper right!
      { x: 1240, y: 180, w: 140, h: 24, type: 'solid' },
    ],
    movingPlatforms: [
      {
        x: 320,
        y: 400,
        w: 90,
        h: 20,
        startY: 320,
        endY: 430,
        speed: 65,
        dir: 1,
        axis: 'y',
        type: 'moving',
      },
      {
        x: 960,
        y: 350,
        w: 90,
        h: 20,
        startY: 280,
        endY: 410,
        speed: 65,
        dir: -1,
        axis: 'y',
        type: 'moving',
      },
    ],
    switches: [
      // Phase 1 switch: "KILL PROCESS"
      {
        id: 'switch_p1',
        x: 670,
        y: 226,
        w: 60,
        h: 24,
        phase: 1,
        label: 'KILL PROCESS',
        pressed: false,
      },
      // Phase 2 switches: "SERVER A" and "SERVER B"
      {
        id: 'switch_p2_a',
        x: 140,
        y: 316,
        w: 60,
        h: 24,
        phase: 2,
        label: 'SERVER A',
        pressed: false,
      },
      {
        id: 'switch_p2_b',
        x: 1180,
        y: 316,
        w: 60,
        h: 24,
        phase: 2,
        label: 'SERVER B',
        pressed: false,
      },
      // Phase 3 switch: "CANCEL UPDATE"
      {
        id: 'switch_p3',
        x: 660,
        y: 346,
        w: 80,
        h: 24,
        phase: 3,
        label: 'CANCEL UPDATE',
        pressed: false,
      },
    ],
    secretHatch: {
      x: 1300,
      y: 110,
      w: 60,
      h: 70,
      label: 'DEBUG HATCH',
      activated: false,
      interactCount: 0,
    },
    signs: [
      {
        x: 80,
        y: 420,
        text: 'BOSS ARENA: Stomp the glowing switches to crash BUGGY!',
        id: 'sign_boss',
      },
    ],
    coins: [
      { x: 180, y: 290, collected: false },
      { x: 1220, y: 290, collected: false },
    ],
    checkpoints: [{ x: 100, y: 420, active: false }],
  };
}

// ============================================================================
// 8. GAME NARRATOR & ROAST QUOTES
// ============================================================================

const NARRATOR_QUOTES = {
  welcome: [
    'Welcome! This game is 100% bug-free. Please do not examine that statement.',
    'Our QA department consisted of a single russet potato.',
    'Congratulations on pressing Start! That was the easiest part.',
  ],
  standStill: [
    'Are you thinking, or did you freeze like my last software update?',
    'Standing still is a valid life choice, but a terrible speedrun strategy.',
    'The hero has entered contemplative meditation.',
  ],
  death: [
    'Congratulations! You have successfully moved in the wrong direction.',
    'That jump was technically a jump. We checked with physics.',
    'Cause of death: Stepped on a red polygon with bad intentions.',
    'Physics.exe has encountered an unexpected user.',
    'Have you considered jumping OVER the spikes instead of into them?',
    'The toaster that wrote the tutorial sends its heartfelt regards.',
  ],
  inversion: [
    'Oops! My cat stepped on the invert axis setting!',
    'Brain Inversion Active! Good luck remembering which way is left.',
    'Controls inverted! It is not a bug, it is a character building exercise!',
  ],
  spaceFly: [
    'Wait... did you honestly believe pressing SPACE would make you fly?!',
    'Haha! You fell for the oldest floating wooden sign in the book!',
  ],
  decoyCoin: [
    'Mwahahaha! You risked your digital life for a fake coin that does nothing!',
    'Achievement not unlocked: Gullible Collector.',
  ],
  fakeExit: [
    'SURPRISE! Did you really think the exit was right there?! NOPE!',
    'That exit was certified organic decoy. The real one is below!',
  ],
  bossDamage: [
    'OUCH! Hey, that switch was not covered under manufacturer warranty!',
    'System warning: Unauthorized blunt-force trauma detected!',
  ],
};

// ============================================================================
// 9. MAIN GAME ENGINE
// ============================================================================

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.confettiCanvas = document.getElementById('confetti-canvas');
    this.confetti = new ConfettiCannon(this.confettiCanvas);

    this.sound = new SoundManager();
    this.storage = new StorageManager();
    this.particles = new ParticleEngine();

    // Hook ScreenShakeManager into the game loop
    this.screenShake = ScreenShakeManager({
      defaultIntensity: 18,
      decayRate: 0.86,
      enabled: this.storage.data.settings.shake !== false,
    });
    this.particles.onExplosion = (intensity, decay) => {
      this.screenShake.trigger(intensity, decay);
    };

    // Virtual resolution
    this.width = 960;
    this.height = 540;

    // Camera
    this.cameraX = 0;
    this.cameraY = 0;

    // State machine: 'menu', 'warning', 'playing', 'paused', 'death', 'level_complete', 'victory', 'secret_ending'
    this.state = 'menu';
    this.currentLevelIndex = 1;
    this.level = null;
    this.player = new Player(100, 380);
    this.boss = null;

    // Mechanics & Timers
    this.isInverted = false;
    this.inversionTimer = 0;
    this.idleTimer = 0;
    this.lastFrameTime = performance.now();
    this.currentCheckpoint = null;
    this.coinsCollected = 0;
    this.levelFailures = 0;

    // Input state
    this.input = {
      left: false,
      right: false,
      jumpHold: false,
      jumpPressed: false,
      actionPressed: false,
    };

    // UI elements
    this.initUI();
    this.bindEvents();
    this.loadSettings();

    // Start render loop
    requestAnimationFrame((t) => this.loop(t));
  }

  // --------------------------------------------------------------------------
  // UI & DIALOGUE HELPERS
  // --------------------------------------------------------------------------

  initUI() {
    this.hudLevelText = document.getElementById('hud-level-text');
    this.hudDeathCount = document.getElementById('hud-death-count');
    this.hudCoinsCount = document.getElementById('hud-coins-count');
    this.hudScoreVal = document.getElementById('hud-score-val');
    this.inversionAlert = document.getElementById('inversion-alert');

    this.narratorBanner = document.getElementById('narrator-banner');
    this.narratorMsg = document.getElementById('narrator-msg');
    this.toast = document.getElementById('achievement-toast');
    this.toastTitle = document.getElementById('toast-title');
    this.toastDesc = document.getElementById('toast-desc');
    this.toastIcon = document.getElementById('toast-icon');

    // Modals
    this.modals = {
      menu: document.getElementById('modal-main-menu'),
      warning: document.getElementById('modal-warning'),
      how: document.getElementById('modal-how-to-play'),
      settings: document.getElementById('modal-settings'),
      achievements: document.getElementById('modal-achievements'),
      credits: document.getElementById('modal-credits'),
      pause: document.getElementById('modal-pause'),
      death: document.getElementById('modal-death'),
      levelComplete: document.getElementById('modal-level-complete'),
      victory: document.getElementById('modal-victory'),
      secretEnding: document.getElementById('modal-secret-ending'),
    };
  }

  showModal(name) {
    Object.keys(this.modals).forEach((key) => {
      if (this.modals[key]) {
        if (key === name) {
          this.modals[key].classList.remove('hidden');
        } else {
          this.modals[key].classList.add('hidden');
        }
      }
    });
  }

  hideAllModals() {
    Object.values(this.modals).forEach((m) => m && m.classList.add('hidden'));
  }

  say(text, duration = 4.5) {
    if (!this.narratorBanner || !this.narratorMsg) return;
    this.narratorMsg.textContent = `"${text}"`;
    this.narratorBanner.classList.remove('hidden');
    clearTimeout(this.narratorTimeout);
    this.narratorTimeout = setTimeout(() => {
      this.narratorBanner.classList.add('hidden');
    }, duration * 1000);
  }

  showAchievementToast(meta) {
    if (!this.toast) return;
    this.sound.victory();
    this.toastTitle.textContent = meta.title;
    this.toastDesc.textContent = meta.desc;
    this.toastIcon.textContent = meta.icon;
    this.toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toast.classList.remove('show');
    }, 4500);
  }

  updateHUD() {
    if (this.hudDeathCount) this.hudDeathCount.textContent = this.storage.data.deaths;
    if (this.hudCoinsCount) this.hudCoinsCount.textContent = this.coinsCollected;
    if (this.hudScoreVal) this.hudScoreVal.textContent = `$${this.storage.data.score}.00`;
    if (this.level && this.hudLevelText) this.hudLevelText.textContent = this.level.name;
  }

  // --------------------------------------------------------------------------
  // INPUT & CONTROLS BINDING
  // --------------------------------------------------------------------------

  bindEvents() {
    // Keyboard events with default scrolling prevention
    window.addEventListener('keydown', (e) => {
      this.sound.init();

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.input.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.input.right = true;

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (!this.input.jumpHold) {
          this.input.jumpPressed = true;
        }
        this.input.jumpHold = true;
      }

      if (e.code === 'KeyE') {
        this.input.actionPressed = true;
      }

      if (e.code === 'KeyR') {
        if (this.state === 'playing' || this.state === 'death') {
          this.restartCurrentLevel();
        }
      }

      if (e.code === 'Escape') {
        if (this.state === 'playing') this.pauseGame();
        else if (this.state === 'paused') this.resumeGame();
      }

      if (e.code === 'KeyM') {
        this.toggleSound();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.input.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.input.right = false;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.input.jumpHold = false;
      }
    });

    // Haptic feedback helper for mobile
    this.haptic = (duration = 25) => {
      if (this.storage.data.settings.haptics && 'vibrate' in navigator) {
        try {
          navigator.vibrate(duration);
        } catch (_) {}
      }
    };

    // Touch button events with haptic feedback
    const bindTouchBtn = (id, onDown, onUp, hapticMs = 20) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const down = (e) => {
        e.preventDefault();
        this.sound.init();
        this.haptic(hapticMs);
        btn.classList.add('pressed');
        onDown();
      };
      const up = (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
        onUp();
      };
      btn.addEventListener('touchstart', down, { passive: false });
      btn.addEventListener('touchend', up, { passive: false });
      btn.addEventListener('mousedown', down);
      btn.addEventListener('mouseup', up);
      btn.addEventListener('mouseleave', up);
    };

    bindTouchBtn('touch-left', () => (this.input.left = true), () => (this.input.left = false), 15);
    bindTouchBtn('touch-right', () => (this.input.right = true), () => (this.input.right = false), 15);
    bindTouchBtn('touch-jump', () => {
      this.input.jumpPressed = true;
      this.input.jumpHold = true;
    }, () => (this.input.jumpHold = false), 35);
    bindTouchBtn('touch-action', () => (this.input.actionPressed = true), () => {}, 25);
    bindTouchBtn('touch-restart', () => {
      if (this.state === 'playing' || this.state === 'death') {
        this.restartCurrentLevel();
      }
    }, () => {}, 40);

    // Platform Tab switching inside "How to Play"
    const tabLap = document.getElementById('tab-controls-lap');
    const tabMob = document.getElementById('tab-controls-mob');
    const panelLap = document.getElementById('controls-panel-lap');
    const panelMob = document.getElementById('controls-panel-mob');

    tabLap?.addEventListener('click', () => {
      this.sound.buttonClick();
      tabLap.classList.add('active');
      tabMob?.classList.remove('active');
      tabLap.setAttribute('aria-selected', 'true');
      tabMob?.setAttribute('aria-selected', 'false');
      panelLap?.classList.remove('hidden');
      panelMob?.classList.add('hidden');
    });

    tabMob?.addEventListener('click', () => {
      this.sound.buttonClick();
      tabMob.classList.add('active');
      tabLap?.classList.remove('active');
      tabMob.setAttribute('aria-selected', 'true');
      tabLap?.setAttribute('aria-selected', 'false');
      panelMob?.classList.remove('hidden');
      panelLap?.classList.add('hidden');
    });

    // Menu button listeners
    document.getElementById('btn-menu-play')?.addEventListener('click', () => {
      this.sound.init();
      this.sound.buttonClick();
      this.showModal('warning');
    });

    document.getElementById('btn-warning-accept')?.addEventListener('click', () => {
      this.sound.buttonClick();
      this.startGame(1);
    });

    document.getElementById('btn-menu-how')?.addEventListener('click', () => {
      this.sound.buttonClick();
      this.showModal('how');
    });

    document.getElementById('btn-how-back')?.addEventListener('click', () => {
      this.sound.buttonClick();
      this.showModal('menu');
    });

    document.getElementById('btn-menu-settings')?.addEventListener('click', () => {
      this.sound.buttonClick();
      this.showModal('settings');
    });

    document.getElementById('btn-settings-save')?.addEventListener('click', () => {
      this.sound.buttonClick();
      this.saveSettingsFromUI();
      if (this.state === 'paused') {
        this.showModal('pause');
      } else {
        this.showModal('menu');
      }
    });

    document.getElementById('btn-settings-reset')?.addEventListener('click', () => {
      if (confirm('Delete all your precious failures and start anew?')) {
        this.storage.reset();
        this.loadSettings();
        this.updateHUD();
        alert('Reset complete. Your suffering is refreshed.');
      }
    });

    document.getElementById('btn-menu-achievements')?.addEventListener('click', () => {
      this.sound.buttonClick();
      this.renderAchievementsUI();
      this.showModal('achievements');
    });

    document.getElementById('btn-achievements-back')?.addEventListener('click', () => {
      this.sound.buttonClick();
      this.showModal('menu');
    });

    document.getElementById('btn-menu-credits')?.addEventListener('click', () => {
      this.sound.buttonClick();
      this.showModal('credits');
    });

    document.getElementById('btn-credits-back')?.addEventListener('click', () => {
      this.sound.buttonClick();
      this.showModal('menu');
    });

    // Pause listeners
    document.getElementById('btn-pause-toggle')?.addEventListener('click', () => {
      if (this.state === 'playing') this.pauseGame();
      else if (this.state === 'paused') this.resumeGame();
    });

    document.getElementById('btn-pause-resume')?.addEventListener('click', () => {
      this.resumeGame();
    });

    document.getElementById('btn-pause-restart')?.addEventListener('click', () => {
      this.restartCurrentLevel();
    });

    document.getElementById('btn-pause-settings')?.addEventListener('click', () => {
      this.showModal('settings');
    });

    document.getElementById('btn-pause-menu')?.addEventListener('click', () => {
      this.returnToMenu();
    });

    // Death listeners
    document.getElementById('btn-death-retry')?.addEventListener('click', () => {
      this.respawnPlayer();
    });

    document.getElementById('btn-death-menu')?.addEventListener('click', () => {
      this.returnToMenu();
    });

    // Level Complete listeners
    document.getElementById('btn-next-level')?.addEventListener('click', () => {
      this.startGame(this.currentLevelIndex + 1);
    });

    // Victory listeners
    document.getElementById('btn-victory-replay')?.addEventListener('click', () => {
      this.confetti.stop();
      this.startGame(1);
    });

    document.getElementById('btn-victory-achievements')?.addEventListener('click', () => {
      this.confetti.stop();
      this.renderAchievementsUI();
      this.showModal('achievements');
    });

    document.getElementById('btn-victory-menu')?.addEventListener('click', () => {
      this.confetti.stop();
      this.returnToMenu();
    });

    // Secret ending listeners
    document.getElementById('btn-secret-menu')?.addEventListener('click', () => {
      this.returnToMenu();
    });

    // Sound toggle on HUD
    document.getElementById('btn-sound-toggle')?.addEventListener('click', () => {
      this.toggleSound();
    });

    // Touch controls toggle on HUD (quick mobile/laptop switch)
    document.getElementById('btn-touch-toggle')?.addEventListener('click', () => {
      this.toggleTouchControls();
    });

    // Fullscreen toggle on HUD
    document.getElementById('btn-fullscreen-toggle')?.addEventListener('click', () => {
      this.toggleFullscreen();
    });
  }

  // --------------------------------------------------------------------------
  // SETTINGS & STORAGE
  // --------------------------------------------------------------------------

  loadSettings() {
    const s = this.storage.data.settings;
    this.sound.enabled = s.sound;
    this.sound.volume = s.volume / 100;

    const soundInput = document.getElementById('setting-sound');
    const volInput = document.getElementById('setting-volume');
    const shakeInput = document.getElementById('setting-shake');
    const diffInput = document.getElementById('setting-difficulty');
    const touchInput = document.getElementById('setting-touch');
    const touchSizeInput = document.getElementById('setting-touch-size');
    const hapticsInput = document.getElementById('setting-haptics');

    if (soundInput) soundInput.checked = s.sound;
    if (volInput) volInput.value = s.volume;
    if (shakeInput) shakeInput.checked = s.shake;
    if (diffInput) diffInput.value = s.difficulty;
    if (touchInput) touchInput.checked = s.touch;
    if (touchSizeInput && s.touchSize) touchSizeInput.value = s.touchSize;
    if (hapticsInput && typeof s.haptics !== 'undefined') hapticsInput.checked = s.haptics;
    if (this.screenShake) this.screenShake.setEnabled(s.shake);

    this.applyTouchSettings();

    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) soundBtn.textContent = s.sound ? '🔊' : '🔇';
  }

  saveSettingsFromUI() {
    const soundInput = document.getElementById('setting-sound');
    const volInput = document.getElementById('setting-volume');
    const shakeInput = document.getElementById('setting-shake');
    const diffInput = document.getElementById('setting-difficulty');
    const touchInput = document.getElementById('setting-touch');
    const touchSizeInput = document.getElementById('setting-touch-size');
    const hapticsInput = document.getElementById('setting-haptics');

    const s = this.storage.data.settings;
    s.sound = soundInput ? soundInput.checked : true;
    s.volume = volInput ? parseInt(volInput.value, 10) : 70;
    s.shake = shakeInput ? shakeInput.checked : true;
    s.difficulty = diffInput ? diffInput.value : 'normal';
    s.touch = touchInput ? touchInput.checked : false;
    s.touchSize = touchSizeInput ? touchSizeInput.value : 'normal';
    s.haptics = hapticsInput ? hapticsInput.checked : true;

    this.sound.enabled = s.sound;
    this.sound.volume = s.volume / 100;
    if (this.screenShake) this.screenShake.setEnabled(s.shake);

    this.applyTouchSettings();

    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) soundBtn.textContent = s.sound ? '🔊' : '🔇';

    this.storage.save();
  }

  applyTouchSettings() {
    const s = this.storage.data.settings;
    const touchControls = document.getElementById('touch-controls');
    const touchBtn = document.getElementById('btn-touch-toggle');

    if (touchControls) {
      if (s.touch) {
        touchControls.classList.add('active');
      } else {
        touchControls.classList.remove('active');
      }

      touchControls.classList.remove('touch-size-compact', 'touch-size-large');
      if (s.touchSize === 'compact') touchControls.classList.add('touch-size-compact');
      if (s.touchSize === 'large') touchControls.classList.add('touch-size-large');
    }

    if (touchBtn) {
      touchBtn.style.opacity = s.touch ? '1' : '0.6';
      touchBtn.title = s.touch ? 'Disable Touch Controls' : 'Enable Touch Controls';
    }
  }

  toggleTouchControls() {
    const s = this.storage.data.settings;
    s.touch = !s.touch;
    this.storage.save();
    this.applyTouchSettings();
    const touchInput = document.getElementById('setting-touch');
    if (touchInput) touchInput.checked = s.touch;
    this.haptic(30);
    this.sound.buttonClick();
  }

  toggleFullscreen() {
    this.sound.buttonClick();
    this.haptic(30);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  toggleSound() {
    this.sound.init();
    this.sound.enabled = !this.sound.enabled;
    this.storage.data.settings.sound = this.sound.enabled;
    this.storage.save();
    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) soundBtn.textContent = this.sound.enabled ? '🔊' : '🔇';
    const soundInput = document.getElementById('setting-sound');
    if (soundInput) soundInput.checked = this.sound.enabled;
  }

  renderAchievementsUI() {
    const container = document.getElementById('achievements-container');
    if (!container) return;
    container.innerHTML = '';

    ACHIEVEMENTS_DATA.forEach((ach) => {
      const isUnlocked = !!this.storage.data.achievements[ach.id];
      const card = document.createElement('div');
      card.className = `achievement-card ${isUnlocked ? 'unlocked' : ''}`;
      card.innerHTML = `
        <div class="achievement-icon">${isUnlocked ? ach.icon : '🔒'}</div>
        <div class="achievement-info">
          <h4>${ach.title} ${isUnlocked ? '✓' : ''}</h4>
          <p>${isUnlocked ? ach.desc : 'Condition currently shrouded in mystery & incompetence.'}</p>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // --------------------------------------------------------------------------
  // GAMEPLAY STATE MACHINE
  // --------------------------------------------------------------------------

  startGame(levelIndex) {
    this.sound.init();
    this.currentLevelIndex = levelIndex;
    this.state = 'playing';
    this.hideAllModals();

    if (levelIndex === 1) {
      this.level = createLevel1();
    } else if (levelIndex === 2) {
      this.level = createLevel2();
    } else if (levelIndex === 3) {
      this.level = createLevel3();
      this.boss = new BossBuggy(640, 150);
    }

    this.currentCheckpoint = null;
    this.player.respawn(this.level.spawn.x, this.level.spawn.y);
    this.isInverted = false;
    this.inversionTimer = 0;
    this.updateInversionUI();
    this.updateHUD();

    // Opening sarcastic line
    if (levelIndex === 1) {
      this.say('Welcome to Level 1! The tutorial signs are written by a toaster. Good luck!');
    } else if (levelIndex === 2) {
      this.say('Level 2: Trust Issues! Spoiler: Do not trust anything that smiles at you.');
    } else if (levelIndex === 3) {
      this.say('Level 3: It is me, BUGGY! I am the final boss! Prepare for mandatory updates!');
    }
  }

  pauseGame() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.showModal('pause');
  }

  resumeGame() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.hideAllModals();
    this.lastFrameTime = performance.now();
  }

  returnToMenu() {
    this.state = 'menu';
    this.showModal('menu');
    this.confetti.stop();
  }

  killPlayer(reason = 'Stepped on a red polygon of death.') {
    if (this.player.isDead) return;
    this.player.isDead = true;
    this.haptic(75);
    this.sound.playTakeDamage();
    this.particles.emitExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 20);

    this.shakeIntensity = 18;
    this.storage.data.deaths++;
    this.levelFailures++;
    this.storage.data.score -= 50; // Absurd failure score
    this.storage.save();
    this.updateHUD();

    // Achievements check
    this.storage.unlockAchievement('first_death', (m) => this.showAchievementToast(m));
    if (this.storage.data.deaths >= 10) {
      this.storage.unlockAchievement('floor_inspector', (m) => this.showAchievementToast(m));
    }

    // Show death modal
    setTimeout(() => {
      const reasonEl = document.getElementById('death-reason');
      const bonusScoreEl = document.getElementById('death-score-bonus');
      if (reasonEl) reasonEl.textContent = `"${reason}"`;
      if (bonusScoreEl) bonusScoreEl.textContent = `-$${Math.abs(this.storage.data.score)}.00`;

      this.state = 'death';
      this.showModal('death');
    }, 450);
  }

  respawnPlayer() {
    this.hideAllModals();
    this.state = 'playing';
    this.lastFrameTime = performance.now();
    const spawnX = this.currentCheckpoint ? this.currentCheckpoint.x : this.level.spawn.x;
    const spawnY = this.currentCheckpoint ? this.currentCheckpoint.y : this.level.spawn.y;
    this.player.respawn(spawnX, spawnY);
    this.isInverted = false;
    this.updateInversionUI();
  }

  restartCurrentLevel() {
    this.storage.data.restarts++;
    this.storage.save();
    if (this.storage.data.restarts >= 5) {
      this.storage.unlockAchievement('persistent_potato', (m) => this.showAchievementToast(m));
    }
    this.startGame(this.currentLevelIndex);
  }

  completeLevel() {
    this.sound.playLevelComplete();
    this.state = 'level_complete';
    this.confetti.start(50);

    const quoteEl = document.getElementById('level-complete-quote');
    if (quoteEl) {
      quoteEl.textContent =
        this.currentLevelIndex === 1
          ? '"Level 1 passed? Wow, our QA potato was wrong about you."'
          : '"Level 2 completed?! You survived the boxing glove exit!"';
    }

    this.showModal('levelComplete');
    setTimeout(() => this.confetti.stop(), 3000);
  }

  triggerVictory() {
    this.sound.victory();
    this.state = 'victory';
    this.confetti.start(120);

    this.storage.unlockAchievement('bug_exterminator', (m) => this.showAchievementToast(m));

    const statDeaths = document.getElementById('victory-stat-deaths');
    const statCoins = document.getElementById('victory-stat-coins');
    if (statDeaths) statDeaths.textContent = this.storage.data.deaths;
    if (statCoins) statCoins.textContent = this.coinsCollected;

    this.showModal('victory');
  }

  triggerSecretEnding() {
    this.sound.secret();
    this.state = 'secret_ending';

    this.storage.unlockAchievement('qa_engineer', (m) => this.showAchievementToast(m));
    this.showModal('secretEnding');
  }

  updateInversionUI() {
    if (this.inversionAlert) {
      if (this.isInverted) {
        this.inversionAlert.classList.add('active');
      } else {
        this.inversionAlert.classList.remove('active');
      }
    }
  }

  // --------------------------------------------------------------------------
  // PHYSICS & COLLISION DETECTION
  // --------------------------------------------------------------------------

  updatePhysics(dt) {
    if (this.player.isDead || !this.level) return;

    // Apply player movement
    this.player.update(dt, this.input, this.isInverted, this.sound, this.particles);

    // Idle timer for satirical narrator
    if (Math.abs(this.player.vx) < 1 && this.player.grounded) {
      this.idleTimer += dt;
      if (this.idleTimer > 8.0) {
        this.idleTimer = 0;
        const quotes = NARRATOR_QUOTES.standStill;
        this.say(quotes[Math.floor(Math.random() * quotes.length)], 3.5);
      }
    } else {
      this.idleTimer = 0;
    }

    // Check Inversion Zones (Level 2)
    if (this.level.inversionZones) {
      const inZone = this.level.inversionZones.some(
        (z) => this.player.x >= z.x && this.player.x <= z.x + z.w
      );
      if (inZone && !this.isInverted) {
        this.isInverted = true;
        this.sound.inversion();
        this.updateInversionUI();
        this.storage.unlockAchievement('trust_issues', (m) => this.showAchievementToast(m));
        this.say(NARRATOR_QUOTES.inversion[Math.floor(Math.random() * NARRATOR_QUOTES.inversion.length)], 4.0);
      } else if (!inZone && this.isInverted) {
        this.isInverted = false;
        this.updateInversionUI();
      }
    }

    // Update Moving Platforms
    if (this.level.movingPlatforms) {
      for (const mp of this.level.movingPlatforms) {
        if (mp.axis === 'y') {
          mp.y += mp.speed * mp.dir * dt;
          if (mp.y >= mp.endY) {
            mp.y = mp.endY;
            mp.dir = -1;
          } else if (mp.y <= mp.startY) {
            mp.y = mp.startY;
            mp.dir = 1;
          }
        } else {
          mp.x += mp.speed * mp.dir * dt;
          if (mp.x >= mp.endX) {
            mp.x = mp.endX;
            mp.dir = -1;
          } else if (mp.x <= mp.startX) {
            mp.x = mp.startX;
            mp.dir = 1;
          }
        }
      }
    }

    // Update Disappearing Platforms (Level 1)
    if (this.level.platforms) {
      for (const p of this.level.platforms) {
        if (p.type === 'disappearing') {
          if (p.hidden) {
            p.cooldown -= dt;
            if (p.cooldown <= 0) {
              p.hidden = false;
              p.timer = p.maxTimer;
              this.particles.emitSparkles(p.x + p.w / 2, p.y + p.h / 2, 6, '#00f0ff');
            }
          } else {
            p.timer -= dt;
            if (p.timer <= 0) {
              p.hidden = true;
              p.cooldown = 2.0;
              this.sound.buttonClick();
              this.particles.emitDust(p.x + p.w / 2, p.y + p.h / 2, 8);
            }
          }
        } else if (p.type === 'wobble') {
          // Crumbly wobbling platform (Level 2)
          if (p.falling) {
            p.vy += 800 * dt;
            p.y += p.vy * dt;
          } else if (p.wobbleTimer > 0) {
            p.wobbleTimer -= dt;
            p.y = p.originY + (Math.random() - 0.5) * 4;
            if (p.wobbleTimer <= 0) {
              p.falling = true;
              this.particles.emitDust(p.x + p.w / 2, p.y + p.h, 6);
            }
          }
        }
      }
    }

    // ------------------------------------------------------------------------
    // HORIZONTAL COLLISION RESOLUTION
    // ------------------------------------------------------------------------
    this.player.x += this.player.vx * dt;

    // Check bounds
    if (this.player.x < 0) {
      this.player.x = 0;
      this.player.vx = 0;
    } else if (this.player.x + this.player.width > this.level.width) {
      this.player.x = this.level.width - this.player.width;
      this.player.vx = 0;
    }

    // Collide with solid platforms on X
    for (const p of this.level.platforms) {
      if (p.hidden) continue;
      if (p.type === 'solid' || p.type === 'disappearing' || (p.type === 'wobble' && !p.falling)) {
        if (this.checkAABB(this.player, p)) {
          if (this.player.vx > 0) {
            this.player.x = p.x - this.player.width;
          } else if (this.player.vx < 0) {
            this.player.x = p.x + p.w;
          }
          this.player.vx = 0;
        }
      }
    }

    // ------------------------------------------------------------------------
    // VERTICAL COLLISION RESOLUTION
    // ------------------------------------------------------------------------
    this.player.y += this.player.vy * dt;
    this.player.grounded = false;

    // Solid platform vertical collisions
    for (const p of this.level.platforms) {
      if (p.hidden) continue;

      if (p.type === 'hazard') {
        if (this.checkAABB(this.player, p)) {
          this.killPlayer('Tasted sharp triangular pixels.');
          return;
        }
      } else if (p.type === 'solid' || p.type === 'disappearing' || (p.type === 'wobble' && !p.falling)) {
        if (this.checkAABB(this.player, p)) {
          if (this.player.vy > 0) {
            this.player.y = p.y - this.player.height;
            this.player.vy = 0;
            this.player.grounded = true;

            // Trigger wobble platform countdown
            if (p.type === 'wobble' && p.wobbleTimer === 0 && !p.falling) {
              p.wobbleTimer = 1.0;
            }
          } else if (this.player.vy < 0) {
            this.player.y = p.y + p.h;
            this.player.vy = 0;
          }
        }
      }
    }

    // Moving platform collisions (one-way standing)
    if (this.level.movingPlatforms) {
      for (const mp of this.level.movingPlatforms) {
        if (
          this.player.vy >= 0 &&
          this.player.y + this.player.height >= mp.y &&
          this.player.y + this.player.height <= mp.y + 16 &&
          this.player.x + this.player.width > mp.x &&
          this.player.x < mp.x + mp.w
        ) {
          this.player.y = mp.y - this.player.height;
          this.player.vy = 0;
          this.player.grounded = true;

          // Drag player with moving platform
          if (mp.axis !== 'y') {
            this.player.x += mp.speed * mp.dir * dt;
          }
        }
      }
    }

    // Fall into bottom void
    if (this.player.y > this.level.height + 50) {
      this.killPlayer('Fell into the infinite void of unrendered code.');
      return;
    }

    // ------------------------------------------------------------------------
    // INTERACTIVE OBJECTS: COINS, CHECKPOINTS, SIGNS, EXITS
    // ------------------------------------------------------------------------

    // Comedy Coins
    if (this.level.coins) {
      for (const coin of this.level.coins) {
        if (!coin.collected && this.checkAABB(this.player, { x: coin.x - 12, y: coin.y - 12, w: 24, h: 24 })) {
          coin.collected = true;
          this.haptic(20);
          this.sound.playCollectCoin();
          this.particles.emitSparkles(coin.x, coin.y, 8, '#ffe600');

          if (coin.isDecoy) {
            this.say(NARRATOR_QUOTES.decoyCoin[0], 4.5);
          } else {
            this.coinsCollected++;
            this.storage.data.coins++;
            this.storage.save();
            this.updateHUD();
            if (this.coinsCollected >= 5) {
              this.storage.unlockAchievement('shiny_trash', (m) => this.showAchievementToast(m));
            }
          }
        }
      }
    }

    // Checkpoints
    if (this.level.checkpoints) {
      for (const cp of this.level.checkpoints) {
        if (!cp.active && this.checkAABB(this.player, { x: cp.x - 16, y: cp.y - 30, w: 32, h: 40 })) {
          cp.active = true;
          this.currentCheckpoint = cp;
          this.haptic(35);
          this.sound.checkpoint();
          this.particles.emitSparkles(cp.x, cp.y - 15, 12, '#00ff88');
          this.say('Checkpoint saved! Now you can suffer at this exact spot repeatedly.');
        }
      }
    }

    // Signs Interaction
    if (this.level.signs) {
      for (const sign of this.level.signs) {
        const dist = Math.abs(this.player.x - sign.x);
        if (dist < 45 && !sign.read) {
          sign.read = true;
          this.say(sign.text, 4.0);

          if (sign.id === 'sign_space_fly') {
            // Space fly achievement test
            setTimeout(() => {
              if (this.input.jumpHold) {
                this.storage.unlockAchievement('fly_brick', (m) => this.showAchievementToast(m));
                this.say(NARRATOR_QUOTES.spaceFly[0], 4.0);
              }
            }, 600);
          }
        }
      }
    }

    // Level 1 Normal Exit
    if (this.level.exit) {
      if (this.checkAABB(this.player, this.level.exit)) {
        this.completeLevel();
        return;
      }
    }

    // Level 2 Fake Exit / Real Exit
    if (this.level.fakeExit) {
      const fe = this.level.fakeExit;
      if (!fe.triggered && this.checkAABB(this.player, fe)) {
        fe.triggered = true;
        this.sound.bossHit();
        this.particles.emitExplosion(fe.x + fe.w / 2, fe.y + fe.h / 2, 14);
        // Knockback hero
        this.player.vx = -450;
        this.player.vy = -300;
        this.shakeIntensity = 12;
        this.say(NARRATOR_QUOTES.fakeExit[0], 5.0);
        // Reveal real trapdoor exit below
        this.level.realExit.revealed = true;
      }
    }
    if (this.level.realExit && this.level.realExit.revealed) {
      if (this.checkAABB(this.player, this.level.realExit)) {
        this.completeLevel();
        return;
      }
    }

    // ------------------------------------------------------------------------
    // LEVEL 3 BOSS LOGIC & SWITCHES
    // ------------------------------------------------------------------------
    if (this.boss && this.level.id === 3) {
      this.boss.update(
        dt,
        this.player,
        (msg) => this.say(msg, 3.5),
        this.sound,
        this.particles
      );

      // Check boss projectile collisions with player
      for (const p of this.boss.projectiles) {
        if (this.checkAABB(this.player, { x: p.x - p.width / 2, y: p.y - p.height / 2, w: p.width, h: p.height })) {
          this.killPlayer('Hit by an unhandled Error 404 exception.');
          return;
        }
      }

      // Check anvil collisions with player
      for (const a of this.boss.anvils) {
        if (a.warning <= 0 && this.checkAABB(this.player, a)) {
          this.killPlayer('Crushed by a heavy Syntax Error.');
          return;
        }
      }

      // Boss Switches Stomp / Interaction
      if (this.level.switches) {
        for (const sw of this.level.switches) {
          if (!sw.pressed && sw.phase === this.boss.phase) {
            // Check stomp or E action
            const touching = this.checkAABB(this.player, sw);
            if (touching && (this.player.vy >= 0 || this.input.actionPressed)) {
              sw.pressed = true;
              this.sound.buttonClick();
              this.particles.emitSparkles(sw.x + sw.w / 2, sw.y + sw.h / 2, 12, '#00ff88');

              if (this.boss.phase === 1) {
                this.say('KILL PROCESS EXECUTED! Take that, BUGGY!', 3.5);
                this.boss.takeDamage(this.sound, this.particles);
                this.shakeIntensity = 15;
              } else if (this.boss.phase === 2) {
                // Check if both Phase 2 switches are pressed
                const swA = this.level.switches.find((s) => s.id === 'switch_p2_a');
                const swB = this.level.switches.find((s) => s.id === 'switch_p2_b');
                if (swA.pressed && swB.pressed) {
                  this.say('SERVERS CRASHED! BUGGY stability dropping fast!', 3.5);
                  this.boss.takeDamage(this.sound, this.particles);
                  this.shakeIntensity = 15;
                } else {
                  this.say('One server down! Stomp the other switch!', 3.0);
                }
              } else if (this.boss.phase === 3) {
                // Cancel update hits
                this.boss.updateCancelHits++;
                sw.pressed = false; // can press multiple times
                this.say(`CANCELLING UPDATE... [Hit ${this.boss.updateCancelHits}/3]`, 2.5);
                this.sound.bossHit();
                this.shakeIntensity = 8;
                if (this.boss.updateCancelHits >= 3) {
                  this.boss.takeDamage(this.sound, this.particles);
                  this.triggerVictory();
                  return;
                }
              }
            }
          }
        }
      }

      // Secret Hatch ("Exploit the Bug") Interaction
      if (this.level.secretHatch) {
        const hatch = this.level.secretHatch;
        if (this.checkAABB(this.player, hatch) && this.input.actionPressed) {
          hatch.interactCount++;
          this.sound.buttonClick();
          this.particles.emitSparkles(hatch.x + hatch.w / 2, hatch.y + hatch.h / 2, 8, '#00f0ff');
          this.say(`Tampering with Maintenance Hatch... (${hatch.interactCount}/3)`, 2.0);

          if (hatch.interactCount >= 3) {
            hatch.activated = true;
            this.triggerSecretEnding();
            return;
          }
        }
      }

      // Check Phase 3 timeout update complete
      if (this.boss.phase === 3 && this.boss.updateProgress >= 100) {
        this.killPlayer('Mandatory update installed. Your software license was revoked.');
      }
    }

    // Reset single-frame inputs
    this.input.jumpPressed = false;
    this.input.actionPressed = false;
  }

  checkAABB(r1, r2) {
    const r1w = r1.width || r1.w;
    const r1h = r1.height || r1.h;
    const r2w = r2.width || r2.w;
    const r2h = r2.height || r2.h;
    return (
      r1.x < r2.x + r2w &&
      r1.x + r1w > r2.x &&
      r1.y < r2.y + r2h &&
      r1.y + r1h > r2.y
    );
  }

  // --------------------------------------------------------------------------
  // CAMERA & RENDERING
  // --------------------------------------------------------------------------

  updateCamera() {
    if (!this.level) return;
    // Follow player smoothly
    const targetX = this.player.x + this.player.width / 2 - this.width / 2;
    this.cameraX += (targetX - this.cameraX) * 0.1;
    this.cameraX = Math.max(0, Math.min(this.level.width - this.width, this.cameraX));
  }

  drawBackground() {
    // Cartoon sky gradient with digital grid parallax
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#12162a');
    grad.addColorStop(1, '#1b223d');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Parallax background hills & clouds
    this.ctx.save();
    const px = this.cameraX * 0.25;

    // Distant digital circuit hills
    this.ctx.fillStyle = '#171c33';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.height);
    for (let x = 0; x <= this.width + 100; x += 60) {
      const y = this.height - 100 + Math.sin((x + px) * 0.01) * 40;
      this.ctx.lineTo(x, y);
    }
    this.ctx.lineTo(this.width, this.height);
    this.ctx.fill();

    // Floating cartoon glitch clouds
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 320 - px * 0.6) % (this.width + 200)) - 100;
      const cy = 60 + (i % 3) * 45;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      this.ctx.arc(cx + 25, cy - 8, 26, 0, Math.PI * 2);
      this.ctx.arc(cx + 50, cy, 30, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  drawWorld() {
    if (!this.level) return;

    this.ctx.save();
    // Apply canvas context translation transformation from ScreenShakeManager
    this.screenShake.apply(this.ctx);
    this.ctx.translate(-Math.round(this.cameraX), 0);

    // Draw Inversion Field Glow (Level 2)
    if (this.level.inversionZones) {
      for (const z of this.level.inversionZones) {
        this.ctx.fillStyle = 'rgba(255, 71, 126, 0.08)';
        this.ctx.fillRect(z.x, 0, z.w, this.level.height);

        // Warning scanlines
        this.ctx.strokeStyle = 'rgba(255, 193, 7, 0.25)';
        this.ctx.setLineDash([8, 8]);
        this.ctx.strokeRect(z.x, 0, z.w, this.level.height);
        this.ctx.setLineDash([]);
      }
    }

    // Platforms
    for (const p of this.level.platforms) {
      if (p.hidden) continue;

      if (p.type === 'hazard') {
        // Red spikes with cartoon malicious gleam
        const spikeW = 20;
        const count = Math.ceil(p.w / spikeW);
        this.ctx.fillStyle = '#ff2a6d';
        this.ctx.strokeStyle = '#220810';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < count; i++) {
          const sx = p.x + i * spikeW;
          this.ctx.beginPath();
          this.ctx.moveTo(sx, p.y + p.h);
          this.ctx.lineTo(sx + spikeW / 2, p.y);
          this.ctx.lineTo(sx + spikeW, p.y + p.h);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();

          // Tiny spike eye
          this.ctx.fillStyle = '#ffffff';
          this.ctx.beginPath();
          this.ctx.arc(sx + spikeW / 2, p.y + p.h - 6, 2, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.fillStyle = '#ff2a6d';
        }
      } else if (p.type === 'disappearing') {
        // Disappearing countdown platform
        this.ctx.fillStyle = '#2b365c';
        this.ctx.strokeStyle = '#00f0ff';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.roundRect(p.x, p.y, p.w, p.h, 6);
        this.ctx.fill();
        this.ctx.stroke();

        // Timer digit floating above
        this.ctx.fillStyle = '#ffe600';
        this.ctx.font = 'bold 12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${Math.max(0, p.timer).toFixed(1)}s`, p.x + p.w / 2, p.y - 6);
      } else if (p.type === 'wobble') {
        // Crumbly wobble platform
        this.ctx.fillStyle = p.wobbleTimer > 0 ? '#ff858d' : '#3f4b75';
        this.ctx.strokeStyle = '#222944';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.roundRect(p.x, p.y, p.w, p.h, 6);
        this.ctx.fill();
        this.ctx.stroke();
      } else {
        // Standard cartoon platform with colorful grass top
        this.ctx.fillStyle = '#222944';
        this.ctx.strokeStyle = '#15192b';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.roundRect(p.x, p.y, p.w, p.h, 6);
        this.ctx.fill();
        this.ctx.stroke();

        // Platform top cap
        this.ctx.fillStyle = '#00f0ff';
        this.ctx.fillRect(p.x + 1, p.y + 1, p.w - 2, 5);
      }
    }

    // Moving Platforms
    if (this.level.movingPlatforms) {
      for (const mp of this.level.movingPlatforms) {
        this.ctx.fillStyle = '#ff477e';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.roundRect(mp.x, mp.y, mp.w, mp.h, 6);
        this.ctx.fill();
        this.ctx.stroke();

        // Direction arrows
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 11px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('◄ ►', mp.x + mp.w / 2, mp.y + 14);
      }
    }

    // Signs
    if (this.level.signs) {
      for (const sign of this.level.signs) {
        // Post
        this.ctx.fillStyle = '#5c4033';
        this.ctx.fillRect(sign.x + 12, sign.y + 16, 6, 20);
        // Wooden Board
        this.ctx.fillStyle = '#c19a6b';
        this.ctx.strokeStyle = '#3e2723';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(sign.x, sign.y, 30, 20, 4);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#3e2723';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('?', sign.x + 15, sign.y + 15);
      }
    }

    // Checkpoints
    if (this.level.checkpoints) {
      for (const cp of this.level.checkpoints) {
        // Pole
        this.ctx.fillStyle = '#8892b0';
        this.ctx.fillRect(cp.x, cp.y - 36, 4, 36);

        // Flag
        this.ctx.fillStyle = cp.active ? '#00ff88' : '#ff477e';
        this.ctx.beginPath();
        this.ctx.moveTo(cp.x + 4, cp.y - 36);
        this.ctx.lineTo(cp.x + 24, cp.y - 26);
        this.ctx.lineTo(cp.x + 4, cp.y - 16);
        this.ctx.closePath();
        this.ctx.fill();

        // Smile on flag
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '10px sans-serif';
        this.ctx.fillText(cp.active ? '✓' : '!', cp.x + 10, cp.y - 23);
      }
    }

    // Comedy Coins
    if (this.level.coins) {
      for (const coin of this.level.coins) {
        if (!coin.collected) {
          this.ctx.save();
          this.ctx.translate(coin.x, coin.y);
          // Spinning disk animation
          const scaleX = Math.cos(performance.now() * 0.005);
          this.ctx.scale(scaleX, 1);

          this.ctx.fillStyle = coin.isDecoy ? '#00f0ff' : '#ffe600';
          this.ctx.strokeStyle = '#000000';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 11, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();

          this.ctx.fillStyle = '#000000';
          this.ctx.font = 'bold 9px monospace';
          this.ctx.textAlign = 'center';
          this.ctx.fillText('$', 0, 3);
          this.ctx.restore();
        }
      }
    }

    // Level 1 Exit Door
    if (this.level.exit) {
      const ex = this.level.exit;
      this.ctx.fillStyle = '#111728';
      this.ctx.strokeStyle = '#00ff88';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.roundRect(ex.x, ex.y, ex.w, ex.h, 8);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = '#00ff88';
      this.ctx.font = 'bold 11px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('EXIT', ex.x + ex.w / 2, ex.y + 20);
    }

    // Level 2 Fake Exit Door
    if (this.level.fakeExit) {
      const fe = this.level.fakeExit;
      this.ctx.fillStyle = '#111728';
      this.ctx.strokeStyle = fe.triggered ? '#ff477e' : '#ffe600';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.roundRect(fe.x, fe.y, fe.w, fe.h, 8);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = fe.triggered ? '#ff477e' : '#ffe600';
      this.ctx.font = 'bold 11px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(fe.triggered ? 'NOPE!' : 'EXIT', fe.x + fe.w / 2, fe.y + 20);
    }

    // Level 2 Real Revealed Trapdoor Exit
    if (this.level.realExit && this.level.realExit.revealed) {
      const re = this.level.realExit;
      this.ctx.fillStyle = '#0c1626';
      this.ctx.strokeStyle = '#00ff88';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.roundRect(re.x, re.y, re.w, re.h, 8);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = '#00ff88';
      this.ctx.font = 'bold 10px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('REAL EXIT', re.x + re.w / 2, re.y + 24);
    }

    // Level 3 Switches
    if (this.level.switches) {
      for (const sw of this.level.switches) {
        if (sw.phase === (this.boss ? this.boss.phase : 1)) {
          this.ctx.fillStyle = sw.pressed ? '#1a2238' : '#ff477e';
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 2.5;
          this.ctx.beginPath();
          this.ctx.roundRect(sw.x, sw.y, sw.w, sw.h, 6);
          this.ctx.fill();
          this.ctx.stroke();

          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = 'bold 9px monospace';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(sw.label, sw.x + sw.w / 2, sw.y + 15);
        }
      }
    }

    // Level 3 Secret Maintenance Hatch
    if (this.level.secretHatch) {
      const sh = this.level.secretHatch;
      this.ctx.fillStyle = '#172036';
      this.ctx.strokeStyle = '#00f0ff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.roundRect(sh.x, sh.y, sh.w, sh.h, 6);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = '#00f0ff';
      this.ctx.font = 'bold 8px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('DEBUG', sh.x + sh.w / 2, sh.y + 20);
      this.ctx.fillText('HATCH', sh.x + sh.w / 2, sh.y + 32);
      this.ctx.fillText(`[E]`, sh.x + sh.w / 2, sh.y + 50);
    }

    // Boss BUGGY
    if (this.boss && this.level.id === 3) {
      this.boss.draw(this.ctx);
    }

    // Particles
    this.particles.draw(this.ctx);

    // Player
    this.player.draw(this.ctx, this.isInverted);

    this.ctx.restore();
  }

  // --------------------------------------------------------------------------
  // MAIN RUNTIME LOOP
  // --------------------------------------------------------------------------

  loop(timestamp) {
    // Delta-time with strict clamping to prevent tab-switch physics glitches
    const rawDt = (timestamp - this.lastFrameTime) / 1000;
    const dt = Math.min(rawDt, 0.05);
    this.lastFrameTime = timestamp;

    if (this.state === 'playing') {
      this.updatePhysics(dt);
      this.particles.update(dt);
      this.screenShake.update(dt);
      this.updateCamera();
    }

    this.confetti.update(dt);

    // Render Scene
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawBackground();
    this.drawWorld();

    requestAnimationFrame((t) => this.loop(t));
  }
}

// ============================================================================
// 10. BOOTSTRAP INSTANTIATION
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new GameEngine();
});
