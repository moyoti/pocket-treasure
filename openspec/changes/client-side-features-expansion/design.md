## Context

The Treasure Hunt app uses a fully decentralized, client-side architecture:
- Ed25519 cryptographic identities for player verification
- SQLite (expo-sqlite) for local data storage
- Deterministic spawn system using hash-based generation
- Existing `P2PContext` provides centralized state management
- Current map uses OSM UrlTile with Overpass API fallback

All new features must integrate with this architecture without requiring backend services. The existing `engines/` pattern (ShopEngine, GachaEngine, AchievementEngine) provides a template for new service modules.

## Goals / Non-Goals

**Goals:**
- Implement BLE-based local trading with cryptographic verification using existing identity system
- Create geofencing-based area exploration with background task support
- Add collection series as an extension to existing achievement system
- Replace OSM tiles with Mapbox GL for improved reliability
- Enable user-created markers with local storage and BLE sharing

**Non-Goals:**
- Online/server-based trading (out of scope - pure client-side only)
- Backend POI management (keep using Overpass/Mapbox APIs)
- Cloud sync for markers or exploration data
- Push notifications for trade requests (BLE requires proximity)
- Multi-player real-time gameplay (BLE is connection-based, not real-time)

## Decisions

### 1. BLE vs WiFi Direct for Trading

**Decision**: BLE (Bluetooth Low Energy) via `react-native-ble-plx`

**Rationale**:
| Option | Pros | Cons |
|--------|------|------|
| BLE | Cross-platform, no network required, works anywhere, standard protocol | Limited bandwidth (~1KB/s), requires proximity |
| WiFi Direct | Higher bandwidth, longer range | Android-only reliability issues, complex setup |
| NFC | Instant, secure | Requires physical touch, iOS limitations |

BLE is chosen for: universal support, proximity-based gameplay fit, standard advertising protocol.

**Implementation Pattern**:
- Use BLE advertising to broadcast trade availability
- Custom service UUID for Treasure Hunt protocol
- Characteristic-based data exchange (write/notify)
- Trade negotiation protocol (offer → accept/reject → exchange)

### 2. Mapbox Tile Strategy

**Decision**: Pure Mapbox with offline caching, no regional provider switching

**Rationale**:
| Option | Pros | Cons |
|--------|------|------|
| Pure Mapbox | Vector tiles, offline SDK, custom styles, global coverage | API key required, rate limits |
| Mapbox + Amap hybrid | Optimized for China | Complex region detection, dual API keys |
| Keep OSM | Free, no API key | Rate limits, unreliable POI fetch, no offline |

Mapbox chosen for: reliability, offline support (critical for mobile gameplay), custom styling for game aesthetic.

**Tile Configuration**:
- Use Mapbox Streets style as base
- Custom style layers for treasure markers
- Offline pack download for visited regions
- Cache POI data locally after first fetch

### 3. Geofencing Strategy

**Decision**: Expo-location geofencing with `expo-task-manager` background handling

**Rationale**:
- Expo-location already integrated for map functionality
- Platform limits acceptable: iOS 20 regions, Android 100 regions
- Background task execution for continuous tracking
- Battery impact minimal with proper region sizing

**Implementation**:
- Define areas as geofence regions (500m-2km radius)
- Task triggers on Enter/Exit events
- Store visit history in SQLite
- UI updates on foreground return

### 4. Collection Series Architecture

**Decision**: Extend existing AchievementEngine rather than new engine

**Rationale**:
- Achievement system already tracks progress and rewards
- Series are essentially "set-based achievements"
- Reduces code duplication
- Unified UI for all achievement types

**Implementation**:
- Add `seriesId` field to achievement definitions
- Series achievements have `items: string[]` requirement instead of numeric `requirement`
- Progress = count of collected items matching series item list
- Partial rewards at 25%, 50%, 75% thresholds

### 5. Marker Storage & Sharing

**Decision**: SQLite + BLE broadcast for sharing (no cloud sync)

**Rationale**:
- Markers personal to player, stored locally
- BLE sharing for in-person marker exchange (friends nearby)
- No server dependency needed
- Matches existing architecture patterns

**Implementation**:
- `user_markers` table with creator public key
- BLE marker broadcast service
- Marker data includes: name, lat/lng, icon type, description
- Sharing = BLE advertise marker data to nearby devices

## Risks / Trade-offs

### BLE Connection Stability
**Risk**: BLE connections may drop during trade negotiation  
**Mitigation**: Implement reconnection logic with trade state persistence; timeout after 60s with cancel option

### Mapbox API Costs
**Risk**: High usage could exceed free tier (50k requests/month)  
**Mitigation**: Heavy caching, offline packs for common areas; POI fetch only on map refresh (2-min cooldown existing)

### Geofencing Battery Drain
**Risk**: Continuous geofencing impacts battery life  
**Mitigation**: Use balanced scan mode, limit active regions to nearby areas only, pause when app backgrounded > 5 min

### iOS Geofence Limit (20 Regions)
**Risk**: iOS caps at 20 simultaneous geofences  
**Mitigation**: Dynamically manage regions - keep only nearest 20; rotate based on player movement

### BLE Permission Requirements
**Risk**: Users may deny Bluetooth permissions  
**Mitigation**: Clear permission request UI explaining trading feature; fallback to "view-only" mode without trading

### Trade Verification Complexity
**Risk**: Cryptographic validation of trades may have edge cases  
**Mitigation**: Use existing Ed25519 signature system; signature = hash(tradeData + privateKey); verify with public key

### Series Achievement Confusion
**Risk**: Users may confuse series with regular achievements  
**Mitigation**: Separate UI section "Collection Series"; distinct visual styling; progress bar showing collected items

## Open Questions

1. **BLE Service UUID**: Should we use a registered UUID or custom? Custom simpler but may conflict with other apps.
   - Recommendation: Use custom UUID `treasure-hunt-trade-v1` format

2. **Offline Map Region Size**: How large should offline packs be? 
   - Recommendation: Auto-download 10km radius around current location, manual download for other areas

3. **Area Definition Granularity**: Should areas be city-level or neighborhood-level?
   - Recommendation: City districts for major cities, neighborhood-level for high-density areas

4. **Trade History Retention**: How long to keep trade records?
   - Recommendation: Keep all trade history for audit; display last 20 in UI

5. **Marker Icon Types**: What icon options to provide?
   - Recommendation: 5-8 preset icons (star, flag, treasure, camp, note, camera, etc.)