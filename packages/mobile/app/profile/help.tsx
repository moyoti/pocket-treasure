import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface FAQItem {
  questionKey: string;
  answerKey: string;
}

interface GameRule {
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  descKey: string;
}

export default function HelpScreen() {
  const { t } = useTranslation();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    { questionKey: 'help.faqCollect', answerKey: 'help.faqCollectAnswer' },
    { questionKey: 'help.faqRefresh', answerKey: 'help.faqRefreshAnswer' },
    { questionKey: 'help.faqRarity', answerKey: 'help.faqRarityAnswer' },
    { questionKey: 'help.faqAchievements', answerKey: 'help.faqAchievementsAnswer' },
    { questionKey: 'help.faqLocation', answerKey: 'help.faqLocationAnswer' },
  ];

  const gameRules: GameRule[] = [
    { icon: 'map-outline', titleKey: 'help.ruleExplore', descKey: 'help.ruleExploreDesc' },
    { icon: 'hand-left-outline', titleKey: 'help.ruleDistance', descKey: 'help.ruleDistanceDesc' },
    { icon: 'time-outline', titleKey: 'help.ruleTimed', descKey: 'help.ruleTimedDesc' },
    { icon: 'star-outline', titleKey: 'help.ruleRarity', descKey: 'help.ruleRarityDesc' },
  ];

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@treasurehunt.com?subject=Treasure%20Hunt%20Feedback');
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Game Rules */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('help.gameRules')}</Text>
        <View style={styles.card}>
          {gameRules.map((rule, index) => (
            <View key={index} style={[styles.ruleItem, index < gameRules.length - 1 && styles.ruleItemBorder]}>
              <View style={styles.ruleIcon}>
                <Ionicons name={rule.icon} size={22} color="#D4A017" />
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>{t(rule.titleKey)}</Text>
                <Text style={styles.ruleDescription}>{t(rule.descKey)}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* FAQ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('help.faq')}</Text>
        <View style={styles.card}>
          {faqs.map((faq, index) => (
            <View key={index}>
              <TouchableOpacity
                style={styles.faqItem}
                onPress={() => toggleFAQ(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.faqQuestion}>{t(faq.questionKey)}</Text>
                <Ionicons
                  name={expandedFAQ === index ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#CCC"
                />
              </TouchableOpacity>
              {expandedFAQ === index && (
                <View style={styles.faqAnswerContainer}>
                  <Text style={styles.faqAnswer}>{t(faq.answerKey)}</Text>
                </View>
              )}
              {index < faqs.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </View>

      {/* Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('help.contactSupport')}</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.contactItem} onPress={handleEmailSupport}>
            <View style={[styles.contactIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="mail-outline" size={20} color="#22c55e" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>{t('help.emailSupport')}</Text>
              <Text style={styles.contactSubtitle}>support@treasurehunt.com</Text>
            </View>
            <Ionicons name="open-outline" size={18} color="#CCC" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.contactItem}>
            <View style={[styles.contactIcon, { backgroundColor: '#EBF5FF' }]}>
              <Ionicons name="time-outline" size={20} color="#3b82f6" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>{t('help.businessHours')}</Text>
              <Text style={styles.contactSubtitle}>{t('help.businessHoursTime')}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footerTip}>
        <Ionicons name="heart" size={14} color="#dc2626" />
        <Text style={styles.footerText}>{t('help.thanksForPlaying')}</Text>
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
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    overflow: 'hidden',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
  },
  ruleItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0E5',
  },
  ruleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 3,
  },
  ruleDescription: {
    fontSize: 13,
    color: '#999',
    lineHeight: 19,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginRight: 12,
  },
  faqAnswerContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#888',
    lineHeight: 21,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F0E5',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  contactSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  footerTip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: '#AAA',
  },
});
