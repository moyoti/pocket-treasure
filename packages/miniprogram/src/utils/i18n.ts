export type Locale = 'zh-CN' | 'en' | 'ja'

export interface LocaleInfo {
  name: string
  flag: string
}

export const localeNames: Record<Locale, LocaleInfo> = {
  'zh-CN': { name: '简体中文', flag: '🇨🇳' },
  'en': { name: 'English', flag: '🇺🇸' },
  'ja': { name: '日本語', flag: '🇯🇵' }
}

type TranslationObject = Record<string, string | Record<string, any>>

const translations: Record<Locale, TranslationObject> = {
  'zh-CN': {
    common: {
      save: '保存',
      cancel: '取消',
      success: '操作成功',
      loading: '加载中...',
      confirm: '确认',
      close: '关闭',
    },
    settings: {
      title: '设置',
      notifications: '通知设置',
      pushNotifications: '推送通知',
      pushNotificationsDesc: '接收游戏活动推送',
      emailNotifications: '邮件通知',
      emailNotificationsDesc: '接收邮件提醒',
      achievementNotifications: '成就通知',
      achievementNotificationsDesc: '获得成就时提醒',
      rareItemAlerts: '稀有物品提醒',
      rareItemAlertsDesc: '附近出现稀有物品时通知',
      mapSettings: '地图设置',
      showAllItems: '显示所有物品',
      showAllItemsDesc: '在地图上显示所有可收集物品',
      showRarityFilter: '稀有度过滤',
      showRarityFilterDesc: '按稀有度筛选物品显示',
      autoCollect: '自动收集',
      autoCollectDesc: '进入范围时自动收集物品',
      defaultZoom: '默认缩放等级',
      defaultZoomDesc: '地图打开时的缩放等级',
      privacy: '隐私设置',
      publicProfile: '公开资料',
      publicProfileDesc: '其他玩家可以查看你的资料',
      showOnLeaderboard: '排行榜可见',
      showOnLeaderboardDesc: '在排行榜中显示你的名字',
      shareLocation: '位置分享',
      shareLocationDesc: '允许好友查看你的位置',
      display: '显示设置',
      darkMode: '暗黑模式',
      darkModeDesc: '使用深色主题',
      highContrast: '高对比度',
      highContrastDesc: '增强文字和背景对比',
      reducedMotion: '减少动效',
      reducedMotionDesc: '减少界面动画效果',
      language: '语言设置',
      saveSuccess: '设置已保存！',
      saveFailed: '保存设置失败，请稍后重试',
      resetSettings: '重置为默认',
      resetConfirm: '确定要恢复默认设置吗？',
    },
  },
  'en': {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      success: 'Success',
      loading: 'Loading...',
      confirm: 'Confirm',
      close: 'Close',
    },
    settings: {
      title: 'Settings',
      notifications: 'Notifications',
      pushNotifications: 'Push Notifications',
      pushNotificationsDesc: 'Receive game activity push alerts',
      emailNotifications: 'Email Notifications',
      emailNotificationsDesc: 'Receive email reminders',
      achievementNotifications: 'Achievement Notifications',
      achievementNotificationsDesc: 'Get notified when achieving milestones',
      rareItemAlerts: 'Rare Item Alerts',
      rareItemAlertsDesc: 'Get notified when rare items appear nearby',
      mapSettings: 'Map Settings',
      showAllItems: 'Show All Items',
      showAllItemsDesc: 'Show all collectible items on the map',
      showRarityFilter: 'Rarity Filter',
      showRarityFilterDesc: 'Filter items by rarity',
      autoCollect: 'Auto Collect',
      autoCollectDesc: 'Automatically collect items when in range',
      defaultZoom: 'Default Zoom Level',
      defaultZoomDesc: 'Initial map zoom level',
      privacy: 'Privacy Settings',
      publicProfile: 'Public Profile',
      publicProfileDesc: 'Allow others to view your profile',
      showOnLeaderboard: 'Show on Leaderboard',
      showOnLeaderboardDesc: 'Display your name on the leaderboard',
      shareLocation: 'Share Location',
      shareLocationDesc: 'Allow friends to view your location',
      display: 'Display Settings',
      darkMode: 'Dark Mode',
      darkModeDesc: 'Use dark theme',
      highContrast: 'High Contrast',
      highContrastDesc: 'Enhance text and background contrast',
      reducedMotion: 'Reduced Motion',
      reducedMotionDesc: 'Reduce interface animations',
      language: 'Language',
      saveSuccess: 'Settings saved!',
      saveFailed: 'Failed to save settings, please try again',
      resetSettings: 'Reset to Default',
      resetConfirm: 'Are you sure you want to reset to default settings?',
    },
  },
  'ja': {
    common: {
      save: '保存',
      cancel: 'キャンセル',
      success: '成功',
      loading: '読み込み中...',
      confirm: '確認',
      close: '閉じる',
    },
    settings: {
      title: '設定',
      notifications: '通知設定',
      pushNotifications: 'プッシュ通知',
      pushNotificationsDesc: 'ゲームアクティビティの通知を受け取る',
      emailNotifications: 'メール通知',
      emailNotificationsDesc: 'メールリマインダーを受け取る',
      achievementNotifications: '実績通知',
      achievementNotificationsDesc: '実績達成時に通知を受け取る',
      rareItemAlerts: 'レアアイテムアラート',
      rareItemAlertsDesc: '近くにレアアイテムが出現した時に通知',
      mapSettings: 'マップ設定',
      showAllItems: '全アイテム表示',
      showAllItemsDesc: 'マップにすべての収集アイテムを表示',
      showRarityFilter: 'レアリティフィルター',
      showRarityFilterDesc: 'レアリティでアイテムをフィルター',
      autoCollect: '自動収集',
      autoCollectDesc: '範囲内有 automat ically collect items',
      defaultZoom: 'デフォルトズームレベル',
      defaultZoomDesc: 'マップを開く時のズームレベル',
      privacy: 'プライバシー設定',
      publicProfile: '公開プロフィール',
      publicProfileDesc: '他のユーザーがプロフィールを閲覧可能',
      showOnLeaderboard: 'ランキング表示',
      showOnLeaderboardDesc: 'ランキングに名前を表示',
      shareLocation: '位置情報共有',
      shareLocationDesc: 'フレンドに位置情報を共有',
      display: '表示設定',
      darkMode: 'ダークモード',
      darkModeDesc: 'ダークテーマを使用',
      highContrast: 'ハイコントラスト',
      highContrastDesc: 'テキストと背景のコントラストを強化',
      reducedMotion: 'モーション軽減',
      reducedMotionDesc: 'インターフェースのアニメーションを軽減',
      language: '言語設定',
      saveSuccess: '設定を保存しました！',
      saveFailed: '設定の保存に失敗しました',
      resetSettings: 'デフォルトにリセット',
      resetConfirm: 'デフォルト設定に戻しますか？',
    },
  },
}

let currentLocale: Locale = 'zh-CN'

export function initI18n(locale?: Locale) {
  if (locale) {
    currentLocale = locale
    return
  }
  try {
    const saved = wx.getStorageSync('userSettings')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.language && localeNames[parsed.language as Locale]) {
        currentLocale = parsed.language as Locale
      }
    }
  } catch (e) {
    console.error('Failed to load locale from settings:', e)
  }
}

export function setLocale(locale: Locale) {
  currentLocale = locale
}

export function getLocale(): Locale {
  return currentLocale
}

export function t(key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.')
  let value: any = translations[currentLocale]
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      value = translations['zh-CN']
      for (const k2 of keys) {
        if (value && typeof value === 'object' && k2 in value) {
          value = value[k2]
        } else {
          return key
        }
      }
      break
    }
  }
  
  if (typeof value !== 'string') {
    return key
  }
  
  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
      return params[paramKey]?.toString() ?? `{${paramKey}}`
    })
  }
  
  return value
}
