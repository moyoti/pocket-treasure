import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, StyleSheet } from 'react-native';

interface Props {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function QuantitySelector({ value, onValueChange, min = 1, max }: Props) {
  return (
    <View style={styles.container}>
      <Pressable 
        style={[styles.button, value <= min && styles.buttonDisabled]}
        onPress={() => value > min && onValueChange(value - 1)}
        disabled={value <= min}
      >
        <Ionicons name="remove" size={20} color={value <= min ? '#CCC' : '#333'} />
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable 
        style={[styles.button, max !== undefined && value >= max && styles.buttonDisabled]}
        onPress={() => max === undefined || value < max ? onValueChange(value + 1) : null}
        disabled={max !== undefined && value >= max}
      >
        <Ionicons name="add" size={20} color={max !== undefined && value >= max ? '#CCC' : '#333'} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  button: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0E8D8', justifyContent: 'center', alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  value: { fontSize: 18, fontWeight: '700', minWidth: 40, textAlign: 'center' },
});
