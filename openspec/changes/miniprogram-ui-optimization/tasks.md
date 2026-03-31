# Implementation Tasks - Miniprogram UI/UX Optimization

## 1. Map Page - Item Display Fix

- [ ] 1.1 Verify `MapItem` interface includes `name` field in API response
- [ ] 1.2 Fix marker popup to show actual item name instead of "神秘宝藏"
- [ ] 1.3 Fix item modal to display actual item name and description

## 2. Map Page - Distance Indicators

- [ ] 2.1 Create floating distance legend panel in map.wxml
- [ ] 2.2 Add styles for distance legend in map.wxss
- [ ] 2.3 Implement distance calculation and display logic in map.ts
- [ ] 2.4 Position legend in top-right corner of map

## 3. Map Page - Rarity Feedback Colors

- [ ] 3.1 Import RARITY_COLORS from utils/util.ts
- [ ] 3.2 Create RARITY_EFFECT_COLORS mapping
- [ ] 3.3 Replace random TAP_COLORS with rarity-matched colors in tap effect function
- [ ] 3.4 Test tap effects show correct rarity colors

## 4. Map Page - Progress Decay Tuning

- [ ] 4.1 Increase inactivity timeout from 400ms to 1500ms in map.ts
- [ ] 4.2 Verify decay behavior doesn't frustrate users

## 5. Loading Indicator Standardization

- [ ] 5.1 Update friends.wxml to use `.cartoon-loader` instead of `.loading-spinner`
- [ ] 5.2 Remove `.loading-spinner` styles from friends.wxss
- [ ] 5.3 Update leaderboard.wxml to use `.cartoon-loader`
- [ ] 5.4 Remove `.loading-spinner` styles from leaderboard.wxss

## 6. Remove Duplicate Icon Sizes

- [ ] 6.1 Remove `.icon`, `.icon-sm`, `.icon-lg`, `.icon-xl` from inventory.wxss
- [ ] 6.2 Remove `.icon`, `.icon-sm`, `.icon-lg`, `.icon-xl` from shop.wxss
- [ ] 6.3 Remove `.icon`, `.icon-sm`, `.icon-lg`, `.icon-xl` from gacha.wxss
- [ ] 6.4 Remove `.icon`, `.icon-sm`, `.icon-lg`, `.icon-xl` from friends.wxss
- [ ] 6.5 Remove `.icon`, `.icon-sm`, `.icon-lg`, `.icon-xl` from leaderboard.wxss

## 7. Friends Page - Modal Pattern

- [ ] 7.1 Add standard header with balance display to friends.wxml
- [ ] 7.2 Add header styles to friends.wxss
- [ ] 7.3 Create confirmation modal for friend request accept/reject
- [ ] 7.4 Update friends.ts to use modal instead of inline actions

## 8. Leaderboard Page - Add Header

- [ ] 8.1 Add standard header with balance display to leaderboard.wxml
- [ ] 8.2 Add header styles to leaderboard.wxss
- [ ] 8.3 Update leaderboard.ts to fetch and display coin balance

## 9. Gacha Page - Rarity Display Fix

- [ ] 9.1 Fix gacha result modal to use `rarityName` instead of raw `rarity`
- [ ] 9.2 Verify Chinese rarity names display correctly

## 10. Testing & Verification

- [ ] 10.1 Test map page loads and displays items correctly
- [ ] 10.2 Test tap effects show rarity-matched colors
- [ ] 10.3 Test distance legend updates correctly
- [ ] 10.4 Test Friends page accept/reject with modal
- [ ] 10.5 Test Leaderboard page shows header and balance
- [ ] 10.6 Verify all pages use consistent loading indicator
- [ ] 10.7 Run miniprogram build to verify no errors
