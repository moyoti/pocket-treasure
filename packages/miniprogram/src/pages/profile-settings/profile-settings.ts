// pages/profile-settings/profile-settings.ts
import { getUserSettings, updateUserSettings } from '../../utils/api'
import { initI18n, setLocale, t } from '../../utils/i18n'

interface SettingsData {
  pushNotifications: boolean
  emailNotifications: boolean
  achievementNotifications: boolean
  rareItemAlerts: boolean
  showAllItems: boolean
  showRarityFilter: boolean
  autoCollectNearby: boolean
  defaultZoom: number
  publicProfile: boolean
  showOnLeaderboard: boolean
  shareLocation: boolean
  darkMode: boolean
  highContrast: boolean
  reducedMotion: boolean
  language: string
}

const defaultSettings: SettingsData = {
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
}

Page({
  data: {
    ...defaultSettings,
    showToast: false,
    saving: false,
    i18n: {} as Record<string, any>,
  },

  onLoad() {
    initI18n()
    this.loadSettings()
    this.updateI18n()
  },

  updateI18n() {
    const i18n: Record<string, any> = {
      common: {
        save: t('common.save'),
        cancel: t('common.cancel'),
        success: t('common.success'),
      },
      settings: {
        title: t('settings.title'),
        notifications: t('settings.notifications'),
        pushNotifications: t('settings.pushNotifications'),
        pushNotificationsDesc: t('settings.pushNotificationsDesc'),
        emailNotifications: t('settings.emailNotifications'),
        emailNotificationsDesc: t('settings.emailNotificationsDesc'),
        achievementNotifications: t('settings.achievementNotifications'),
        achievementNotificationsDesc: t('settings.achievementNotificationsDesc'),
        rareItemAlerts: t('settings.rareItemAlerts'),
        rareItemAlertsDesc: t('settings.rareItemAlertsDesc'),
        mapSettings: t('settings.mapSettings'),
        showAllItems: t('settings.showAllItems'),
        showAllItemsDesc: t('settings.showAllItemsDesc'),
        showRarityFilter: t('settings.showRarityFilter'),
        showRarityFilterDesc: t('settings.showRarityFilterDesc'),
        autoCollect: t('settings.autoCollect'),
        autoCollectDesc: t('settings.autoCollectDesc'),
        defaultZoom: t('settings.defaultZoom'),
        defaultZoomDesc: t('settings.defaultZoomDesc'),
        privacy: t('settings.privacy'),
        publicProfile: t('settings.publicProfile'),
        publicProfileDesc: t('settings.publicProfileDesc'),
        showOnLeaderboard: t('settings.showOnLeaderboard'),
        showOnLeaderboardDesc: t('settings.showOnLeaderboardDesc'),
        shareLocation: t('settings.shareLocation'),
        shareLocationDesc: t('settings.shareLocationDesc'),
        display: t('settings.display'),
        darkMode: t('settings.darkMode'),
        darkModeDesc: t('settings.darkModeDesc'),
        highContrast: t('settings.highContrast'),
        highContrastDesc: t('settings.highContrastDesc'),
        reducedMotion: t('settings.reducedMotion'),
        reducedMotionDesc: t('settings.reducedMotionDesc'),
        language: t('settings.language'),
        saveSuccess: t('settings.saveSuccess'),
        saveFailed: t('settings.saveFailed'),
        resetSettings: t('settings.resetSettings'),
        resetConfirm: t('settings.resetConfirm'),
      },
    }
    this.setData({ i18n })
  },

  async loadSettings() {
    try {
      const localSettings = wx.getStorageSync('userSettings')
      if (localSettings) {
        const parsed = JSON.parse(localSettings)
        this.setData(parsed)
        if (parsed.language) {
          setLocale(parsed.language as any)
          this.updateI18n()
        }
        this.applyTheme(parsed)
      }
    } catch (e) {
      console.error('Failed to load settings:', e)
    }

    try {
      const serverSettings = await getUserSettings()
      if (serverSettings && Object.keys(serverSettings).length > 0) {
        const merged = { ...this.data, ...serverSettings }
        this.setData(merged)
        if (serverSettings.language) {
          setLocale(serverSettings.language as any)
          this.updateI18n()
        }
        this.applyTheme(serverSettings)
        wx.setStorageSync('userSettings', JSON.stringify(merged))
      }
    } catch (e) {
      console.error('Failed to load settings from server:', e)
    }
  },

  applyTheme(settings: Partial<SettingsData>) {
    const app = getApp<any>()
    
    if (settings.darkMode !== undefined) {
      app.globalData.darkMode = settings.darkMode
    }
    if (settings.highContrast !== undefined) {
      app.globalData.highContrast = settings.highContrast
    }
    if (settings.reducedMotion !== undefined) {
      app.globalData.reducedMotion = settings.reducedMotion
    }

    const pages = getCurrentPages()
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1]
      if (currentPage.applyTheme) {
        currentPage.applyTheme()
      }
    }

    this.notifySettingsChange(settings)
  },

  notifySettingsChange(settings: any) {
    try {
      const eventChannel = this.getOpenerEventChannel()
      if (eventChannel && eventChannel.emit) {
        eventChannel.emit('settingsChange', settings)
      }
    } catch (e) {
    }

    try {
      wx.eventCenter.trigger('settingsChange', settings)
    } catch (e) {
    }
  },

  toggleSetting(e: any) {
    const key = e.currentTarget.dataset.key as keyof SettingsData
    const current = this.data[key]
    if (typeof current === 'boolean') {
      const newValue = !current
      const update: any = { [key]: newValue }
      this.setData(update)
      const settingsUpdate: any = {}
      settingsUpdate[key] = newValue
      this.applyTheme(settingsUpdate)
    }
  },

  onZoomChange(e: any) {
    this.setData({ defaultZoom: e.detail.value })
  },

  selectLanguage(e: any) {
    const lang = e.currentTarget.dataset.lang
    this.setData({ language: lang })
    setLocale(lang as any)
    this.updateI18n()
  },

  async saveSettings() {
    const settings: SettingsData = {
      pushNotifications: this.data.pushNotifications,
      emailNotifications: this.data.emailNotifications,
      achievementNotifications: this.data.achievementNotifications,
      rareItemAlerts: this.data.rareItemAlerts,
      showAllItems: this.data.showAllItems,
      showRarityFilter: this.data.showRarityFilter,
      autoCollectNearby: this.data.autoCollectNearby,
      defaultZoom: this.data.defaultZoom,
      publicProfile: this.data.publicProfile,
      showOnLeaderboard: this.data.showOnLeaderboard,
      shareLocation: this.data.shareLocation,
      darkMode: this.data.darkMode,
      highContrast: this.data.highContrast,
      reducedMotion: this.data.reducedMotion,
      language: this.data.language,
    }

    this.setData({ saving: true })

    try {
      await updateUserSettings(settings)
      wx.setStorageSync('userSettings', JSON.stringify(settings))
      this.applyTheme(settings)
      wx.showToast({ title: t('settings.saveSuccess'), icon: 'success' })
    } catch (e: any) {
      wx.showToast({ title: t('settings.saveFailed'), icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  },

  resetSettings() {
    wx.showModal({
      title: t('settings.resetSettings'),
      content: t('settings.resetConfirm'),
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userSettings')
          this.setData(defaultSettings)
          initI18n('zh-CN')
          this.updateI18n()
          this.applyTheme(defaultSettings)
          wx.showToast({ title: t('common.success'), icon: 'success' })
        }
      }
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
