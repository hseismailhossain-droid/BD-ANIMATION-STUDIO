/**
 * Procedural Audio Synthesizer & Sound FX Generator Engine
 * 100% Client-side Web Audio API Sound Generation & Voice Recording
 */

import { AudioTrackItem } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export interface SoundPreset {
  id: string;
  name: string;
  bengaliName: string;
  category: 'foley' | 'vehicle' | 'nature' | 'emotion' | 'cartoon';
  icon: string;
  description: string;
  durationSeconds: number;
}

export const SOUND_PRESETS: SoundPreset[] = [
  // 1. Walking / Footsteps
  {
    id: 'walk',
    name: 'Footsteps (Walking)',
    bengaliName: '🚶‍♂️ Footsteps (Walking)',
    category: 'foley',
    icon: 'Footprints',
    description: 'Rhythmic walking steps on ground or road',
    durationSeconds: 1.6,
  },
  {
    id: 'run',
    name: 'Running Steps',
    bengaliName: '🏃‍♂️ Running Footsteps',
    category: 'foley',
    icon: 'Footprints',
    description: 'Fast paced running footsteps with heavy stride',
    durationSeconds: 1.2,
  },
  {
    id: 'sneak',
    name: 'Sneaking Steps',
    bengaliName: '🤫 Sneaking Steps',
    category: 'foley',
    icon: 'Footprints',
    description: 'Quiet cautious tiptoeing footsteps',
    durationSeconds: 1.8,
  },

  // 2. Car / Vehicles
  {
    id: 'car',
    name: 'Car Driving & Engine',
    bengaliName: '🚗 Car Engine & Acceleration',
    category: 'vehicle',
    icon: 'Car',
    description: 'Car accelerating and engine revving',
    durationSeconds: 2.2,
  },
  {
    id: 'car_horn',
    name: 'Car Horn Beep',
    bengaliName: '📯 Car Horn (Beep Beep)',
    category: 'vehicle',
    icon: 'Car',
    description: 'Sharp road traffic car horn honk',
    durationSeconds: 1.0,
  },
  {
    id: 'car_skid',
    name: 'Tire Brake Screech',
    bengaliName: '🛑 Tire Brake Screech',
    category: 'vehicle',
    icon: 'Car',
    description: 'Sudden screeching brake wheel friction',
    durationSeconds: 1.5,
  },

  // 3. Train
  {
    id: 'train',
    name: 'Train Chug-Chug Rhythm',
    bengaliName: '🚂 Train Chug-Chug Rhythm',
    category: 'vehicle',
    icon: 'Train',
    description: 'Rhythmic chug-chug sound of running train tracks',
    durationSeconds: 2.5,
  },
  {
    id: 'train_whistle',
    name: 'Train Steam Whistle',
    bengaliName: '📢 Train Whistle',
    category: 'vehicle',
    icon: 'Train',
    description: 'Long traditional locomotive train whistle',
    durationSeconds: 2.0,
  },

  // 4. Airplane & Helicopter
  {
    id: 'plane',
    name: 'Airplane Jet Flyby',
    bengaliName: '✈️ Airplane Jet Flyby',
    category: 'vehicle',
    icon: 'Plane',
    description: 'Loud jet engine soaring across the sky',
    durationSeconds: 2.8,
  },
  {
    id: 'helicopter',
    name: 'Helicopter Rotor',
    bengaliName: '🚁 Helicopter Blades',
    category: 'vehicle',
    icon: 'Plane',
    description: 'Heavy spinning helicopter rotor blades',
    durationSeconds: 2.4,
  },

  // 5. Rain
  {
    id: 'rain',
    name: 'Gentle Rain Drizzle',
    bengaliName: '🌧️ Gentle Rain Drizzle',
    category: 'nature',
    icon: 'CloudRain',
    description: 'Calm raindrops and gentle drizzle',
    durationSeconds: 3.0,
  },
  {
    id: 'heavy_rain',
    name: 'Heavy Storm Rain',
    bengaliName: '⛈️ Heavy Storm Rain',
    category: 'nature',
    icon: 'CloudRain',
    description: 'Downpour rainfall with windy ambiance',
    durationSeconds: 3.0,
  },

  // 6. Thunder & Lightning
  {
    id: 'thunder',
    name: 'Thunder Crack & Rumble',
    bengaliName: '⚡ Thunder Crack & Rumble',
    category: 'nature',
    icon: 'Zap',
    description: 'Sky-splitting thunderbolt and deep rumbling',
    durationSeconds: 3.2,
  },

  // 7. Sad mood
  {
    id: 'sad',
    name: 'Sad Melancholy Piano',
    bengaliName: '😢 Melancholy Piano Chords',
    category: 'emotion',
    icon: 'Frown',
    description: 'Emotional slow minor piano chords',
    durationSeconds: 3.2,
  },
  {
    id: 'sad_strings',
    name: 'Melancholy Strings',
    bengaliName: '🎻 Sad Violin Strings',
    category: 'emotion',
    icon: 'Frown',
    description: 'Heartfelt minor strings drone',
    durationSeconds: 3.5,
  },

  // 8. Joy & Happiness
  {
    id: 'joy',
    name: 'Joyful Victory Fanfare',
    bengaliName: '🎉 Joyful Victory Fanfare',
    category: 'emotion',
    icon: 'Smile',
    description: 'Upbeat joyful victory trumpet melody',
    durationSeconds: 2.2,
  },
  {
    id: 'joy_chime',
    name: 'Sparkling Bells & Chimes',
    bengaliName: '🔔 Sparkling Bells & Chimes',
    category: 'emotion',
    icon: 'Smile',
    description: 'Bright magical chime bells of celebration',
    durationSeconds: 2.0,
  },

  // 9. Cartoon & Action
  {
    id: 'boing',
    name: 'Cartoon Boing Spring Jump',
    bengaliName: '🦘 Cartoon Boing Jump',
    category: 'cartoon',
    icon: 'Footprints',
    description: 'Bouncy spring comic jump sound',
    durationSeconds: 0.9,
  },
  {
    id: 'punch',
    name: 'Cartoon Punch / Whack',
    bengaliName: '💥 Cartoon Punch / Whack',
    category: 'cartoon',
    icon: 'Zap',
    description: 'Action scene comic impact smack',
    durationSeconds: 0.7,
  },
  {
    id: 'whoosh',
    name: 'Air Whoosh / Swipe',
    bengaliName: '💨 Fast Air Whoosh',
    category: 'cartoon',
    icon: 'Zap',
    description: 'Fast movement air cut sound',
    durationSeconds: 0.8,
  },
];

/**
 * Procedural Audio Synthesizer Class
 */
export class AudioEngine {
  private static activeAudioElements: HTMLAudioElement[] = [];

  /**
   * Preview a sound immediately through Web Audio API
   */
  public static async previewSound(presetId: string, volume: number = 0.8): Promise<void> {
    const ctx = getAudioContext();
    const preset = SOUND_PRESETS.find((p) => p.id === presetId) || SOUND_PRESETS[0];
    const duration = preset.durationSeconds;
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(2, Math.floor(sampleRate * duration), sampleRate);

    this.synthesizeSoundIntoBuffer(presetId, buffer);

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(ctx.currentTime);
  }

  /**
   * Render preset sound into an AudioBuffer, then convert to WAV Blob & URL
   */
  public static async generateSoundClip(
    presetId: string,
    volume: number = 0.9
  ): Promise<{ blob: Blob; url: string; duration: number }> {
    const preset = SOUND_PRESETS.find((p) => p.id === presetId) || SOUND_PRESETS[0];
    const duration = preset.durationSeconds;
    const sampleRate = 44100;
    const offlineCtx = new OfflineAudioContext(2, Math.floor(sampleRate * duration), sampleRate);

    // Create buffer and synthesize
    const buffer = offlineCtx.createBuffer(2, Math.floor(sampleRate * duration), sampleRate);
    this.synthesizeSoundIntoBuffer(presetId, buffer);

    // Apply volume
    for (let c = 0; c < 2; c++) {
      const channel = buffer.getChannelData(c);
      for (let i = 0; i < channel.length; i++) {
        channel[i] = channel[i] * volume;
      }
    }

    const wavBlob = this.audioBufferToWavBlob(buffer);
    const url = URL.createObjectURL(wavBlob);

    return {
      blob: wavBlob,
      url,
      duration,
    };
  }

  /**
   * Play an assigned AudioTrackItem during animation playback
   */
  public static playTrack(track: AudioTrackItem): void {
    if (track.muted || !track.audioUrl) return;

    try {
      const audio = new Audio(track.audioUrl);
      audio.volume = Math.max(0, Math.min(1, track.volume ?? 1));
      audio.play().catch(() => {
        // Autoplay may need user gesture
      });

      this.activeAudioElements.push(audio);
      audio.onended = () => {
        this.activeAudioElements = this.activeAudioElements.filter((a) => a !== audio);
      };
    } catch {
      // Audio element creation fail safe
    }
  }

  /**
   * Stop all actively playing sounds
   */
  public static stopAllSounds(): void {
    for (const audio of this.activeAudioElements) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // Ignore
      }
    }
    this.activeAudioElements = [];
  }

  /**
   * Procedural Audio Synthesis Logic for All Preset Categories
   */
  private static synthesizeSoundIntoBuffer(presetId: string, buffer: AudioBuffer): void {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const len = left.length;
    const sampleRate = buffer.sampleRate;

    // Zero out
    left.fill(0);
    right.fill(0);

    switch (presetId) {
      case 'walk': {
        // Footsteps: 3 steps with gravel texture & low thud
        const stepInterval = Math.floor(sampleRate * 0.5);
        for (let step = 0; step < 3; step++) {
          const start = step * stepInterval;
          for (let i = 0; i < Math.floor(sampleRate * 0.22) && start + i < len; i++) {
            const t = i / sampleRate;
            const env = Math.exp(-t * 22);
            // Low thud
            const thud = Math.sin(2 * Math.PI * (80 - t * 150) * t) * 0.6;
            // High crunch
            const crunch = (Math.random() * 2 - 1) * 0.4 * Math.exp(-t * 35);
            const val = (thud + crunch) * env;
            left[start + i] += val * 0.9;
            right[start + i] += val * (step % 2 === 0 ? 0.7 : 1.0);
          }
        }
        break;
      }

      case 'run': {
        // Running: 4 fast aggressive steps
        const stepInterval = Math.floor(sampleRate * 0.28);
        for (let step = 0; step < 4; step++) {
          const start = step * stepInterval;
          for (let i = 0; i < Math.floor(sampleRate * 0.18) && start + i < len; i++) {
            const t = i / sampleRate;
            const env = Math.exp(-t * 26);
            const thud = Math.sin(2 * Math.PI * (110 - t * 250) * t) * 0.8;
            const slap = (Math.random() * 2 - 1) * 0.5 * Math.exp(-t * 40);
            const val = (thud + slap) * env;
            left[start + i] += val;
            right[start + i] += val;
          }
        }
        break;
      }

      case 'sneak': {
        // Sneak: 2 subtle soft steps
        const stepInterval = Math.floor(sampleRate * 0.8);
        for (let step = 0; step < 2; step++) {
          const start = step * stepInterval;
          for (let i = 0; i < Math.floor(sampleRate * 0.25) && start + i < len; i++) {
            const t = i / sampleRate;
            const env = Math.sin((t / 0.25) * Math.PI) * Math.exp(-t * 12);
            const soft = (Math.random() * 2 - 1) * 0.25;
            left[start + i] += soft * env;
            right[start + i] += soft * env;
          }
        }
        break;
      }

      case 'car': {
        // Car engine rumble + rev
        for (let i = 0; i < len; i++) {
          const t = i / sampleRate;
          const revFreq = 45 + Math.sin(t * 3) * 15 + (t > 1.0 ? (t - 1.0) * 40 : 0);
          const env = Math.min(1, t * 4) * Math.min(1, (len / sampleRate - t) * 2);
          const osc1 = Math.sin(2 * Math.PI * revFreq * t);
          const osc2 = (Math.sin(4 * Math.PI * revFreq * t) > 0 ? 0.3 : -0.3);
          const rumble = (Math.random() * 2 - 1) * 0.15;
          const val = (osc1 * 0.5 + osc2 * 0.3 + rumble) * env * 0.7;
          left[i] = val;
          right[i] = val;
        }
        break;
      }

      case 'car_horn': {
        // Dual tone horn: 420Hz & 510Hz
        for (let i = 0; i < len; i++) {
          const t = i / sampleRate;
          // Beep 1 (0 to 0.35s) & Beep 2 (0.45 to 0.85s)
          let active = false;
          if (t >= 0.05 && t <= 0.38) active = true;
          if (t >= 0.48 && t <= 0.85) active = true;
          if (active) {
            const tone1 = Math.sin(2 * Math.PI * 420 * t);
            const tone2 = Math.sin(2 * Math.PI * 515 * t);
            const val = (tone1 * 0.5 + tone2 * 0.5) * 0.6;
            left[i] = val;
            right[i] = val;
          }
        }
        break;
      }

      case 'car_skid': {
        // Tire screech: filtered noise band with screech modulation
        for (let i = 0; i < len; i++) {
          const t = i / sampleRate;
          const env = Math.sin((t / (len / sampleRate)) * Math.PI);
          const screechFreq = 1800 - t * 600;
          const tone = Math.sin(2 * Math.PI * screechFreq * t) * 0.4;
          const noise = (Math.random() * 2 - 1) * 0.6;
          const val = (tone + noise) * env * 0.5;
          left[i] = val;
          right[i] = val;
        }
        break;
      }

      case 'train': {
        // Train chug-chug rhythm (steam engine 4-beat cycle)
        const beatLen = Math.floor(sampleRate * 0.22);
        const totalBeats = Math.floor(len / beatLen);
        for (let b = 0; b < totalBeats; b++) {
          const start = b * beatLen;
          for (let i = 0; i < beatLen && start + i < len; i++) {
            const t = i / sampleRate;
            const env = Math.exp(-t * 24);
            const chuff = (Math.random() * 2 - 1) * 0.7;
            const thud = Math.sin(2 * Math.PI * 65 * t) * 0.4;
            const val = (chuff + thud) * env * (b % 4 === 0 ? 0.9 : 0.6);
            left[start + i] += val;
            right[start + i] += val * 0.85;
          }
        }
        break;
      }

      case 'train_whistle': {
        // Steam train whistle: dual flute harmonic (630Hz & 790Hz) with vibrato
        for (let i = 0; i < len; i++) {
          const t = i / sampleRate;
          const env = Math.min(1, t * 5) * Math.min(1, (len / sampleRate - t) * 3);
          const vib = Math.sin(2 * Math.PI * 5 * t) * 12;
          const f1 = 630 + vib;
          const f2 = 790 + vib;
          const tone = (Math.sin(2 * Math.PI * f1 * t) * 0.5 + Math.sin(2 * Math.PI * f2 * t) * 0.5);
          const breath = (Math.random() * 2 - 1) * 0.12;
          const val = (tone + breath) * env * 0.6;
          left[i] = val;
          right[i] = val;
        }
        break;
      }

      case 'plane': {
        // Jet engine roar & flyby: rising and falling Doppler frequency
        for (let i = 0; i < len; i++) {
          const t = i / sampleRate;
          const dur = len / sampleRate;
          const normT = t / dur;
          const env = Math.sin(normT * Math.PI);
          const jetFreq = 160 + Math.sin(normT * Math.PI) * 140;
          const whine = Math.sin(2 * Math.PI * jetFreq * 4 * t) * 0.2;
          const turbine = (Math.random() * 2 - 1) * 0.6;
          const val = (turbine * 0.7 + whine) * env * 0.7;
          // Panning Doppler (left to right)
          left[i] = val * (1 - normT * 0.6);
          right[i] = val * (0.4 + normT * 0.6);
        }
        break;
      }

      case 'helicopter': {
        // Helicopter rotor thrum (chopper blades)
        const bladeInterval = Math.floor(sampleRate * 0.12);
        for (let b = 0; b * bladeInterval < len; b++) {
          const start = b * bladeInterval;
          for (let i = 0; i < Math.floor(sampleRate * 0.08) && start + i < len; i++) {
            const t = i / sampleRate;
            const env = Math.sin((t / 0.08) * Math.PI);
            const chop = Math.sin(2 * Math.PI * 60 * t) * 0.7 + (Math.random() * 2 - 1) * 0.3;
            left[start + i] += chop * env * 0.8;
            right[start + i] += chop * env * 0.8;
          }
        }
        break;
      }

      case 'rain': {
        // Gentle drizzle: pink noise + droplet clicks
        for (let i = 0; i < len; i++) {
          const t = i / sampleRate;
          const env = Math.min(1, t * 3) * Math.min(1, (len / sampleRate - t) * 3);
          const noise = (Math.random() * 2 - 1) * 0.28;
          // occasional droplet click
          let drop = 0;
          if (Math.random() < 0.0006) {
            drop = Math.sin(2 * Math.PI * (1200 + Math.random() * 800) * t) * 0.4;
          }
          const val = (noise + drop) * env;
          left[i] = val;
          right[i] = val;
        }
        break;
      }

      case 'heavy_rain': {
        // Heavy rain & storm: loud broadband rain + wind rumble
        for (let i = 0; i < len; i++) {
          const t = i / sampleRate;
          const env = Math.min(1, t * 2) * Math.min(1, (len / sampleRate - t) * 2);
          const wind = Math.sin(2 * Math.PI * 35 * t) * 0.3;
          const rain = (Math.random() * 2 - 1) * 0.5;
          const val = (wind + rain) * env * 0.7;
          left[i] = val;
          right[i] = val;
        }
        break;
      }

      case 'thunder': {
        // Thunder: Sharp explosive crack at 0.1s + long low rolling rumble
        for (let i = 0; i < len; i++) {
          const t = i / sampleRate;
          if (t < 0.05) continue;
          const relT = t - 0.05;
          // Initial explosive crack
          const crack = (Math.random() * 2 - 1) * Math.exp(-relT * 30) * 1.5;
          // Rolling sub-bass rumble
          const rumbleFreq = 50 + Math.sin(relT * 8) * 20;
          const rumble = Math.sin(2 * Math.PI * rumbleFreq * relT) * (Math.random() * 0.5 + 0.5);
          const rumbleEnv = Math.exp(-relT * 1.2) * 0.8;
          const val = Math.max(-1, Math.min(1, (crack + rumble * rumbleEnv) * 0.85));
          left[i] = val;
          right[i] = val;
        }
        break;
      }

      case 'sad': {
        // Sad melody: Slow melancholy minor arpeggio (A minor: A3, C4, E4, A4) with reverb
        const notes = [220, 261.63, 329.63, 440];
        const noteDur = 0.7;
        for (let n = 0; n < notes.length; n++) {
          const freq = notes[n];
          const start = Math.floor(n * noteDur * sampleRate);
          for (let i = 0; start + i < len; i++) {
            const t = i / sampleRate;
            const env = Math.exp(-t * 2.2);
            // Rich piano harmonics
            const h1 = Math.sin(2 * Math.PI * freq * t);
            const h2 = Math.sin(4 * Math.PI * freq * t) * 0.3;
            const h3 = Math.sin(6 * Math.PI * freq * t) * 0.15;
            const val = (h1 + h2 + h3) * env * 0.45;
            left[start + i] += val;
            right[start + i] += val * 0.95;
          }
        }
        break;
      }

      case 'sad_strings': {
        // Somber minor cello/violin chord drone
        const chord = [130.81, 155.56, 196.0]; // C minor
        for (let i = 0; i < len; i++) {
          const t = i / sampleRate;
          const env = Math.min(1, t * 1.5) * Math.min(1, (len / sampleRate - t) * 1.5);
          let sum = 0;
          for (const f of chord) {
            const vib = Math.sin(2 * Math.PI * 4.5 * t) * 2;
            sum += Math.sin(2 * Math.PI * (f + vib) * t) * 0.3;
            sum += Math.sin(4 * Math.PI * (f + vib) * t) * 0.1;
          }
          const val = sum * env * 0.4;
          left[i] = val;
          right[i] = val;
        }
        break;
      }

      case 'joy': {
        // Joyful victory fanfare: C major triad fanfare (C4, E4, G4, C5)
        const notes = [
          { f: 261.63, d: 0.3 },
          { f: 329.63, d: 0.3 },
          { f: 392.0, d: 0.3 },
          { f: 523.25, d: 0.9 },
        ];
        let currentPos = 0;
        for (const note of notes) {
          const start = Math.floor(currentPos * sampleRate);
          for (let i = 0; start + i < len; i++) {
            const t = i / sampleRate;
            const env = Math.exp(-t * (note.d > 0.5 ? 2.5 : 5.5));
            const brass = Math.sin(2 * Math.PI * note.f * t) * 0.6 + Math.sin(4 * Math.PI * note.f * t) * 0.3;
            const val = brass * env * 0.5;
            left[start + i] += val;
            right[start + i] += val;
          }
          currentPos += note.d;
        }
        break;
      }

      case 'joy_chime': {
        // Cheerful sparkling bells / music box
        const chimes = [523.25, 659.25, 783.99, 1046.5];
        for (let c = 0; c < chimes.length; c++) {
          const start = Math.floor(c * 0.22 * sampleRate);
          const f = chimes[c];
          for (let i = 0; start + i < len; i++) {
            const t = i / sampleRate;
            const env = Math.exp(-t * 6);
            const bell = Math.sin(2 * Math.PI * f * t) * 0.7 + Math.sin(6 * Math.PI * f * t) * 0.25;
            const val = bell * env * 0.4;
            left[start + i] += val;
            right[start + i] += val;
          }
        }
        break;
      }

      case 'boing': {
        // Cartoon spring jump: sine pitch bend from 110Hz to 620Hz with vibrato
        for (let i = 0; i < len; i++) {
          const t = i / sampleRate;
          const env = Math.exp(-t * 3.5);
          const sweep = 110 + Math.min(500, t * 1200);
          const wobble = Math.sin(2 * Math.PI * 18 * t) * (50 * Math.exp(-t * 5));
          const val = Math.sin(2 * Math.PI * (sweep + wobble) * t) * env * 0.6;
          left[i] = val;
          right[i] = val;
        }
        break;
      }

      case 'punch': {
        // Punch / whack: low kick impact + high transient slap
        for (let i = 0; i < len; i++) {
          const t = i / sampleRate;
          const env = Math.exp(-t * 28);
          const kick = Math.sin(2 * Math.PI * (160 - t * 450) * t) * 0.8;
          const slap = (Math.random() * 2 - 1) * Math.exp(-t * 60) * 0.6;
          const val = (kick + slap) * env * 0.7;
          left[i] = val;
          right[i] = val;
        }
        break;
      }

      case 'whoosh': {
        // Fast air whoosh: bandpass white noise sweep
        for (let i = 0; i < len; i++) {
          const t = i / sampleRate;
          const dur = len / sampleRate;
          const env = Math.sin((t / dur) * Math.PI);
          const noise = (Math.random() * 2 - 1) * 0.8;
          const sweep = Math.sin(2 * Math.PI * (300 + t * 600) * t) * 0.3;
          const val = (noise + sweep) * env * 0.5;
          left[i] = val;
          right[i] = val;
        }
        break;
      }

      default: {
        // Generic tone
        for (let i = 0; i < len; i++) {
          const t = i / sampleRate;
          const val = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 3) * 0.5;
          left[i] = val;
          right[i] = val;
        }
        break;
      }
    }
  }

  /**
   * Helper: Convert Web Audio AudioBuffer to standard 16-bit PCM WAV Blob
   */
  public static audioBufferToWavBlob(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Interleave channels & write PCM 16-bit samples
    let offset = 44;
    const channels: Float32Array[] = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }

    for (let i = 0; i < buffer.length; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = channels[c][i];
        sample = Math.max(-1, Math.min(1, sample));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private static writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Apply Character Voice Effects (Chipmunk, Monster, Robot, Radio, Normal)
   */
  public static async applyVoiceEffect(
    sourceBlob: Blob,
    effect: 'normal' | 'chipmunk' | 'monster' | 'robot' | 'radio'
  ): Promise<{ blob: Blob; url: string; duration: number }> {
    if (effect === 'normal') {
      const url = URL.createObjectURL(sourceBlob);
      const audio = new Audio(url);
      await new Promise((r) => {
        audio.onloadedmetadata = () => r(null);
        audio.onerror = () => r(null);
        setTimeout(() => r(null), 300);
      });
      return { blob: sourceBlob, url, duration: audio.duration || 1.0 };
    }

    const ctx = getAudioContext();
    const arrayBuffer = await sourceBlob.arrayBuffer();
    const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);

    let pitchRate = 1.0;
    if (effect === 'chipmunk') pitchRate = 1.42;
    if (effect === 'monster') pitchRate = 0.74;

    const outDuration = decodedBuffer.duration / pitchRate;
    const sampleRate = decodedBuffer.sampleRate;
    const offlineCtx = new OfflineAudioContext(
      1,
      Math.max(1, Math.floor(outDuration * sampleRate)),
      sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.playbackRate.value = pitchRate;

    if (effect === 'chipmunk') {
      const highShelf = offlineCtx.createBiquadFilter();
      highShelf.type = 'highshelf';
      highShelf.frequency.value = 2800;
      highShelf.gain.value = 5;
      source.connect(highShelf);
      highShelf.connect(offlineCtx.destination);
    } else if (effect === 'monster') {
      const lowpass = offlineCtx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 1600;
      source.connect(lowpass);
      lowpass.connect(offlineCtx.destination);
    } else if (effect === 'robot') {
      const bandpass = offlineCtx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1100;
      bandpass.Q.value = 3.0;
      source.connect(bandpass);
      bandpass.connect(offlineCtx.destination);
    } else if (effect === 'radio') {
      const highpass = offlineCtx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 550;
      const lowpass = offlineCtx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 2400;
      source.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(offlineCtx.destination);
    } else {
      source.connect(offlineCtx.destination);
    }

    source.start(0);
    const rendered = await offlineCtx.startRendering();
    const wavBlob = this.audioBufferToWavBlob(rendered);
    const url = URL.createObjectURL(wavBlob);

    return {
      blob: wavBlob,
      url,
      duration: rendered.duration,
    };
  }

  /**
   * Voice Recorder: Start recording audio from microphone
   */
  public static async startVoiceRecording(
    onAnalyserCreated?: (analyser: AnalyserNode) => void
  ): Promise<{ stop: () => Promise<{ blob: Blob; url: string; duration: number }> }> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = getAudioContext();

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    if (onAnalyserCreated) {
      onAnalyserCreated(analyser);
    }

    const mediaRecorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    const startTime = Date.now();

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.start(100);

    return {
      stop: () => {
        return new Promise((resolve) => {
          mediaRecorder.onstop = () => {
            const duration = (Date.now() - startTime) / 1000;
            const mimeType = mediaRecorder.mimeType || 'audio/webm';
            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);

            // Clean up microphone tracks
            stream.getTracks().forEach((track) => track.stop());

            resolve({
              blob,
              url,
              duration,
            });
          };

          mediaRecorder.stop();
        });
      },
    };
  }
}
