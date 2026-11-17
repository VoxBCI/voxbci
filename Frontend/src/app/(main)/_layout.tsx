import { StyleSheet, View } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { AppToolbar } from '@/components/app-toolbar';

export default function MainLayout() {
  return (
    <View style={styles.root}>
      <AppToolbar />
      <AppTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
