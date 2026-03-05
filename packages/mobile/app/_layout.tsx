import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/components/AuthProvider';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: '#1a1a2e',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              contentStyle: {
                backgroundColor: '#0f0f1a',
              },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen 
              name="item/[id]" 
              options={{ 
                title: '物品详情',
                presentation: 'modal'
              }} 
            />
            <Stack.Screen
              name="profile/stats"
              options={{
                title: '统计',
                headerBackTitle: '返回',
              }}
            />
            <Stack.Screen
              name="profile/settings"
              options={{
                title: '设置',
                headerBackTitle: '返回',
              }}
            />
            <Stack.Screen
              name="profile/help"
              options={{
                title: '帮助',
                headerBackTitle: '返回',
              }}
            />
            <Stack.Screen
              name="profile/about"
              options={{
                title: '关于',
                headerBackTitle: '返回',
              }}
            />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}