import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { CustomTabBar } from '@/components/CustomTabBar';

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={(props) => <CustomTabBar />}
      >
        <Tabs.Screen name="trade" options={{ title: 'trade' }} />
        <Tabs.Screen name="map" options={{ title: 'map' }} />
        <Tabs.Screen name="inventory" options={{ title: 'inventory' }} />
        <Tabs.Screen name="tasks" options={{ title: 'tasks' }} />
        <Tabs.Screen name="achievements" options={{ href: null }} />
        <Tabs.Screen name="gacha" options={{ href: null }} />
        <Tabs.Screen name="cosmetics" options={{ href: null }} />
        <Tabs.Screen name="synthesis" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ title: 'profile' }} />
        <Tabs.Screen name="shop" options={{ href: null }} />
        <Tabs.Screen name="map-p2p" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});