## ADDED Requirements

### Requirement: User Marker Creation
The system SHALL allow players to create custom location markers.

#### Scenario: Create new marker
- **WHEN** player taps "Add Marker" on map screen
- **THEN** system displays marker creation form
- **AND** allows input: name, description, icon type selection
- **AND** pre-fills location at current player position

#### Scenario: Select marker icon
- **WHEN** player selects icon type
- **THEN** system presents icon picker: star, flag, treasure chest, camp, camera, note, heart, waypoint
- **AND** displays preview of selected icon

#### Scenario: Save marker
- **WHEN** player submits marker creation form
- **THEN** system stores marker in user_markers SQLite table
- **AND** marker appears on player's map immediately
- **AND** displays confirmation toast

#### Scenario: Marker at custom location
- **WHEN** player wants marker at non-current location
- **THEN** system allows tap-to-place on map
- **AND** marker position updates to tapped coordinates

### Requirement: Marker Local Storage
The system SHALL store user markers locally in SQLite without cloud sync.

#### Scenario: Store marker data
- **WHEN** marker is created
- **THEN** system inserts record with: id, creatorPublicKey, name, description, latitude, longitude, iconType, createdAt, isShared

#### Scenario: Load saved markers
- **WHEN** player opens map screen
- **THEN** system retrieves all markers from user_markers where creatorPublicKey matches player identity
- **AND** displays markers on map with custom icons

#### Scenario: Marker persistence
- **WHEN** app closes or restarts
- **THEN** markers remain stored in SQLite
- **AND** reload on next app launch

### Requirement: Marker Management
The system SHALL allow editing and deleting markers.

#### Scenario: Edit marker
- **WHEN** player taps existing marker and selects Edit
- **THEN** system displays marker edit form with current values
- **AND** allows modification: name, description, icon type
- **AND** preserves original location and creation timestamp

#### Scenario: Delete marker
- **WHEN** player taps marker and selects Delete
- **THEN** system prompts for deletion confirmation
- **AND** removes marker from SQLite on confirm
- **AND** removes marker from map display

#### Scenario: Marker limit
- **WHEN** player has 50+ markers
- **THEN** system displays warning about marker limit
- **AND** suggests deleting old markers before creating new ones

### Requirement: Marker BLE Sharing
The system SHALL allow sharing markers with nearby players via BLE.

#### Scenario: Enable marker sharing
- **WHEN** player toggles "Share marker" on marker
- **THEN** system sets isShared = true for marker
- **AND** includes marker in BLE marker broadcast data

#### Scenario: Discover shared markers
- **WHEN** player with BLE discovery active passes near marker creator
- **THEN** system receives shared marker data via BLE
- **AND** displays shared markers with distinct visual style (semi-transparent)
- **AND** shows creator name in marker info

#### Scenario: Accept shared marker
- **WHEN** player taps shared marker from another player
- **THEN** system offers to "Save to my markers" or "Dismiss"
- **AND** if saved, copies marker to player's user_markers table
- **AND** stores original creator public key reference

### Requirement: Marker Visualization
The system SHALL render markers with distinct styling on map.

#### Scenario: Marker icon rendering
- **WHEN** map renders markers
- **THEN** each marker displays selected icon type
- **AND** icon size scales appropriately for zoom level
- **AND** marker shows name on tap

#### Scenario: Marker callout
- **WHEN** player taps marker
- **THEN** system displays callout with: name, description, creation date
- **AND** shows Edit/Delete buttons for own markers
- **AND** shows Save button for shared markers from others

#### Scenario: Marker clustering
- **WHEN** multiple markers are in close proximity
- **THEN** system clusters markers at low zoom levels
- **AND** expands cluster on zoom in
- **AND** shows marker count on cluster icon