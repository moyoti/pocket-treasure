## ADDED Requirements

### Requirement: Premium gacha pool with higher legendary rate
The system SHALL provide a premium gacha pool accessible with gems.

#### Scenario: Premium pool rates
- **WHEN** user pulls from premium pool
- **THEN** legendary rate SHALL be 15% (vs 5% standard pool)
- **AND** epic rate SHALL be 25% (vs 15% standard pool)
- **AND** rare rate SHALL be 40% (vs 35% standard pool)
- **AND** common rate SHALL be 20% (vs 45% standard pool)

### Requirement: Premium pool pricing
Premium pool pulls SHALL cost gems instead of coins.

#### Scenario: Premium single pull
- **WHEN** user performs single pull from premium pool
- **THEN** system SHALL deduct 50 gems from user's balance
- **AND** user SHALL receive 1 random item with premium rates

#### Scenario: Premium ten pull
- **WHEN** user performs 10-pull from premium pool
- **THEN** system SHALL deduct 450 gems from user's balance (10% discount)
- **AND** user SHALL receive 10 random items with premium rates

### Requirement: Premium pool has exclusive items
Premium pool SHALL contain exclusive items not available in standard pool.

#### Scenario: Exclusive items in premium pool
- **WHEN** user pulls from premium pool
- **THEN** user MAY receive exclusive premium-only items
- **AND** these items SHALL have isExclusive=true flag

### Requirement: Premium pool selection in gacha page
The gacha page SHALL show premium pool option when user has sufficient gems.

#### Scenario: Display premium pool when user can afford
- **WHEN** user has >= 50 gems
- **THEN** gacha page SHALL show premium pool option
- **AND** premium pool SHALL be clearly marked with gems icon and pricing

#### Scenario: Hide premium pool when user cannot afford
- **WHEN** user has < 50 gems
- **THEN** premium pool option SHALL be hidden or disabled
- **AND** tooltip SHALL show "宝石不足"
