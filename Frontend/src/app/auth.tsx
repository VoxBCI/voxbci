import { router } from 'expo-router';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function AuthScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auth</Text>
      <Text>Sign in placeholder</Text>
      <Button title="Continue" onPress={() => router.replace('/home')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
