import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const developers = [
  { name: '寻宝记团队', role: '开发与维护' },
  { name: '开源社区', role: '贡献者' },
];

const licenses = [
  { name: 'React Native', license: 'MIT' },
  { name: 'Expo', license: 'MIT' },
  { name: 'TypeScript', license: 'Apache-2.0' },
];

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '2024.03.04.1';

export default function AboutScreen() {
  const handleOpenGitHub = () => {
    Linking.openURL('https://github.com/your-username/treasure-hunt');
  };

  const handleOpenWebsite = () => {
    Linking.openURL('https://treasurehunt.com');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 应用信息卡片 */}
        <View style={styles.appCard}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons name="diamond" size={48} color="#ffd700" />
            </View>
          </View>
          <Text style={styles.appName}>寻宝记</Text>
          <Text style={styles.appTagline}>探索世界，收集宝藏</Text>
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>版本 {APP_VERSION}</Text>
            <Text style={styles.buildText}>Build {BUILD_NUMBER}</Text>
          </View>
        </View>

        {/* 项目信息 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={18} color="#888" />
            <Text style={styles.sectionTitle}>关于项目</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.aboutText}>
              寻宝记是一个基于地理位置的物品收集游戏，灵感来源于 Pokémon GO。
              玩家可以在真实世界中探索，在各个地标位置收集虚拟宝藏物品。
            </Text>
            <Text style={styles.aboutText}>
              我们相信游戏可以让生活更有趣，让探索成为一种乐趣。
            </Text>
          </View>
        </View>

        {/* 开发者 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={18} color="#888" />
            <Text style={styles.sectionTitle}>开发团队</Text>
          </View>
          <View style={styles.card}>
            {developers.map((dev, index) => (
              <View key={index} style={styles.devItem}>
                <Ionicons name="person-circle" size={36} color="#ffd700" />
                <View style={styles.devInfo}>
                  <Text style={styles.devName}>{dev.name}</Text>
                  <Text style={styles.devRole}>{dev.role}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 链接 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="link" size={18} color="#888" />
            <Text style={styles.sectionTitle}>相关链接</Text>
          </View>
          <View style={styles.card}>
            <TouchableOpacity style={styles.linkItem} onPress={handleOpenGitHub}>
              <View style={[styles.linkIcon, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <Ionicons name="logo-github" size={22} color="#fff" />
              </View>
              <View style={styles.linkContent}>
                <Text style={styles.linkTitle}>GitHub</Text>
                <Text style={styles.linkSubtitle}>查看源代码</Text>
              </View>
              <Ionicons name="open-outline" size={20} color="#666" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.linkItem} onPress={handleOpenWebsite}>
              <View style={[styles.linkIcon, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <Ionicons name="globe" size={22} color="#3B82F6" />
              </View>
              <View style={styles.linkContent}>
                <Text style={styles.linkTitle}>官方网站</Text>
                <Text style={styles.linkSubtitle}>了解更多信息</Text>
              </View>
              <Ionicons name="open-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 开源许可 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={18} color="#888" />
            <Text style={styles.sectionTitle}>开源许可</Text>
          </View>
          <View style={styles.card}>
            {licenses.map((item, index) => (
              <View key={index}>
                <View style={styles.licenseItem}>
                  <Text style={styles.licenseName}>{item.name}</Text>
                  <View style={styles.licenseBadge}>
                    <Text style={styles.licenseText}>{item.license}</Text>
                  </View>
                </View>
                {index < licenses.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* 版权信息 */}
        <View style={styles.footer}>
          <Text style={styles.copyright}>© 2024 寻宝记团队</Text>
          <Text style={styles.rights}>保留所有权利</Text>
          <View style={styles.legalLinks}>
            <TouchableOpacity>
              <Text style={styles.legalLink}>隐私政策</Text>
            </TouchableOpacity>
            <Text style={styles.legalDot}>·</Text>
            <TouchableOpacity>
              <Text style={styles.legalLink}>服务条款</Text>
            </TouchableOpacity>
          </View>
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
  appCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 24,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  versionContainer: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffd700',
  },
  buildText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  aboutText: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 22,
    marginBottom: 12,
  },
  devItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  devInfo: {
    marginLeft: 12,
  },
  devName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  devRole: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  linkSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
  },
  licenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  licenseName: {
    fontSize: 15,
    color: '#fff',
  },
  licenseBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  licenseText: {
    fontSize: 12,
    color: '#ffd700',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  copyright: {
    fontSize: 14,
    color: '#666',
  },
  rights: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  legalLink: {
    fontSize: 13,
    color: '#888',
  },
  legalDot: {
    fontSize: 13,
    color: '#666',
    marginHorizontal: 8,
  },
});
