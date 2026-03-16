# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-13
**Commit:** 0ad1388
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
│   │       └── database/   # TypeORM entities, seeds
│   ├── mobile/      # React Native + Expo
│   │   ├── app/           # Expo Router (file-based routing)
│   │   │   ├── (auth)/    # Login, register
│   │   │   └── (tabs)/    # Map, inventory, achievements
│   │   ├── api/           # API client modules
│   │   ├── components/    # Reusable UI
│   │   └── lib/           # Utilities, storage
│   ├── web/         # Next.js 14 App Router (port 3001)
│   │   ├── app/           # Routes: login, register, map, inventory
│   │   ├── components/    # UI components
│   │   └── lib/           # Utilities, API client
│   └── shared/      # Shared types, constants, utils
└── CLAUDE.md        # Existing project guidance
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Auth logic | `packages/backend/src/auth/` | JWT + Passport strategies |
| Game mechanics | `packages/shared/src/constants.ts` | Rarity weights, collection radius |
| Map UI | `packages/web/app/map/`, `packages/mobile/app/(tabs)/map.tsx` | Leaflet (web), Amap (mobile) |
| Collection logic | `packages/backend/src/spawn/` | Distance validation, item expiration |
| API routes | `packages/backend/src/*/` | REST endpoints |
| Mobile routes | `packages/mobile/app/` | Expo Router file-based |
| Database entities | `packages/backend/src/*/entities/` | Colocated with feature modules |
| Cross-cutting | `packages/backend/src/common/` | Guards, decorators, filters |

## CONVENTIONS

- **Database**: SQLite (dev), PostgreSQL + PostGIS (prod) - TypeORM
- **State**: React Context (mobile), no Zustand stores despite docs
- **Maps**: Leaflet (web), Amap/高德地图 (mobile)
- **Auth**: JWT httpOnly cookies, OAuth (Google/Apple)
- **TypeScript**: Strict mode enabled in all packages
- **Testing**: Jest in backend/web, jest-expo in mobile
- **API prefix**: All routes prefixed with `/api`
- **Rarity**: common > rare > epic > legendary (spawn weights in constants)
- **Path aliases**: `@/*` maps to `src/*` or `./*` in all packages

## ANTI-PATTERNS (THIS PROJECT)

- **DO NOT** use `as any` for type assertions (10 instances exist - cleanup needed)
- **DO NOT** commit with `console.log` in production code (9 instances in main.ts, seeds)
- **DO NOT** use `@ts-ignore` or `@ts-expect-error` (none currently)
- **DO NOT** use `synchronize: true` in production database config
- **DO NOT** use `req: any` in controllers - type with `RequestWithUser`
- **DO NOT** duplicate types in web/types - use `@treasure-hunt/shared`

## KNOWN ISSUES

- **No CI/CD**: No `.github/workflows` exists
- **Mixed lockfiles**: Both yarn.lock and package-lock.json exist (problematic)
- **Broken mobile lint**: `"lint": "lint:."` script will fail
- **Empty directories**: `store/` and `hooks/` in web/mobile are placeholders
- **Husky hooks**: Pre-commit does nothing (no lint-staged config)

## UNIQUE STYLES

- Mobile uses Chinese UI text throughout (地图, 收藏, 成就, 排行, 我的)
- Web includes Amap (高德地图) provider in head metadata
- Backend has comprehensive `common/` module for cross-cutting concerns
- Both frontend apps use React Context for auth state (not Zustand)
- Metro config has custom monorepo setup with `disableHierarchicalLookup: true`

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

# Docker
yarn docker:up      # Production (PostGIS + Redis)
yarn docker:down
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