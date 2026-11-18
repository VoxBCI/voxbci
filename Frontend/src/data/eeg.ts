/**
 * Synthetic, TGAM-inspired EEG used by the telemetry dashboard.
 *
 * Nothing here talks to hardware: every sample is generated deterministically
 * from the elapsed session time, so the waveform can roll forward for as long
 * as the screen stays open. A standard TGAM module reports a single raw EEG
 * channel (plus attention/meditation values), so these five streams are purely
 * a frontend demonstration — never present them as a real recording.
 */

/** Width of the rolling window, in seconds. */
export const EEG_WINDOW_SECONDS = 2;

/** Samples per second drawn for each channel. */
export const EEG_SAMPLE_RATE = 128;

const TAU = Math.PI * 2;

export type EegChannel = {
  /** Channel label shown in the trace gutter and legend. */
  id: string;
  /** Peak positive/negative excursion in microvolts. */
  range: number;
  /** Trace, label, and legend colour. */
  color: string;
  /** Dominant alpha rhythm. */
  alphaHz: number;
  alphaAmp: number;
  /** Faster beta ripple layered over the alpha rhythm. */
  betaHz: number;
  betaAmp: number;
  /** Slow theta wander. */
  thetaHz: number;
  thetaAmp: number;
  /** Very slow baseline drift. */
  driftHz: number;
  driftAmp: number;
  /** Band-limited value noise that keeps the trace from looking periodic. */
  noiseHz: number;
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
 * Five independently configured channels. Frequencies, amplitudes, and phases
 * all differ, so no two traces can line up.
 */
export const EEG_CHANNELS: readonly EegChannel[] = [
  {
    id: 'CH 01',
    range: 25,
    color: '#38BDF8',
    alphaHz: 10.4,
    alphaAmp: 13,
    betaHz: 21.8,
    betaAmp: 1,
    thetaHz: 6.3,
    thetaAmp: 2.6,
    driftHz: 0.23,
    driftAmp: 2.4,
    noiseHz: 11,
    noiseAmp: 0.6,
    blinkAmp: 4,
    blinkPeriod: 5.3,
    seed: 1.7,
    phase: 0.4,
  },
  {
    id: 'CH 02',
    range: 20,
    color: '#A78BFA',
    alphaHz: 9.1,
    alphaAmp: 10,
    betaHz: 19.4,
    betaAmp: 1.1,
    thetaHz: 5.4,
    thetaAmp: 2.2,
    driftHz: 0.17,
    driftAmp: 2,
    noiseHz: 13,
    noiseAmp: 0.5,
    blinkAmp: 3.2,
    blinkPeriod: 4.7,
    seed: 4.3,
    phase: 2.1,
  },
  {
    id: 'CH 03',
    range: 30,
    color: '#34D399',
    alphaHz: 11.3,
    alphaAmp: 15.5,
    betaHz: 24.1,
    betaAmp: 1.4,
    thetaHz: 7.1,
    thetaAmp: 3,
    driftHz: 0.29,
    driftAmp: 3,
    noiseHz: 8.5,
    noiseAmp: 0.7,
    blinkAmp: 4.8,
    blinkPeriod: 6.1,
    seed: 7.9,
    phase: 3.6,
  },
  {
    id: 'CH 04',
    range: 18,
    color: '#FBBF24',
    alphaHz: 8.6,
    alphaAmp: 9,
    betaHz: 17.8,
    betaAmp: 0.9,
    thetaHz: 4.7,
    thetaAmp: 2,
    driftHz: 0.13,
    driftAmp: 1.6,
    noiseHz: 15,
    noiseAmp: 0.4,
    blinkAmp: 2.6,
    blinkPeriod: 4.3,
    seed: 11.2,
    phase: 5.2,
  },
  {
    id: 'CH 05',
    range: 22,
    color: '#FB7185',
    alphaHz: 10,
    alphaAmp: 11.5,
    betaHz: 22.6,
    betaAmp: 1,
    thetaHz: 6.8,
    thetaAmp: 2.4,
    driftHz: 0.21,
    driftAmp: 2.2,
    noiseHz: 10.5,
    noiseAmp: 0.5,
    blinkAmp: 3.6,
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

/** One blink-like bump per period, with a small undershoot after it. */
function blink(seconds: number, period: number) {
  const wrapped = ((seconds % period) + period) % period;
  const distance = wrapped - period / 2;
  const bump = Math.exp(-(distance * distance) / (2 * 0.09 * 0.09));
  const rebound = Math.exp(-((distance + 0.26) ** 2) / (2 * 0.13 * 0.13));
  return bump - 0.45 * rebound;
}

/**
 * One channel's value at a given session time, in microvolts.
 *
 * Several incommensurate rhythms are summed, then squashed with `tanh` so the
 * trace stays inside the channel's displayed range without hard clipping.
 */
export function eegSample(channel: EegChannel, seconds: number) {
  const t = seconds;

  const raw =
    channel.alphaAmp * Math.sin(TAU * channel.alphaHz * t + channel.phase) +
    channel.betaAmp * Math.sin(TAU * channel.betaHz * t + channel.phase * 1.9) +
    channel.thetaAmp * Math.sin(TAU * channel.thetaHz * t + channel.phase * 0.7) +
    channel.driftAmp * Math.sin(TAU * channel.driftHz * t + channel.phase * 2.3) +
    channel.noiseAmp * valueNoise(t * channel.noiseHz, channel.seed) +
    channel.blinkAmp * blink(t + channel.phase, channel.blinkPeriod);

  return channel.range * Math.tanh(raw / channel.range);
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
    return { channel, samples };
  });
}
