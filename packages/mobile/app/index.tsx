import { Redirect } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useEffect, useState } from 'react';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 模拟加载过程（实际应用中这里会初始化数据库、检查登录状态等）
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // 显示 2 秒加载动画

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        {/* 应用 Logo */}
        <Image
          source={require('../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        {/* 应用名称 */}
        <Text style={styles.appName}>Treasure Cat</Text>
        <Text style={styles.appNameSub}>宝探し猫</Text>
        
        {/* 加载动画 */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
        
        {/* 底部标语 */}
        <Text style={styles.tagline}>探索世界，收集宝藏</Text>
      </View>
    );
  }

  // 加载完成后跳转到主页面
  return <Redirect href="/(tabs)/map" />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    padding: 20,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 30,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  appNameSub: {
    fontSize: 24,
    color: '#666',
    marginBottom: 60,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 15,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  tagline: {
    position: 'absolute',
    bottom: 60,
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});
