import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/components/AuthProvider';
import { MobileLocaleProvider } from '@/components/MobileLocaleProvider';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <MobileLocaleProvider>
          <AuthProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: '#FFF8E7',
              },
              headerTintColor: '#1A1A1A',
              headerTitleStyle: {
                fontWeight: '700',
                fontSize: 17,
              },
              headerShadowVisible: false,
              contentStyle: {
                backgroundColor: '#FFF8E7',
              },
              headerBackTitle: 'Back',
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="item/[id]"
              options={{
                title: 'Item Details',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="chat/[userId]"
              options={{
                title: 'Chat',
              }}
            />
            <Stack.Screen
              name="profile/stats"
              options={{
                title: 'Statistics',
              }}
            />
            <Stack.Screen
              name="profile/settings"
              options={{
                title: 'Settings',
              }}
            />
            <Stack.Screen
              name="profile/help"
              options={{
                title: 'Help',
              }}
            />
            <Stack.Screen
              name="profile/about"
              options={{
                title: 'About',
              }}
            />
          </Stack>
        </AuthProvider>
        </MobileLocaleProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
