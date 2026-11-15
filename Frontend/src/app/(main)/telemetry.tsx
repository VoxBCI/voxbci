import { ScrollView, StyleSheet, View } from 'react-native';

import { EegChart } from '@/components/eeg-chart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SESSION_FIELDS = [
  { label: 'Timestamp', value: '2 minutes ago' },
  { label: 'Source', value: 'Simulated TGAM EEG' },
  { label: 'Channels', value: '5' },
] as const;

export default function TelemetryScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Telemetry</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Five-channel EEG stream from your latest session.
            </ThemedText>
          </View>

          <EegChart />

          <ThemedView type="secondary" style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <ThemedText style={styles.sessionTitle}>Latest session</ThemedText>
              <View style={styles.status}>
                <View style={styles.statusDot} />
                <ThemedText style={styles.statusText}>Simulated data</ThemedText>
              </View>
            </View>

            <View>
              {SESSION_FIELDS.map((field, index) => (
                <View
                  key={field.label}
                  style={[
                    styles.sessionRow,
                    index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
                  ]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {field.label}
                  </ThemedText>
                  <ThemedText type="code" style={styles.sessionValue}>
                    {field.value}
                  </ThemedText>
                </View>
              ))}
            </View>
          </ThemedView>

          <View style={[styles.note, { borderColor: theme.border }]}>
            <ThemedText type="smallBold">About this data</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              These streams are synthetic TGAM-inspired signals rendered on-device for
              demonstration. A standard TGAM module reports a single raw EEG channel, so the
              five channels above are simulated — not live hardware telemetry or a device
              recording.
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.five,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  sessionCard: {
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sessionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(52, 211, 153, 0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(52, 211, 153, 0.5)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  statusText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '700',
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  sessionValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontWeight: '700',
  },
  note: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
