import { Redirect } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function Index() {
  // 简单测试页面
  return (
    <View style={styles.container}>
      <Text style={styles.title}>应用正常！</Text>
      <Text style={styles.subtitle}>如果看到这个，说明渲染正常</Text>
      <Redirect href="/(tabs)/map" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
