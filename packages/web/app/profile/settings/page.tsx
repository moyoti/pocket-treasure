'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';
import { useLocale } from '@/contexts/LocaleContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { updateUserSettings, getUserSettings } from '@/lib/api';
import { ChevronLeft, Bell, Map as MapIcon, Lock, Palette, Moon, Globe, Shield } from 'lucide-react';

interface Settings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  achievementNotifications: boolean;
  rareItemAlerts: boolean;
  showAllItems: boolean;
  showRarityFilter: boolean;
  autoCollectNearby: boolean;
  defaultZoom: number;
  publicProfile: boolean;
  showOnLeaderboard: boolean;
  shareLocation: boolean;
  darkMode: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  language: string;
}

const defaultSettings: Settings = {
  pushNotifications: true,
  emailNotifications: false,
  achievementNotifications: true,
  rareItemAlerts: true,
  showAllItems: true,
  showRarityFilter: true,
  autoCollectNearby: false,
  defaultZoom: 15,
  publicProfile: true,
  showOnLeaderboard: true,
  shareLocation: true,
  darkMode: false,
  highContrast: false,
  reducedMotion: false,
  language: 'zh-CN',
};

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { setTheme } = useTheme();
  const { t, locale, setLocale, localeNames } = useLocale();
  const { settings: a11ySettings, setHighContrast, setReducedMotion } = useAccessibility();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userSettings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Failed to parse settings:', e);
        }
      }
    }
  }, []);

  // Load settings from server
  useEffect(() => {
    const loadSettings = async () => {
      if (user) {
        try {
          const serverSettings = await getUserSettings();
          if (serverSettings && Object.keys(serverSettings).length > 0) {
            setSettings(prev => ({ ...prev, ...serverSettings }));
            if (typeof window !== 'undefined') {
              localStorage.setItem('userSettings', JSON.stringify({ ...settings, ...serverSettings }));
            }
            // Apply dark mode from server
            if (serverSettings.darkMode) {
              setTheme(serverSettings.darkMode ? 'dark' : 'light');
            }
          }
        } catch (error) {
          console.error('Failed to load settings from server:', error);
        }
      }
    };
    loadSettings();
  }, [user]);

  const handleToggle = (key: keyof Settings) => {
    const newValue = !settings[key];

    setSettings(prev => {
      const newSettings = { ...prev, [key]: !prev[key] };

      if (typeof window !== 'undefined') {
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
        // Dispatch event for other components to listen
        window.dispatchEvent(new CustomEvent('settingsChange', { detail: newSettings }));
      }
      return newSettings;
    });

    // Apply settings immediately
    if (key === 'darkMode') {
      setTheme(newValue ? 'dark' : 'light');
    }

    if (key === 'highContrast') {
      setHighContrast(newValue);
    }

    if (key === 'reducedMotion') {
      setReducedMotion(newValue);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserSettings(settings);
      if (typeof window !== 'undefined') {
        localStorage.setItem('userSettings', JSON.stringify(settings));
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('settingsChange', { detail: settings }));
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert(t('settings.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLocale(lang as 'zh-CN' | 'en' | 'ja');
    setSettings(prev => {
      const newSettings = { ...prev, language: lang };
      if (typeof window !== 'undefined') {
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
      }
      return newSettings;
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8E7]">
        <div className="cartoon-loader"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const SettingItem = ({
    icon: Icon,
    title,
    description,
    checked,
    onChange,
  }: {
    icon: React.ElementType;
    title: string;
    description: string;
    checked: boolean;
    onChange: () => void;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center border-2 border-gray-800">
          <Icon size={20} className="text-gray-700" />
        </div>
        <div>
          <p className="font-bold text-gray-800">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`w-14 h-8 rounded-full border-2 border-gray-800 relative transition-all duration-200 ${
          checked ? 'bg-green-400' : 'bg-gray-300'
        }`}
      >
        <div
          className={`absolute top-0.5 w-6 h-6 rounded-full bg-white border-2 border-gray-800 shadow-md transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%)' }}>
      {/* Header */}
      <div className="bg-white border-b-4 border-gray-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/profile')}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center border-2 border-gray-800 transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2"><Lock className="w-5 h-5 text-gray-600" />{t('settings.title')}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-page-enter">
        {/* Notification Settings */}
        <section className="cartoon-card overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-3 border-b-2 border-gray-800">
            <div className="flex items-center gap-2">
              <Bell size={20} className="text-gray-700" />
              <h2 className="font-black text-gray-800">{t('settings.notifications')}</h2>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <SettingItem
              icon={Bell}
              title={t('settings.pushNotifications')}
              description={t('settings.pushNotificationsDesc')}
              checked={settings.pushNotifications}
              onChange={() => handleToggle('pushNotifications')}
            />
            <div className="border-t border-gray-200" />
            <SettingItem
              icon={Globe}
              title={t('settings.emailNotifications')}
              description={t('settings.emailNotificationsDesc')}
              checked={settings.emailNotifications}
              onChange={() => handleToggle('emailNotifications')}
            />
            <div className="border-t border-gray-200" />
            <SettingItem
              icon={Shield}
              title={t('settings.achievementNotifications')}
              description={t('settings.achievementNotificationsDesc')}
              checked={settings.achievementNotifications}
              onChange={() => handleToggle('achievementNotifications')}
            />
            <div className="border-t border-gray-200" />
            <SettingItem
              icon={Palette}
              title={t('settings.rareItemAlerts')}
              description={t('settings.rareItemAlertsDesc')}
              checked={settings.rareItemAlerts}
              onChange={() => handleToggle('rareItemAlerts')}
            />
          </div>
        </section>

        {/* Map Settings */}
        <section className="cartoon-card overflow-hidden">
          <div className="bg-gradient-to-r from-green-100 to-teal-100 px-4 py-3 border-b-2 border-gray-800">
            <div className="flex items-center gap-2">
              <MapIcon size={20} className="text-gray-700" />
              <h2 className="font-black text-gray-800">{t('settings.mapSettings')}</h2>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <SettingItem
              icon={MapIcon}
              title={t('settings.showAllItems')}
              description={t('settings.showAllItemsDesc')}
              checked={settings.showAllItems}
              onChange={() => handleToggle('showAllItems')}
            />
            <div className="border-t border-gray-200" />
            <SettingItem
              icon={Palette}
              title={t('settings.showRarityFilter')}
              description={t('settings.showRarityFilterDesc')}
              checked={settings.showRarityFilter}
              onChange={() => handleToggle('showRarityFilter')}
            />
            <div className="border-t border-gray-200" />
            <SettingItem
              icon={Shield}
              title={t('settings.autoCollect')}
              description={t('settings.autoCollectDesc')}
              checked={settings.autoCollectNearby}
              onChange={() => handleToggle('autoCollectNearby')}
            />
            <div className="border-t border-gray-200" />
            <div className="py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-teal-200 flex items-center justify-center border-2 border-gray-800">
                    <MapIcon size={20} className="text-gray-700" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{t('settings.defaultZoom')}</p>
                    <p className="text-xs text-gray-500">{t('settings.defaultZoomDesc')}</p>
                  </div>
                </div>
                <span className="font-bold text-gray-800">{settings.defaultZoom}</span>
              </div>
              <input
                type="range"
                min="10"
                max="20"
                value={settings.defaultZoom}
                onChange={(e) => {
                  const zoom = parseInt(e.target.value);
                  setSettings(prev => {
                    const newSettings = { ...prev, defaultZoom: zoom };
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('userSettings', JSON.stringify(newSettings));
                    }
                    return newSettings;
                  });
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{t('map.noTreasures').charAt(0)}</span>
                <span>{t('map.nearbyTreasures').charAt(0)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Settings */}
        <section className="cartoon-card overflow-hidden">
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-3 border-b-2 border-gray-800">
            <div className="flex items-center gap-2">
              <Lock size={20} className="text-gray-700" />
              <h2 className="font-black text-gray-800">🔒 {t('settings.privacy')}</h2>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <SettingItem
              icon={Globe}
              title={t('settings.publicProfile')}
              description={t('settings.publicProfileDesc')}
              checked={settings.publicProfile}
              onChange={() => handleToggle('publicProfile')}
            />
            <div className="border-t border-gray-200" />
            <SettingItem
              icon={Shield}
              title={t('settings.showOnLeaderboard')}
              description={t('settings.showOnLeaderboardDesc')}
              checked={settings.showOnLeaderboard}
              onChange={() => handleToggle('showOnLeaderboard')}
            />
            <div className="border-t border-gray-200" />
            <SettingItem
              icon={MapIcon}
              title={t('settings.shareLocation')}
              description={t('settings.shareLocationDesc')}
              checked={settings.shareLocation}
              onChange={() => handleToggle('shareLocation')}
            />
          </div>
        </section>

        {/* Display Settings */}
        <section className="cartoon-card overflow-hidden">
          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-3 border-b-2 border-gray-800">
            <div className="flex items-center gap-2">
              <Palette size={20} className="text-gray-700" />
              <h2 className="font-black text-gray-800">🎨 {t('settings.display')}</h2>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <SettingItem
              icon={Moon}
              title={t('settings.darkMode')}
              description={t('settings.darkModeDesc')}
              checked={settings.darkMode}
              onChange={() => handleToggle('darkMode')}
            />
            <div className="border-t border-gray-200" />
            <SettingItem
              icon={Palette}
              title={t('settings.highContrast')}
              description={t('settings.highContrastDesc')}
              checked={settings.highContrast}
              onChange={() => handleToggle('highContrast')}
            />
            <div className="border-t border-gray-200" />
            <SettingItem
              icon={Shield}
              title={t('settings.reducedMotion')}
              description={t('settings.reducedMotionDesc')}
              checked={settings.reducedMotion}
              onChange={() => handleToggle('reducedMotion')}
            />
          </div>
        </section>

        {/* Language Settings */}
        <section className="cartoon-card overflow-hidden">
          <div className="bg-gradient-to-r from-red-100 to-orange-100 px-4 py-3 border-b-2 border-gray-800">
            <div className="flex items-center gap-2">
              <Globe size={20} className="text-gray-700" />
              <h2 className="font-black text-gray-800">🌐 {t('settings.language')}</h2>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(localeNames).map(([code, { name, flag }]) => (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code)}
                  className={`p-3 rounded-xl border-2 border-gray-800 transition-all text-left ${
                    locale === code
                      ? 'bg-yellow-200 border-yellow-500'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl mr-2">{flag}</span>
                  <span className="font-bold text-sm text-gray-800">{name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full cartoon-btn disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? `💾 ${t('common.loading')}` : `💾 ${t('common.save')}${t('settings.title')}`}
        </button>

        {/* Reset Button */}
        <button
          onClick={() => {
            if (confirm(t('settings.resetConfirm'))) {
              localStorage.removeItem('userSettings');
              setSettings(defaultSettings);
              setTheme('light');
              setShowToast(true);
              setTimeout(() => setShowToast(false), 2000);
            }
          }}
          className="w-full py-3 px-4 rounded-xl border-2 border-red-300 text-red-600 font-bold hover:bg-red-50 transition-colors"
        >
          🗑️ {t('settings.resetSettings')}
        </button>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg z-50 animate-bounce-in">
          ✅ {t('settings.saveSuccess')}
        </div>
      )}
    </div>
  );
}