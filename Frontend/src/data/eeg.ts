/**
 * Synthetic, TGAM-inspired EEG used by the telemetry dashboard.
 *
 * Nothing here talks to hardware: every sample is generated deterministically
 * from the elapsed session time, so the waveform can roll forward for as long
 * as the screen stays open. A standard TGAM module reports a single raw EEG
 * channel (plus attention/meditation values), so these five streams are purely
 * a frontend demonstration — never present them as a real recording.
 *
 * Why it does not look like a sine wave:
 *
 * - **Spindles** — alpha waxes and wanes (0.2–0.4 Hz envelope), so it arrives in
 *   bursts instead of holding a constant amplitude.
 * - **Frequency wander** — the alpha phase is frequency-modulated ±8 %, so peaks
 *   never keep an exact spacing.
 * - **Harmonics** — a little second and third harmonic makes peaks sharper than
 *   troughs, the way real alpha looks.
 * - **1/f background** — four octaves of value noise give a smooth, pink-ish
 *   baseline wander instead of clean sines.
 * - **Blink deflections** — an occasional slow bump with a small undershoot.
 * - **Low-pass filter** — the summed signal is run through a two-pole low-pass at
 *   `LOWPASS_HZ`, so everything drawn is band-limited and the trace reads smooth,
 *   like a recording that was filtered before it reached the screen.
 */

/** Width of the rolling window, in seconds. */
export const EEG_WINDOW_SECONDS = 0.5;

/** Samples per second drawn for each channel. */
export const EEG_SAMPLE_RATE = 256;

/**
 * Two cascaded one-pole low-pass stages at this cutoff. Well above alpha
 * (8–12 Hz), so the rhythm survives; high enough above beta to remove the
 * sample-to-sample hash that made the old trace look synthetic.
 */
const LOWPASS_HZ = 24;

const TAU = Math.PI * 2;

export type EegChannel = {
  /** Channel label shown in the trace gutter and legend. */
  id: string;
  /** Peak positive/negative excursion in microvolts. */
  range: number;
  /** Trace, label, and legend colour. */
  color: string;

  /** Dominant alpha rhythm, 8–12 Hz. */
  alphaHz: number;
  alphaAmp: number;
  /** Slow amplitude modulation that produces alpha spindles. */
  spindleHz: number;
  /** 0 = steady tone, 0.5 = deep bursts. */
  spindleDepth: number;
  /** Slow frequency wobble: how far alpha drifts and how quickly. */
  wobbleHz: number;
  wobbleDepth: number;

  /** Slow theta wander. */
  thetaHz: number;
  thetaAmp: number;
  /** Very slow delta/baseline component. */
  deltaHz: number;
  deltaAmp: number;
  /** Faster beta ripple layered under the alpha rhythm. */
  betaHz: number;
  betaAmp: number;

  /** Amplitude of the 1/f background noise. */
  noiseAmp: number;

  /** Large slow deflection that mimics an eye blink. */
  blinkAmp: number;
  blinkPeriod: number;

  /** Separates the noise streams so channels never share a waveform. */
  seed: number;
  /** Start offset (radians / seconds) applied to every rhythm. */
  phase: number;
};

/**
 * Five independently configured channels. Frequencies, amplitudes, spindle
 * rates and phases all differ, so no two traces can line up.
 */
export const EEG_CHANNELS: readonly EegChannel[] = [
  {
    id: 'CH 01',
    range: 12.5,
    color: '#38BDF8',
    alphaHz: 10.4,
    alphaAmp: 8.4,
    spindleHz: 0.27,
    spindleDepth: 0.45,
    wobbleHz: 0.37,
    wobbleDepth: 0.07,
    thetaHz: 5.1,
    thetaAmp: 1.5,
    deltaHz: 1.25,
    deltaAmp: 1.2,
    betaHz: 18.6,
    betaAmp: 0.5,
    noiseAmp: 0.95,
    blinkAmp: 2.2,
    blinkPeriod: 5.3,
    seed: 1.7,
    phase: 0.4,
  },
  {
    id: 'CH 02',
    range: 10,
    color: '#A78BFA',
    alphaHz: 9.1,
    alphaAmp: 6.4,
    spindleHz: 0.21,
    spindleDepth: 0.5,
    wobbleHz: 0.29,
    wobbleDepth: 0.09,
    thetaHz: 4.4,
    thetaAmp: 1.7,
    deltaHz: 0.9,
    deltaAmp: 1.1,
    betaHz: 19.8,
    betaAmp: 0.45,
    noiseAmp: 0.85,
    blinkAmp: 1.7,
    blinkPeriod: 4.7,
    seed: 4.3,
    phase: 2.1,
  },
  {
    id: 'CH 03',
    range: 15,
    color: '#34D399',
    alphaHz: 11.2,
    alphaAmp: 10.2,
    spindleHz: 0.33,
    spindleDepth: 0.4,
    wobbleHz: 0.43,
    wobbleDepth: 0.06,
    thetaHz: 6.2,
    thetaAmp: 2,
    deltaHz: 1.6,
    deltaAmp: 1.6,
    betaHz: 22.1,
    betaAmp: 0.6,
    noiseAmp: 1.15,
    blinkAmp: 2.6,
    blinkPeriod: 6.1,
    seed: 7.9,
    phase: 3.6,
  },
  {
    id: 'CH 04',
    range: 9,
    color: '#FBBF24',
    alphaHz: 8.6,
    alphaAmp: 5.6,
    spindleHz: 0.18,
    spindleDepth: 0.55,
    wobbleHz: 0.24,
    wobbleDepth: 0.1,
    thetaHz: 3.9,
    thetaAmp: 1.9,
    deltaHz: 0.72,
    deltaAmp: 1.3,
    betaHz: 17.4,
    betaAmp: 0.4,
    noiseAmp: 0.8,
    blinkAmp: 1.4,
    blinkPeriod: 4.3,
    seed: 11.2,
    phase: 5.2,
  },
  {
    id: 'CH 05',
    range: 11,
    color: '#FB7185',
    alphaHz: 10,
    alphaAmp: 7.4,
    spindleHz: 0.3,
    spindleDepth: 0.48,
    wobbleHz: 0.34,
    wobbleDepth: 0.08,
    thetaHz: 5.7,
    thetaAmp: 1.4,
    deltaHz: 1.05,
    deltaAmp: 1,
    betaHz: 20.7,
    betaAmp: 0.5,
    noiseAmp: 0.9,
    blinkAmp: 2,
    blinkPeriod: 5.9,
    seed: 14.6,
    phase: 1.1,
  },
] as const;

export type EegTrace = {
  channel: EegChannel;
  /** Microvolt samples across the window, oldest first. */
  samples: number[];
};

/** Tiny deterministic pseudo-random value in `[-1, 1]`. */
function hash(index: number, seed: number) {
  const value = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

/** Smooth value noise: continuous in time, so the rolling window is stable. */
function valueNoise(x: number, seed: number) {
  const index = Math.floor(x);
  const fraction = x - index;
  const eased = fraction * fraction * (3 - 2 * fraction);
  const a = hash(index, seed);
  const b = hash(index + 1, seed);
  return a + (b - a) * eased;
}

/**
 * Cheap 1/f background: four octaves of value noise, each quieter than the last.
 * The result is roughly `[-1, 1]` and smooth, unlike white noise.
 */
function pinkNoise(seconds: number, seed: number) {
  let sum = 0;
  let amplitude = 1;
  let frequency = 0.8;

  for (let octave = 0; octave < 4; octave += 1) {
    sum += amplitude * valueNoise(seconds * frequency, seed + octave * 7.3);
    amplitude *= 0.55;
    frequency *= 2;
  }

  return sum / 2;
}

/**
 * Alpha phase with a slow frequency wobble.
 *
 * The wobble is integrated rather than added to the phase, so the instantaneous
 * frequency drifts smoothly instead of jumping when the modulation moves.
 */
function alphaPhase(channel: EegChannel, seconds: number) {
  const modulation = TAU * channel.wobbleHz * seconds + channel.phase;
  const drift =
    (channel.alphaHz * channel.wobbleDepth / channel.wobbleHz) * Math.cos(modulation);

  return TAU * channel.alphaHz * seconds - drift + channel.phase;
}

/** Alpha rhythm with a spindle envelope and a touch of harmonic asymmetry. */
function alphaRhythm(channel: EegChannel, seconds: number) {
  const phase = alphaPhase(channel, seconds);
  const envelope =
    1 + channel.spindleDepth * Math.sin(TAU * channel.spindleHz * seconds + channel.phase * 0.6);

  const shaped =
    Math.sin(phase) +
    0.16 * Math.sin(2 * phase + 0.7) +
    0.06 * Math.sin(3 * phase + 2.1);

  return channel.alphaAmp * envelope * shaped;
}

/** One blink-like bump per period, with a small undershoot after it. */
function blink(seconds: number, period: number) {
  const wrapped = ((seconds % period) + period) % period;
  const distance = wrapped - period / 2;
  const bump = Math.exp(-(distance * distance) / (2 * 0.09 * 0.09));
  const rebound = Math.exp(-((distance + 0.26) ** 2) / (2 * 0.13 * 0.13));
  return bump - 0.45 * rebound;
}

/**
 * One channel's value at a given session time, in microvolts — before filtering.
 *
 * Several incommensurate rhythms plus a pink background are summed, then
 * squashed with `tanh` so the trace stays inside the channel's displayed range
 * without hard clipping.
 */
export function eegSample(channel: EegChannel, seconds: number) {
  const raw =
    alphaRhythm(channel, seconds) +
    channel.thetaAmp * Math.sin(TAU * channel.thetaHz * seconds + channel.phase * 1.7) +
    channel.deltaAmp * Math.sin(TAU * channel.deltaHz * seconds + channel.phase * 2.9) +
    channel.betaAmp * Math.sin(TAU * channel.betaHz * seconds + channel.phase * 0.4) +
    channel.noiseAmp * pinkNoise(seconds, channel.seed) +
    channel.blinkAmp * blink(seconds + channel.phase, channel.blinkPeriod);

  return channel.range * Math.tanh(raw / channel.range);
}

/**
 * Two-pole low-pass at `LOWPASS_HZ`, applied to the finished window.
 *
 * Sampling starts from the first value, so the filter settles within a sample or
 * two; at 128 Hz that is far below anything visible.
 */
function lowPass(samples: number[], sampleRate: number, cutoffHz: number) {
  const alpha = Math.exp(-TAU * cutoffHz / sampleRate);
  const out = new Array<number>(samples.length);
  let stage1 = samples[0] ?? 0;
  let stage2 = stage1;

  for (let i = 0; i < samples.length; i += 1) {
    stage1 = (1 - alpha) * samples[i] + alpha * stage1;
    stage2 = (1 - alpha) * stage1 + alpha * stage2;
    out[i] = stage2;
  }

  return out;
}

/**
 * Samples every channel over the window ending at `elapsedSeconds`.
 * Call it again with a later time to advance the rolling window.
 */
export function buildEegFrame(elapsedSeconds: number): EegTrace[] {
  const start = elapsedSeconds - EEG_WINDOW_SECONDS;
  const sampleCount = EEG_WINDOW_SECONDS * EEG_SAMPLE_RATE + 1;

  return EEG_CHANNELS.map((channel) => {
    const samples = new Array<number>(sampleCount);
    for (let i = 0; i < sampleCount; i += 1) {
      samples[i] = eegSample(channel, start + i / EEG_SAMPLE_RATE);
    }

    return { channel, samples: lowPass(samples, EEG_SAMPLE_RATE, LOWPASS_HZ) };
  });
}

/**
 * Flat baseline frame used before a headset stream is active.
 */
export function buildFlatEegFrame(): EegTrace[] {
  const sampleCount = EEG_WINDOW_SECONDS * EEG_SAMPLE_RATE + 1;

  return EEG_CHANNELS.map((channel) => ({
    channel,
    samples: new Array<number>(sampleCount).fill(0),
  }));
}
