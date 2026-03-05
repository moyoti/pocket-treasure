# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-04
**Commit:** a0f248e
**Branch:** main

## OVERVIEW

寻宝记 (Treasure Hunt) - Location-based item collection game (Pokémon GO-like). Monorepo with 4 packages: NestJS backend, Next.js web, React Native/Expo mobile, and shared types.

## STRUCTURE

```
treasure-hunt/
├── packages/
│   ├── backend/     # NestJS API (port 3000)
│   │   └── src/
│   │       ├── auth/        # JWT, Passport (local/jwt), OAuth
│   │       ├── user/       # User entity
│   │       ├── item/       # Item definitions
│   │       ├── spawn/      # SpawnedItem, scheduled spawning
│   │       ├── inventory/  # User collection history
│   │       ├── poi/        # Points of Interest
│   │       ├── leaderboard/# Rankings
│   │       ├── achievement/# Achievement tracking
│   │       ├── common/     # Guards, decorators, filters, pipes
│   │       ├── config/     # Configuration
│   │       └── database/   # TypeORM entities
│   ├── mobile/      # React Native + Expo
│   │   ├── app/           # Expo Router (file-based routing)
│   │   │   ├── (auth)/    # Login, register
│   │   │   └── (tabs)/    # Map, inventory, achievements
│   │   ├── api/           # API client
│   │   ├── components/    # Reusable UI
│   │   ├── store/         # Zustand stores
│   │   └── hooks/         # Custom hooks
│   ├── web/         # Next.js 14 App Router (port 3001)
│   │   ├── app/           # Routes: login, register, map, inventory
│   │   ├── components/    # UI components
│   │   ├── lib/           # Utilities
│   │   ├── store/         # Zustand stores
│   │   └── hooks/         # Custom hooks
│   └── shared/      # Shared types, constants, utils
└── CLAUDE.md        # Existing project guidance
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Auth logic | `packages/backend/src/auth/` | JWT + Passport strategies |
| Game mechanics | `packages/shared/src/constants.ts` | Rarity weights, collection radius |
| Map UI | `packages/web/app/map/` | Leaflet integration |
| Collection logic | `packages/backend/src/spawn/` | Distance validation, item expiration |
| API routes | `packages/backend/src/*/` | REST endpoints |
| Mobile routes | `packages/mobile/app/` | Expo Router file-based |

## CONVENTIONS

- **Database**: SQLite (dev), PostgreSQL + PostGIS (prod) - TypeORM
- **State**: Zustand stores in `packages/{web,mobile}/store/`
- **Maps**: Leaflet (web), Mapbox available but not active
- **Auth**: JWT httpOnly cookies, OAuth (Google/Apple)
- **TypeScript**: Strict mode enabled
- **Testing**: Jest in backend, Expo testing in mobile
- **API prefix**: All routes prefixed with `/api`
- **Rarity**: common > rare > epic > legendary (spawn weights in constants)

## ANTI-PATTERNS (THIS PROJECT)

- **DO NOT** use `as any` for type assertions (43 instances exist - cleanup needed)
- **DO NOT** commit with `console.log` in production code (21 instances found)
- **DO NOT** use `@ts-ignore` or `@ts-expect-error` (none currently)

## UNIQUE STYLES

- Mobile uses Chinese "我的物品" (My Items) in tab navigation
- Web includes Amap (高德地图) provider in head metadata
- Backend has comprehensive `common/` module for cross-cutting concerns
- Both frontend apps have parallel features but separate implementations

## COMMANDS

```bash
# Install
yarn install

# Dev servers
yarn dev:backend    # NestJS (port 3000)
yarn dev:web        # Next.js (port 3001)
yarn dev:mobile     # Expo

# Build
yarn build:backend
yarn build:web

# Test
yarn test
yarn workspace @treasure-hunt/backend test:watch

# Database
yarn workspace @treasure-hunt/backend migration:run
yarn workspace @treasure-hunt/backend seed
```

## NOTES

- **Collection radius**: 50 meters (defined in `shared/src/constants.ts`)
- **Spawn interval**: 1 hour
- **Item expiration**: 24 hours
- **Entry points**:
  - Backend: `packages/backend/src/main.ts`
  - Web: `packages/web/app/layout.tsx` (App Router)
  - Mobile: `packages/mobile/app/_layout.tsx` (Expo Router)
  - Shared: `packages/shared/src/index.ts`