import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  balance: number;
}

export function CoinBalance({ balance }: Props) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <View style={styles.container}>
      <Ionicons name="logo-usd" size={24} color="#D4A017" />
      <Text style={styles.balance}>{formatNumber(balance)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF8E7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 2, borderColor: '#333' },
  balance: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
});
