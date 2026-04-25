## ADDED Requirements

### Requirement: BLE Device Discovery
The system SHALL allow players to discover nearby devices running Treasure Hunt app via BLE advertising.

#### Scenario: Discover nearby traders
- **WHEN** player opens trade screen and initiates discovery
- **THEN** system scans for BLE devices broadcasting Treasure Hunt service UUID
- **AND** displays list of nearby players within ~10m proximity

#### Scenario: No nearby players
- **WHEN** player initiates discovery and no devices found
- **THEN** system displays "No nearby players" message
- **AND** continues scanning for 30 seconds before stopping

#### Scenario: BLE permission denied
- **WHEN** player denies Bluetooth permission
- **THEN** system displays permission request explanation
- **AND** disables trade functionality until permission granted

### Requirement: Trade Session Connection
The system SHALL establish BLE connection with another player for trade negotiation.

#### Scenario: Successful connection
- **WHEN** player selects nearby device from discovery list
- **THEN** system initiates BLE connection to selected device
- **AND** displays connection status to both players
- **AND** opens trade negotiation session

#### Scenario: Connection timeout
- **WHEN** connection attempt exceeds 30 seconds without success
- **THEN** system cancels connection attempt
- **AND** displays "Connection failed - try again" message

#### Scenario: Connection drops during trade
- **WHEN** BLE connection drops during active trade session
- **THEN** system attempts automatic reconnection within 10 seconds
- **AND** preserves trade state for resume if reconnection succeeds
- **AND** cancels trade if reconnection fails

### Requirement: Trade Negotiation Protocol
The system SHALL allow players to offer and negotiate item exchanges.

#### Scenario: Send trade offer
- **WHEN** player selects items to offer and submits
- **THEN** system sends trade offer to connected player via BLE characteristic write
- **AND** displays offer details to receiving player

#### Scenario: Accept trade offer
- **WHEN** receiving player accepts trade offer
- **THEN** system sends acceptance signal to offering player
- **AND** proceeds to item exchange phase

#### Scenario: Reject trade offer
- **WHEN** receiving player rejects trade offer
- **THEN** system sends rejection signal to offering player
- **AND** returns both players to negotiation state

#### Scenario: Modify trade offer
- **WHEN** receiving player requests modification
- **THEN** system allows counter-offer creation
- **AND** sends modified offer to original offering player

### Requirement: Item Exchange with Verification
The system SHALL execute item exchange with cryptographic verification using existing identity signatures.

#### Scenario: Execute validated trade
- **WHEN** both players accept trade and exchange begins
- **THEN** system verifies each player's Ed25519 signature on trade data
- **AND** transfers items from each player's inventory to the other
- **AND** records trade in trade_history with signatures
- **AND** updates inventory for both players

#### Scenario: Signature verification fails
- **WHEN** cryptographic verification fails for either player
- **THEN** system cancels trade immediately
- **AND** displays "Trade verification failed" message
- **AND** preserves original inventory state

#### Scenario: Trade completion confirmation
- **WHEN** exchange completes successfully
- **THEN** system displays trade summary to both players
- **AND** shows items received
- **AND** disconnects BLE session

### Requirement: Trade History Tracking
The system SHALL maintain history of completed trades for audit purposes.

#### Scenario: Record trade history
- **WHEN** trade completes successfully
- **THEN** system stores trade record in trade_history table
- **AND** includes: partner public key, items given/received, signatures, timestamp

#### Scenario: View trade history
- **WHEN** player views profile trade history section
- **THEN** system displays last 20 trades chronologically
- **AND** shows partner name, items exchanged, date

### Requirement: Tradeable Item Flag
The system SHALL support marking items as tradeable or non-tradeable.

#### Scenario: Mark item tradeable
- **WHEN** player views inventory item details
- **THEN** system displays tradeable toggle (default: true)
- **AND** item can only be offered in trades when tradeable flag is true

#### Scenario: Non-tradeable item in trade offer
- **WHEN** player attempts to offer non-tradeable item
- **THEN** system prevents selection of non-tradeable items in trade UI
- **AND** displays "This item cannot be traded" indicator

### Requirement: Trade UI Screens
The system SHALL provide dedicated UI screens for all trade operations.

#### Scenario: Trade discovery screen
- **WHEN** player navigates to trade tab
- **THEN** system displays BLE discovery button
- **AND** shows nearby players list when discovery active
- **AND** shows connection status indicators

#### Scenario: Trade negotiation screen
- **WHEN** trade session is active
- **THEN** system displays player's inventory for selection
- **AND** shows current offer from other player
- **AND** provides accept/reject/counter buttons

#### Scenario: Trade complete screen
- **WHEN** trade finishes (success or fail)
- **THEN** system displays trade result summary
- **AND** shows items received (if successful)
- **AND** provides return to map button