# MOBILE PACKAGE

**Generated:** 2026-05-06
**Package:** @treasure-hunt/mobile
**Framework:** React Native + Expo Router

## OVERVIEW

Expo-based mobile app with file-based routing. P2P offline-first architecture with local SQLite database and Ed25519 identity. No backend server required.

## STRUCTURE

```
mobile/
├── app/              # Expo Router routes (file-based)
│   ├── _layout.tsx   # Root: P2PProvider, Stack
│   ├── index.tsx     # Splash/loading screen
│   ├── (tabs)/       # Tab navigation
│   │   ├── _layout.tsx    # Bottom tabs config
│   │   ├── map.tsx        # 地图 - OpenStreetMap
│   │   ├── inventory.tsx  # 收藏
│   │   ├── achievements.tsx # 成就
│   │   ├── tasks.tsx      # 任务
│   │   ├── gacha.tsx      # 扭蛋
│   │   ├── synthesis.tsx  # 合成
│   │   ├── cosmetics.tsx  # 装饰品
│   │   ├── trade.tsx      # 交易
│   │   └── profile.tsx    # 我的
│   ├── item/[id].tsx # Item detail modal
│   └── profile/      # stats.tsx, settings.tsx, help.tsx, about.tsx, exploration.tsx
├── src/
│   ├── p2p/          # P2P core logic
│   │   ├── P2PContext.tsx  # React Context for all game state
│   │   ├── database/       # SQLite database service
│   │   ├── identity/       # Ed25519 identity service
│   │   ├── engines/        # Game engines (Shop, Gacha, etc.)
│   │   ├── data/           # Item definitions, POIs, etc.
│   │   ├── poi/            # POI fetching service
│   │   ├── spawn/          # Treasure spawn service
│   │   ├── exploration/    # Area tracking
│   │   ├── markers/        # User markers
│   │   └── trade/          # P2P trading
│   └── utils/        # Utilities
├── components/       # UI components
│   ├── animations/   # Animation components
│   └── MobileLocaleProvider.tsx
└── assets/           # Static assets
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Root navigation | `app/_layout.tsx` |
| Tab configuration | `app/(tabs)/_layout.tsx` |
| P2P state management | `src/p2p/P2PContext.tsx` |
| Database operations | `src/p2p/database/DatabaseService.ts` |
| Identity/crypto | `src/p2p/identity/IdentityService.ts` |
| Map screen | `app/(tabs)/map.tsx` |
| Game engines | `src/p2p/engines/` |
| Item definitions | `src/p2p/data/items.ts` |

## CONVENTIONS

- **Routing**: Expo Router file-based with route groups `(tabs)`
- **Navigation**: Stack in root, bottom tabs in main screens
- **Localization**: Chinese UI text throughout (地图, 收藏, 成就, 任务, 我的)
- **Gestures**: Root wrapped with `GestureHandlerRootView`
- **State**: P2PContext (React Context) for all game state
- **Database**: expo-sqlite with TypeORM-like service
- **Identity**: Ed25519 key pairs stored in SecureStore
- **Path alias**: `@/*` → `./*`

## MAP PROVIDER

- **Provider**: OpenStreetMap (OSM)
- **Tile URL**: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Library**: react-native-maps with UrlTile
- **Reason**: Free, no API key, global coverage, suitable for international release

## P2P ARCHITECTURE

- **No Backend**: All data stored locally on device
- **Identity**: Ed25519 key pair generated on first launch
- **Database**: SQLite for persistent storage
- **Treasure Spawns**: Deterministic based on POI + time slot + salt
- **Trading**: Bluetooth LE for peer-to-peer item exchange

## ANTI-PATTERNS

- **DO NOT** use `as any` for type assertions
- **DO NOT** commit with `console.log` in production code
- **DO NOT** use `@ts-ignore` or `@ts-expect-error`
- **DO NOT** use `synchronize: true` in production database config
- **DO NOT** use `req: any` in controllers - type with `RequestWithUser`
- **DO NOT** duplicate types - use `@treasure-hunt/shared`

## KNOWN ISSUES

- **No CI/CD**: No `.github/workflows` exists
- **Mixed lockfiles**: Both yarn.lock and package-lock.json exist
- **Empty directories**: `store/` and `hooks/` are placeholders

## TESTING

- **Config**: `jest.config.js` with jest-expo preset
- **Setup**: `jest.setup.js` with extensive Expo mocks
- **Pattern**: `__tests__/` for integration tests