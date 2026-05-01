import { StyleSheet, Text, View } from 'react-native';

export default function ChartScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>グラフ</Text>
      <Text style={styles.subtitle}>3段パネル（M5/M6 で実装）</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
});
