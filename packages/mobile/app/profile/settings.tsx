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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getData, storeData } from '@/lib/storage';

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
      const stored = await getData('user_settings');
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
      await storeData('user_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      '清除缓存',
      '确定要清除应用缓存吗？这将删除所有临时数据。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: () => {
            Alert.alert('成功', '缓存已清除');
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
        <Ionicons name={icon} size={22} color="#ffd700" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={settings[settingKey]}
        onValueChange={(value) => saveSetting(settingKey, value)}
        trackColor={{ false: '#333', true: 'rgba(255, 215, 0, 0.5)' }}
        thumbColor={settings[settingKey] ? '#ffd700' : '#666'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.title}>⚙️ 设置</Text>
          <Text style={styles.subtitle}>自定义你的应用体验</Text>
        </View>

        {/* 通知设置 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications" size={18} color="#888" />
            <Text style={styles.sectionTitle}>通知</Text>
          </View>
          <View style={styles.card}>
            <SettingItem
              icon="notifications"
              title="启用通知"
              subtitle="接收新物品和活动提醒"
              settingKey="notifications_enabled"
            />
            <View style={styles.divider} />
            <SettingItem
              icon="volume-high"
              title="音效"
              subtitle="收集物品时播放音效"
              settingKey="sound_enabled"
            />
          </View>
        </View>

        {/* 地图设置 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="map" size={18} color="#888" />
            <Text style={styles.sectionTitle}>地图</Text>
          </View>
          <View style={styles.card}>
            <SettingItem
              icon="satellite"
              title="卫星视图"
              subtitle="使用卫星地图模式"
              settingKey="map_satellite"
            />
            <View style={styles.divider} />
            <SettingItem
              icon="car"
              title="交通状况"
              subtitle="显示实时交通信息"
              settingKey="map_traffic"
            />
          </View>
        </View>

        {/* 隐私设置 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield" size={18} color="#888" />
            <Text style={styles.sectionTitle}>隐私</Text>
          </View>
          <View style={styles.card}>
            <SettingItem
              icon="location"
              title="位置共享"
              subtitle="允许分享你的位置信息"
              settingKey="location_sharing"
            />
            <View style={styles.divider} />
            <SettingItem
              icon="person"
              title="公开资料"
              subtitle="允许其他用户查看你的成就"
              settingKey="public_profile"
            />
          </View>
        </View>

        {/* 其他设置 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="apps" size={18} color="#888" />
            <Text style={styles.sectionTitle}>其他</Text>
          </View>
          <View style={styles.card}>
            <TouchableOpacity style={styles.actionItem} onPress={handleClearCache}>
              <View style={styles.settingIcon}>
                <Ionicons name="trash" size={22} color="#ff6b6b" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.actionTitle}>清除缓存</Text>
                <Text style={styles.settingSubtitle}>删除临时数据释放空间</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 提示 */}
        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.tipText}>
            部分设置需要重启应用才能生效。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ff6b6b',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginLeft: 68,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    gap: 12,
    marginBottom: 24,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
});
