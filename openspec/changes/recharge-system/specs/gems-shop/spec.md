## ADDED Requirements

### Requirement: Gems can purchase premium items
The system SHALL allow users to purchase premium items using gems.

#### Scenario: User purchases premium item with gems
- **WHEN** user has sufficient gems and purchases a premium item
- **THEN** gems SHALL be deducted from user's balance
- **AND** item SHALL be added to user's inventory
- **AND** GemTransaction record SHALL be created

### Requirement: Premium items are gems-only
Premium items SHALL only be purchasable with gems, not coins.

#### Scenario: Attempt to purchase premium item with coins
- **WHEN** user attempts to purchase premium item using coins
- **THEN** the system SHALL reject the purchase
- **AND** show error message "该商品需要宝石购买"

### Requirement: Premium item types
Premium items include:
- Limited gacha keys (10-50 gems each)
- Lucky potions (20 gems, +20% luck for 24 hours)
- Quick refresh (5 gems, refresh map cooldown immediately)
- Premium avatars/frames (50-200 gems, cosmetic only)
- Premium gacha pulls (50-150 gems per pull, higher legendary rate)

#### Scenario: List available premium items
- **WHEN** user requests premium shop items
- **THEN** response SHALL contain list of items with:
  - name (localized)
  - price in gems
  - description
  - type (key | potion | refresh | cosmetic | gacha)
  - isAvailable (boolean)

### Requirement: Premium shop tab in store page
The store page SHALL have a "宝石商店" tab showing gems-only items.

#### Scenario: User switches to gems shop tab
- **WHEN** user taps "宝石商店" tab in store
- **THEN** page SHALL display premium items purchasable with gems
