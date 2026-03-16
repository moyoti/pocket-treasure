import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingKey = 'notifications_enabled' | 'sound_enabled' | 'map_satellite' | 'map_traffic' | 'location_sharing' | 'public_profile';

interface Settings {
  notifications_enabled: boolean;
  sound_enabled: boolean;
  map_satellite: boolean;
  map_traffic: boolean;
  location_sharing: boolean;
  public_profile: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  notifications_enabled: true,
  sound_enabled: true,
  map_satellite: false,
  map_traffic: false,
  location_sharing: false,
  public_profile: true,
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('user_settings');
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: SettingKey, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem('user_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Done', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    settingKey,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    settingKey: SettingKey;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color="#D4A017" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={settings[settingKey]}
        onValueChange={(value) => saveSetting(settingKey, value)}
        trackColor={{ false: '#E0D5C0', true: 'rgba(212, 160, 23, 0.4)' }}
        thumbColor={settings[settingKey] ? '#D4A017' : '#CCC'}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <SettingItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Receive alerts for new items and events"
            settingKey="notifications_enabled"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="volume-high-outline"
            title="Sound Effects"
            subtitle="Play sounds when collecting items"
            settingKey="sound_enabled"
          />
        </View>
      </View>

      {/* Map */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MAP</Text>
        <View style={styles.card}>
          <SettingItem
            icon="earth-outline"
            title="Satellite View"
            subtitle="Use satellite map mode"
            settingKey="map_satellite"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="car-outline"
            title="Traffic Layer"
            subtitle="Show real-time traffic info"
            settingKey="map_traffic"
          />
        </View>
      </View>

      {/* Privacy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PRIVACY</Text>
        <View style={styles.card}>
          <SettingItem
            icon="location-outline"
            title="Location Sharing"
            subtitle="Allow sharing your location"
            settingKey="location_sharing"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="person-outline"
            title="Public Profile"
            subtitle="Allow others to see your achievements"
            settingKey="public_profile"
          />
        </View>
      </View>

      {/* Other */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>OTHER</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionItem} onPress={handleClearCache}>
            <View style={[styles.settingIcon, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="trash-outline" size={20} color="#dc2626" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: '#dc2626' }]}>Clear Cache</Text>
              <Text style={styles.settingSubtitle}>Delete temporary data to free space</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tip */}
      <View style={styles.tipCard}>
        <Ionicons name="information-circle-outline" size={18} color="#3b82f6" />
        <Text style={styles.tipText}>
          Some settings may require an app restart to take effect.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#AAA',
    marginBottom: 8,
    paddingHorizontal: 4,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F0E5',
    marginLeft: 62,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    gap: 12,
    marginBottom: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#888',
    lineHeight: 20,
  },
});
