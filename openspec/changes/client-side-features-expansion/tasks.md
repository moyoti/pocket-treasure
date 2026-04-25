## 1. Dependencies & Configuration

- [x] 1.1 Install react-native-ble-plx package
- [x] 1.2 Install @rnmapbox/maps package
- [x] 1.3 Configure Mapbox access token in iOS Info.plist
- [x] 1.4 Configure Mapbox access token in Android AndroidManifest.xml
- [x] 1.5 Update app.json with BLE and Mapbox plugin configurations
- [ ] 1.6 Create Mapbox custom style with treasure marker layers (requires manual setup in Mapbox Studio)

## 2. Database Schema Extensions

- [x] 2.1 Add visited_areas table schema to DatabaseService
- [x] 2.2 Add user_markers table schema to DatabaseService
- [x] 2.3 Add trade_history table schema to DatabaseService
- [x] 2.4 Add collection_series_progress table schema to DatabaseService
- [x] 2.5 Update DatabaseService.initialize() to create new tables
- [x] 2.6 Add migration function for existing databases

## 3. Local Trading System - Core

- [x] 3.1 Create src/p2p/trade/TradeProtocol.ts with message format definitions
- [x] 3.2 Create src/p2p/trade/TradeService.ts with BLE discovery logic
- [x] 3.3 Implement BLE advertising for Treasure Hunt service UUID
- [x] 3.4 Implement BLE scanning for nearby traders
- [x] 3.5 Implement BLE connection establishment and negotiation
- [x] 3.6 Create src/p2p/trade/TradeEngine.ts for trade validation
- [x] 3.7 Implement Ed25519 signature verification for trades
- [x] 3.8 Implement trade execution with inventory update
- [x] 3.9 Add trade state persistence for reconnection handling

## 4. Local Trading System - UI

- [ ] 4.1 Create app/(tabs)/trade.tsx discovery screen
- [ ] 4.2 Create trade negotiation UI component
- [ ] 4.3 Create trade item selection component
- [ ] 4.4 Create trade completion summary screen
- [ ] 4.5 Add BLE permission request flow UI
- [ ] 4.6 Add tradeable toggle to item detail view
- [ ] 4.7 Add trade history section to profile screen

## 5. Area Exploration System - Core

- [x] 5.1 Create src/p2p/data/areas.ts with static area definitions
- [x] 5.2 Create src/p2p/exploration/AreaService.ts
- [x] 5.3 Create src/p2p/exploration/AreaUnlockEngine.ts
- [x] 5.4 Define GEOFENCE_TASK in expo-task-manager
- [x] 5.5 Implement geofencing start with region registration
- [x] 5.6 Implement geofencing Enter/Exit event handlers
- [x] 5.7 Implement area visit tracking logic
- [x] 5.8 Implement unlock condition checking
- [x] 5.9 Implement iOS region rotation (max 20 regions)

## 6. Area Exploration System - UI

- [ ] 6.1 Create app/profile/exploration.tsx stats screen
- [ ] 6.2 Create area list component with progress display
- [ ] 6.3 Create area detail view component
- [ ] 6.4 Add exploration map visualization layer
- [ ] 6.5 Add unlock notification display
- [ ] 6.6 Add exploration menu item to profile screen

## 7. Collection Series - Core

- [x] 7.1 Create src/p2p/data/series.ts with series definitions
- [x] 7.2 Extend AchievementEngine to support series achievements
- [x] 7.3 Implement series progress calculation logic
- [x] 7.4 Implement partial progress threshold checking (25%, 50%, 75%)
- [x] 7.5 Implement series completion with rewards
- [x] 7.6 Add series integration to inventory item collection flow

## 8. Collection Series - UI

- [ ] 8.1 Add series tab to achievements screen
- [ ] 8.2 Create series list component with category organization
- [ ] 8.3 Create series detail screen with item progress display
- [ ] 8.4 Add series indicator to inventory item view
- [ ] 8.5 Add partial progress milestone notifications

## 9. Mapbox Integration - Core

- [x] 9.1 Create src/p2p/map/MapboxService.ts
- [ ] 9.2 Replace OSM UrlTile with Mapbox GL in map.tsx
- [ ] 9.3 Replace OSM UrlTile with Mapbox GL in map-p2p.tsx
- [ ] 9.4 Implement custom style layer for treasure markers
- [ ] 9.5 Implement custom style layer for POI markers
- [ ] 9.6 Implement player location custom marker
- [x] 9.7 Implement offline pack download logic
- [x] 9.8 Implement offline pack management (list/delete)
- [x] 9.9 Integrate Mapbox Places API for POI search
- [x] 9.10 Implement POI caching with Mapbox data

## 10. Mapbox Integration - UI

- [ ] 10.1 Update map screen to use Mapbox components
- [ ] 10.2 Add offline map download indicator
- [ ] 10.3 Add offline map settings section to settings screen
- [ ] 10.4 Update POI info callouts for Mapbox markers

## 11. Custom Markers - Core

- [x] 11.1 Create src/p2p/markers/MarkerService.ts
- [x] 11.2 Create src/p2p/markers/MarkerEngine.ts
- [x] 11.3 Implement marker creation with validation
- [x] 11.4 Implement marker editing logic
- [x] 11.5 Implement marker deletion logic
- [x] 11.6 Implement marker BLE broadcast for sharing
- [x] 11.7 Implement marker BLE discovery for receiving
- [x] 11.8 Implement marker copy/save from shared markers

## 12. Custom Markers - UI

- [ ] 12.1 Create marker creation modal component
- [ ] 12.2 Create marker icon picker component
- [ ] 12.3 Add marker layer to map rendering
- [ ] 12.4 Create marker callout component
- [ ] 12.5 Create marker edit/delete UI
- [ ] 12.6 Add marker management section to profile screen
- [ ] 12.7 Add shared marker indicator styling

## 13. P2PContext Integration

- [ ] 13.1 Add trade state to P2PContext (nearbyTraders, activeTrade, tradeHistory)
- [ ] 13.2 Add exploration state to P2PContext (visitedAreas, areaProgress)
- [ ] 13.3 Add series state to P2PContext (seriesProgress)
- [ ] 13.4 Add markers state to P2PContext (userMarkers, sharedMarkers)
- [ ] 13.5 Add trade functions to P2PContext (startDiscovery, connectTrade, executeTrade)
- [ ] 13.6 Add exploration functions to P2PContext (refreshAreas, checkUnlocks)
- [ ] 13.7 Add marker functions to P2PContext (createMarker, updateMarker, deleteMarker)

## 14. Localization

- [ ] 14.1 Add trading translation keys to locales/*.json
- [ ] 14.2 Add exploration translation keys to locales/*.json
- [ ] 14.3 Add series translation keys to locales/*.json
- [ ] 14.4 Add marker translation keys to locales/*.json
- [ ] 14.5 Add Mapbox offline settings translations to locales/*.json

## 15. Testing & Validation

- [ ] 15.1 Test BLE discovery on iOS device
- [ ] 15.2 Test BLE discovery on Android device
- [ ] 15.3 Test trade negotiation flow between two devices
- [ ] 15.4 Test geofencing Enter/Exit events
- [ ] 15.5 Test offline map pack download and rendering
- [ ] 15.6 Test series progress tracking
- [ ] 15.7 Test marker creation and rendering
- [ ] 15.8 Run TypeScript type check on all new files

## 16. Documentation

- [ ] 16.1 Update AGENTS.md with new module locations
- [ ] 16.2 Add BLE troubleshooting section to help.tsx
- [ ] 16.3 Add exploration guide to help.tsx
- [ ] 16.4 Add series guide to help.tsx