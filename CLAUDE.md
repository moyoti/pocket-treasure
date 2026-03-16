# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

寻宝记 (Treasure Hunt) is a location-based item collection game similar to Pokémon GO. Players explore the real world and collect virtual treasures at landmark locations.

## Monorepo Structure

```
treasure-hunt/
├── packages/
│   ├── backend/     # NestJS API (port 3000)
│   ├── mobile/      # React Native + Expo
│   ├── web/         # Next.js 14 App Router (port 3001)
│   ├── miniprogram/ # 微信小程序
│   └── shared/      # Shared types, constants, utilities
```

## Commands

```bash
# Install dependencies
yarn install

# Development servers
yarn dev:backend    # NestJS with hot reload (port 3000)
yarn dev:web        # Next.js dev server (port 3001)
yarn dev:mobile     # Expo development server

# Build
yarn build:backend
yarn build:web

# Docker (development database)
docker-compose -f docker-compose.dev.yml up -d   # PostgreSQL + PostGIS
docker-compose -f docker-compose.dev.yml down

# Docker (production)
yarn docker:up
yarn docker:down

# Lint and test
yarn lint
yarn test

# Backend-specific
yarn workspace @treasure-hunt/backend test                    # Run all tests
yarn workspace @treasure-hunt/backend test:watch              # Run tests in watch mode
yarn workspace @treasure-hunt/backend test -- path/to/test.spec.ts  # Run single test file
yarn workspace @treasure-hunt/backend test:e2e                # Run e2e tests
yarn workspace @treasure-hunt/backend migration:run           # Run database migrations
yarn workspace @treasure-hunt/backend seed                    # Seed database with items

# Mobile-specific
yarn workspace @treasure-hunt/mobile ios              # Run on iOS simulator
yarn workspace @treasure-hunt/mobile android          # Run on Android emulator

# Miniprogram-specific
yarn workspace @treasure-hunt/miniprogram compile     # Compile TypeScript
# Open in WeChat DevTools: Import packages/miniprogram directory
```

## Backend Architecture (NestJS)

Modules in `packages/backend/src/`:
- **auth** - JWT authentication, Passport strategies (local/jwt), OAuth (Google/Apple)
- **user** - User entity and management
- **item** - Item definitions with rarity/type enums
- **spawn** - SpawnedItem entity, scheduled spawning service (`@nestjs/schedule`), collection logic
- **inventory** - User inventory and collection history
- **poi** - Points of Interest (landmarks where items spawn)
- **leaderboard** - User rankings by collection count
- **achievement** - Achievement tracking and progress

Database: PostgreSQL with PostGIS for geospatial queries in production. SQLite (`better-sqlite3`) for local development without Docker.

Configuration: `src/config/` exports `appConfig`, `databaseConfig`, `jwtConfig` loaded via `ConfigModule.forRoot()`.

## Frontend Architecture (Next.js 14)

App Router pages in `packages/web/app/`:
- `/login` - Email/password login
- `/register` - User registration
- `/map` - Core game: map showing nearby items
- `/inventory` - User's collected items
- `/profile` - User profile management
- `/leaderboard` - User rankings
- `/achievements` - Achievement tracking

Key providers wrap the app in `layout.tsx`: `ThemeProvider`, `AmapProvider`, `AuthProvider`, `ToastProvider`.

Maps: Uses Amap (高德地图) via `AmapProvider.tsx` for China-compatible maps. The provider loads the AMap JS API v2.0.

## Mobile Architecture (Expo Router)

Uses Expo Router with file-based routing. Structure in `packages/mobile/app/`:
- `(auth)/` - Authentication screens (login, register)
- `(tabs)/` - Main app tabs: map, inventory, leaderboard, achievements, profile
- `item/` - Item detail screens
- `profile/` - Profile-related screens

Maps: Uses `react-native-amap3d` for native Amap integration on iOS/Android.

## Miniprogram Architecture (微信小程序)

Uses native WeChat miniprogram framework with TypeScript. Structure in `packages/miniprogram/src/`:
- `pages/` - Page files (login, map, inventory, shop, profile, achievements, leaderboard, gacha, market)
- `utils/` - Utility functions including API wrapper
- `assets/` - Static resources (icons)
- `app.ts` - Application entry point
- `app.json` - Application configuration including tabBar

Key features:
- **地图探索** - Uses WeChat map component with location services
- **背包系统** - Item management and NPC trading
- **商店** - Purchase items with coins
- **抽奖** - Gacha system with pity mechanism
- **市场** - Player-to-player trading
- **成就/排行榜** - Achievement and ranking systems

To develop:
1. Install WeChat DevTools
2. Import `packages/miniprogram` directory
3. Configure `apiBaseUrl` in `app.ts`
4. Set `appid` in `project.config.json`

## Key Game Mechanics

- **Collection radius**: 50 meters (defined in `shared/src/constants.ts`)
- **Spawn interval**: Every 1 hour
- **Item expiration**: 24 hours
- **Rarity system**: common > rare > epic > legendary (with spawn weights in `RARITY_WEIGHTS`)

## Shared Package

`packages/shared/src/` exports:
- `types.ts` - ItemRarity, ItemType, User, Item, SpawnedItem, InventoryItem, LeaderboardEntry, Achievement interfaces
- `constants.ts` - Game constants (COLLECTION_RADIUS_METERS, RARITY_COLORS, RARITY_WEIGHTS, etc.)
- `utils.ts` - Distance calculation (Haversine formula), format helpers

## Database Configuration

**Local development (default)**: Uses SQLite via `better-sqlite3` with no additional setup. Database file is `packages/backend/treasure_hunt.db`.

**PostgreSQL with PostGIS (optional)**: For production or when PostGIS geospatial queries are needed:
- Run `docker-compose -f docker-compose.dev.yml up -d` to start postgres container
- Entity location fields use `geometry` type with PostGIS
- For SQLite, location fields use `decimal` for lat/lng columns instead

The `TypeOrmModule.forRootAsync()` in `app.module.ts` automatically configures the database connection.

## API Endpoints

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login, returns JWT
- `GET /api/spawned-items/nearby?lat=&lng=` - Items near location
- `POST /api/spawned-items/collect` - Collect item (validates distance)
- `GET /api/inventory` - User's inventory
- `GET /api/items` - All item definitions
- `GET /api/leaderboard` - User rankings
- `GET /api/achievements` - User achievements

## Environment Setup

Required environment variables (see `.env.example` files in each package):
- Backend: `JWT_SECRET`, `MAPBOX_ACCESS_TOKEN`, OAuth credentials (optional)
- Web: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_MAPBOX_TOKEN`

Amap API keys are currently hardcoded in:
- Web: `packages/web/components/AmapProvider.tsx`
- Mobile: `packages/mobile/app/(tabs)/map.tsx`