// pages/profile-help/profile-help.ts

Page({
  data: {
    faqs: [
      {
        icon: '/images/icons/map.svg',
        question: '如何收集宝藏？',
        answer: '打开地图，寻找附近的宝藏标记。当你距离宝藏50米以内时，点击标记即可收集。宝藏会显示不同的稀有度，越稀有的宝藏出现概率越低。',
        expanded: false,
        bg: '#EFF6FF',
      },
      {
        icon: '/images/icons/gem.svg',
        question: '什么是稀有度？',
        answer: '物品分为四个稀有度等级：普通（灰色）、稀有（蓝色）、史诗（紫色）、传说（金色）。稀有度越高，物品越珍贵，出现概率越低。',
        expanded: false,
        bg: '#FAF5FF',
      },
      {
        icon: '/images/icons/users.svg',
        question: '如何添加好友？',
        answer: '进入好友页面，使用搜索功能查找其他玩家的用户名，然后发送好友请求。对方同意后即可成为好友，互相查看收集进度。',
        expanded: false,
        bg: '#ECFDF5',
      },
      {
        icon: '/images/icons/store.svg',
        question: '如何在市场交易？',
        answer: '在市场页面可以上架���己的物品出售，也可以浏览并购买其他玩家的物品。交易使用金币作为货币。',
        expanded: false,
        bg: '#FFF7ED',
      },
      {
        icon: '/images/icons/dices.svg',
        question: '什么是保底系统？',
        answer: '抽奖系统设有保底机制，当连续多次未获得高稀有度物品时，系统会提升获得概率，确保你不会空手而归。',
        expanded: false,
        bg: '#FDF2F8',
      },
      {
        icon: '/images/icons/coins.svg',
        question: '金币有什么用？',
        answer: '金币可以用来在商店购买物品、在市场交易、进行抽奖���。可以通过收集宝藏、完成任务、出售物品获得金币。',
        expanded: false,
        bg: '#FFFBEB',
      },
    ],
    rules: [
      { icon: '/images/icons/target.svg', title: '收集半径', desc: '必须距离宝藏50米以内才能收集', bg: '#FEE2E2' },
      { icon: '/images/icons/refresh-cw.svg', title: '刷新机制', desc: '新宝藏每小时在各个地点随机生成', bg: '#D1FAE5' },
      { icon: '/images/icons/gem.svg', title: '稀有度系统', desc: '普通 > 稀有 > 史诗 > 传说', bg: '#EDE9FE' },
      { icon: '/images/icons/medal.svg', title: '成就系统', desc: '完成特定目标解锁专属成就徽章', bg: '#FEF3C7' },
    ],
  },

  toggleFaq(e: any) {
    const index = e.currentTarget.dataset.index
    const key = `faqs[${index}].expanded`
    const current = this.data.faqs[index].expanded
    this.setData({ [key]: !current })
  },

  goBack() {
    wx.navigateBack()
  }
})
