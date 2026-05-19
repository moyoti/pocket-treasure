import '@/lib/crypto-polyfill';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MobileLocaleProvider } from '@/components/MobileLocaleProvider';
import { P2PProvider } from '@/src/p2p/P2PContext';
import { useTranslation } from 'react-i18next';
import MapboxGL from '@rnmapbox/maps';

// Initialize Mapbox access token
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
if (MAPBOX_TOKEN) {
  MapboxGL.setAccessToken(MAPBOX_TOKEN);
} else {
  console.error('[Mapbox] Access token not found!');
}

// Completely disable React Native DevTools to prevent fatal websocket errors
if (__DEV__) {
  // 1. Block WebSocket creation for devtools
  const originalWebSocket = global.WebSocket;
  global.WebSocket = function(url: string, ...args: any[]) {
    // Block devtools websocket connections
    if (url && typeof url === 'string' && (
      url.includes('devtools') ||
      url.includes('debugger') ||
      url.includes('10.0.2.2:8081') ||
      url.includes('localhost:8081')
    )) {
      // Return a mock WebSocket that does nothing
      return {
        addEventListener: () => {},
        removeEventListener: () => {},
        send: () => {},
        close: () => {},
        readyState: 3, // CLOSED
      };
    }
    return new originalWebSocket(url, ...args);
  } as any;

  // 2. Catch and suppress devtools errors
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('devtools')) {
      return;
    }
    originalError(...args);
  };

  // 3. Override ErrorUtils to catch fatal devtools errors
  if (typeof ErrorUtils !== 'undefined') {
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
      if (error.message && error.message.includes('devtools')) {
        // Silently ignore devtools errors
        return;
      }
      originalHandler(error, isFatal);
    });
  }
}

function RootStack() {
  const { t } = useTranslation();

  return (
    <>
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
          headerBackTitle: t('common.back'),
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="item/[id]"
          options={{
            title: t('screens.itemDetails'),
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="profile/stats"
          options={{
            title: t('items.screens.statistics'),
          }}
        />
        <Stack.Screen
          name="profile/settings"
          options={{
            title: t('screens.settings'),
          }}
        />
        <Stack.Screen
          name="profile/help"
          options={{
            title: t('screens.help'),
          }}
        />
        <Stack.Screen
          name="profile/about"
          options={{
            title: t('screens.about'),
          }}
        />
        <Stack.Screen
          name="shop/page"
          options={{
            title: t('shop.title'),
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <MobileLocaleProvider>
          <P2PProvider>
            <RootStack />
          </P2PProvider>
        </MobileLocaleProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
