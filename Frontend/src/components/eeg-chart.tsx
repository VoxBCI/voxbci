import { usePathname } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import {
  buildEegFrame,
  EEG_CHANNELS,
  EEG_SAMPLE_RATE,
  EEG_WINDOW_SECONDS,
  type EegTrace,
} from '@/data/eeg';

const ROW_HEIGHT = 56;
const TOP_PADDING = 10;
const AXIS_HEIGHT = 24;
const GUTTER = 54;
const RIGHT_PADDING = 12;

const CARD_BACKGROUND = '#05121F';
const CARD_BORDER = 'rgba(56, 189, 248, 0.18)';
const CARD_TEXT = '#E2E8F0';
const CARD_MUTED = 'rgba(226, 232, 240, 0.55)';
const GRID_COLOR = 'rgba(148, 163, 184, 0.13)';
const GRID_MIDLINE = 'rgba(148, 163, 184, 0.07)';
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

function TimeAxis({ width }: { width: number }) {
  const { ticks, labels } = useMemo(() => {
    const tickList: number[] = [];
    const labelList: { x: number; text: string; anchor: 'start' | 'middle' | 'end' }[] = [];

    for (let second = 0; second <= EEG_WINDOW_SECONDS; second += 1) {
      const x = (second / EEG_WINDOW_SECONDS) * width;
      tickList.push(x);
      labelList.push({
        x,
        text: `${second}`,
        anchor: second === 0 ? 'start' : second === EEG_WINDOW_SECONDS ? 'end' : 'middle',
      });
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
          stroke={GRID_COLOR}
          strokeWidth={1}
        />
      ))}
      {labels.map((label) => (
        <SvgText
          key={`label-${label.text}`}
          x={label.x}
          y={baseline + 16}
          fill={CARD_MUTED}
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
  const halfHeight = (ROW_HEIGHT - 14) / 2;
  const centerY = TOP_PADDING + row * ROW_HEIGHT + ROW_HEIGHT / 2;
  const path = tracePath(samples, width, centerY, halfHeight, channel.range);
  const last = samples[samples.length - 1];

  return (
    <G>
      <Path
        d={path}
        fill="none"
        stroke={channel.color}
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.16}
      />
      <Path
        d={path}
        fill="none"
        stroke={channel.color}
        strokeWidth={1.7}
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

export function EegChart() {
  const pathname = usePathname();
  const active = pathname === '/telemetry';
  const [elapsed, setElapsed] = useState(0);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!active) return;

    const id = setInterval(() => {
      setElapsed((value) => value + 0.1);
    }, 100);

    return () => clearInterval(id);
  }, [active]);

  const frame = useMemo(() => buildEegFrame(elapsed), [elapsed]);
  const plotWidth = Math.max(0, width - GUTTER - RIGHT_PADDING);

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setWidth((current) => (Math.abs(current - next) < 0.5 ? current : next));
  };

  return (
    <View
      accessible
      accessibilityLabel={`Five simulated EEG channels on a ${EEG_WINDOW_SECONDS} second rolling window, sampled at ${EEG_SAMPLE_RATE} hertz.`}
      style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Neural stream</Text>
          <Text style={styles.subtitle}>
            {EEG_WINDOW_SECONDS} s rolling window · {EEG_SAMPLE_RATE} Hz
          </Text>
        </View>

        <View style={styles.status}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Simulated</Text>
        </View>
      </View>

      <View style={styles.legend}>
        {EEG_CHANNELS.map((channel) => (
          <View key={channel.id} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: channel.color }]} />
            <Text style={[styles.legendText, { color: channel.color }]}>{channel.id}</Text>
          </View>
        ))}
      </View>

      <View onLayout={onLayout} style={styles.plotArea}>
        {plotWidth > 0 ? (
          <Svg width="100%" height={SVG_HEIGHT} viewBox={`0 0 ${width} ${SVG_HEIGHT}`}>
            {EEG_CHANNELS.map((channel, row) => {
              const top = TOP_PADDING + row * ROW_HEIGHT;
              return (
                <G key={`row-${channel.id}`}>
                  <Line
                    x1={GUTTER}
                    x2={width - RIGHT_PADDING}
                    y1={top}
                    y2={top}
                    stroke={GRID_COLOR}
                    strokeWidth={1}
                  />
                  <Line
                    x1={GUTTER}
                    x2={width - RIGHT_PADDING}
                    y1={top + ROW_HEIGHT / 2}
                    y2={top + ROW_HEIGHT / 2}
                    stroke={GRID_MIDLINE}
                    strokeWidth={1}
                    strokeDasharray={[2, 6]}
                  />
                  <SvgText
                    x={0}
                    y={top + ROW_HEIGHT / 2 - 4}
                    fill={channel.color}
                    fontFamily={MONO}
                    fontSize={10}
                    fontWeight="700"
                    textAnchor="start">
                    {channel.id}
                  </SvgText>
                  <SvgText
                    x={0}
                    y={top + ROW_HEIGHT / 2 + 11}
                    fill={CARD_MUTED}
                    fontFamily={MONO}
                    fontSize={8.5}
                    textAnchor="start">
                    {`±${channel.range} µV`}
                  </SvgText>
                </G>
              );
            })}

            <Line
              x1={GUTTER}
              x2={width - RIGHT_PADDING}
              y1={TOP_PADDING + PLOT_HEIGHT}
              y2={TOP_PADDING + PLOT_HEIGHT}
              stroke={GRID_COLOR}
              strokeWidth={1}
            />

            <G transform={`translate(${GUTTER}, 0)`}>
              {frame.map((trace, row) => (
                <Trace key={trace.channel.id} trace={trace} row={row} width={plotWidth} />
              ))}
              <TimeAxis width={plotWidth} />
            </G>
          </Svg>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Amplitude (µV) · per-channel scale</Text>
        <Text style={styles.footerText}>Time (s)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: CARD_BACKGROUND,
    borderColor: CARD_BORDER,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerText: {
    flexShrink: 1,
    gap: 2,
  },
  title: {
    color: CARD_TEXT,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: CARD_MUTED,
    fontSize: 12,
    fontFamily: MONO,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  statusText: {
    color: '#6EE7B7',
    fontSize: 11,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(148, 163, 184, 0.09)',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: '600',
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
    color: CARD_MUTED,
    fontFamily: MONO,
    fontSize: 10,
  },
});
