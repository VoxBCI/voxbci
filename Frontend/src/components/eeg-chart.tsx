import { usePathname } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { CardLayout, Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import {
  buildEegFrame,
  buildFlatEegFrame,
  EEG_CHANNELS,
  EEG_SAMPLE_RATE,
  EEG_WINDOW_SECONDS,
  type EegTrace,
} from '@/data/eeg';
import { useThemeScheme } from '@/hooks/use-theme';

const ROW_HEIGHT = 68;
const TOP_PADDING = 10;
const AXIS_HEIGHT = 24;
/** Fits the 20px channel labels ("CH 01"). */
const GUTTER = 72;
const RIGHT_PADDING = 12;

/**
 * The card follows the component-surface rule: the page colour fills it and the
 * raised-surface colour (`Colors[scheme].secondary`) outlines it, so it sits
 * flush with the page and is defined by its stroke.
 */
const PALETTES = {
  light: {
    background: '#FFFFFF',
    border: '#D9E1F8',
    grid: 'rgba(0, 37, 76, 0.14)',
    midline: 'rgba(0, 37, 76, 0.07)',
    muted: 'rgba(0, 37, 76, 0.55)',
    /** Darker channel inks so the labels stay legible on the pale surface. */
    labelInk: {
      'CH 01': '#0284C7',
      'CH 02': '#7C3AED',
      'CH 03': '#047857',
      'CH 04': '#B45309',
      'CH 05': '#E11D48',
    } as Record<string, string>,
  },
  dark: {
    background: '#000000',
    border: '#262626',
    grid: 'rgba(148, 163, 184, 0.13)',
    midline: 'rgba(148, 163, 184, 0.07)',
    muted: 'rgba(226, 232, 240, 0.55)',
    /** On navy the trace colours already read well. */
    labelInk: {} as Record<string, string>,
  },
} as const;

type Palette = (typeof PALETTES)[keyof typeof PALETTES];

const MONO = Fonts.mono;

const PLOT_HEIGHT = ROW_HEIGHT * EEG_CHANNELS.length;
const SVG_HEIGHT = TOP_PADDING + PLOT_HEIGHT + AXIS_HEIGHT;

/**
 * Smooth the polyline with quadratic segments through sample midpoints. At this
 * sample density it removes visible corners without inventing large swings.
 */
function tracePath(
  samples: number[],
  width: number,
  centerY: number,
  halfHeight: number,
  range: number,
) {
  const step = width / (samples.length - 1);
  let x = 0;
  let y = centerY - (samples[0] / range) * halfHeight;
  let d = `M ${x.toFixed(2)} ${y.toFixed(2)}`;

  for (let i = 1; i < samples.length; i += 1) {
    const nextX = i * step;
    const nextY = centerY - (samples[i] / range) * halfHeight;
    d += ` Q ${x.toFixed(2)} ${y.toFixed(2)} ${((x + nextX) / 2).toFixed(2)} ${(
      (y + nextY) /
      2
    ).toFixed(2)}`;
    x = nextX;
    y = nextY;
  }

  return `${d} L ${x.toFixed(2)} ${y.toFixed(2)}`;
}

function TimeAxis({ width, palette }: { width: number; palette: Palette }) {
  const { ticks, labels } = useMemo(() => {
    const tickStep = EEG_WINDOW_SECONDS <= 1 ? 0.1 : 1;
    const labelStep = EEG_WINDOW_SECONDS <= 1 ? 0.5 : 1;
    const tickList: number[] = [];
    const labelList: { x: number; text: string; anchor: 'start' | 'middle' | 'end' }[] = [];
    const steps = Math.round(EEG_WINDOW_SECONDS / tickStep);

    for (let i = 0; i <= steps; i += 1) {
      const second = Number((i * tickStep).toFixed(10));
      const x = (second / EEG_WINDOW_SECONDS) * width;
      tickList.push(x);

      const isLabel = Math.abs(second / labelStep - Math.round(second / labelStep)) < 1e-6;
      if (isLabel) {
        const text = Number.isInteger(second) ? `${second}` : second.toFixed(1);
        labelList.push({
          x,
          text,
          anchor: i === 0 ? 'start' : i === steps ? 'end' : 'middle',
        });
      }
    }

    return { ticks: tickList, labels: labelList };
  }, [width]);

  const baseline = TOP_PADDING + PLOT_HEIGHT;

  return (
    <G>
      {ticks.map((x) => (
        <Line
          key={`tick-${x}`}
          x1={x}
          x2={x}
          y1={baseline}
          y2={baseline + 4}
          stroke={palette.grid}
          strokeWidth={1}
        />
      ))}
      {labels.map((label) => (
        <SvgText
          key={`label-${label.text}`}
          x={label.x}
          y={baseline + 16}
          fill={palette.muted}
          fontFamily={MONO}
          fontSize={9.5}
          textAnchor={label.anchor}>
          {label.text}
        </SvgText>
      ))}
    </G>
  );
}

function Trace({ trace, row, width }: { trace: EegTrace; row: number; width: number }) {
  const { channel, samples } = trace;
  const halfHeight = (ROW_HEIGHT - 10) / 2;
  const centerY = TOP_PADDING + row * ROW_HEIGHT + ROW_HEIGHT / 2;
  const path = tracePath(samples, width, centerY, halfHeight, channel.range);
  const last = samples[samples.length - 1];

  return (
    <G>
      <Path
        d={path}
        fill="none"
        stroke={channel.color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.14}
      />
      <Path
        d={path}
        fill="none"
        stroke={channel.color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={width - 1}
        cy={centerY - (last / channel.range) * halfHeight}
        r={2.6}
        fill={channel.color}
      />
    </G>
  );
}

export function EegChart({ streaming = false }: { streaming?: boolean }) {
  const pathname = usePathname();
  const onTelemetry = pathname === '/telemetry';
  const active = onTelemetry && streaming;
  const palette = PALETTES[useThemeScheme()];
  const { width: viewportWidth } = useWindowDimensions();
  const [elapsed, setElapsed] = useState(0);
  const [measuredWidth, setMeasuredWidth] = useState(0);

  useEffect(() => {
    if (!active) return;

    const id = setInterval(() => {
      setElapsed((value) => value + 0.015);
    }, 100);

    return () => clearInterval(id);
  }, [active]);

  const frame = useMemo(
    () => (streaming ? buildEegFrame(elapsed) : buildFlatEegFrame()),
    [elapsed, streaming],
  );

  // `onLayout` is unreliable during web hydration, so derive a width from the
  // viewport (same padding/max-width as the screen) and let the measured value
  // refine it once the plot actually lays out.
  const estimatedCardWidth = Math.min(
    Math.max(
      viewportWidth > 0 ? viewportWidth - CardLayout.gutter * 2 : MaxContentWidth,
      240,
    ),
    MaxContentWidth,
  );
  const estimatedPlotWidth = Math.max(
    140,
    estimatedCardWidth - Spacing.three * 2 - GUTTER - RIGHT_PADDING,
  );
  const plotWidth =
    measuredWidth > 0
      ? Math.max(140, measuredWidth - GUTTER - RIGHT_PADDING)
      : estimatedPlotWidth;
  const svgWidth = plotWidth + GUTTER + RIGHT_PADDING;

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setMeasuredWidth((current) => (Math.abs(current - next) < 0.5 ? current : next));
  };

  return (
    <View
      accessible
      accessibilityLabel={
        streaming
          ? `Five simulated EEG channels on a ${EEG_WINDOW_SECONDS} second rolling window, sampled at ${EEG_SAMPLE_RATE} hertz.`
          : 'EEG telemetry idle with flat baseline traces.'
      }
      style={[
        styles.card,
        { backgroundColor: palette.background, opacity: streaming ? 1 : 0.5 },
      ]}>
      <View onLayout={onLayout} style={styles.plotArea}>
        <Svg width="100%" height={SVG_HEIGHT} viewBox={`0 0 ${svgWidth} ${SVG_HEIGHT}`}>
          {EEG_CHANNELS.map((channel, row) => {
            const top = TOP_PADDING + row * ROW_HEIGHT;
            return (
              <G key={`row-${channel.id}`}>
                <Line
                  x1={GUTTER}
                  x2={svgWidth - RIGHT_PADDING}
                  y1={top}
                  y2={top}
                  stroke={palette.grid}
                  strokeWidth={1}
                />
                <Line
                  x1={GUTTER}
                  x2={svgWidth - RIGHT_PADDING}
                  y1={top + ROW_HEIGHT / 2}
                  y2={top + ROW_HEIGHT / 2}
                  stroke={palette.midline}
                  strokeWidth={1}
                  strokeDasharray={[2, 6]}
                />
                <SvgText
                  x={0}
                  y={top + ROW_HEIGHT / 2 + 7}
                  fill={palette.labelInk[channel.id] ?? channel.color}
                  fontFamily={MONO}
                  fontSize={20}
                  fontWeight="700"
                  textAnchor="start">
                  {channel.id}
                </SvgText>
                <SvgText
                  x={0}
                  y={top + ROW_HEIGHT / 2 + 20}
                  fill={palette.muted}
                  fontFamily={MONO}
                  fontSize={9}
                  textAnchor="start">
                  {`±${channel.range} µV`}
                </SvgText>
              </G>
            );
          })}

          <Line
            x1={GUTTER}
            x2={svgWidth - RIGHT_PADDING}
            y1={TOP_PADDING + PLOT_HEIGHT}
            y2={TOP_PADDING + PLOT_HEIGHT}
            stroke={palette.grid}
            strokeWidth={1}
          />

          <G transform={`translate(${GUTTER}, 0)`}>
            {frame.map((trace, row) => (
              <Trace key={trace.channel.id} trace={trace} row={row} width={plotWidth} />
            ))}
            <TimeAxis width={plotWidth} palette={palette} />
          </G>
        </Svg>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: palette.muted }]}>
          Amplitude (µV) · per-channel scale
        </Text>
        <Text style={[styles.footerText, { color: palette.muted }]}>Time (s)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  plotArea: {
    width: '100%',
    minHeight: SVG_HEIGHT,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  footerText: {
    fontFamily: MONO,
    fontSize: 10,
  },
});
