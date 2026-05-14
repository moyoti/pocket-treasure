# Treasure Cat - Screenshots & ASO Guide

## 📸 Screenshots Requirements

### Google Play Specifications:
- **Minimum**: 2 screenshots
- **Recommended**: 5-8 screenshots
- **Format**: PNG or JPG
- **Resolution**: At least 320px on any side, max 3840px
- **Aspect Ratio**: 16:9 to 9:16

### 🎯 Recommended Screenshots (Capture These):

#### 1. Main Map View (Primary Screenshot)
**What to show:**
- Map with multiple treasure markers visible
- User location indicator
- Collection radius circles
- Clean UI with treasure count

**How to capture:**
```bash
# On emulator
adb shell screencap -p /sdcard/map_view.png
adb pull /sdcard/map_view.png screenshots/01_map_view.png
```

**Caption**: "Explore the real world and discover hidden treasures!"

#### 2. Collection Inventory
**What to show:**
- Grid of collected items
- Different rarity levels (colors)
- Collection progress
- Rare/legendary items highlighted

**Caption**: "Collect rare treasures and complete your collection!"

#### 3. Trading Interface
**What to show:**
- Two players trading
- Items being exchanged
- Bluetooth connection indicator
- Friendly UI

**Caption**: "Trade with nearby players offline!"

#### 4. Achievements Screen
**What to show:**
- Achievement list with icons
- Progress bars
- Completed vs locked achievements
- Rewards preview

**Caption**: "Complete challenges and earn achievements!"

#### 5. Custom Markers
**What to show:**
- Map with user-created markers
- Different marker icons/colors
- Marker creation interface

**Caption**: "Mark your favorite locations and share with friends!"

#### 6. QR Code Feature
**What to show:**
- QR code display screen
- Scanner interface
- Friend addition flow

**Caption**: "Add friends instantly with QR codes!"

#### 7. Profile & Stats
**What to show:**
- User profile with stats
- Collection counts
- Exploration progress
- Achievement summary

**Caption**: "Track your progress and show off your stats!"

#### 8. Item Detail View
**What to show:**
- Detailed item information
- Rarity indicator
- Collection series
- Item lore/description

**Caption**: "Discover unique items with rich histories!"

### 📱 Screenshot Best Practices:

#### DO:
- ✅ Use high-resolution captures
- ✅ Show actual gameplay
- ✅ Include UI text (make sure it's readable)
- ✅ Highlight key features
- ✅ Use landscape and portrait orientations
- ✅ Add text overlays if needed (optional)
- ✅ Show variety of screens

#### DON'T:
- ❌ Use blurry or low-quality images
- ❌ Show empty states or errors
- ❌ Include personal information
- ❌ Use screenshots from other apps
- ❌ Misrepresent features
- ❌ Show debug information

### 🎨 Screenshot Enhancement (Optional):

#### Tools:
- **Canva**: Free screenshot templates
- **Figma**: Professional design
- **Photoshop**: Advanced editing
- **App Screenshot Maker**: Mobile apps

#### Text Overlays:
Add short, punchy text to highlight features:
- "100+ Items to Collect"
- "Play Offline Anywhere"
- "Trade with Friends"
- "Explore Your City"

### 🌍 Localization:

Create separate screenshots for:
- **English** (Default)
- **Japanese** (For Japan market)

**Japanese text examples:**
- "世界中で宝を探そう" (Search for treasures worldwide)
- "100 種類以上のアイテム" (100+ items)
- "オフラインでプレイ" (Play offline)

---

## 🔍 ASO (App Store Optimization)

### Title Optimization:
**Current**: Treasure Cat
**Good**: Clear, memorable, includes "Cat" for mascot appeal

### Short Description Keywords:
**English**: "Collect treasures, explore maps, trade offline"
**Japanese**: "宝を集めて、地図を探索、オフライントレード"

### Long Description Keywords:

#### Primary Keywords (High Priority):
- treasure hunt
- collection game
- offline game
- location game
- trading game

#### Secondary Keywords:
- pokemon go alternative
- adventure game
- cat game
- exploration game
- multiplayer offline
- local trading
- item collection
- rarity collection

#### Long-tail Keywords:
- location based collection game
- offline multiplayer trading
- real world exploration game
- bluetooth trading game
- local area treasure hunt

### Keyword Strategy:

#### Google Play (in description):
Google Play indexes keywords in your description naturally. Include keywords 3-5 times throughout your description.

**Example Integration:**
> "Treasure Cat is the ultimate **treasure hunt** game where you **collect** rare items while **exploring** the real world. This **offline game** lets you **trade** with nearby players without internet."

### Competitor Keywords:

Analyze similar apps:
- Pokémon GO
- Ingress
- Geocaching
- Monster Hunter Now

**Find their keywords:**
- Use tools like AppAnnie, SensorTower
- Check their descriptions
- Read user reviews for common terms

### Tags Selection (5 tags):

Recommended tags for Treasure Cat:
1. **Adventure** ✅
2. **Casual** ✅
3. **Role Playing** (if progression is deep)
4. **Simulation** (if collection is main focus)
5. **Strategy** (if trading requires planning)

---

## 📊 A/B Testing

### Test Elements:
1. **Icon variations** (different cat expressions)
2. **Screenshot order** (which features first)
3. **Short description** (different value propositions)
4. **Feature graphic** (different designs)

### Metrics to Track:
- **Conversion Rate**: Views → Installs
- **Retention**: Day 1, Day 7, Day 30
- **Uninstall Rate**
- **User Ratings**

---

## 🎨 Feature Graphic Design

### Specifications:
- **Size**: 1024 x 500 pixels
- **Format**: PNG or JPG (no transparency)
- **File Size**: Max 1 MB

### Design Tips:
1. **Show the cat mascot** prominently
2. **Include game elements** (treasures, map)
3. **Use brand colors** (warm oranges, golds)
4. **Keep text minimal** (or no text)
5. **Make it eye-catching** at small sizes

### Layout Suggestion:
```
┌────────────────────────────────────────┐
│  [Cat Mascot]    TREASURE    [Map]    │
│                    CAT                │
│  [Treasures]              [Players]   │
└────────────────────────────────────────┘
```

### Tools:
- **Canva**: Free templates
- **Figma**: Professional design
- **Adobe Express**: Quick graphics

---

## 📈 Launch Timeline

### 4 Weeks Before Launch:
- [ ] Finalize app features
- [ ] Create all graphics
- [ ] Write store listing copy
- [ ] Set up developer account

### 2 Weeks Before Launch:
- [ ] Upload assets to Play Console
- [ ] Complete content rating
- [ ] Submit for review
- [ ] Prepare marketing materials

### Launch Week:
- [ ] Monitor review status
- [ ] Respond to early reviews
- [ ] Track initial metrics
- [ ] Fix critical issues

### Post-Launch:
- [ ] Analyze performance
- [ ] Gather user feedback
- [ ] Plan updates
- [ ] Optimize ASO

---

## 📱 Screenshot Capture Script

Use this to capture screenshots on emulator:

```bash
#!/bin/bash

# Create screenshots directory
mkdir -p screenshots

# Capture map view
adb shell screencap -p /sdcard/map.png
adb pull /sdcard/map.png screenshots/01_map_view.png

# Capture inventory
adb shell screencap -p /sdcard/inventory.png
adb pull /sdcard/inventory.png screenshots/02_inventory.png

# Capture trading
adb shell screencap -p /sdcard/trading.png
adb pull /sdcard/trading.png screenshots/03_trading.png

# Capture achievements
adb shell screencap -p /sdcard/achievements.png
adb pull /sdcard/achievements.png screenshots/04_achievements.png

# Capture markers
adb shell screencap -p /sdcard/markers.png
adb pull /sdcard/markers.png screenshots/05_markers.png

echo "Screenshots captured successfully!"
```

---

## ✅ Pre-Launch Checklist

### Graphics:
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Phone screenshots (minimum 2, ideal 5-8)
- [ ] Tablet screenshots (optional)
- [ ] Promo video (optional)

### Text Content:
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Keywords integrated naturally
- [ ] Translations completed

### Technical:
- [ ] AAB file built
- [ ] App signed
- [ ] Tested on devices
- [ ] No crashes

### Legal:
- [ ] Privacy policy hosted
- [ ] Content rating completed
- [ ] Terms of service (optional)

### Marketing:
- [ ] Social media prepared
- [ ] Press kit ready
- [ ] Launch announcement drafted

---

Good luck with your launch! 🚀🐱
