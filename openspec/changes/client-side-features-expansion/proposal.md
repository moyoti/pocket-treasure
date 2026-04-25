## Why

The Treasure Hunt mobile app currently operates as a fully client-side game with limited social and exploration features. To increase user engagement and retention, we need to expand gameplay depth through: (1) enabling local peer-to-peer trading between nearby players, (2) rewarding exploration of new geographic areas, (3) providing collection series goals, (4) upgrading the map infrastructure for better reliability and offline support, and (5) allowing players to create custom location markers. All features must remain pure client-side without backend dependencies, leveraging the existing P2P architecture.

## What Changes

- **Local Trading System**: BLE-based peer-to-peer item trading between nearby players without server
- **Area Exploration System**: Geofencing-based region unlock with rewards for exploring new areas
- **Collection Series**: Item set collection goals with tiered completion rewards
- **Mapbox Integration**: Replace OSM tiles with Mapbox for improved reliability, offline support, and custom styling
- **Custom Markers**: User-created location markers stored locally, shareable with nearby players via BLE

## Capabilities

### New Capabilities

- `local-trading`: BLE-based P2P device discovery, connection negotiation, item exchange with cryptographic validation, trade UI screens
- `area-exploration`: Geographic region definitions, visit tracking via geofencing, unlock conditions and rewards, exploration progress display
- `collection-series`: Item series/set definitions, series completion tracking, partial progress rewards, series-specific achievements
- `mapbox-map`: Mapbox GL tile integration, custom map styles, offline tile caching, Mapbox POI search API
- `custom-markers`: User marker creation UI, local SQLite storage, BLE marker sharing, marker visualization on map

### Modified Capabilities

- `achievements`: Extend existing achievement system to support series-based achievements and exploration achievements
- `map-screen`: Update map rendering to use Mapbox tiles instead of OSM UrlTile, add custom marker layer
- `inventory`: Add tradeable item flag, trade history tracking, locked items during active trades
- `profile`: Add exploration stats display, series progress display, marker management

## Impact

### Code Changes

- **New Files** (~15-20 files):
  - `src/p2p/trade/` - TradeService, TradeProtocol, TradeEngine
  - `src/p2p/exploration/` - AreaService, AreaUnlockEngine, GeofencingTask
  - `src/p2p/data/series.ts` - Collection series definitions
  - `src/p2p/data/areas.ts` - Geographic area definitions
  - `src/p2p/markers/` - MarkerService, MarkerEngine
  - `app/(tabs)/trade.tsx` - Trade screen
  - `app/profile/exploration.tsx` - Exploration stats screen
  - `components/map/` - Mapbox integration components

- **Modified Files** (~10 files):
  - `app/(tabs)/map.tsx` - Mapbox tile integration, marker layers
  - `app/(tabs)/inventory.tsx` - Tradeable flag, trade button
  - `app/(tabs)/achievements.tsx` - Series achievements section
  - `app/(tabs)/profile.tsx` - Exploration/markers menu items
  - `src/p2p/P2PContext.tsx` - Add trade/exploration/marker state
  - `src/p2p/data/achievements.ts` - Add series-based achievements
  - `locales/*.json` - New translation keys for all features

### Dependencies

| Package | Purpose | Platform Support |
|---------|---------|------------------|
| `react-native-ble-plx` | BLE discovery and communication | iOS + Android |
| `@rnmapbox/maps` | Mapbox GL maps | iOS + Android |
| `expo-task-manager` | Background geofencing task | iOS + Android |
| `expo-location` | Geofencing API (existing) | iOS + Android |

### Database Schema Extensions

```sql
-- New tables
CREATE TABLE visited_areas (
  id TEXT PRIMARY KEY,
  area_id TEXT,
  first_visit_at INTEGER,
  total_visits INTEGER,
  last_visit_at INTEGER
);

CREATE TABLE user_markers (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  latitude REAL,
  longitude REAL,
  icon_type TEXT,
  created_at INTEGER,
  is_shared INTEGER
);

CREATE TABLE trade_history (
  id TEXT PRIMARY KEY,
  partner_public_key TEXT,
  items_given TEXT,  -- JSON array
  items_received TEXT, -- JSON array
  traded_at INTEGER
);

CREATE TABLE collection_series_progress (
  series_id TEXT PRIMARY KEY,
  collected_items TEXT, -- JSON array of item IDs
  completed_at INTEGER
);
```

### iOS vs Android Consistency

All features designed for cross-platform parity:
- BLE works identically on both platforms via `react-native-ble-plx`
- Geofencing works on both via `expo-location` (iOS: 20 regions max, Android: 100 max)
- Mapbox GL renders identically via `@rnmapbox/maps`
- All UI components use shared React Native code
- Platform-specific adjustments only for safe area insets (existing pattern)