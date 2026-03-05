import React, { useState } from 'react';
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

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: '如何收集物品？',
    answer: '在地图上找到附近的物品标记，移动到距离物品50米以内，然后点击收集按钮即可将物品加入你的收藏。',
  },
  {
    question: '物品多久刷新一次？',
    answer: '物品每1小时自动刷新一次。不同地点会刷新不同种类的物品，记得经常查看地图哦！',
  },
  {
    question: '稀有度是什么意思？',
    answer: '物品分为普通、稀有、史诗和传说四种稀有度。稀有度越高，物品越难找到，但也越有收藏价值。',
  },
  {
    question: '成就是什么？',
    answer: '成就是完成特定目标的奖励，如收集一定数量的物品或找到特定稀有度的物品。完成成就可以获得额外的成就感！',
  },
  {
    question: '为什么定位不准确？',
    answer: '请确保你的设备开启了GPS定位权限，并且在户外开阔地带。室内或信号不好的地方可能影响定位精度。',
  },
];

const gameRules = [
  {
    icon: 'map' as keyof typeof Ionicons.glyphMap,
    title: '探索地图',
    description: '在真实世界中移动，发现地图上的宝藏',
  },
  {
    icon: 'hand-left' as keyof typeof Ionicons.glyphMap,
    title: '距离限制',
    description: '必须距离物品50米内才能收集',
  },
  {
    icon: 'time' as keyof typeof Ionicons.glyphMap,
    title: '限时收集',
    description: '物品会在24小时后过期消失',
  },
  {
    icon: 'star' as keyof typeof Ionicons.glyphMap,
    title: '稀有度系统',
    description: '普通→稀有→史诗→传说，越来越珍贵',
  },
];

export default function HelpScreen() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@treasurehunt.com?subject=寻宝记-用户反馈');
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.title}>❓ 帮助中心</Text>
          <Text style={styles.subtitle}>有问题？我们来帮你</Text>
        </View>

        {/* 游戏规则 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="game-controller" size={20} color="#ffd700" />
            <Text style={styles.sectionTitle}>游戏规则</Text>
          </View>
          <View style={styles.rulesContainer}>
            {gameRules.map((rule, index) => (
              <View key={index} style={styles.ruleItem}>
                <View style={styles.ruleIcon}>
                  <Ionicons name={rule.icon} size={24} color="#ffd700" />
                </View>
                <View style={styles.ruleContent}>
                  <Text style={styles.ruleTitle}>{rule.title}</Text>
                  <Text style={styles.ruleDescription}>{rule.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle" size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>常见问题</Text>
          </View>
          <View style={styles.card}>
            {faqs.map((faq, index) => (
              <View key={index}>
                <TouchableOpacity
                  style={styles.faqItem}
                  onPress={() => toggleFAQ(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Ionicons
                    name={expandedFAQ === index ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#888"
                  />
                </TouchableOpacity>
                {expandedFAQ === index && (
                  <View style={styles.faqAnswerContainer}>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </View>
                )}
                {index < faqs.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* 联系客服 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble" size={20} color="#10B981" />
            <Text style={styles.sectionTitle}>联系客服</Text>
          </View>
          <View style={styles.card}>
            <TouchableOpacity style={styles.contactItem} onPress={handleEmailSupport}>
              <View style={[styles.contactIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Ionicons name="mail" size={22} color="#10B981" />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactTitle}>邮件支持</Text>
                <Text style={styles.contactSubtitle}>support@treasurehunt.com</Text>
              </View>
              <Ionicons name="open-outline" size={20} color="#666" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <View style={styles.contactItem}>
              <View style={[styles.contactIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Ionicons name="time" size={22} color="#3B82F6" />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactTitle}>服务时间</Text>
                <Text style={styles.contactSubtitle}>周一至周五 9:00-18:00</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 底部提示 */}
        <View style={styles.footerTip}>
          <Ionicons name="heart" size={16} color="#ff6b6b" />
          <Text style={styles.footerText}>感谢使用寻宝记，祝你探险愉快！</Text>
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
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  rulesContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ruleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  ruleDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
    marginRight: 12,
  },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  contactSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  footerTip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
});
