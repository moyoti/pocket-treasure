## ADDED Requirements

### Requirement: User entity has gems fields
User entity SHALL have the following additional fields:
- gems (integer, current gems balance, default 0)
- totalGemsPurchased (integer, lifetime gems purchased, default 0)

#### Scenario: New user starts with zero gems
- **WHEN** a new user is created
- **THEN** gems SHALL default to 0
- **AND** totalGemsPurchased SHALL default to 0

### Requirement: GemService provides gems management
The system SHALL provide GemService with methods:
- getBalance(userId): Promise<number> - get current gems balance
- addGems(userId, amount, source): Promise<void> - add gems with transaction
- deductGems(userId, amount, source): Promise<boolean> - deduct gems, returns false if insufficient
- getTransactionHistory(userId): Promise<GemTransaction[]> - get transaction history

#### Scenario: Add gems to user
- **WHEN** GemService.addGems is called with userId and amount
- **THEN** user's gems balance SHALL increase by amount
- **AND** GemTransaction record SHALL be created

#### Scenario: Deduct gems from user
- **WHEN** GemService.deductGems is called with userId and amount
- **AND** user has sufficient gems balance
- **THEN** user's gems balance SHALL decrease by amount
- **AND** GemTransaction record SHALL be created
- **AND** method SHALL return true

#### Scenario: Deduct gems with insufficient balance
- **WHEN** GemService.deductGems is called with userId and amount
- **AND** user has insufficient gems balance
- **THEN** gems balance SHALL remain unchanged
- **AND** method SHALL return false

### Requirement: GemTransaction entity tracks all gems changes
The system SHALL record all gems additions and deductions:
- id (UUID, primary key)
- userId (UUID, foreign key to User)
- amount (integer, positive for addition, negative for deduction)
- source (string: 'recharge' | 'gacha' | 'purchase' | 'refund')
- balanceAfter (integer, user's balance after this transaction)
- createdAt (datetime)

#### Scenario: Transaction records all gems changes
- **WHEN** any gems balance change occurs
- **THEN** a GemTransaction SHALL be created with all specified fields
