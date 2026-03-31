## Context

The WeChat miniprogram at `packages/miniprogram/` is a location-based treasure hunting game. The codebase uses:
- WeChat's `<map>` component with Tencent Maps for location display
- Custom markers with custom icons per rarity
- A "疯狂点击收集" (rapid tap collection) mechanic with progress bar
- CSS/WXSS styling with a "cartoon" design system defined in `app.wxss`

**Current Issues Identified:**
1. Map items show hardcoded "神秘宝藏" instead of actual item names from API
2. Tap effect colors are random, not rarity-matched
3. No distance display on map - forces blind exploration
4. Progress decay after 400ms creates frustration
5. Loading indicators inconsistent (`.cartoon-loader` vs `.loading-spinner`)
6. Friends page uses inline actions instead of modal pattern
7. Leaderboard lacks standard header
8. Duplicate icon size CSS in every page WXSS

## Goals / Non-Goals

**Goals:**
- Fix critical map UX (item names, distance, rarity feedback colors)
- Standardize loading indicators across all pages
- Refactor Friends and Leaderboard to use consistent patterns
- Remove duplicate CSS definitions

**Non-Goals:**
- No backend API changes
- No new features or game mechanics
- No changes to mobile app (`packages/mobile/`) or web app (`packages/web/`)
- No refactoring of the component architecture (components directory is empty, not used)

## Decisions

### 1. Map Item Name Display
**Decision**: Use actual `item.name` from API response instead of hardcoded "神秘宝藏"

**Rationale**: The API already returns item names via `getNearbyItems()`. The code incorrectly uses `item.poiName` or hardcodes "神秘宝藏". Need to verify `MapItem` interface includes `name` field and use it in marker and modal display.

**Files**: `map.ts` lines ~156-165, marker creation

### 2. Rarity-Matched Tap Colors
**Decision**: Create a mapping from rarity to effect colors and use it for tap effects

**Rationale**: Currently `TAP_COLORS` array uses random colors. Should use `RARITY_COLORS` from `utils/util.ts`:
```typescript
const RARITY_EFFECT_COLORS = {
  common: '#6B7280',
  rare: '#0EA5E9', 
  epic: '#8B5CF6',
  legendary: '#F59E0B'
}
```

### 3. Distance Indicators
**Decision**: Add floating distance legend on map OR show distance on marker callout

**Rationale**: Users cannot see distance without tapping. Options:
- A. Add floating panel showing distance to nearest 3 items
- B. Use Tencent Maps `callout` property on markers
- C. Add label on marker showing distance

**Chosen**: Option A (floating legend) - less invasive, doesn't clutter markers

### 4. Progress Decay Mechanic
**Decision**: Increase inactivity timeout from 400ms to 1500ms, or remove decay entirely

**Rationale**: 400ms is too aggressive for a mobile game where users may pause to read UI. The decay creates frustration, not engagement. Recommended: 1500ms timeout with gradual decay.

### 5. Loading Indicator Standardization
**Decision**: Replace all `.loading-spinner` usages with `.cartoon-loader`

**Files to modify**:
- `friends.wxml` + `friends.wxss`: Remove `.loading-spinner`, use `.cartoon-loader`
- `leaderboard.wxml` + `leaderboard.wxss`: Same
- Check `app.wxss` for `.loading-spinner` definition - may need removal

### 6. Friends Page Modal Pattern
**Decision**: Refactor inline accept/reject buttons to use modal confirmation

**Rationale**: Other pages (Inventory, Shop, Gacha) use modal pattern consistently. Friends page should match.

**Implementation**: Add modal component similar to Inventory's sell modal for friend request accept/reject confirmations.

### 7. Leaderboard Header
**Decision**: Add standard `.header` div with `.balance-pill` to leaderboard page

**Implementation**: Copy header structure from Inventory/Shop/Gacha pages.

### 8. Duplicate Icon Sizes
**Decision**: Remove icon size classes from all page WXSS files

**Files**: `inventory.wxss`, `shop.wxss`, `gacha.wxss`, `friends.wxss`, `leaderboard.wxss` - all have duplicate `.icon`, `.icon-sm`, `.icon-lg`, `.icon-xl` already defined in `app.wxss`

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Breaking item display on map | Test thoroughly - may need to verify API response structure |
| Removing progress decay changes game balance | Keep decay but increase timeout - preserves mechanic intent |
| Friends modal refactor changes UX flow | User testing after implementation |

## Open Questions

1. **API Verification**: Does `getNearbyItems()` actually return item names? Need to verify against actual API response.
2. **Progress Decay Balance**: Should decay be reduced or removed entirely? User feedback would clarify.
3. **Tap Effect Performance**: Rarity-matched colors may require re-rendering - verify no performance impact on rapid taps.
