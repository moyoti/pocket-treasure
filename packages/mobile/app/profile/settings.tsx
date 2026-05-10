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
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { SupportedLanguage, saveLanguage, SUPPORTED_LANGUAGES } from '@/lib/i18n';

type SettingKey = 'notifications_enabled' | 'sound_enabled' | 'map_satellite' | 'map_traffic' | 'location_sharing' | 'public_profile';

interface Settings {
  notifications_enabled: boolean;
  sound_enabled: boolean;
  map_satellite: boolean;
  map_traffic: boolean;
  location_sharing: boolean;
  public_profile: boolean;
  language: SupportedLanguage;
}

const DEFAULT_SETTINGS: Settings = {
  notifications_enabled: true,
  sound_enabled: true,
  map_satellite: false,
  map_traffic: false,
  location_sharing: false,
  public_profile: true,
  language: 'en',
};

export default function SettingsScreen() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('user_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
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

  const handleLanguageChange = async (language: SupportedLanguage) => {
    const newSettings = { ...settings, language };
    setSettings(newSettings);
    try {
      await i18n.changeLanguage(language);
      await saveLanguage(language);
      await AsyncStorage.setItem('user_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      t('settings.resetSettings'),
      t('settings.clearCacheConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.resetSettings'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(t('common.success'), t('settings.cacheCleared'));
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

  const LanguageSelector = () => (
    <View style={styles.languageSection}>
      <View style={styles.settingItem}>
        <View style={styles.settingIcon}>
          <Ionicons name="language-outline" size={20} color="#D4A017" />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{t('settings.languageSection')}</Text>
          <Text style={styles.settingSubtitle}>{t('settings.languageDesc')}</Text>
        </View>
      </View>
      <View style={styles.languageButtons}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang}
            style={[
              styles.languageButton,
              settings.language === lang && styles.languageButtonActive,
            ]}
            onPress={() => handleLanguageChange(lang)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.languageButtonText,
                settings.language === lang && styles.languageButtonTextActive,
              ]}
            >
              {lang === 'en' ? t('settings.english') : t('settings.japanese')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.languageSection').toUpperCase()}</Text>
        <View style={styles.card}>
          <LanguageSelector />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.notifications').toUpperCase()}</Text>
        <View style={styles.card}>
          <SettingItem
            icon="notifications-outline"
            title={t('settings.pushNotifications')}
            subtitle={t('settings.pushNotificationsDesc')}
            settingKey="notifications_enabled"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="volume-high-outline"
            title={t('settings.soundEffects')}
            subtitle={t('settings.soundEffectsDesc')}
            settingKey="sound_enabled"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.mapSettings').toUpperCase()}</Text>
        <View style={styles.card}>
          <SettingItem
            icon="earth-outline"
            title={t('settings.satelliteView')}
            subtitle={t('settings.satelliteViewDesc')}
            settingKey="map_satellite"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="car-outline"
            title={t('settings.trafficLayer')}
            subtitle={t('settings.trafficLayerDesc')}
            settingKey="map_traffic"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.privacy').toUpperCase()}</Text>
        <View style={styles.card}>
          <SettingItem
            icon="location-outline"
            title={t('settings.shareLocation')}
            subtitle={t('settings.shareLocationDesc')}
            settingKey="location_sharing"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="person-outline"
            title={t('settings.publicProfile')}
            subtitle={t('settings.publicProfileDesc')}
            settingKey="public_profile"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('common.other').toUpperCase()}</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionItem} onPress={handleClearCache}>
            <View style={[styles.settingIcon, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="trash-outline" size={20} color="#dc2626" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: '#dc2626' }]}>{t('settings.resetSettings')}</Text>
              <Text style={styles.settingSubtitle}>{t('settings.clearCacheDesc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tipCard}>
        <Ionicons name="information-circle-outline" size={18} color="#3b82f6" />
        <Text style={styles.tipText}>
          {t('settings.restartTip')}
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
  languageSection: {
    padding: 14,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#FFF8E7',
    borderWidth: 1,
    borderColor: '#E0D5C0',
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: '#D4A017',
    borderColor: '#D4A017',
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  languageButtonTextActive: {
    color: '#FFF',
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