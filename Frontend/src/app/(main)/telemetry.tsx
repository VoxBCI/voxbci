import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { CardLayout, Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
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

function LoadingCard() {
  const theme = useTheme();
  const dots = useTerminalLoading(true);

  return (
    <OutlinedView style={[styles.card, { backgroundColor: theme.secondary }]}>
      <View style={styles.cardMain}>
        <ThemedText type="smallBold">Detecting intent</ThemedText>
        <Text
          style={[
            styles.terminal,
            { color: theme.textSecondary, fontFamily: Fonts?.mono ?? 'monospace' },
          ]}>
          {dots}
        </Text>
      </View>
      <View style={styles.cardSide}>
        <ThemedText type="small" themeColor="textSecondary">
          live
        </ThemedText>
      </View>
    </OutlinedView>
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

type TelemetryState = 'idle' | 'streaming';

export default function TelemetryScreen() {
  const theme = useTheme();
  const scheme = useThemeScheme();
  const listData = useMemo(() => DUMMY_READINGS, []);
  const copyReady = useSymbolFont(['content_copy'], 20);
  const [activeIndex, setActiveIndex] = useState(0);
  const [telemetryState] = useState<TelemetryState>('idle');
  const logsColor = scheme === 'dark' ? '#4DA3FF' : theme.accent;

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
            <View style={styles.chartWrap}>
              <EegChart streaming={telemetryState === 'streaming'} />
              {telemetryState === 'idle' ? (
                <View style={styles.chartOverlay} pointerEvents="none">
                  <View style={styles.searchRow}>
                    <ThemedText type="smallBold" style={[styles.searchText, { color: logsColor }]}>
                      Searching for headset
                    </ThemedText>
                    <ActivityIndicator size="large" color={logsColor} />
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.bottomHalf}>
        <View style={styles.stickyHeader}>
          <LoadingCard />
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
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topHalf: {
    flex: 1,
    minHeight: 0,
  },
  bottomHalf: {
    flex: 1,
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
  chartWrap: {
    position: 'relative',
  },
  chartOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  searchText: {
    fontSize: 20,
    lineHeight: 28,
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
