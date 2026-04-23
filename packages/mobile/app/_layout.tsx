import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MobileLocaleProvider } from '@/components/MobileLocaleProvider';
import { P2PProvider } from '@/src/p2p/P2PContext';
import { useTranslation } from 'react-i18next';

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
            title: t('screens.statistics'),
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