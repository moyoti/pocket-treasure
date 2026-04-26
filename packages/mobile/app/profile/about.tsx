import React from 'react';
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

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '2024.03.04.1';

const PRIVACY_POLICY_URL = 'https://treasurehunt.com/privacy';
const TERMS_OF_SERVICE_URL = 'https://treasurehunt.com/terms';

export default function AboutScreen() {
  const { t } = useTranslation();

  const developers = [
    { name: t('about.devTeam'), role: t('about.devRole') },
    { name: t('about.openSourceCommunity'), role: t('about.contributorRole') },
  ];

  const licenses = [
    { name: 'React Native', license: t('about.licenseMIT') },
    { name: 'Expo', license: t('about.licenseMIT') },
    { name: 'TypeScript', license: t('about.licenseApache') },
  ];

  const handleOpenGitHub = () => {
    Linking.openURL('https://github.com/your-username/treasure-hunt');
  };

  const handleOpenWebsite = () => {
    Linking.openURL('https://treasurehunt.com');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* App Info */}
      <View style={styles.appCard}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="diamond" size={48} color="#D4A017" />
          </View>
        </View>
        <Text style={styles.appName}>{t('about.appName')}</Text>
        <Text style={styles.appTagline}>{t('about.appTagline')}</Text>
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>{t('about.version')} {APP_VERSION}</Text>
          <Text style={styles.buildText}>{t('about.build')} {BUILD_NUMBER}</Text>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('about.about')}</Text>
        <View style={styles.card}>
          <Text style={styles.aboutText}>
            {t('about.aboutDesc1')}
          </Text>
          <Text style={styles.aboutText}>
            {t('about.aboutDesc2')}
          </Text>
          <Text style={styles.aboutText}>
            {t('about.aboutDesc3')}
          </Text>
        </View>
      </View>

      {/* Team */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('about.team')}</Text>
        <View style={styles.card}>
          {developers.map((dev, index) => (
            <View key={index} style={[styles.devItem, index < developers.length - 1 && styles.devItemBorder]}>
              <View style={styles.devAvatar}>
                <Ionicons name="person-circle-outline" size={32} color="#D4A017" />
              </View>
              <View style={styles.devInfo}>
                <Text style={styles.devName}>{dev.name}</Text>
                <Text style={styles.devRole}>{dev.role}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('about.links')}</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.linkItem} onPress={handleOpenGitHub}>
            <View style={[styles.linkIcon, { backgroundColor: '#F5F0E5' }]}>
              <Ionicons name="logo-github" size={20} color="#1A1A1A" />
            </View>
            <View style={styles.linkContent}>
              <Text style={styles.linkTitle}>{t('about.github')}</Text>
              <Text style={styles.linkSubtitle}>{t('about.viewSource')}</Text>
            </View>
            <Ionicons name="open-outline" size={18} color="#CCC" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.linkItem} onPress={handleOpenWebsite}>
            <View style={[styles.linkIcon, { backgroundColor: '#EBF5FF' }]}>
              <Ionicons name="globe-outline" size={20} color="#3b82f6" />
            </View>
            <View style={styles.linkContent}>
              <Text style={styles.linkTitle}>{t('about.website')}</Text>
              <Text style={styles.linkSubtitle}>{t('about.learnMore')}</Text>
            </View>
            <Ionicons name="open-outline" size={18} color="#CCC" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Licenses */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('about.openSource')}</Text>
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

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.copyright}>{t('about.copyright')}</Text>
        <Text style={styles.rights}>{t('about.allRightsReserved')}</Text>
        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
            <Text style={styles.legalLink}>{t('about.privacyPolicy')}</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}>  </Text>
          <TouchableOpacity onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}>
            <Text style={styles.legalLink}>{t('about.termsOfService')}</Text>
          </TouchableOpacity>
        </View>
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
  appCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E8D8',
    marginBottom: 20,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0E8D8',
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  versionContainer: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#D4A017',
  },
  buildText: {
    fontSize: 12,
    color: '#CCC',
    marginTop: 4,
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
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
  },
  devItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  devItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0E5',
  },
  devAvatar: {
    marginRight: 12,
  },
  devInfo: {
    flex: 1,
  },
  devName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  devRole: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  linkSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F0E5',
  },
  licenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  licenseName: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  licenseBadge: {
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  licenseText: {
    fontSize: 11,
    color: '#D4A017',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  copyright: {
    fontSize: 13,
    color: '#AAA',
  },
  rights: {
    fontSize: 12,
    color: '#CCC',
    marginTop: 4,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  legalLink: {
    fontSize: 13,
    color: '#D4A017',
    fontWeight: '500',
  },
  legalDot: {
    fontSize: 13,
    color: '#CCC',
  },
});
