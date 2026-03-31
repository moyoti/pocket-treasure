# UI/UX Optimization Specs

This change focuses on fixing existing UI/UX issues and improving consistency across pages.

## map-distance-indicators

**What**: Display distance information on the map interface

**Requirements**:
- Show distance to nearest items in a floating legend panel
- Distance should update as user moves
- Panel should be unobtrusive and not block map content

**Implementation**:
- Add floating panel in map.ts
- Calculate and display distance to nearest 3-5 items
- Use existing distance calculation utilities

## rarity-feedback-colors

**What**: Match tap effect colors to item rarity

**Requirements**:
- Tap effects should use rarity-matched colors instead of random colors
- Use RARITY_COLORS from utils/util.ts

**Implementation**:
- Modify tap effect color selection in map.ts
- Map rarity to effect color

## consistency-improvements

**What**: Standardize loading indicators and UI patterns

**Requirements**:
- All pages use `.cartoon-loader` for loading
- Remove duplicate icon size definitions
- Friends page adopts modal pattern
- Leaderboard has standard header

**Files to modify**:
- `friends.wxml`, `friends.wxss`
- `leaderboard.wxml`, `leaderboard.wxss`
- `inventory.wxss`
- `shop.wxss`
- `gacha.wxss`
