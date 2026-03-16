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

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How do I collect items?',
    answer: 'Find item markers on the map, move within 50 meters of the item, then tap the collect button to add it to your backpack.',
  },
  {
    question: 'How often do items refresh?',
    answer: 'Items automatically refresh every hour. Different locations spawn different types of items, so check the map often!',
  },
  {
    question: 'What does rarity mean?',
    answer: 'Items come in four rarities: Common, Rare, Epic, and Legendary. Higher rarity items are harder to find but more valuable to collect.',
  },
  {
    question: 'What are achievements?',
    answer: 'Achievements are rewards for completing specific goals, like collecting a certain number of items or finding specific rarities.',
  },
  {
    question: 'Why is my location inaccurate?',
    answer: 'Make sure GPS is enabled on your device and you are outdoors. Indoor areas or weak signal zones may affect accuracy.',
  },
];

const gameRules = [
  {
    icon: 'map-outline' as keyof typeof Ionicons.glyphMap,
    title: 'Explore the Map',
    description: 'Move in the real world to discover treasures',
  },
  {
    icon: 'hand-left-outline' as keyof typeof Ionicons.glyphMap,
    title: 'Distance Limit',
    description: 'Must be within 50m to collect an item',
  },
  {
    icon: 'time-outline' as keyof typeof Ionicons.glyphMap,
    title: 'Timed Collection',
    description: 'Items expire after 24 hours',
  },
  {
    icon: 'star-outline' as keyof typeof Ionicons.glyphMap,
    title: 'Rarity System',
    description: 'Common > Rare > Epic > Legendary',
  },
];

export default function HelpScreen() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);

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
        <Text style={styles.sectionTitle}>GAME RULES</Text>
        <View style={styles.card}>
          {gameRules.map((rule, index) => (
            <View key={index} style={[styles.ruleItem, index < gameRules.length - 1 && styles.ruleItemBorder]}>
              <View style={styles.ruleIcon}>
                <Ionicons name={rule.icon} size={22} color="#D4A017" />
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
        <Text style={styles.sectionTitle}>FAQ</Text>
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
                  size={18}
                  color="#CCC"
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

      {/* Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CONTACT SUPPORT</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.contactItem} onPress={handleEmailSupport}>
            <View style={[styles.contactIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="mail-outline" size={20} color="#22c55e" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Email Support</Text>
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
              <Text style={styles.contactTitle}>Business Hours</Text>
              <Text style={styles.contactSubtitle}>Mon-Fri 9:00-18:00</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footerTip}>
        <Ionicons name="heart" size={14} color="#dc2626" />
        <Text style={styles.footerText}>Thanks for playing Treasure Hunt!</Text>
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
