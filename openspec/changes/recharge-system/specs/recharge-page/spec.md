## ADDED Requirements

### Requirement: Recharge page displays package list
The recharge page SHALL display all available recharge packages with:
- Package name
- Price in CNY
- Gems amount (base + bonus if applicable)
- Visual indicator for "首充双倍" on first recharge packages

#### Scenario: User views recharge page
- **WHEN** user navigates to recharge page
- **THEN** page SHALL display list of active packages
- **AND** each package SHALL show name, price, and gems amount

### Requirement: Show user's gems balance
The recharge page SHALL display user's current gems balance in the header.

#### Scenario: Logged-in user views balance
- **WHEN** user is logged in and views recharge page
- **THEN** current gems balance SHALL be displayed in header

### Requirement: Initiate recharge flow
Tapping a package SHALL create an order and initiate payment flow.

#### Scenario: User taps package to purchase
- **WHEN** user taps a recharge package
- **THEN** system SHALL create a pending order
- **AND** system SHALL call payment SDK (mocked for now)
- **AND** user SHALL see payment confirmation dialog

### Requirement: Handle payment success
After successful payment, page SHALL update gems balance and show success message.

#### Scenario: Payment completed successfully
- **WHEN** payment callback returns success
- **THEN** page SHALL refresh gems balance
- **AND** page SHALL show success toast with gems awarded

### Requirement: Handle payment failure
After failed payment, page SHALL show error message without changing balance.

#### Scenario: Payment failed
- **WHEN** payment callback returns failure
- **THEN** page SHALL show error toast "充值失败"
- **AND** gems balance SHALL remain unchanged
