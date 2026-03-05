# 寻宝记 UI 设计系统

> **卡通风格 · 温暖活泼 · 探索收集**

一个专为寻宝记 (Treasure Hunt) 游戏设计的完整卡通风格 UI 系统。设计哲学围绕温暖、探索、惊喜三个核心概念，通过鲜明的色彩、圆润的造型和灵动的动画，创造充满童趣但不失精致的游戏体验。

---

## 🎨 设计原则

### 核心设计理念
- **温暖亲切**：暖色调为主，营造探索冒险的氛围
- **活泼灵动**：动画效果自然流畅，增加游戏趣味性
- **层次分明**：通过阴影、边框、颜色建立清晰的信息层级
- **一致性**：所有组件遵循统一的视觉语言

### 视觉特征
- 粗边框设计（3px solid）营造卡通质感
- 大圆角（15-50px）柔化视觉感受
- Offset 阴影模拟 3D 立体感
- 渐变背景增加深度和温暖感

---

## 🌈 颜色系统

### 主色调

| 名称 | 色值 | 用途 |
|------|------|------|
| **Primary** | `#FFD93D` | 主按钮、高亮、强调元素 |
| **Primary Dark** | `#F4C430` | 按钮底部渐变、阴影 |
| **Primary Light** | `#FFE066` | 悬停状态、高亮背景 |

### 辅助色

| 名称 | 色值 | 用途 |
|------|------|------|
| **Secondary** | `#6BCB77` | 成功状态、正向反馈 |
| **Secondary Dark** | `#5AB669` | 次要按钮渐变底部 |
| **Accent** | `#FF6B6B` | 危险操作、警告、重要提示 |
| **Accent Dark** | `#E85555` | 强调按钮渐变底部 |
| **Accent Blue** | `#4ECDC4` | 信息提示、链接、次级强调 |
| **Accent Purple** | `#9B59B6` | 史诗稀有度、特殊功能 |
| **Accent Pink** | `#FF8ED4` | 装饰性元素、成就 |

### 稀有度颜色（优化版）

| 稀有度 | 颜色 | 色值 | 发光效果 |
|--------|------|------|----------|
| **普通 Common** | 岩石灰 | `#8D99AE` | 无 |
| **稀有 Rare** | 海洋蓝 | `#00B4D8` | 微弱蓝色光晕 |
| **史诗 Epic** | 神秘紫 | `#9B59B6` | 紫色发光 |
| **传说 Legendary** | 炽烈金 | `#FFD700` | 金色脉冲发光 |

#### 稀有度颜色对比
```
旧版: 普通#9ca3af → 新#8D99AE (更温暖的灰色)
旧版: 稀有#3b82f6 → 新#00B4D8 (更明亮的蓝色)
旧版: 史诗#a855f7 → 新#9B59B6 (更饱和的紫色)
旧版: 传说#fbbf24 → 新#FFD700 (更纯正的金色)
```

### 背景色

| 名称 | 色值 | 用途 |
|------|------|------|
| **Bg Light** | `#FFF8E7` | 浅色模式主背景 |
| **Bg Gradient Start** | `#FFF8E7` | 渐变背景起点 |
| **Bg Gradient End** | `#FFE4B5` | 渐变背景终点 |
| **Bg Card** | `#FFFFFF` | 卡片背景 |
| **Bg Overlay** | `rgba(0,0,0,0.5)` | 模态框遮罩 |

### 文字色

| 名称 | 色值 | 用途 |
|------|------|------|
| **Text Primary** | `#2D3436` | 主要文字 |
| **Text Secondary** | `#636E72` | 次要文字、描述 |
| **Text Light** | `#B2BEC3` | 禁用文字、占位符 |
| **Text White** | `#FFFFFF` | 深色背景上的文字 |

### 暗色模式

| 名称 | 色值 | 用途 |
|------|------|------|
| **Dark Bg** | `#1A1A2E` | 暗色主背景 |
| **Dark Card** | `#16213E` | 暗色卡片背景 |
| **Dark Elevated** | `#0F3460` | 悬浮元素 |

---

## 🔤 字体系统

### 字体选择

#### 标题字体（Display）
**站酷快乐体 / ZCOOL KuaiLe**
- 风格：活泼、卡通、圆润
- 用途：Logo、主标题、成就名称
- 备选：站酷高端黑

```css
/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap');
```

#### 正文字体（Body）
**Nunito**
- 风格：圆润、友好、易读
- 用途：正文、按钮文字、描述
- 字重：400 (Regular), 600 (SemiBold), 700 (Bold), 800 (ExtraBold)

```css
/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
```

#### 中文优化
**思源黑体 / Noto Sans SC**
- 作为 Nunito 的中文回退字体
- 保证中文字符显示质量

### 字体层级

| 层级 | 大小 | 字重 | 行高 | 用途 |
|------|------|------|------|------|
| **Hero** | 48px/3rem | 900 | 1.1 | 主标题、大标题 |
| **H1** | 36px/2.25rem | 800 | 1.2 | 页面标题 |
| **H2** | 28px/1.75rem | 700 | 1.3 | 区块标题 |
| **H3** | 22px/1.375rem | 700 | 1.4 | 卡片标题 |
| **H4** | 18px/1.125rem | 600 | 1.5 | 小标题 |
| **Body Large** | 18px/1.125rem | 600 | 1.6 | 重要正文 |
| **Body** | 16px/1rem | 400 | 1.6 | 默认正文 |
| **Body Small** | 14px/0.875rem | 400 | 1.5 | 辅助文字 |
| **Caption** | 12px/0.75rem | 600 | 1.4 | 标签、徽章文字 |

### 字体样式规范

```css
/* 标题样式 */
.cartoon-title {
  font-family: 'ZCOOL KuaiLe', 'Nunito', sans-serif;
  font-weight: 900;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 50%, var(--accent-purple) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(2px 2px 0 rgba(0,0,0,0.1));
}

/* 正文样式 */
.cartoon-text {
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  font-weight: 600;
  letter-spacing: 0.02em;
}

/* 按钮文字 */
.cartoon-btn-text {
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
}
```

---

## ✨ 动画系统

### 动画原则
- **快速响应**：交互动画 200-300ms
- **弹性自然**：使用 cubic-bezier(0.68, -0.55, 0.265, 1.55) 实现弹性效果
- **性能优先**：使用 transform 和 opacity，避免 layout 属性动画

### 基础动画

#### 1. Bounce In（弹入）
```css
@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
/* Duration: 600ms | Easing: ease-out */
```
用途：弹窗出现、卡片加载、重要元素展示

#### 2. Wiggle（摆动）
```css
@keyframes wiggle {
  0%, 100% {
    transform: rotate(-3deg);
  }
  50% {
    transform: rotate(3deg);
  }
}
/* Duration: 500ms | Easing: ease-in-out */
```
用途：错误提示、吸引注意、成就解锁

#### 3. Float（漂浮）
```css
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
/* Duration: 3s | Easing: ease-in-out | Infinite */
```
用途：地图标记、空闲状态装饰

#### 4. Pulse（脉冲）
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}
/* Duration: 2s | Easing: ease-in-out | Infinite */
```
用途：传说物品发光、可交互提示

#### 5. Shake（摇晃）
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
/* Duration: 300ms | Easing: ease-in-out */
```
用途：拒绝操作、错误反馈

#### 6. Legendary Glow（传说发光）
```css
@keyframes legendary-glow {
  0%, 100% {
    box-shadow: 0 0 5px var(--rarity-legendary),
                0 0 10px var(--rarity-legendary);
  }
  50% {
    box-shadow: 0 0 20px var(--rarity-legendary),
                0 0 30px var(--rarity-epic);
  }
}
/* Duration: 2s | Easing: ease-in-out | Infinite */
```
用途：传说物品、稀有成就

#### 7. Collect Success（收集成功）
```css
@keyframes collect-success {
  0% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  50% {
    transform: scale(1.5) rotate(180deg);
    opacity: 0.8;
  }
  100% {
    transform: scale(0) rotate(360deg);
    opacity: 0;
  }
}
/* Duration: 800ms | Easing: cubic-bezier(0.68, -0.55, 0.265, 1.55) */
```
用途：物品收集成功动画

#### 8. Pop（弹出）
```css
@keyframes pop {
  0% {
    transform: scale(0);
  }
  70% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
/* Duration: 400ms | Easing: cubic-bezier(0.175, 0.885, 0.32, 1.275) */
```
用途：按钮点击反馈、小元素出现

#### 9. Slide In（滑入）
```css
@keyframes slide-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
/* Duration: 300ms | Easing: ease-out */
```
用途：列表项加载、Toast 提示

#### 10. Spin（旋转）
```css
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
/* Duration: 1s | Easing: linear | Infinite */
```
用途：加载状态、刷新按钮

### 交互动画

#### 按钮状态
```css
/* Hover - 上浮效果 */
.cartoon-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #333, 0 8px 15px rgba(0,0,0,0.2);
  transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Active - 按下效果 */
.cartoon-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #333, 0 2px 8px rgba(0,0,0,0.15);
  transition: all 0.1s ease;
}

/* Loading - 脉冲 */
.cartoon-btn:disabled {
  animation: pulse 1.5s ease-in-out infinite;
  cursor: not-allowed;
  opacity: 0.7;
}
```

#### 卡片状态
```css
/* Hover - 抬起效果 */
.cartoon-card:hover {
  transform: translateY(-4px) rotate(0.5deg);
  box-shadow: 0 8px 0 rgba(0,0,0,0.1), 0 12px 30px rgba(0,0,0,0.15);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Click - 缩放反馈 */
.cartoon-card:active {
  transform: scale(0.98);
  transition: all 0.1s ease;
}
```

### 页面转场动画

```css
/* 页面进入 */
.page-enter {
  opacity: 0;
  transform: translateY(20px);
}
.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 页面离开 */
.page-exit {
  opacity: 1;
  transform: scale(1);
}
.page-exit-active {
  opacity: 0;
  transform: scale(0.95);
  transition: all 0.3s ease-in;
}
```

---

## 🧩 组件规范

### 1. 按钮 (Button)

#### 主按钮
```css
.cartoon-btn {
  /* 基础样式 */
  background: linear-gradient(180deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: var(--text-primary);
  font-weight: 800;
  font-size: 16px;
  padding: 14px 32px;
  border-radius: 50px;
  border: 3px solid var(--text-primary);
  box-shadow: 0 4px 0 var(--text-primary);
  
  /* 交互 */
  transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
  
  /* 文字 */
  text-transform: uppercase;
  letter-spacing: 1px;
}
```

#### 次按钮
```css
.cartoon-btn-secondary {
  background: linear-gradient(180deg, var(--secondary) 0%, var(--secondary-dark) 100%);
  color: white;
}
```

#### 危险按钮
```css
.cartoon-btn-danger {
  background: linear-gradient(180deg, var(--accent) 0%, var(--accent-dark) 100%);
  color: white;
}
```

#### 幽灵按钮
```css
.cartoon-btn-ghost {
  background: transparent;
  border: 3px solid var(--text-primary);
  box-shadow: 0 4px 0 var(--text-primary);
  color: var(--text-primary);
}
```

#### 按钮尺寸
| 尺寸 | 内边距 | 字体大小 | 用途 |
|------|--------|----------|------|
| **Small** | 8px 16px | 14px | 紧凑空间 |
| **Medium** (默认) | 14px 32px | 16px | 主要操作 |
| **Large** | 18px 48px | 18px | 强调操作 |
| **Icon** | 12px | 20px | 图标按钮 |

### 2. 卡片 (Card)

#### 基础卡片
```css
.cartoon-card {
  /* 基础样式 */
  background: white;
  border-radius: 20px;
  border: 3px solid var(--text-primary);
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.1), 0 6px 20px rgba(0, 0, 0, 0.1);
  
  /* 交互 */
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  /* 内容间距 */
  padding: 20px;
}

.cartoon-card:hover {
  transform: translateY(-4px) rotate(0.5deg);
  box-shadow: 0 8px 0 rgba(0, 0, 0, 0.1), 0 12px 30px rgba(0, 0, 0, 0.15);
}
```

#### 收藏卡片
```css
.collection-card {
  background: white;
  border-radius: 20px;
  border: 3px solid var(--text-primary);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.collection-card:hover {
  transform: translateY(-8px) rotate(1deg);
  box-shadow: 0 12px 0 rgba(0, 0, 0, 0.1);
}

.collection-card-image {
  background: linear-gradient(135deg, var(--bg-light) 0%, var(--bg-gradient-end) 100%);
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
}
```

#### 统计卡片
```css
.stat-card {
  background: linear-gradient(135deg, white 0%, var(--bg-light) 100%);
  border-radius: 20px;
  border: 3px solid var(--text-primary);
  padding: 24px;
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--primary-dark);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 700;
}
```

### 3. 弹窗/模态框 (Modal)

```css
/* 遮罩 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 16px;
}

/* 弹窗容器 */
.modal-content {
  background: white;
  border-radius: 24px;
  border: 4px solid var(--text-primary);
  box-shadow: 0 8px 0 rgba(0, 0, 0, 0.2), 0 20px 40px rgba(0, 0, 0, 0.2);
  max-width: 420px;
  width: 100%;
  padding: 32px;
  animation: bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 弹窗标题 */
.modal-title {
  font-size: 1.5rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 16px;
}

/* 弹窗按钮组 */
.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.modal-actions button {
  flex: 1;
}
```

### 4. 输入框 (Input)

```css
.cartoon-input {
  /* 基础样式 */
  background: white;
  border: 3px solid var(--text-primary);
  border-radius: 16px;
  padding: 16px 20px;
  font-size: 16px;
  font-weight: 600;
  width: 100%;
  
  /* 阴影 */
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
  
  /* 过渡 */
  transition: all 0.3s ease;
}

.cartoon-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.05),
    0 0 0 4px rgba(255, 217, 61, 0.3);
}

.cartoon-input::placeholder {
  color: var(--text-light);
}

/* 错误状态 */
.cartoon-input.error {
  border-color: var(--accent);
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.05),
    0 0 0 4px rgba(255, 107, 107, 0.2);
}
```

### 5. 徽章/标签 (Badge)

#### 稀有度徽章
```css
.cartoon-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 50px;
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 2px solid currentColor;
}

.cartoon-badge-common {
  background: var(--rarity-common);
  color: white;
}

.cartoon-badge-rare {
  background: var(--rarity-rare);
  color: white;
}

.cartoon-badge-epic {
  background: var(--rarity-epic);
  color: white;
}

.cartoon-badge-legendary {
  background: linear-gradient(135deg, var(--rarity-legendary) 0%, #F39C12 100%);
  color: var(--text-primary);
  animation: legendary-glow 2s infinite;
}
```

### 6. 提示框/Toast

```css
.toast {
  padding: 16px 24px;
  border-radius: 16px;
  border: 3px solid;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.1), 0 8px 20px rgba(0, 0, 0, 0.1);
  animation: slide-in-up 0.3s ease-out;
}

.toast-success {
  background: #D1FAE5;
  border-color: var(--secondary);
  color: #059669;
}

.toast-error {
  background: #FEE2E2;
  border-color: var(--accent);
  color: #DC2626;
}

.toast-info {
  background: #DBEAFE;
  border-color: var(--accent-blue);
  color: #2563EB;
}
```

### 7. 底部导航 (Bottom Navigation)

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 4px solid var(--text-primary);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  z-index: 50;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 64px;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: var(--text-secondary);
}

.bottom-nav-item:hover {
  transform: translateY(-2px);
  color: var(--primary);
}

.bottom-nav-item.active {
  color: var(--primary);
  font-weight: 700;
}

.bottom-nav-item .icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.bottom-nav-item .label {
  font-size: 12px;
  font-weight: 600;
}
```

### 8. 加载器 (Loader)

```css
.cartoon-loader {
  width: 56px;
  height: 56px;
  border: 6px solid var(--bg-light);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 脉冲加载器 */
.cartoon-loader-pulse {
  width: 56px;
  height: 56px;
  background: var(--primary);
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

/* 弹跳加载器 */
.cartoon-loader-bounce {
  display: flex;
  gap: 8px;
}

.cartoon-loader-bounce > div {
  width: 16px;
  height: 16px;
  background: var(--primary);
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite both;
}

.cartoon-loader-bounce > div:nth-child(1) { animation-delay: -0.32s; }
.cartoon-loader-bounce > div:nth-child(2) { animation-delay: -0.16s; }
```

### 9. 头像 (Avatar)

```css
.cartoon-avatar {
  border-radius: 50%;
  border: 4px solid var(--primary);
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.cartoon-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.15);
}

/* 尺寸 */
.cartoon-avatar-sm { width: 40px; height: 40px; }
.cartoon-avatar-md { width: 64px; height: 64px; }
.cartoon-avatar-lg { width: 96px; height: 96px; }
```

### 10. 地图标记 (Map Marker)

```css
/* 用户位置标记 */
.map-marker-user {
  width: 28px;
  height: 28px;
  background: var(--accent-blue);
  border: 4px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  animation: pulse 2s infinite;
}

/* 物品标记 */
.map-marker-item {
  width: 40px;
  height: 40px;
  border: 4px solid white;
  border-radius: 50%;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all 0.2s ease;
}

.map-marker-item:hover {
  transform: scale(1.2) translateY(-4px);
}

/* 按稀有度 */
.map-marker-common { background: var(--rarity-common); }
.map-marker-rare { background: var(--rarity-rare); }
.map-marker-epic { background: var(--rarity-epic); }
.map-marker-legendary {
  background: var(--rarity-legendary);
  animation: legendary-glow 2s infinite, float 3s infinite;
}
```

---

## 🎯 特殊场景设计

### 1. 物品收集成功

```
动画序列：
1. 物品图标放大旋转 (0ms-400ms)
2. 金币/星星粒子爆发 (200ms-800ms)
3. 物品飞向背包图标 (400ms-800ms)
4. 背包图标弹跳反馈 (700ms-900ms)
5. Toast提示出现 (800ms+)
```

### 2. 稀有度揭示

```
普通: 简单缩放出现
稀有: 缩放 + 蓝色光晕
史诗: 缩放 + 紫色发光 + 粒子效果
传说: 缩放 + 金色脉冲发光 + 全屏暗化 + 庆祝动画
```

### 3. 成就解锁

```
动画序列：
1. 徽章从下方弹入
2. 金色粒子从中心爆发
3. 标题文字逐字显示
4. 背景轻微震动
5. 持续发光效果
```

---

## 📱 响应式断点

| 断点 | 尺寸 | 说明 |
|------|------|------|
| **Mobile** | < 640px | 单列布局，全宽卡片 |
| **Tablet** | 640px - 1024px | 双列网格，适中间距 |
| **Desktop** | > 1024px | 三列以上，最大宽度容器 |

### 容器宽度
```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 640px) {
  .container { padding: 0 24px; }
}

@media (min-width: 1024px) {
  .container { padding: 0 32px; }
}
```

---

## 🌓 暗色模式

### 颜色映射

| 浅色模式 | 暗色模式 |
|----------|----------|
| `var(--bg-light)` | `#1A1A2E` |
| `var(--bg-card)` | `#16213E` |
| `white` | `#1A1A2E` |
| `var(--text-primary)` | `#FFFFFF` |
| `var(--text-secondary)` | `#A0A0A0` |
| `var(--border)` | `#444444` |

### 暗色模式组件调整

```css
.dark .cartoon-card {
  background: #1A1A2E;
  border-color: #444444;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.3), 0 6px 20px rgba(0, 0, 0, 0.3);
}

.dark .cartoon-btn {
  border-color: #666666;
  box-shadow: 0 4px 0 #666666;
}

.dark .cartoon-input {
  background: #1A1A2E;
  border-color: #444444;
  color: white;
}
```

---

## 🎮 游戏特殊元素

### 1. 稀有度指示器

```css
.rarity-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 50px;
  font-weight: 700;
  font-size: 14px;
}

.rarity-indicator::before {
  content: '';
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.rarity-common::before { background: var(--rarity-common); }
.rarity-rare::before { background: var(--rarity-rare); box-shadow: 0 0 8px var(--rarity-rare); }
.rarity-epic::before { background: var(--rarity-epic); box-shadow: 0 0 12px var(--rarity-epic); }
.rarity-legendary::before { 
  background: var(--rarity-legendary); 
  box-shadow: 0 0 16px var(--rarity-legendary);
  animation: legendary-glow 2s infinite;
}
```

### 2. 收集按钮

```css
.collect-button {
  position: relative;
  overflow: hidden;
}

.collect-button::after {
  content: '✨';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  transition: all 0.3s ease;
}

.collect-button:hover::after {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
}
```

### 3. 距离指示器

```css
.distance-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: white;
  border: 3px solid var(--text-primary);
  border-radius: 50px;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.1);
}

.distance-badge.near {
  background: var(--secondary);
  color: white;
}

.distance-badge.far {
  background: var(--text-light);
  color: white;
}
```

---

## 📝 实施检查清单

### CSS 变量定义
```css
:root {
  /* 主色 */
  --primary: #FFD93D;
  --primary-dark: #F4C430;
  --primary-light: #FFE066;
  
  /* 辅助色 */
  --secondary: #6BCB77;
  --secondary-dark: #5AB669;
  --accent: #FF6B6B;
  --accent-dark: #E85555;
  --accent-blue: #4ECDC4;
  --accent-purple: #9B59B6;
  --accent-pink: #FF8ED4;
  
  /* 稀有度 */
  --rarity-common: #8D99AE;
  --rarity-rare: #00B4D8;
  --rarity-epic: #9B59B6;
  --rarity-legendary: #FFD700;
  
  /* 背景 */
  --bg-light: #FFF8E7;
  --bg-gradient-start: #FFF8E7;
  --bg-gradient-end: #FFE4B5;
  --bg-card: #FFFFFF;
  
  /* 文字 */
  --text-primary: #2D3436;
  --text-secondary: #636E72;
  --text-light: #B2BEC3;
}
```

### 性能考虑
- ✅ 使用 `transform` 和 `opacity` 进行动画
- ✅ 使用 `will-change` 提示浏览器优化
- ✅ 动画完成后移除 `will-change`
- ✅ 支持 `prefers-reduced-motion` 媒体查询
- ✅ 使用 CSS 变量便于主题切换

### 无障碍考虑
- ✅ 颜色对比度符合 WCAG AA 标准
- ✅ 焦点状态清晰可见
- ✅ 支持键盘导航
- ✅ 提供减少动画选项
- ✅ 语义化 HTML 结构

---

## 🔄 版本记录

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0 | 2026-03-05 | 初始版本，完整的卡通风格设计系统 |

---

**设计系统由寻宝记团队维护**

如有问题或建议，欢迎提交 Issue 或 PR。
