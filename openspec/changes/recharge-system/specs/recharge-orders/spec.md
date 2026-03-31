## ADDED Requirements

### Requirement: Create recharge order
The system SHALL create a pending order when user initiates a recharge.

#### Scenario: User creates order for a package
- **WHEN** authenticated user POSTs to /api/recharge/orders with {packageId}
- **THEN** system SHALL create a RechargeRecord with status='pending'
- **AND** system SHALL generate a unique orderId
- **AND** response SHALL contain {orderId, amount, status}

### Requirement: Order records track all recharge attempts
The system SHALL persist all recharge attempts with:
- id (UUID, primary key)
- userId (UUID, foreign key to User)
- packageId (UUID, foreign key to RechargePackage)
- orderId (string, external order identifier)
- amount (decimal, actual payment amount)
- gemsAwarded (integer, total gems to be awarded including bonus)
- status (enum: 'pending' | 'completed' | 'failed' | 'refunded')
- paymentChannel (string: 'wechat' | 'alipay' | 'app_store')
- completedAt (datetime, nullable)
- createdAt (datetime)

#### Scenario: Order record persists all fields
- **WHEN** an order is created
- **THEN** all specified fields SHALL be stored in the database

### Requirement: Process payment callback
The system SHALL handle payment callbacks and award gems upon successful payment.

#### Scenario: Successful payment callback
- **WHEN** POST /api/recharge/callback receives {orderId, status: 'success'}
- **THEN** system SHALL find the order by orderId
- **AND** system SHALL update order status to 'completed'
- **AND** system SHALL add gemsAwarded to user's gems balance
- **AND** system SHALL create a GemTransaction record

#### Scenario: Failed payment callback
- **WHEN** POST /api/recharge/callback receives {orderId, status: 'failed'}
- **THEN** system SHALL update order status to 'failed'
- **AND** system SHALL NOT award any gems

### Requirement: Recharge record history
Authenticated user SHALL be able to view their recharge history.

#### Scenario: User views recharge history
- **WHEN** authenticated user GETs /api/recharge/history
- **THEN** response SHALL contain list of user's completed recharge records
- **AND** records SHALL be ordered by completedAt descending

### Requirement: First recharge bonus
System SHALL track and apply first recharge bonus per user.

#### Scenario: First recharge awards bonus gems
- **WHEN** user with no completed orders makes first purchase
- **AND** the package has isFirstRechargeBonus=true
- **THEN** gemsAwarded SHALL equal gemsAmount + bonusGems (doubled bonus)

#### Scenario: Subsequent recharges do not get first bonus
- **WHEN** user with existing completed orders makes another purchase
- **AND** the package has isFirstRechargeBonus=true
- **THEN** gemsAwarded SHALL equal gemsAmount only (no bonus)
