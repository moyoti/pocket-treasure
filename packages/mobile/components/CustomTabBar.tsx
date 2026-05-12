import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter, usePathname } from 'expo-router';

interface TabItem {
  name: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
}

const PRIMARY_TABS: TabItem[] = [
  { name: 'trade', route: '/trade', icon: 'swap-horizontal', iconOutline: 'swap-horizontal-outline' },
  { name: 'inventory', route: '/inventory', icon: 'cube', iconOutline: 'cube-outline' },
];

const SECONDARY_TABS: TabItem[] = [
  { name: 'tasks', route: '/tasks', icon: 'list', iconOutline: 'list-outline' },
  { name: 'profile', route: '/profile', icon: 'person-circle', iconOutline: 'person-circle-outline' },
];

export function CustomTabBar() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const isActive = (route: string) => {
    const routePath = `/(tabs)${route}`;
    return pathname === routePath || pathname.endsWith(route);
  };

  const handlePress = (route: string) => {
    router.push(`/(tabs)${route}` as any);
  };

  const renderTab = (tab: TabItem, isPrimary: boolean) => {
    const active = isActive(tab.route);
    const color = active ? '#D4A017' : '#AAAAAA';

    return (
      <TouchableOpacity
        key={tab.name}
        style={styles.tabItem}
        onPress={() => handlePress(tab.route)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={active ? tab.icon : tab.iconOutline}
          size={24}
          color={color}
        />
        <Text style={[styles.tabLabel, { color }]}>
          {t(`nav.${tab.name === 'inventory' ? 'backpack' : tab.name}`)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom + 8,
          height: 64 + insets.bottom,
        },
      ]}
    >
      {/* Left tabs */}
      <View style={styles.sideGroup}>
        {PRIMARY_TABS.map((tab) => renderTab(tab, true))}
      </View>

      {/* Center Map Button */}
      <TouchableOpacity
        style={styles.mapButton}
        onPress={() => handlePress('/map')}
        activeOpacity={0.8}
      >
        <View style={styles.mapButtonInner}>
          <Ionicons name="compass" size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.mapLabel}>{t('nav.explore')}</Text>
      </TouchableOpacity>

      {/* Right tabs */}
      <View style={styles.sideGroup}>
        {SECONDARY_TABS.map((tab) => renderTab(tab, false))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0D5C0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 12,
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  sideGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: 4,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 60,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  mapButton: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 16,
    minWidth: 72,
  },
  mapButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D4A017',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  mapLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D4A017',
    marginTop: 2,
  },
});
