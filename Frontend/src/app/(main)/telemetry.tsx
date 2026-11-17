import { ScrollView, StyleSheet, View } from 'react-native';

import { EegChart } from '@/components/eeg-chart';
import { ThemedView } from '@/components/themed-view';
import { CardLayout, MaxContentWidth } from '@/constants/theme';

export default function TelemetryScreen() {
  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <EegChart />
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
    paddingTop: CardLayout.gutter,
    paddingHorizontal: CardLayout.gutter,
    paddingBottom: CardLayout.bottomInset,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
