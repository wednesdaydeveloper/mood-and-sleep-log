import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { initializeDatabase } from '@/db/client';
import { useTheme } from '@/theme/useTheme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();

  useEffect(() => {
    initializeDatabase()
      .then(() => setReady(true))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgPrimary }]}>
        <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>起動エラー</Text>
        <Text style={[styles.errorBody, { color: colors.danger }]}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bgSecondary },
          headerTitleStyle: { color: colors.textPrimary },
          headerTintColor: colors.accent,
          contentStyle: { backgroundColor: colors.bgPrimary },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  errorBody: { fontSize: 14, textAlign: 'center' },
});
