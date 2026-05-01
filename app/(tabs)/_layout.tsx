import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarLabel: 'ホーム',
        }}
      />
      <Tabs.Screen
        name="chart"
        options={{
          title: 'グラフ',
          tabBarLabel: 'グラフ',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarLabel: '設定',
        }}
      />
    </Tabs>
  );
}
