## ADDED Requirements

### Requirement: Collection Series Definitions
The system SHALL define item collection series as sets of related items for completion tracking.

#### Scenario: Series data structure
- **WHEN** system loads series definitions
- **THEN** each series SHALL have: unique ID, name (EN/ZH), description, required item IDs list, rarity level, completion rewards, partial progress rewards (25%, 50%, 75%)

#### Scenario: Series categories
- **WHEN** series are defined
- **THEN** system organizes series by category: Crystal, Nature, Historical, Legendary, Seasonal
- **AND** each category has 3-5 series of varying difficulty

### Requirement: Series Progress Tracking
The system SHALL track player's progress toward completing each series.

#### Scenario: Initialize series progress
- **WHEN** system initializes for new player
- **THEN** collection_series_progress table is created empty
- **AND** series definitions are loaded from static data

#### Scenario: Update series progress
- **WHEN** player collects new item
- **THEN** system checks if item belongs to any series
- **AND** if series item matches, adds item ID to series collected_items array
- **AND** recalculates series completion percentage

#### Scenario: Series completion check
- **WHEN** player collects all items in series
- **THEN** system marks series as completed
- **AND** sets completed_at timestamp
- **AND** grants completion rewards

### Requirement: Partial Progress Rewards
The system SHALL grant rewards at partial completion thresholds.

#### Scenario: 25% completion reward
- **WHEN** series progress reaches 25% for first time
- **THEN** system grants partial reward: coins (10% of completion), experience
- **AND** displays progress milestone notification

#### Scenario: 50% completion reward
- **WHEN** series progress reaches 50% for first time
- **THEN** system grants partial reward: coins (25% of completion), experience
- **AND** displays halfway milestone notification

#### Scenario: 75% completion reward
- **WHEN** series progress reaches 75% for first time
- **THEN** system grants partial reward: coins (50% of completion), experience
- **AND** displays near-complete notification

### Requirement: Series Achievement Integration
The system SHALL integrate series completion with existing achievement system.

#### Scenario: Series completion achievement
- **WHEN** player completes a series
- **THEN** system checks if series completion achievement exists
- **AND** if exists, triggers achievement progress update
- **AND** grants achievement rewards alongside series rewards

#### Scenario: Series mastery achievement
- **WHEN** player completes all series in a category
- **THEN** system grants category mastery achievement
- **AND** grants bonus rewards: title, cosmetic item

### Requirement: Series UI Display
The system SHALL provide UI for viewing series progress.

#### Scenario: Series list screen
- **WHEN** player navigates to achievements > series tab
- **THEN** system displays all series organized by category
- **AND** shows progress bar and percentage for each series
- **AND** indicates completed series with checkmark

#### Scenario: Series detail screen
- **WHEN** player selects specific series
- **THEN** system displays: series name, required items list, collected items highlighted, missing items dimmed
- **AND** shows progress percentage and next milestone
- **AND** displays rewards for completion and partial thresholds

#### Scenario: Item series indicator
- **WHEN** player views inventory item
- **THEN** system displays which series item belongs to (if any)
- **AND** shows series completion progress badge