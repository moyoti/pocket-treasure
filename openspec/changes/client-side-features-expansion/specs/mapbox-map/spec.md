## ADDED Requirements

### Requirement: Mapbox Tile Integration
The system SHALL replace OSM UrlTile with Mapbox GL vector tiles for map rendering.

#### Scenario: Initialize Mapbox
- **WHEN** app initializes with Mapbox access token
- **THEN** system configures Mapbox GL via @rnmapbox/maps
- **AND** uses Mapbox Streets style as default base map
- **AND** applies custom color theme matching app aesthetic

#### Scenario: Render map tiles
- **WHEN** map screen renders
- **THEN** Mapbox renders vector tiles for current region
- **AND** displays terrain, roads, landmarks from Mapbox data
- **AND** caches tiles locally for performance

#### Scenario: Mapbox API failure
- **WHEN** Mapbox API request fails or rate limits
- **THEN** system falls back to cached tiles if available
- **AND** displays cached map if offline
- **AND** shows "Map data unavailable" if no cache and offline

### Requirement: Custom Map Styling
The system SHALL apply custom Mapbox style for game-specific visual elements.

#### Scenario: Treasure marker layer
- **WHEN** treasures spawn nearby
- **THEN** Mapbox renders treasure markers as custom symbols
- **AND** marker color matches item rarity (common/gray, rare/blue, epic/purple, legendary/gold)
- **AND** markers display treasure icon with glow effect

#### Scenario: POI layer
- **WHEN** POIs are fetched
- **THEN** Mapbox renders POI markers with distinct styling
- **AND** POI marker shows location type icon
- **AND** POI markers highlight on tap

#### Scenario: Player location indicator
- **WHEN** player location updates
- **THEN** Mapbox renders player position with custom avatar marker
- **AND** shows accuracy circle around position
- **AND** marker updates smoothly with location changes

### Requirement: Offline Map Support
The system SHALL download and cache offline map packs for visited regions.

#### Scenario: Auto-download offline pack
- **WHEN** player visits new area for first time
- **THEN** system triggers offline pack download for 10km radius around current location
- **AND** stores pack in Mapbox offline database
- **AND** displays download progress indicator

#### Scenario: Manual offline download
- **WHEN** player requests offline download for specific area
- **THEN** system allows area selection by city/region name
- **AND** downloads selected pack
- **AND** shows download size estimate before confirmation

#### Scenario: Offline pack management
- **WHEN** player views offline settings
- **THEN** system lists downloaded packs with size and coverage area
- **AND** allows pack deletion to free storage
- **AND** shows total storage used by offline maps

### Requirement: Mapbox POI Integration
The system SHALL use Mapbox POI search API as primary POI source.

#### Scenario: Fetch nearby POIs via Mapbox
- **WHEN** player location updates
- **THEN** system requests nearby POIs from Mapbox Places API
- **AND** requests features within 2km radius
- **AND** filters by relevant categories (attraction, park, museum, historic)

#### Scenario: Mapbox POI fallback to static
- **WHEN** Mapbox POI request fails or returns empty
- **THEN** system falls back to static POI definitions
- **AND** uses existing staticPOIs.ts data

#### Scenario: Cache POI data
- **WHEN** POIs are fetched successfully
- **THEN** system stores POI data in SQLite with timestamp
- **AND** reuses cached data for 2-minute cooldown period
- **AND** refreshes cache after cooldown expires

### Requirement: Map Configuration
The system SHALL provide proper Mapbox configuration for iOS and Android.

#### Scenario: iOS Mapbox setup
- **WHEN** app builds for iOS
- **THEN** Mapbox access token configured in Info.plist
- **AND** MGLMapboxStyleURL set to custom style URL

#### Scenario: Android Mapbox setup
- **WHEN** app builds for Android
- **THEN** Mapbox access token configured in AndroidManifest.xml
- **AND** mapbox:mapbox_styleUrl set to custom style URL

#### Scenario: Style URL configuration
- **WHEN** app loads map style
- **THEN** system uses custom style URL: mapbox://styles/treasurehunt/[style-id]
- **AND** style includes custom layers for game elements