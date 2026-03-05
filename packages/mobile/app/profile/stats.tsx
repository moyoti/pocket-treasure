import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import api from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

interface StatsData {
  totalItems: number;
  uniqueItems: number;
  byRarity: Record<string, number>;
}

interface AchievementProgress {
  total: number;
  completed: number;
}

export default function StatsScreen() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const [statsRes, achievementsRes] = await Promise.all([
        api.get('/inventory/stats'),
        api.get('/achievements/me'),
      ]);
      setStats(statsRes.data);
      const achievements = achievementsRes.data;
      setAchievementProgress({
        total: achievements.length,
        completed: achievements.filter((a: any) => a.completed).length,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9CA3AF';
      case 'rare': return '#3B82F6';
      case 'epic': return '#A855F7';
      case 'legendary': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getRarityName = (rarity: string) => {
    switch (rarity) {
      case 'common': return '普通';
      case 'rare': return '稀有';
      case 'epic': return '史诗';
      case 'legendary': return '传说';
      default: return rarity;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffd700" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const rarityData = stats?.byRarity || {};
  const totalByRarity = Object.values(rarityData).reduce((a, b) => a + b, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.title}>📊 我的统计</Text>
          <Text style={styles.subtitle}>探索数据，见证成长</Text>
        </View>

        {/* 主要统计卡片 */}
        <View style={styles.mainStatsContainer}>
          <View style={[styles.statCard, styles.primaryCard]}>
            <Ionicons name="cube" size={32} color="#ffd700" />
            <Text style={styles.statNumber}>{stats?.totalItems || 0}</Text>
            <Text style={styles.statLabel}>总收集数</Text>
          </View>
          <View style={[styles.statCard, styles.primaryCard]}>
            <Ionicons name="layers" size={32} color="#3B82F6" />
            <Text style={styles.statNumber}>{stats?.uniqueItems || 0}</Text>
            <Text style={styles.statLabel}>物品种类</Text>
          </View>
        </View>

        {/* 稀有度分布 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={20} color="#ffd700" />
            <Text style={styles.sectionTitle}>稀有度分布</Text>
          </View>
          {Object.entries(rarityData).length > 0 ? (
            Object.entries(rarityData).map(([rarity, count]) => (
              <View key={rarity} style={styles.rarityItem}>
                <View style={styles.rarityInfo}>
                  <View style={[styles.rarityDot, { backgroundColor: getRarityColor(rarity) }]} />
                  <Text style={styles.rarityName}>{getRarityName(rarity)}</Text>
                </View>
                <View style={styles.rarityBarContainer}>
                  <View
                    style={[
                      styles.rarityBar,
                      {
                        backgroundColor: getRarityColor(rarity),
                        width: `${totalByRarity > 0 ? (count / totalByRarity) * 100 : 0}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.rarityCount}>{count}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={40} color="#666" />
              <Text style={styles.emptyText}>还没有收集任何物品</Text>
              <Text style={styles.emptySubText}>快去地图上探索吧！</Text>
            </View>
          )}
        </View>

        {/* 成就进度 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy" size={20} color="#ffd700" />
            <Text style={styles.sectionTitle}>成就进度</Text>
          </View>
          <View style={styles.achievementCard}>
            <View style={styles.achievementProgress}>
              <Text style={styles.achievementText}>
                {achievementProgress?.completed || 0} / {achievementProgress?.total || 0}
              </Text>
              <Text style={styles.achievementSubtext}>已完成成就</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${achievementProgress?.total
                        ? (achievementProgress.completed / achievementProgress.total) * 100
                        : 0}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {achievementProgress?.total
                  ? Math.round((achievementProgress.completed / achievementProgress.total) * 100)
                  : 0}% 完成
              </Text>
            </View>
          </View>
        </View>

        {/* 提示信息 */}
        <View style={styles.tipCard}>
          <Ionicons name="bulb" size={20} color="#ffd700" />
          <Text style={styles.tipText}>
            继续探索地图，收集更多稀有物品来提升你的统计数据！
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
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
  mainStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  primaryCard: {
    borderWidth: 1,
    borderColor: '#333',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  rarityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  rarityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  rarityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  rarityName: {
    fontSize: 14,
    color: '#fff',
  },
  rarityBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  rarityBar: {
    height: '100%',
    borderRadius: 4,
  },
  rarityCount: {
    width: 40,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  achievementCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  achievementProgress: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  achievementText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffd700',
  },
  achievementSubtext: {
    fontSize: 14,
    color: '#888',
    marginLeft: 8,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffd700',
    borderRadius: 4,
  },
  progressText: {
    width: 60,
    textAlign: 'right',
    fontSize: 14,
    color: '#ffd700',
    fontWeight: '600',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
});
