import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string | null;
  collectionCount: number;
}

const RANK_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: '#FFF8E7', border: '#D4A017', text: '#D4A017' },
  2: { bg: '#F5F5F5', border: '#A0A0A0', text: '#888' },
  3: { bg: '#FFF5EB', border: '#CD7F32', text: '#CD7F32' },
};

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/leaderboard');
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1: return { icon: 'trophy', color: '#D4A017' };
      case 2: return { icon: 'medal', color: '#A0A0A0' };
      case 3: return { icon: 'medal-outline', color: '#CD7F32' };
      default: return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Top treasure collectors</Text>
      </View>

      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.userId}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A017" />
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const rankDisplay = getRankDisplay(item.rank);
          const rankStyle = RANK_COLORS[item.rank];

          return (
            <View style={[
              styles.card,
              rankStyle && { borderLeftColor: rankStyle.border, borderLeftWidth: 4 },
            ]}>
              <View style={[
                styles.rankBadge,
                rankStyle ? { backgroundColor: rankStyle.bg } : { backgroundColor: '#F5F0E5' },
              ]}>
                {rankDisplay ? (
                  <Ionicons name={rankDisplay.icon as any} size={20} color={rankDisplay.color} />
                ) : (
                  <Text style={styles.rankNumber}>{item.rank}</Text>
                )}
              </View>
              <View style={styles.userInfo}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {item.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.username}>{item.username}</Text>
                  <View style={styles.countRow}>
                    <Ionicons name="diamond-outline" size={12} color="#AAA" />
                    <Text style={styles.collectionCount}>{item.collectionCount} collected</Text>
                  </View>
                </View>
              </View>
              <Text style={[
                styles.countText,
                rankStyle && { color: rankStyle.text },
              ]}>
                {item.collectionCount}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="trophy-outline" size={40} color="#CCC" />
            </View>
            <Text style={styles.emptyText}>No rankings yet</Text>
            <Text style={styles.emptySubtext}>Start collecting to appear here!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#AAA',
    marginTop: 4,
  },
  list: {
    padding: 16,
    paddingTop: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    borderLeftWidth: 1,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#AAA',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D4A017',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  username: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  collectionCount: {
    fontSize: 12,
    color: '#AAA',
  },
  countText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#D4A017',
    marginLeft: 8,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F0E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    color: '#666',
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
  },
});
