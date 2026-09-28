/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LightingPresetType =
  | 'moon-full'
  | 'moon-crescent'
  | 'moon-blood'
  | 'sun-blaze'
  | 'sun-sunset'
  | 'sun-eclipse'
  | 'day-bright'
  | 'day-golden'
  | 'day-morning'
  | 'night-moon'
  | 'night-midnight'
  | 'mobile-screen'
  | 'computer-monitor'
  | 'lamppost'
  | 'torch-fire'
  | 'studio-spotlight'
  | 'neon-rim'
  | 'rain-ambient'
  | 'snow-ambient';

export interface LightingEffectConfig {
  preset: LightingPresetType;
  name: string;
  sourceX: number; // Document X
  sourceY: number; // Document Y
  targetX?: number; // For directional/cone lights
  targetY?: number;
  radius: number; // Light reach in px
  coneAngle: number; // In degrees (e.g. 45 - 90 deg for lamppost)
  beamAngle: number; // In degrees (direction: 90 = downward)
  intensity: number; // 0.1 to 2.0
  color: string; // Hex color
  secondaryColor?: string;
  blendMode: GlobalCompositeOperation;
  volumetricDust: boolean;
  dustDensity: number;
  vignette: boolean;
  vignetteStrength: number;
  applyScope: 'new-layer' | 'current-layer' | 'all-frames';
  // Dedicated Moon & Sun (Celestial) controls:
  discRadius?: number; // Radius of moon/sun body (px)
  lensFlare?: boolean; // Anamorphic streaks & aperture reflections
  showStars?: boolean; // Background starry night sky
  moonPhase?: 'full' | 'crescent' | 'blood';
  sunType?: 'blaze' | 'sunset' | 'eclipse';
}

export const LIGHTING_PRESETS: Record<LightingPresetType, Partial<LightingEffectConfig>> = {
  'moon-full': {
    preset: 'moon-full',
    name: 'পূর্ণিমার চাঁদ (Full Moon & Halo)',
    color: '#f8fafc',
    secondaryColor: '#38bdf8',
    radius: 1200,
    discRadius: 90,
    intensity: 0.9,
    blendMode: 'screen',
    beamAngle: 75,
    coneAngle: 360,
    volumetricDust: false,
    dustDensity: 0,
    vignette: true,
    vignetteStrength: 0.55,
    showStars: true,
    moonPhase: 'full',
  },
  'moon-crescent': {
    preset: 'moon-crescent',
    name: 'কাস্তে চাঁদ / অর্ধচন্দ্র (Crescent Moon)',
    color: '#f1f5f9',
    secondaryColor: '#0284c7',
    radius: 1100,
    discRadius: 85,
    intensity: 0.85,
    blendMode: 'screen',
    beamAngle: 60,
    coneAngle: 360,
    volumetricDust: false,
    dustDensity: 0,
    vignette: true,
    vignetteStrength: 0.5,
    showStars: true,
    moonPhase: 'crescent',
  },
  'moon-blood': {
    preset: 'moon-blood',
    name: 'রক্তিম চাঁদ / গ্রহণ (Blood Moon)',
    color: '#ef4444',
    secondaryColor: '#7f1d1d',
    radius: 1150,
    discRadius: 90,
    intensity: 0.95,
    blendMode: 'screen',
    beamAngle: 80,
    coneAngle: 360,
    volumetricDust: true,
    dustDensity: 15,
    vignette: true,
    vignetteStrength: 0.65,
    showStars: true,
    moonPhase: 'blood',
  },
  'sun-blaze': {
    preset: 'sun-blaze',
    name: 'প্রখর সূর্য ও লেন্স ফ্লেয়ার (Blazing Sun)',
    color: '#ffffff',
    secondaryColor: '#fbbf24',
    radius: 1400,
    discRadius: 100,
    intensity: 1.0,
    blendMode: 'screen',
    beamAngle: 45,
    coneAngle: 90,
    volumetricDust: true,
    dustDensity: 30,
    vignette: false,
    vignetteStrength: 0,
    lensFlare: true,
    sunType: 'blaze',
  },
  'sun-sunset': {
    preset: 'sun-sunset',
    name: 'অস্তগামী লাল সূর্য (Sunset Sun Disc)',
    color: '#f97316',
    secondaryColor: '#dc2626',
    radius: 1350,
    discRadius: 110,
    intensity: 0.9,
    blendMode: 'screen',
    beamAngle: 30,
    coneAngle: 110,
    volumetricDust: true,
    dustDensity: 35,
    vignette: true,
    vignetteStrength: 0.3,
    lensFlare: true,
    sunType: 'sunset',
  },
  'sun-eclipse': {
    preset: 'sun-eclipse',
    name: 'সূর্যগ্রহণ (Solar Eclipse - Diamond Ring)',
    color: '#38bdf8',
    secondaryColor: '#ffffff',
    radius: 1250,
    discRadius: 95,
    intensity: 0.95,
    blendMode: 'screen',
    beamAngle: 60,
    coneAngle: 360,
    volumetricDust: false,
    dustDensity: 0,
    vignette: true,
    vignetteStrength: 0.7,
    lensFlare: true,
    showStars: true,
    sunType: 'eclipse',
  },
  'day-bright': {
    preset: 'day-bright',
    name: 'Day - Bright Sunlight',
    color: '#fff8e7',
    secondaryColor: '#fde047',
    radius: 1200,
    intensity: 0.75,
    blendMode: 'screen',
    beamAngle: 45,
    coneAngle: 90,
    volumetricDust: true,
    dustDensity: 20,
    vignette: false,
    vignetteStrength: 0,
  },
  'day-golden': {
    preset: 'day-golden',
    name: 'Day - Golden Hour Sunset',
    color: '#ff7e33',
    secondaryColor: '#f59e0b',
    radius: 1400,
    intensity: 0.85,
    blendMode: 'overlay',
    beamAngle: 35,
    coneAngle: 110,
    volumetricDust: true,
    dustDensity: 35,
    vignette: true,
    vignetteStrength: 0.25,
  },
  'day-morning': {
    preset: 'day-morning',
    name: 'Day - Morning Sunrise',
    color: '#fed7aa',
    secondaryColor: '#f472b6',
    radius: 1100,
    intensity: 0.65,
    blendMode: 'screen',
    beamAngle: 60,
    coneAngle: 95,
    volumetricDust: true,
    dustDensity: 15,
    vignette: false,
    vignetteStrength: 0,
  },
  'night-moon': {
    preset: 'night-moon',
    name: 'Night - Cinematic Moonlight',
    color: '#bae6fd',
    secondaryColor: '#0284c7',
    radius: 1300,
    intensity: 0.7,
    blendMode: 'screen',
    beamAngle: 75,
    coneAngle: 80,
    volumetricDust: true,
    dustDensity: 25,
    vignette: true,
    vignetteStrength: 0.45,
  },
  'night-midnight': {
    preset: 'night-midnight',
    name: 'Night - Deep Midnight & Stars',
    color: '#38bdf8',
    secondaryColor: '#1e1b4b',
    radius: 1500,
    intensity: 0.8,
    blendMode: 'soft-light',
    beamAngle: 90,
    coneAngle: 120,
    volumetricDust: true,
    dustDensity: 60,
    vignette: true,
    vignetteStrength: 0.6,
  },
  'mobile-screen': {
    preset: 'mobile-screen',
    name: 'Mobile Phone Screen Glow',
    color: '#67e8f9',
    secondaryColor: '#e0f2fe',
    radius: 500,
    intensity: 0.9,
    blendMode: 'screen',
    beamAngle: -70, // Casting upward onto face
    coneAngle: 65,
    volumetricDust: false,
    dustDensity: 0,
    vignette: true,
    vignetteStrength: 0.35,
  },
  'computer-monitor': {
    preset: 'computer-monitor',
    name: 'Computer / Monitor Glow',
    color: '#38bdf8',
    secondaryColor: '#818cf8',
    radius: 750,
    intensity: 0.85,
    blendMode: 'screen',
    beamAngle: -80, // Horizontal/frontal glow
    coneAngle: 85,
    volumetricDust: false,
    dustDensity: 0,
    vignette: true,
    vignetteStrength: 0.4,
  },
  'lamppost': {
    preset: 'lamppost',
    name: 'Lamppost Street Lamp (Cone)',
    color: '#fef08a',
    secondaryColor: '#f59e0b',
    radius: 800,
    intensity: 0.95,
    blendMode: 'screen',
    beamAngle: 90, // Downward conical beam
    coneAngle: 55,
    volumetricDust: true,
    dustDensity: 40,
    vignette: true,
    vignetteStrength: 0.3,
  },
  'torch-fire': {
    preset: 'torch-fire',
    name: 'Torch / Campfire Flame',
    color: '#fb923c',
    secondaryColor: '#ef4444',
    radius: 650,
    intensity: 0.9,
    blendMode: 'screen',
    beamAngle: 0,
    coneAngle: 360,
    volumetricDust: true,
    dustDensity: 50,
    vignette: true,
    vignetteStrength: 0.35,
  },
  'studio-spotlight': {
    preset: 'studio-spotlight',
    name: 'Studio Theatrical Spotlight',
    color: '#ffffff',
    secondaryColor: '#cbd5e1',
    radius: 900,
    intensity: 0.95,
    blendMode: 'screen',
    beamAngle: 80,
    coneAngle: 45,
    volumetricDust: true,
    dustDensity: 30,
    vignette: true,
    vignetteStrength: 0.5,
  },
  'neon-rim': {
    preset: 'neon-rim',
    name: 'Cyberpunk Neon Glow',
    color: '#f43f5e',
    secondaryColor: '#a855f7',
    radius: 600,
    intensity: 0.85,
    blendMode: 'screen',
    beamAngle: 45,
    coneAngle: 360,
    volumetricDust: false,
    dustDensity: 0,
    vignette: false,
    vignetteStrength: 0,
  },
  'rain-ambient': {
    preset: 'rain-ambient',
    name: 'Rainy Night Atmospheric Mist',
    color: '#93c5fd',
    secondaryColor: '#1e293b',
    radius: 1200,
    intensity: 0.7,
    blendMode: 'screen',
    beamAngle: 85,
    coneAngle: 120,
    volumetricDust: true,
    dustDensity: 70,
    vignette: true,
    vignetteStrength: 0.4,
  },
  'snow-ambient': {
    preset: 'snow-ambient',
    name: 'Snowy Winter Soft Glow',
    color: '#f8fafc',
    secondaryColor: '#cbd5e1',
    radius: 1300,
    intensity: 0.75,
    blendMode: 'screen',
    beamAngle: 90,
    coneAngle: 140,
    volumetricDust: true,
    dustDensity: 80,
    vignette: false,
    vignetteStrength: 0,
  },
};

// Precomputed tables for ultra-fast 60fps rendering without repeated trigonometric calls
const PRECOMPUTED_STARS = Array.from({ length: 180 }, (_, i) => ({
  normX: Math.sin(i * 1237.9) * 0.5 + 0.5,
  normY: Math.cos(i * 853.3) * 0.5 + 0.5,
  size: 0.8 + ((i % 5) * 0.5),
  alpha: 0.3 + ((i % 7) * 0.1),
  color: i % 8 === 0 ? '#bae6fd' : i % 11 === 0 ? '#fef08a' : '#ffffff',
  twinkle: i % 25 === 0,
}));

const PRECOMPUTED_DUST = Array.from({ length: 120 }, (_, i) => ({
  angleFactor: Math.sin(i * 47),
  distFactor: Math.cos(i * 89) * 0.5 + 0.5,
  size: 1 + (i % 3.5),
  alpha: 0.2 + ((i % 5) * 0.15),
}));

export class LightingEngine {
  /**
   * Render lighting effect onto a destination canvas
   */
  public static renderEffect(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    config: LightingEffectConfig
  ) {
    const {
      sourceX,
      sourceY,
      radius,
      coneAngle,
      beamAngle,
      intensity,
      color,
      secondaryColor = color,
      volumetricDust,
      dustDensity,
      vignette,
      vignetteStrength,
      preset,
    } = config;

    ctx.save();

    // 1. Dark Vignette / Atmospheric Backdrop (if night or focused light)
    if (vignette && vignetteStrength > 0) {
      const vGrad = ctx.createRadialGradient(
        sourceX,
        sourceY,
        Math.min(width, height) * 0.2,
        sourceX,
        sourceY,
        Math.max(width, height) * 0.9
      );
      vGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vGrad.addColorStop(0.6, `rgba(5, 7, 15, ${vignetteStrength * 0.5})`);
      vGrad.addColorStop(1, `rgba(2, 4, 10, ${vignetteStrength * 0.9})`);

      ctx.fillStyle = vGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // 1b. Starry Night Sky for Moon / Midnight presets
    if (config.showStars) {
      this.renderStars(ctx, width, height, sourceX, sourceY, intensity);
    }

    // 2. Specific Light Source Geometry
    if (
      preset === 'moon-full' ||
      preset === 'moon-crescent' ||
      preset === 'moon-blood' ||
      preset === 'night-moon'
    ) {
      this.renderMoon(ctx, width, height, config);
    } else if (
      preset === 'sun-blaze' ||
      preset === 'sun-sunset' ||
      preset === 'sun-eclipse'
    ) {
      this.renderSun(ctx, width, height, config);
    } else if (preset === 'lamppost') {
      this.renderLamppost(ctx, sourceX, sourceY, radius, coneAngle, beamAngle, intensity, color, secondaryColor);
    } else if (preset === 'mobile-screen') {
      this.renderMobileScreen(ctx, sourceX, sourceY, radius, coneAngle, beamAngle, intensity, color);
    } else if (preset === 'computer-monitor') {
      this.renderComputerMonitor(ctx, sourceX, sourceY, radius, coneAngle, beamAngle, intensity, color, secondaryColor);
    } else if (preset === 'day-bright' || preset === 'day-golden' || preset === 'day-morning') {
      this.renderSunlight(ctx, width, height, sourceX, sourceY, radius, beamAngle, intensity, color, secondaryColor, preset);
    } else if (coneAngle < 360) {
      this.renderConicalSpotlight(ctx, sourceX, sourceY, radius, coneAngle, beamAngle, intensity, color, secondaryColor);
    } else {
      this.renderRadialGlow(ctx, sourceX, sourceY, radius, intensity, color, secondaryColor);
    }

    // 3. Volumetric Dust / Particles / Rain / Snow / Embers
    if (volumetricDust && dustDensity > 0) {
      this.renderParticles(ctx, width, height, sourceX, sourceY, radius, beamAngle, coneAngle, dustDensity, color, preset);
    }

    ctx.restore();
  }

  /**
   * Lamppost: Volumetric downward light cone + hot ground pool + lamp fixture glow
   */
  private static renderLamppost(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    coneAngleDeg: number,
    beamAngleDeg: number,
    intensity: number,
    color: string,
    secondaryColor: string
  ) {
    const halfAngleRad = ((coneAngleDeg / 2) * Math.PI) / 180;
    const dirRad = (beamAngleDeg * Math.PI) / 180;

    const leftAngle = dirRad - halfAngleRad;
    const rightAngle = dirRad + halfAngleRad;

    const leftX = x + Math.cos(leftAngle) * radius;
    const leftY = y + Math.sin(leftAngle) * radius;
    const rightX = x + Math.cos(rightAngle) * radius;
    const rightY = y + Math.sin(rightAngle) * radius;

    // Volumetric Cone Beam
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(leftX, leftY);
    ctx.arc(x, y, radius, leftAngle, rightAngle);
    ctx.closePath();

    const beamGrad = ctx.createRadialGradient(x, y, 10, x, y, radius);
    beamGrad.addColorStop(0, this.hexToRgba(color, 0.85 * intensity));
    beamGrad.addColorStop(0.3, this.hexToRgba(color, 0.5 * intensity));
    beamGrad.addColorStop(0.7, this.hexToRgba(secondaryColor, 0.25 * intensity));
    beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = beamGrad;
    ctx.fill();
    ctx.restore();

    // Hot Lamp Orb (Fixture Bulb)
    ctx.save();
    const bulbGrad = ctx.createRadialGradient(x, y, 0, x, y, 60);
    bulbGrad.addColorStop(0, '#ffffff');
    bulbGrad.addColorStop(0.2, this.hexToRgba(color, 0.95 * intensity));
    bulbGrad.addColorStop(0.6, this.hexToRgba(secondaryColor, 0.4 * intensity));
    bulbGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bulbGrad;
    ctx.beginPath();
    ctx.arc(x, y, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Ground Illumination Ellipse Pool
    ctx.save();
    const groundY = y + radius * 0.85;
    const poolWidth = radius * Math.tan(halfAngleRad) * 1.5;
    const poolHeight = poolWidth * 0.35;

    const groundGrad = ctx.createRadialGradient(x, groundY, 0, x, groundY, poolWidth);
    groundGrad.addColorStop(0, this.hexToRgba(color, 0.7 * intensity));
    groundGrad.addColorStop(0.5, this.hexToRgba(secondaryColor, 0.3 * intensity));
    groundGrad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = groundGrad;
    ctx.beginPath();
    ctx.ellipse(x, groundY, poolWidth, poolHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Mobile Phone Screen Glow (Distinctive soft upward cool-cyan cast)
   */
  private static renderMobileScreen(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    coneAngleDeg: number,
    beamAngleDeg: number,
    intensity: number,
    color: string
  ) {
    ctx.save();
    const halfAngleRad = ((coneAngleDeg / 2) * Math.PI) / 180;
    const dirRad = (beamAngleDeg * Math.PI) / 180;

    const leftAngle = dirRad - halfAngleRad;
    const rightAngle = dirRad + halfAngleRad;

    // Upward screen light cone
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, leftAngle, rightAngle);
    ctx.closePath();

    const grad = ctx.createRadialGradient(x, y, 5, x, y, radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.15, this.hexToRgba(color, 0.85 * intensity));
    grad.addColorStop(0.55, this.hexToRgba(color, 0.35 * intensity));
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fill();

    // Smartphone bezel outline & screen representation
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(dirRad + Math.PI / 2);
    const phoneW = 70;
    const phoneH = 120;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.fillStyle = this.hexToRgba(color, 0.9 * intensity);
    ctx.beginPath();
    ctx.roundRect(-phoneW / 2, -phoneH / 2, phoneW, phoneH, 10);
    ctx.fill();
    ctx.stroke();

    // High brightness screen core
    const screenCore = ctx.createRadialGradient(0, 0, 0, 0, 0, phoneW);
    screenCore.addColorStop(0, '#ffffff');
    screenCore.addColorStop(0.5, this.hexToRgba(color, 0.8));
    screenCore.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = screenCore;
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  /**
   * Computer Monitor Glow (Trapezoidal projector screen cast with scanlines)
   */
  private static renderComputerMonitor(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    coneAngleDeg: number,
    beamAngleDeg: number,
    intensity: number,
    color: string,
    secondaryColor: string
  ) {
    ctx.save();
    const halfAngleRad = ((coneAngleDeg / 2) * Math.PI) / 180;
    const dirRad = (beamAngleDeg * Math.PI) / 180;

    const leftAngle = dirRad - halfAngleRad;
    const rightAngle = dirRad + halfAngleRad;

    // Wide beam cast
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, leftAngle, rightAngle);
    ctx.closePath();

    const beamGrad = ctx.createRadialGradient(x, y, 20, x, y, radius);
    beamGrad.addColorStop(0, '#ffffff');
    beamGrad.addColorStop(0.2, this.hexToRgba(color, 0.8 * intensity));
    beamGrad.addColorStop(0.6, this.hexToRgba(secondaryColor, 0.35 * intensity));
    beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = beamGrad;
    ctx.fill();

    // Monitor display rectangle at source
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(dirRad + Math.PI / 2);
    const monW = 140;
    const monH = 85;
    ctx.fillStyle = this.hexToRgba(color, 0.85 * intensity);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-monW / 2, -monH / 2, monW, monH, 6);
    ctx.fill();
    ctx.stroke();

    // Stand base
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-10, monH / 2, 20, 20);
    ctx.fillRect(-25, monH / 2 + 20, 50, 6);

    ctx.restore();
    ctx.restore();
  }

  /**
   * Sunlight Rays & Atmospheric Daylight Sky
   */
  private static renderSunlight(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    sunX: number,
    sunY: number,
    radius: number,
    beamAngleDeg: number,
    intensity: number,
    color: string,
    secondaryColor: string,
    preset: LightingPresetType
  ) {
    ctx.save();

    // 1. Sky atmospheric gradient
    const skyGrad = ctx.createLinearGradient(sunX, sunY, width / 2, height);
    if (preset === 'day-golden') {
      skyGrad.addColorStop(0, this.hexToRgba(color, 0.6 * intensity));
      skyGrad.addColorStop(0.4, this.hexToRgba(secondaryColor, 0.35 * intensity));
      skyGrad.addColorStop(1, 'rgba(255, 120, 40, 0.05)');
    } else {
      skyGrad.addColorStop(0, this.hexToRgba(color, 0.5 * intensity));
      skyGrad.addColorStop(0.5, this.hexToRgba(secondaryColor, 0.2 * intensity));
      skyGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Sun Core Orb
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, radius * 0.5);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.15, this.hexToRgba(color, 0.9 * intensity));
    sunGrad.addColorStop(0.5, this.hexToRgba(secondaryColor, 0.4 * intensity));
    sunGrad.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // 3. Volumetric Sunbeams / Crepuscular God Rays
    const numRays = 12;
    const rayLength = Math.max(width, height) * 1.2;
    const baseAngle = (beamAngleDeg * Math.PI) / 180;

    for (let i = 0; i < numRays; i++) {
      const offsetAngle = ((i - numRays / 2) * 5 * Math.PI) / 180;
      const angle = baseAngle + offsetAngle;
      const rayWidth = (3 + (i % 4) * 2) * (Math.PI / 180);

      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(sunX + Math.cos(angle - rayWidth) * rayLength, sunY + Math.sin(angle - rayWidth) * rayLength);
      ctx.lineTo(sunX + Math.cos(angle + rayWidth) * rayLength, sunY + Math.sin(angle + rayWidth) * rayLength);
      ctx.closePath();

      const rayGrad = ctx.createRadialGradient(sunX, sunY, 50, sunX, sunY, rayLength);
      rayGrad.addColorStop(0, this.hexToRgba('#ffffff', 0.45 * intensity));
      rayGrad.addColorStop(0.3, this.hexToRgba(color, 0.25 * intensity));
      rayGrad.addColorStop(1, 'rgba(255,255,255,0)');

      ctx.fillStyle = rayGrad;
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Generic Conical Spotlight
   */
  private static renderConicalSpotlight(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    coneAngleDeg: number,
    beamAngleDeg: number,
    intensity: number,
    color: string,
    secondaryColor: string
  ) {
    ctx.save();
    const halfAngleRad = ((coneAngleDeg / 2) * Math.PI) / 180;
    const dirRad = (beamAngleDeg * Math.PI) / 180;

    const leftAngle = dirRad - halfAngleRad;
    const rightAngle = dirRad + halfAngleRad;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, leftAngle, rightAngle);
    ctx.closePath();

    const grad = ctx.createRadialGradient(x, y, 10, x, y, radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, this.hexToRgba(color, 0.8 * intensity));
    grad.addColorStop(0.6, this.hexToRgba(secondaryColor, 0.35 * intensity));
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  /**
   * Omnidirectional Radial Glow (Torch / Neon / Ambient)
   */
  private static renderRadialGlow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    intensity: number,
    color: string,
    secondaryColor: string
  ) {
    ctx.save();
    const grad = ctx.createRadialGradient(x, y, 5, x, y, radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, this.hexToRgba(color, 0.9 * intensity));
    grad.addColorStop(0.6, this.hexToRgba(secondaryColor, 0.4 * intensity));
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Atmospheric Particles: Dust motes in light beam, embers, snowflakes, or rain streaks
   */
  private static renderParticles(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    x: number,
    y: number,
    radius: number,
    beamAngleDeg: number,
    coneAngleDeg: number,
    density: number,
    color: string,
    preset: LightingPresetType
  ) {
    ctx.save();
    const count = Math.round(density * 1.5);

    if (preset === 'rain-ambient') {
      // Slanted Rain Streaks
      ctx.strokeStyle = this.hexToRgba(color, 0.4);
      ctx.lineWidth = 1.5;
      for (let i = 0; i < count * 4; i++) {
        const rx = (Math.sin(i * 997) * 0.5 + 0.5) * width;
        const ry = (Math.cos(i * 733) * 0.5 + 0.5) * height;
        const len = 15 + ((i * 3) % 20);
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + 4, ry + len);
        ctx.stroke();
      }
    } else if (preset === 'snow-ambient') {
      // Soft Falling Snowflakes
      for (let i = 0; i < count * 3; i++) {
        const sx = (Math.sin(i * 1234) * 0.5 + 0.5) * width;
        const sy = (Math.cos(i * 5678) * 0.5 + 0.5) * height;
        const size = 1.5 + (i % 4);
        ctx.fillStyle = this.hexToRgba(color, 0.5 + ((i % 5) * 0.1));
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (preset === 'torch-fire') {
      // Glowing Fire Embers floating upward
      for (let i = 0; i < count; i++) {
        const angle = (Math.sin(i * 31) * 0.5 + 0.5) * Math.PI * 2;
        const dist = ((i * 17) % radius) * 0.7;
        const ex = x + Math.cos(angle) * dist * 0.8;
        const ey = y - Math.abs(Math.sin(angle)) * dist; // Float upward
        const size = 2 + (i % 3);

        ctx.fillStyle = i % 2 === 0 ? '#ffedd5' : '#f97316';
        ctx.beginPath();
        ctx.arc(ex, ey, size, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Suspended Dust Motes inside the light volume (accelerated via precomputed lookup)
      const dirRad = (beamAngleDeg * Math.PI) / 180;
      const halfAngle = ((coneAngleDeg / 2) * Math.PI) / 180;
      const maxCount = Math.min(count, PRECOMPUTED_DUST.length);

      for (let i = 0; i < maxCount; i++) {
        const item = PRECOMPUTED_DUST[i];
        const particleAngle = dirRad + item.angleFactor * halfAngle;
        const particleDist = item.distFactor * radius;
        const px = x + Math.cos(particleAngle) * particleDist;
        const py = y + Math.sin(particleAngle) * particleDist;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          ctx.fillStyle = this.hexToRgba('#ffffff', item.alpha);
          ctx.beginPath();
          ctx.arc(px, py, item.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  /**
   * Starry Night Sky Background (accelerated via precomputed star coordinates)
   */
  private static renderStars(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    moonX: number,
    moonY: number,
    intensity: number
  ) {
    ctx.save();
    const starCount = Math.min(
      PRECOMPUTED_STARS.length,
      Math.round(180 * Math.min(1.5, intensity))
    );

    for (let i = 0; i < starCount; i++) {
      const star = PRECOMPUTED_STARS[i];
      const sx = star.normX * width;
      const sy = star.normY * height;

      // Don't draw star right over moon core
      const distToMoon = Math.hypot(sx - moonX, sy - moonY);
      if (distToMoon < 110) continue;

      ctx.fillStyle = star.color;
      ctx.globalAlpha = Math.min(1, star.alpha * intensity);
      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fill();

      // Twinkle spikes on brightest stars
      if (star.twinkle) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(sx - 4, sy);
        ctx.lineTo(sx + 4, sy);
        ctx.moveTo(sx, sy - 4);
        ctx.lineTo(sx, sy + 4);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /**
   * Photorealistic Moon: Full Moon with craters & maria, Crescent with earthshine, or Blood Moon
   */
  private static renderMoon(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    config: LightingEffectConfig
  ) {
    const {
      sourceX: x,
      sourceY: y,
      radius,
      discRadius = 90,
      intensity,
      color,
      secondaryColor = '#38bdf8',
      preset,
      moonPhase = preset === 'moon-crescent' ? 'crescent' : preset === 'moon-blood' ? 'blood' : 'full',
    } = config;

    ctx.save();

    // 1. Large Atmospheric Lunar Glow Halo
    const haloGrad = ctx.createRadialGradient(x, y, discRadius * 0.6, x, y, radius);
    haloGrad.addColorStop(0, this.hexToRgba('#ffffff', 0.6 * intensity));
    haloGrad.addColorStop(0.15, this.hexToRgba(color, 0.45 * intensity));
    haloGrad.addColorStop(0.4, this.hexToRgba(secondaryColor, 0.25 * intensity));
    haloGrad.addColorStop(0.75, this.hexToRgba(secondaryColor, 0.08 * intensity));
    haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Moon Body Sphere
    if (moonPhase === 'crescent') {
      // 2A. Crescent Moon: Dark-side Earthshine + Brilliant Illuminated Arc
      // Earthshine (Faint ghostly unlit portion of moon)
      ctx.save();
      const earthshineGrad = ctx.createRadialGradient(x, y, 0, x, y, discRadius);
      earthshineGrad.addColorStop(0, 'rgba(30, 41, 59, 0.4)');
      earthshineGrad.addColorStop(0.85, 'rgba(15, 23, 42, 0.6)');
      earthshineGrad.addColorStop(1, 'rgba(2, 6, 23, 0.2)');
      ctx.fillStyle = earthshineGrad;
      ctx.beginPath();
      ctx.arc(x, y, discRadius, 0, Math.PI * 2);
      ctx.fill();

      // Delicate lunar rim line
      ctx.strokeStyle = this.hexToRgba(color, 0.25);
      ctx.lineWidth = 1;
      ctx.stroke();

      // Sharp Illuminated Crescent Sliver
      ctx.beginPath();
      ctx.arc(x, y, discRadius, -Math.PI / 2, Math.PI / 2, false);
      ctx.bezierCurveTo(
        x + discRadius * 0.45,
        y + discRadius * 0.7,
        x + discRadius * 0.45,
        y - discRadius * 0.7,
        x,
        y - discRadius
      );
      ctx.closePath();

      const crescentGrad = ctx.createLinearGradient(x, y - discRadius, x + discRadius, y);
      crescentGrad.addColorStop(0, '#ffffff');
      crescentGrad.addColorStop(0.5, this.hexToRgba(color, 0.95 * intensity));
      crescentGrad.addColorStop(1, this.hexToRgba(secondaryColor, 0.75 * intensity));
      ctx.fillStyle = crescentGrad;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 20 * intensity;
      ctx.fill();

      // Bright tips / horns starflare
      ctx.restore();
    } else if (moonPhase === 'blood') {
      // 2B. Blood Moon: Deep crimson eclipse with copper shading & fiery rim
      ctx.save();
      const bloodGrad = ctx.createRadialGradient(
        x - discRadius * 0.25,
        y - discRadius * 0.25,
        discRadius * 0.1,
        x,
        y,
        discRadius
      );
      bloodGrad.addColorStop(0, '#fca5a5');
      bloodGrad.addColorStop(0.3, '#dc2626');
      bloodGrad.addColorStop(0.7, '#991b1b');
      bloodGrad.addColorStop(1, '#450a0a');

      ctx.fillStyle = bloodGrad;
      ctx.beginPath();
      ctx.arc(x, y, discRadius, 0, Math.PI * 2);
      ctx.fill();

      // Umbra shadow arc
      const umbraGrad = ctx.createRadialGradient(x + discRadius * 0.3, y - discRadius * 0.2, 0, x, y, discRadius);
      umbraGrad.addColorStop(0, 'rgba(15, 23, 42, 0.75)');
      umbraGrad.addColorStop(0.8, 'rgba(69, 10, 10, 0.4)');
      umbraGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = umbraGrad;
      ctx.fill();

      // Fiery orange rim light
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.8)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    } else {
      // 2C. Full Moon: 3D sphere + realistic Lunar Maria (Craters and dark plains)
      ctx.save();
      // Base shaded sphere
      const baseGrad = ctx.createRadialGradient(
        x - discRadius * 0.3,
        y - discRadius * 0.3,
        discRadius * 0.1,
        x,
        y,
        discRadius
      );
      baseGrad.addColorStop(0, '#ffffff');
      baseGrad.addColorStop(0.4, '#f1f5f9');
      baseGrad.addColorStop(0.85, '#cbd5e1');
      baseGrad.addColorStop(1, '#94a3b8');

      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.arc(x, y, discRadius, 0, Math.PI * 2);
      ctx.fill();

      // Clip subsequent craters strictly inside the moon disc
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, discRadius, 0, Math.PI * 2);
      ctx.clip();

      // Realistic Lunar Maria (Dark basalt seas on the Moon)
      const maria = [
        { ox: -0.35, oy: -0.15, r: 0.28, op: 0.32 }, // Oceanus Procellarum
        { ox: -0.1, oy: -0.32, r: 0.22, op: 0.35 },  // Mare Imbrium
        { ox: 0.18, oy: -0.22, r: 0.19, op: 0.3 },   // Mare Serenitatis
        { ox: 0.32, oy: 0.02, r: 0.22, op: 0.34 },   // Mare Tranquillitatis
        { ox: 0.45, oy: -0.18, r: 0.13, op: 0.4 },   // Mare Crisium
        { ox: 0.08, oy: 0.18, r: 0.25, op: 0.28 },   // Mare Nubium
        { ox: -0.22, oy: 0.28, r: 0.18, op: 0.3 },   // Mare Humorum
      ];

      for (const m of maria) {
        const mx = x + m.ox * discRadius;
        const my = y + m.oy * discRadius;
        const mr = m.r * discRadius;

        const mGrad = ctx.createRadialGradient(mx, my, mr * 0.2, mx, my, mr);
        mGrad.addColorStop(0, `rgba(71, 85, 105, ${m.op * 1.2})`);
        mGrad.addColorStop(0.7, `rgba(100, 116, 139, ${m.op * 0.8})`);
        mGrad.addColorStop(1, 'rgba(100, 116, 139, 0)');

        ctx.fillStyle = mGrad;
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bright Tycho crater rays (bottom center)
      const tychoX = x + 0.05 * discRadius;
      const tychoY = y + 0.65 * discRadius;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1;
      for (let a = 0; a < 8; a++) {
        const rayAngle = (a * Math.PI) / 4 + 0.1;
        ctx.beginPath();
        ctx.moveTo(tychoX, tychoY);
        ctx.lineTo(
          tychoX + Math.cos(rayAngle) * discRadius * 0.4,
          tychoY + Math.sin(rayAngle) * discRadius * 0.4
        );
        ctx.stroke();
      }

      // Tycho central peak dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(tychoX, tychoY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric Limb Darkening on edge
      const rimGrad = ctx.createRadialGradient(x, y, discRadius * 0.82, x, y, discRadius);
      rimGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      rimGrad.addColorStop(1, 'rgba(51, 65, 85, 0.4)');
      ctx.fillStyle = rimGrad;
      ctx.fillRect(x - discRadius, y - discRadius, discRadius * 2, discRadius * 2);

      ctx.restore(); // remove clip
      ctx.restore();
    }

    // 3. Radiant Lunar Rim Corona
    ctx.save();
    const rimCorona = ctx.createRadialGradient(x, y, discRadius * 0.95, x, y, discRadius * 1.35);
    rimCorona.addColorStop(0, this.hexToRgba('#ffffff', 0.8 * intensity));
    rimCorona.addColorStop(0.3, this.hexToRgba(color, 0.4 * intensity));
    rimCorona.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = rimCorona;
    ctx.beginPath();
    ctx.arc(x, y, discRadius * 1.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  /**
   * Photorealistic Sun: Blazing Sun with Solar Corona, Sunset Disc, or Solar Eclipse
   */
  private static renderSun(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    config: LightingEffectConfig
  ) {
    const {
      sourceX: x,
      sourceY: y,
      radius,
      discRadius = 100,
      intensity,
      color,
      secondaryColor = '#f59e0b',
      beamAngle = 45,
      sunType = 'blaze',
      lensFlare = true,
    } = config;

    ctx.save();

    if (sunType === 'eclipse') {
      // 1A. Solar Eclipse (Diamond Ring & Black Sun)
      // Brilliant Outer Solar Corona
      const coronaGrad = ctx.createRadialGradient(x, y, discRadius * 0.8, x, y, radius * 0.7);
      coronaGrad.addColorStop(0, '#ffffff');
      coronaGrad.addColorStop(0.2, this.hexToRgba(color, 0.85 * intensity));
      coronaGrad.addColorStop(0.5, this.hexToRgba(secondaryColor, 0.4 * intensity));
      coronaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Streaming Solar Corona Tendrils
      for (let i = 0; i < 36; i++) {
        const angle = (i * 10 * Math.PI) / 180;
        const len = discRadius * (1.3 + Math.sin(i * 7) * 0.4);
        ctx.strokeStyle = this.hexToRgba(color, 0.25 * intensity);
        ctx.lineWidth = 2 + (i % 3);
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * discRadius, y + Math.sin(angle) * discRadius);
        ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        ctx.stroke();
      }

      // Pitch Black Moon Silhouette Blocking the Sun
      ctx.fillStyle = '#030712';
      ctx.beginPath();
      ctx.arc(x, y, discRadius, 0, Math.PI * 2);
      ctx.fill();

      // Blinding "Diamond Ring" Flare at edge
      const diamondAngle = (beamAngle * Math.PI) / 180;
      const dx = x + Math.cos(diamondAngle) * discRadius;
      const dy = y + Math.sin(diamondAngle) * discRadius;

      const diamondGrad = ctx.createRadialGradient(dx, dy, 0, dx, dy, 75);
      diamondGrad.addColorStop(0, '#ffffff');
      diamondGrad.addColorStop(0.2, this.hexToRgba(color, 0.9));
      diamondGrad.addColorStop(0.7, this.hexToRgba(secondaryColor, 0.3));
      diamondGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = diamondGrad;
      ctx.beginPath();
      ctx.arc(dx, dy, 75, 0, Math.PI * 2);
      ctx.fill();

      // Diamond Spike Flare
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(dx - 50, dy);
      ctx.lineTo(dx + 50, dy);
      ctx.moveTo(dx, dy - 50);
      ctx.lineTo(dx, dy + 50);
      ctx.stroke();
    } else if (sunType === 'sunset') {
      // 1B. Sunset Golden Sun Disc with atmospheric flattening & heat distortion
      // Sky atmospheric warm bath
      const skyGrad = ctx.createLinearGradient(x, y - discRadius * 2, width / 2, height);
      skyGrad.addColorStop(0, this.hexToRgba(secondaryColor, 0.7 * intensity));
      skyGrad.addColorStop(0.4, this.hexToRgba(color, 0.45 * intensity));
      skyGrad.addColorStop(1, 'rgba(255, 90, 20, 0.08)');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Atmospheric outer sun glow
      const sunAtmosphere = ctx.createRadialGradient(x, y, discRadius * 0.5, x, y, radius * 0.8);
      sunAtmosphere.addColorStop(0, this.hexToRgba('#ffffff', 0.9 * intensity));
      sunAtmosphere.addColorStop(0.2, this.hexToRgba(color, 0.75 * intensity));
      sunAtmosphere.addColorStop(0.6, this.hexToRgba(secondaryColor, 0.3 * intensity));
      sunAtmosphere.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sunAtmosphere;
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Flattened Horizon Sun Disc (Refraction effect)
      ctx.save();
      const discGrad = ctx.createLinearGradient(x, y - discRadius * 0.8, x, y + discRadius * 0.8);
      discGrad.addColorStop(0, '#ffffff');
      discGrad.addColorStop(0.3, this.hexToRgba(color, 0.98 * intensity));
      discGrad.addColorStop(1, this.hexToRgba(secondaryColor, 0.95 * intensity));
      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.ellipse(x, y, discRadius * 1.08, discRadius * 0.88, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // 1C. Blazing Daytime Sun with Massive Solar Corona & God Rays
      // Daylight Sky Wash
      const skyWash = ctx.createLinearGradient(x, y, width / 2, height);
      skyWash.addColorStop(0, this.hexToRgba(color, 0.55 * intensity));
      skyWash.addColorStop(0.6, this.hexToRgba(secondaryColor, 0.2 * intensity));
      skyWash.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = skyWash;
      ctx.fillRect(0, 0, width, height);

      // Radial Solar Corona
      const corona = ctx.createRadialGradient(x, y, discRadius * 0.3, x, y, radius * 0.6);
      corona.addColorStop(0, '#ffffff');
      corona.addColorStop(0.18, this.hexToRgba(color, 0.95 * intensity));
      corona.addColorStop(0.55, this.hexToRgba(secondaryColor, 0.4 * intensity));
      corona.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = corona;
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Blinding Sun Core Disc
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 30 * intensity;
      ctx.beginPath();
      ctx.arc(x, y, discRadius * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // God Rays / Crepuscular volumetric beams
      const numRays = 14;
      const rayLen = Math.max(width, height) * 1.3;
      const baseDir = (beamAngle * Math.PI) / 180;
      for (let i = 0; i < numRays; i++) {
        const offset = ((i - numRays / 2) * 6 * Math.PI) / 180;
        const angle = baseDir + offset;
        const rayWidth = (2.5 + (i % 3) * 2) * (Math.PI / 180);

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle - rayWidth) * rayLen, y + Math.sin(angle - rayWidth) * rayLen);
        ctx.lineTo(x + Math.cos(angle + rayWidth) * rayLen, y + Math.sin(angle + rayWidth) * rayLen);
        ctx.closePath();

        const rayGrad = ctx.createRadialGradient(x, y, discRadius, x, y, rayLen);
        rayGrad.addColorStop(0, this.hexToRgba('#ffffff', 0.5 * intensity));
        rayGrad.addColorStop(0.3, this.hexToRgba(color, 0.25 * intensity));
        rayGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = rayGrad;
        ctx.fill();
      }
    }

    // 2. Anamorphic Lens Flare & Hexagonal Aperture Reflections
    if (lensFlare) {
      this.renderAnamorphicFlare(ctx, width, height, x, y, discRadius, intensity, color, secondaryColor);
    }

    ctx.restore();
  }

  /**
   * Cinematic Anamorphic Lens Flare (Horizontal beam streak, 8-point starburst & hexagonal ghosts)
   */
  private static renderAnamorphicFlare(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    x: number,
    y: number,
    discRadius: number,
    intensity: number,
    color: string,
    secondaryColor: string
  ) {
    ctx.save();

    // 1. Horizontal Anamorphic Blue/Gold Streak across entire frame
    const streakH = 8;
    const streakGrad = ctx.createLinearGradient(0, y, width, y);
    streakGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    streakGrad.addColorStop(Math.max(0, x / width - 0.2), 'rgba(56, 189, 248, 0.25)');
    streakGrad.addColorStop(x / width, '#ffffff');
    streakGrad.addColorStop(Math.min(1, x / width + 0.2), 'rgba(56, 189, 248, 0.25)');
    streakGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

    ctx.fillStyle = streakGrad;
    ctx.fillRect(0, y - streakH / 2, width, streakH);

    // Thicker softer secondary streak
    const softStreak = ctx.createRadialGradient(x, y, 0, x, y, width * 0.45);
    softStreak.addColorStop(0, this.hexToRgba('#ffffff', 0.8 * intensity));
    softStreak.addColorStop(0.3, this.hexToRgba(color, 0.3 * intensity));
    softStreak.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(4, 0.25);
    ctx.fillStyle = softStreak;
    ctx.beginPath();
    ctx.arc(0, 0, width * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. 8-Point Diffraction Starburst Spikes
    ctx.strokeStyle = '#ffffff';
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 4;
      const spikeLen = discRadius * (i % 2 === 0 ? 2.5 : 1.7) * intensity;
      ctx.lineWidth = i % 2 === 0 ? 2 : 1.2;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(angle) * spikeLen, y - Math.sin(angle) * spikeLen);
      ctx.lineTo(x + Math.cos(angle) * spikeLen, y + Math.sin(angle) * spikeLen);
      ctx.stroke();
    }

    // 3. Hexagonal Aperture Iris Ghosts along vector from sun through screen center
    const centerX = width / 2;
    const centerY = height / 2;
    const vecX = centerX - x;
    const vecY = centerY - y;

    const ghostSteps = [
      { t: 0.35, size: 28, color: 'rgba(56, 189, 248, 0.35)' },
      { t: 0.65, size: 45, color: 'rgba(251, 191, 36, 0.25)' },
      { t: 1.15, size: 60, color: 'rgba(244, 63, 94, 0.2)' },
      { t: 1.45, size: 35, color: 'rgba(16, 185, 129, 0.25)' },
      { t: 1.85, size: 80, color: 'rgba(168, 85, 247, 0.18)' },
    ];

    for (const g of ghostSteps) {
      const gx = x + vecX * g.t;
      const gy = y + vecY * g.t;
      ctx.fillStyle = g.color;
      ctx.beginPath();
      for (let s = 0; s < 6; s++) {
        const hAngle = (s * Math.PI) / 3;
        const hx = gx + Math.cos(hAngle) * g.size;
        const hy = gy + Math.sin(hAngle) * g.size;
        if (s === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  private static hexToRgba(hex: string, alpha: number): string {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map((c) => c + c).join('');
    }
    const num = parseInt(cleanHex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
  }
}
