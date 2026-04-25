## ADDED Requirements

### Requirement: Geographic Area Definitions
The system SHALL define geographic regions (areas) with boundaries for exploration tracking.

#### Scenario: Area data structure
- **WHEN** system loads area definitions
- **THEN** each area SHALL have: unique ID, name (EN/ZH), center coordinates, radius (500m-5km), type (city/district/neighborhood)
- **AND** areas SHALL cover major cities and landmarks worldwide

#### Scenario: Static area fallback
- **WHEN** no dynamic areas loaded
- **THEN** system uses pre-defined static areas covering: SF Bay Area, Beijing, Shanghai, Tokyo, London, NYC, Paris
- **AND** areas have appropriate spawn weight bonuses

### Requirement: Geofencing Region Monitoring
The system SHALL use expo-location geofencing to detect when player enters/exits defined areas.

#### Scenario: Start geofencing
- **WHEN** app initializes with location permission granted
- **THEN** system registers geofence regions for nearby areas (within 20km)
- **AND** starts background geofencing task via expo-task-manager

#### Scenario: Enter area event
- **WHEN** player's location enters a geofence region
- **THEN** geofencing task triggers Enter event
- **AND** system records first_visit_at timestamp if unvisited
- **AND** increments total_visits counter
- **AND** checks area unlock conditions

#### Scenario: Exit area event
- **WHEN** player's location exits a geofence region
- **THEN** geofencing task triggers Exit event
- **AND** system updates last_visit_at timestamp

#### Scenario: iOS region limit handling
- **WHEN** more than 20 areas are nearby (iOS platform)
- **THEN** system prioritizes closest 20 areas for geofencing
- **AND** rotates regions dynamically as player moves

### Requirement: Area Visit Tracking
The system SHALL track player's visit history for each area.

#### Scenario: Record area visit
- **WHEN** player enters area
- **THEN** system stores/updates visited_areas record
- **AND** includes: area_id, first_visit_at, total_visits, last_visit_at

#### Scenario: Query visited areas
- **WHEN** player views exploration progress
- **THEN** system retrieves all visited_areas records
- **AND** calculates exploration percentage for display

### Requirement: Area Unlock Conditions
The system SHALL define unlock conditions for area rewards.

#### Scenario: First visit unlock
- **WHEN** player visits area for first time (first_visit_at set)
- **THEN** system grants first visit reward: coins (50-500 based on area type), experience (100-1000)
- **AND** displays unlock notification

#### Scenario: Total visits milestone
- **WHEN** player reaches visit milestones (5, 10, 25, 50 visits)
- **THEN** system grants milestone rewards
- **AND** rewards increase with milestone level

#### Scenario: Area type bonus
- **WHEN** area is landmark type (high spawn weight)
- **THEN** unlock rewards are doubled
- **AND** rare item spawn chance bonus active in that area

### Requirement: Exploration Progress Display
The system SHALL provide UI for viewing exploration statistics.

#### Scenario: Exploration stats screen
- **WHEN** player navigates to profile > exploration
- **THEN** system displays: total areas visited, exploration percentage, recent discoveries
- **AND** shows map with visited areas highlighted

#### Scenario: Area detail view
- **WHEN** player selects specific area from exploration list
- **THEN** system displays: area name, visit count, first visit date, unlock status, rewards earned

### Requirement: Background Geofencing Task
The system SHALL execute geofencing monitoring in background via expo-task-manager.

#### Scenario: Task definition
- **WHEN** app initializes
- **THEN** system defines GEOFENCE_TASK with enter/exit handlers
- **AND** task processes location events in background

#### Scenario: Background event processing
- **WHEN** geofence event triggers while app is backgrounded
- **THEN** task records visit data to SQLite
- **AND** queues notification for foreground display

#### Scenario: App foreground update
- **WHEN** app returns to foreground after background visits
- **THEN** system syncs UI with recorded background events
- **AND** displays any pending unlock notifications