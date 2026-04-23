import { Redirect } from 'expo-router';
import { useP2P } from '@/src/p2p/P2PContext';
import { View, ActivityIndicator, Text } from 'react-native';

export default function Index() {
  const { isInitialized, isLoading, error } = useP2P();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8E7' }}>
        <ActivityIndicator size="large" color="#D4A017" />
        <Text style={{ marginTop: 16, color: '#666' }}>Initializing...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8E7', padding: 20 }}>
        <Text style={{ color: '#D32F2F', textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8E7' }}>
        <ActivityIndicator size="large" color="#D4A017" />
      </View>
    );
  }

  return <Redirect href="/(tabs)/map" />;
}