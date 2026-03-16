# BACKEND KNOWLEDGE BASE

**Generated:** 2026-03-13
**Commit:** 0ad1388
**Package:** @treasure-hunt/backend

## OVERVIEW

NestJS API server providing REST endpoints for authentication, item spawning, inventory management, POI, leaderboard, and achievements.

## STRUCTURE

```
src/
├── main.ts           # Entry: CORS, validation pipes, /api prefix
├── app.module.ts     # Root module, TypeORM (SQLite), ScheduleModule
├── auth/             # JWT strategies, Passport, OAuth guards
│   ├── strategies/   # jwt.strategy.ts, local.strategy.ts
│   ├── guards/       # jwt-auth.guard.ts, local-auth.guard.ts, roles.guard.ts
│   └── dto/          # login.dto.ts, register.dto.ts, oauth-login.dto.ts
├── user/             # User entity, profile management
├── item/             # Item definitions, rarity constants
├── spawn/            # Scheduled spawning, distance validation, expiration
├── inventory/        # User collection history, stats
├── poi/              # Points of Interest management
├── leaderboard/      # Ranking calculations
├── achievement/      # Achievement tracking, unlock logic
├── common/           # Guards, decorators, filters, pipes
│   ├── guards/       # jwt-auth.guard.ts (global default)
│   ├── decorators/   # @CurrentUser(), @Public(), @Roles()
│   ├── filters/      # all-exceptions.filter.ts
│   └── pipes/        # validation.pipe.ts
├── config/           # appConfig, databaseConfig, jwtConfig
├── database/         # seeds/item.seeder.ts, run-seeds.ts
└── types/            # jest.d.ts (misplaced, should be at root)
```

## WHERE TO LOOK

| Feature | Location | Key Files |
|---------|----------|-----------|
| Auth flow | `src/auth/` | auth.service.ts, jwt.strategy.ts |
| Spawning | `src/spawn/` | spawn.service.ts (scheduled tasks, Haversine distance) |
| Collection validation | `src/spawn/dto/` | collect-item.dto.ts (50m radius check) |
| Entity definitions | `src/*/entities/` | *.entity.ts (colocated with features) |
| Global guards | `src/common/guards/` | jwt-auth.guard.ts |
| Custom decorators | `src/common/decorators/` | current-user.decorator.ts |
| Error handling | `src/common/filters/` | all-exceptions.filter.ts |
| Config | `src/config/` | index.ts (exports appConfig, databaseConfig, jwtConfig) |

## CONVENTIONS

- **Port**: 3000 (configurable via PORT env)
- **API prefix**: All routes under `/api`
- **Database**: SQLite (`better-sqlite3`) for dev, PostgreSQL for prod
- **Validation**: Global `ValidationPipe` with whitelist + transform
- **Auth**: JWT httpOnly cookies, Passport strategies (local + jwt)
- **Scheduling**: `@nestjs/schedule` for hourly spawns, 24h expiration cleanup
- **Guards**: `JwtAuthGuard` is global default; use `@Public()` to bypass
- **Decorators**: `@CurrentUser()` extracts user from request
- **Path alias**: `@/*` → `src/*`

## ANTI-PATTERNS

- **DO NOT** hardcode distances (use `COLLECTION_RADIUS_METERS` from shared)
- **DO NOT** use `req: any` - type as `@Request() req: RequestWithUser`
- **DO NOT** place business logic in controllers (keep in services)
- **DO NOT** use `synchronize: true` in production
- **DO NOT** use `as any` for type assertions (5 instances exist)

## TESTING

- **Pattern**: `*.spec.ts` colocated with source files
- **Config**: Jest config embedded in `package.json` (lines 76-100)
- **Setup**: `jest.setup.ts` imports `@types/jest`
- **Mocking**: Repository mock pattern with `getRepositoryToken()`
- **Directive**: Start test files with `/// <reference types="jest" />`

## KEY SERVICES

- **AuthService**: Local login, OAuth (Google/Apple), JWT token generation
- **SpawnService**: Cron-based spawning, Haversine distance calc, expiration cleanup
- **InventoryService**: Collection history, stats with rarity breakdown
- **AchievementService**: Progress tracking, unlock conditions
