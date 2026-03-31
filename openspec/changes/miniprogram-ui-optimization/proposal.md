## Why

The WeChat miniprogram has accumulated significant UI/UX inconsistencies and usability issues that degrade the user experience:

1. **Map Page Critical Issues**: Items display as "神秘宝藏" (Mysterious Treasure) instead of actual item names, making the game feel incomplete. The progress decay mechanic (400ms inactivity) creates frustration rather than engagement. No distance indicators force users to tap items blindly.

2. **Cross-Page Inconsistencies**: Loading indicators, modal patterns, and interaction styles vary dramatically between pages (Inventory/Shop/Gacha vs Friends/Leaderboard), breaking user expectations and making the app feel unpolished.

3. **Missing Standard Patterns**: Leaderboard lacks the standard header with balance display. Friends page uses inline actions instead of the established modal system.

These issues compound to create a fragmented, frustrating experience that undermines the game's core loop.

## What Changes

### High Priority (User Experience Critical)
- **Fix Map Item Display**: Show actual item names from API instead of generic "神秘宝藏"
- **Improve Collection Feedback**: Replace random tap effect colors with rarity-matched colors
- **Add Distance Indicators**: Show distance labels on map markers or in floating legend
- **Standardize Loading**:统一所有页面的加载指示器使用 `.cartoon-loader`

### Medium Priority (Visual Consistency)
- **Add Leaderboard Header**: Add standard header with balance display to match other pages
- **Refactor Friends Page**: Adopt standard modal pattern instead of inline accept/reject buttons
- **Remove Duplicate Icon Sizes**: 删除各页面 WXSS 中重复定义的 icon size classes（已在 app.wxss 定义）

### Low Priority (Polish)
- **Standardize Empty States**: 统一 Friends 页面的 empty state 样式使用 `.empty-state-text` / `.empty-state-subtext`
- **Fix Gacha Rarity Display**: Gacha 结果 modal 显示中文稀有度名称而非英文
- **Consistent Login Handling**: 统一各页面的登录检查和提示行为

## Capabilities

### New Capabilities
- `map-distance-indicators`: Display distance information directly on map interface
- `rarity-feedback-colors`: Match tap effect and feedback colors to item rarity

### Modified Capabilities
- (none - all changes are implementation fixes, not requirement changes)

## Impact

### Affected Files
- `packages/miniprogram/src/pages/map/map.ts` - Fix item name display, add distance indicators, rarity-matched colors
- `packages/miniprogram/src/pages/friends/friends.ts` + `.wxml` + `.wxss` - Refactor to use standard modal pattern
- `packages/miniprogram/src/pages/leaderboard/leaderboard.ts` + `.wxml` + `.wxss` - Add standard header
- `packages/miniprogram/src/pages/inventory/inventory.wxss` - Remove duplicate icon sizes
- `packages/miniprogram/src/pages/shop/shop.wxss` - Remove duplicate icon sizes
- `packages/miniprogram/src/pages/gacha/gacha.wxss` - Remove duplicate icon sizes
- `packages/miniprogram/src/app.wxss` - (reference only, already correct)

### No Impact
- Backend API (changes are frontend-only)
- Mobile app (separate codebase)
- Web app (separate codebase)
