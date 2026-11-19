import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EegChart } from '@/components/eeg-chart';
import { OutlinedView } from '@/components/outlined-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  CardLayout,
  Fonts,
  MaxContentWidth,
  Radius,
  Spacing,
  StrokeWidth,
} from '@/constants/theme';
import { useTheme, useThemeScheme } from '@/hooks/use-theme';
import { SYMBOL_FONT_FAMILY, useSymbolFont } from '@/hooks/use-symbol-font';

type IntentReading = {
  id: string;
  intent: string;
  timestamp: string;
  confidence: number;
};

const DUMMY_READINGS: IntentReading[] = [
  { id: '1', intent: 'Attempted movement', timestamp: 'Today · 14:32:18', confidence: 0.94 },
  { id: '2', intent: 'Need food', timestamp: 'Today · 14:31:42', confidence: 0.91 },
  { id: '3', intent: 'Need restroom', timestamp: 'Today · 14:30:55', confidence: 0.88 },
  { id: '4', intent: 'Need water', timestamp: 'Today · 14:29:10', confidence: 0.93 },
  { id: '5', intent: 'Call caregiver', timestamp: 'Today · 14:27:36', confidence: 0.96 },
  { id: '6', intent: 'Feeling discomfort', timestamp: 'Today · 14:25:04', confidence: 0.84 },
  { id: '7', intent: 'Yes', timestamp: 'Today · 14:23:51', confidence: 0.97 },
  { id: '8', intent: 'No', timestamp: 'Today · 14:22:19', confidence: 0.95 },
  { id: '9', intent: 'Attempted movement', timestamp: 'Today · 14:20:48', confidence: 0.89 },
  { id: '10', intent: 'Need repositioning', timestamp: 'Today · 14:18:07', confidence: 0.86 },
];

const LOADING_FRAMES = ['.', '..', '...', '....', '.....', ".....'", ".....'.", ".....'..", ".....'..."];

function useTerminalLoading(active: boolean) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setFrame((value) => (value + 1) % LOADING_FRAMES.length);
    }, 220);
    return () => clearInterval(id);
  }, [active]);

  return LOADING_FRAMES[frame];
}

async function copyText(value: string) {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // fall through
    }
  }
  // Fallback: best-effort no-op on platforms without clipboard access wired up.
}

function LoadingCard({
  state,
  devices,
  logsColor,
  connectedDevice,
  onConnect,
  expansion,
}: {
  state: TelemetryState;
  devices: HeadsetDevice[];
  logsColor: string;
  connectedDevice: HeadsetDevice | null;
  onConnect: (device: HeadsetDevice) => void;
  /** Animated extra height of the discovered state, shared with the screen. */
  expansion: Animated.Value;
}) {
  const theme = useTheme();
  const dots = useTerminalLoading(state !== 'streaming');
  const blueMode = state !== 'streaming';

  // The card sits on the accent fill while searching / listing and falls back
  // to the secondary surface once a headset is streaming.
  const [colorMix] = useState(() => new Animated.Value(state === 'streaming' ? 0 : 1));

  useEffect(() => {
    Animated.timing(colorMix, {
      toValue: blueMode ? 1 : 0,
      duration: CARD_ANIMATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [blueMode, colorMix]);

  const backgroundColor = colorMix.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.secondary, logsColor],
  });
  const foregroundColor = blueMode ? '#FFFFFF' : theme.text;
  const secondaryColor = blueMode ? 'rgba(255, 255, 255, 0.72)' : theme.textSecondary;

  const cardStyle = [
    styles.card,
    styles.animatedCard,
    {
      height: Animated.add(BASE_CARD_MIN_HEIGHT, expansion),
      backgroundColor,
      borderColor: theme.secondary,
    },
  ];

  if (state === 'discovered' && devices.length > 0) {
    return (
      <Animated.View style={[...cardStyle, styles.discoveredCard]}>
        <ThemedText type="smallBold" style={styles.whiteText}>
          Available headsets
        </ThemedText>
        <ScrollView
          style={styles.deviceList}
          contentContainerStyle={styles.deviceListContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled>
          {devices.map((device) => (
            <View key={device.id} style={styles.deviceRow}>
              <View style={styles.deviceInfo}>
                <ThemedText type="smallBold" style={styles.whiteText} numberOfLines={1}>
                  {device.name}
                </ThemedText>
                <Text
                  style={[
                    styles.terminal,
                    styles.whiteSecondary,
                    { fontFamily: Fonts?.mono ?? 'monospace' },
                  ]}
                  numberOfLines={1}>
                  {device.id}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Connect to ${device.name}`}
                onPress={() => onConnect(device)}
                style={({ pressed }) => [
                  styles.connectButton,
                  { opacity: pressed ? 0.85 : 1 },
                ]}>
                <ThemedText type="smallBold" style={styles.connectLabel}>
                  Connect
                </ThemedText>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    );
  }

  const searching = state === 'searching';

  return (
    <Animated.View style={cardStyle}>
      <View style={styles.cardMain}>
        <ThemedText type="smallBold" style={{ color: foregroundColor }}>
          {searching ? 'Searching for headset' : 'Detecting intent'}
        </ThemedText>
        <Text
          style={[
            styles.terminal,
            { color: secondaryColor, fontFamily: Fonts?.mono ?? 'monospace' },
          ]}>
          {dots}
        </Text>
      </View>
      {state === 'streaming' ? (
        <View style={[styles.cardSide, styles.cardSideInfo]}>
          <ThemedText type="smallBold" style={{ color: foregroundColor }} numberOfLines={1}>
            {connectedDevice?.name ?? 'Connected headset'}
          </ThemedText>
          <Text
            style={[
              styles.terminal,
              { color: secondaryColor, fontFamily: Fonts?.mono ?? 'monospace' },
            ]}>
            Battery: 40%
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

function CopyIcon({
  onPress,
  ready,
  color,
}: {
  onPress: () => void;
  ready: boolean;
  color: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Copy detected intent"
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.copyButton, { opacity: pressed ? 0.6 : 1 }]}>
      <Text
        selectable={false}
        style={[
          styles.copyGlyph,
          {
            color,
            fontFamily: Platform.OS === 'web' ? SYMBOL_FONT_FAMILY : undefined,
            opacity: Platform.OS === 'web' && !ready ? 0 : 0.25,
          },
        ]}>
        {Platform.OS === 'web' ? 'content_copy' : '⧉'}
      </Text>
    </Pressable>
  );
}

function ReadingCard({
  item,
  copyReady,
  showActions,
}: {
  item: IntentReading;
  copyReady: boolean;
  showActions: boolean;
}) {
  const theme = useTheme();
  const confidence = `${Math.round(item.confidence * 100)}%`;

  return (
    <OutlinedView style={styles.card}>
      <View style={styles.cardMain}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {item.intent}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {item.timestamp}
        </ThemedText>
      </View>

      <View style={styles.cardSide}>
        <ThemedText type="small" style={[styles.confidence, { color: theme.text, opacity: 0.25 }]}>
          {showActions ? `Confidence score ${confidence}` : confidence}
        </ThemedText>
        {showActions ? (
          <CopyIcon onPress={() => copyText(item.intent)} ready={copyReady} color={theme.text} />
        ) : null}
      </View>
    </OutlinedView>
  );
}

type TelemetryState = 'searching' | 'discovered' | 'streaming';

type HeadsetDevice = { id: string; name: string };

const DUMMY_HEADSETS: HeadsetDevice[] = [
  { id: 'VB-A1F3', name: 'VoxBCI Neuroband' },
  { id: 'VB-B7C2', name: 'VoxBCI Neuroband Pro' },
  { id: 'VB-C4D8', name: 'VoxBCI Lite' },
  { id: 'VB-D9E1', name: 'VoxBCI Neuroband X' },
  { id: 'VB-E2F6', name: 'VoxBCI Air' },
];

const BASE_CARD_MIN_HEIGHT = 76;
const EXPANDED_CARD_MIN_HEIGHT = BASE_CARD_MIN_HEIGHT * 4;

/** Shared duration of the card resize, the lower-half lift and the fill fade. */
const CARD_ANIMATION_MS = 300;

/** Height of one device row and of the card's title line. */
const DEVICE_ROW_HEIGHT = 36;
const CARD_TITLE_HEIGHT = 20;

/**
 * Natural height of the discovered card: four times the base card once the list
 * overflows, otherwise only as tall as its rows.
 */
function expandedCardHeight(deviceCount: number) {
  if (deviceCount > 4) return EXPANDED_CARD_MIN_HEIGHT;
  const rows = deviceCount * DEVICE_ROW_HEIGHT + Math.max(0, deviceCount - 1) * Spacing.two;
  return CARD_TITLE_HEIGHT + Spacing.two + rows + Spacing.three * 2 + StrokeWidth * 2;
}

export default function TelemetryScreen() {
  const theme = useTheme();
  const scheme = useThemeScheme();
  const listData = useMemo(() => DUMMY_READINGS, []);
  const copyReady = useSymbolFont(['content_copy'], 20);
  const [activeIndex, setActiveIndex] = useState(0);
  const [telemetryState, setTelemetryState] = useState<TelemetryState>('searching');
  const [discoveredHeadsets, setDiscoveredHeadsets] = useState<HeadsetDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<HeadsetDevice | null>(null);
  const logsColor = scheme === 'dark' ? '#4DA3FF' : theme.accent;
  /** Animated height the lower half gains while the headset list is open. */
  const [expansion] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (telemetryState !== 'searching') return;
    const id = setTimeout(() => {
      setDiscoveredHeadsets(DUMMY_HEADSETS);
      setTelemetryState('discovered');
    }, 5000);
    return () => clearTimeout(id);
  }, [telemetryState]);

  const onConnect = (device: HeadsetDevice) => {
    setConnectedDevice(device);
    setTelemetryState('streaming');
  };

  /**
   * How much taller the status card gets when the headset list appears. The
   * lower half absorbs that extra height and lifts by half of it, so the card
   * and logs stay centred instead of being pushed towards the bottom.
   */
  const targetExpansion =
    telemetryState === 'discovered' && discoveredHeadsets.length > 0
      ? Math.max(0, expandedCardHeight(discoveredHeadsets.length) - BASE_CARD_MIN_HEIGHT)
      : 0;

  useEffect(() => {
    Animated.timing(expansion, {
      toValue: targetExpansion,
      duration: CARD_ANIMATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
      isInteraction: false,
    }).start();
  }, [expansion, targetExpansion]);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null | undefined }> }) => {
      if (!viewableItems.length) return;
      const indices = viewableItems
        .map((entry) => entry.index)
        .filter((value): value is number => typeof value === 'number');
      if (!indices.length) return;
      const topIndex = Math.min(...indices);
      setActiveIndex((current) => (current === topIndex ? current : topIndex));
    },
    [],
  );

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.topHalf}>
        <ScrollView
          contentContainerStyle={styles.chartScrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.chartContent}>
            <EegChart streaming={telemetryState === 'streaming'} />
          </View>
        </ScrollView>
      </View>

      <Animated.View
        style={[
          styles.bottomHalf,
          {
            // Growing `bottom` past the screen edge adds the expansion to the
            // lower half's height without touching the fixed top half.
            bottom: Animated.multiply(expansion, -1),
            transform: [{ translateY: Animated.multiply(expansion, -0.5) }],
          },
        ]}>
        <View style={styles.stickyHeader}>
          <LoadingCard
            state={telemetryState}
            devices={discoveredHeadsets}
            logsColor={logsColor}
            connectedDevice={connectedDevice}
            onConnect={onConnect}
            expansion={expansion}
          />
        </View>
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ReadingCard item={item} copyReady={copyReady} showActions={index === activeIndex} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={undefined}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
    // The lower half grows past the bottom edge when the headset list appears.
    overflow: 'hidden',
  },
  topHalf: {
    height: '50%',
    minHeight: 0,
  },
  bottomHalf: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    minHeight: 0,
  },
  chartScrollContent: {
    paddingTop: CardLayout.gutter,
    paddingHorizontal: CardLayout.gutter,
    paddingBottom: CardLayout.gutter,
  },
  chartContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  stickyHeader: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingTop: CardLayout.gutter,
    paddingHorizontal: CardLayout.gutter,
    paddingBottom: CardLayout.gap,
  },
  listContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: CardLayout.gutter,
    paddingBottom: CardLayout.bottomInset,
    gap: CardLayout.gap,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  animatedCard: {
    borderWidth: StrokeWidth,
    // Clips the device list while the card grows back into its compact height.
    overflow: 'hidden',
  },
  discoveredCard: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    gap: Spacing.two,
  },
  deviceList: {
    flex: 1,
    minHeight: 0,
  },
  deviceListContent: {
    gap: Spacing.two,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  connectButton: {
    height: 36,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectLabel: {
    color: '#FFFFFF',
  },
  deviceInfo: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  whiteText: {
    color: '#FFFFFF',
  },
  whiteSecondary: {
    color: 'rgba(255, 255, 255, 0.72)',
  },
  cardMain: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  cardSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardSideInfo: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: Spacing.half,
  },
  confidence: {
    textAlign: 'right',
  },
  terminal: {
    fontSize: 14,
    lineHeight: 20,
  },
  copyButton: {
    padding: 2,
  },
  copyGlyph: {
    fontSize: 20,
    lineHeight: 20,
  },
});
