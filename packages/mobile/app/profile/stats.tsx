import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

interface StatsData {
  totalItems: number;
  uniqueItems: number;
  byRarity: Record<string, number>;
}

interface AchievementProgress {
  total: number;
  completed: number;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#8D99AE',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#F59E0B',
};

const RARITY_NAMES: Record<string, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
          <Text style={styles.loadingText}>Loading stats...</Text>
        </View>
      </View>
    );
  }

  const rarityData = stats?.byRarity || {};
  const totalByRarity = Object.values(rarityData).reduce((a, b) => a + b, 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A017" />}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Main Stats */}
      <View style={styles.mainStatsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="layers-outline" size={28} color="#D4A017" />
          <Text style={styles.statNumber}>{stats?.totalItems || 0}</Text>
          <Text style={styles.statLabel}>Total Collected</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="apps-outline" size={28} color="#3b82f6" />
          <Text style={styles.statNumber}>{stats?.uniqueItems || 0}</Text>
          <Text style={styles.statLabel}>Unique Items</Text>
        </View>
      </View>

      {/* Rarity Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RARITY DISTRIBUTION</Text>
        <View style={styles.sectionCard}>
          {Object.entries(rarityData).length > 0 ? (
            Object.entries(rarityData).map(([rarity, count]) => (
              <View key={rarity} style={styles.rarityItem}>
                <View style={styles.rarityInfo}>
                  <View style={[styles.rarityDot, { backgroundColor: RARITY_COLORS[rarity] || '#999' }]} />
                  <Text style={styles.rarityName}>{RARITY_NAMES[rarity] || rarity}</Text>
                </View>
                <View style={styles.rarityBarContainer}>
                  <View
                    style={[
                      styles.rarityBar,
                      {
                        backgroundColor: RARITY_COLORS[rarity] || '#999',
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
              <View style={styles.emptyIconCircle}>
                <Ionicons name="search-outline" size={32} color="#CCC" />
              </View>
              <Text style={styles.emptyText}>No items collected yet</Text>
              <Text style={styles.emptySubtext}>Explore the map to find treasures!</Text>
            </View>
          )}
        </View>
      </View>

      {/* Achievement Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACHIEVEMENTS</Text>
        <View style={styles.sectionCard}>
          <View style={styles.achievementRow}>
            <View>
              <Text style={styles.achievementValue}>
                {achievementProgress?.completed || 0} / {achievementProgress?.total || 0}
              </Text>
              <Text style={styles.achievementLabel}>Completed</Text>
            </View>
            <View style={styles.achievementIcon}>
              <Ionicons name="medal" size={24} color="#9B59B6" />
            </View>
          </View>
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
        </View>
      </View>

      {/* Tip */}
      <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={18} color="#D4A017" />
        <Text style={styles.tipText}>
          Keep exploring the map and collecting items to improve your stats!
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#999',
  },
  mainStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontWeight: '600',
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
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  rarityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rarityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 90,
  },
  rarityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  rarityName: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  rarityBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#F0E8D8',
    borderRadius: 3,
    marginHorizontal: 12,
  },
  rarityBar: {
    height: '100%',
    borderRadius: 3,
  },
  rarityCount: {
    width: 32,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5F0E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#AAA',
  },
  achievementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  achievementLabel: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 2,
    fontWeight: '600',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F0E8D8',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9B59B6',
    borderRadius: 3,
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
