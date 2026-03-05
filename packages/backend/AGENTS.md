# BACKEND KNOWLEDGE BASE

**Generated:** 2026-03-04
**Commit:** a0f248e
**Package:** @treasure-hunt/backend

## OVERVIEW

NestJS API server providing REST endpoints for authentication, item spawning, inventory management, and leaderboard features.

## STRUCTURE

```
src/
├── main.ts           # Entry: CORS, validation pipes, /api prefix
├── app.module.ts     # Root module, TypeORM, Schedule setup
├── auth/             # JWT strategies, Passport, OAuth guards
├── user/             # User entity, profile management
├── item/             # Item definitions, rarity constants
├── spawn/            # Scheduled spawning, distance validation, expiration
├── inventory/        # User collection history, stats
├── poi/              # Points of Interest management
├── leaderboard/      # Ranking calculations
├── achievement/      # Achievement tracking, unlock logic
├── common/           # Guards, decorators, filters, pipes
├── config/           # Environment configs (app, database, jwt)
└── database/         # TypeORM entities, migrations
```

## WHERE TO LOOK

| Feature | Location | Key Files |
|---------|----------|-----------|
| Auth strategies | `src/auth/strategies/` | jwt.strategy.ts, local.strategy.ts |
| Spawning logic | `src/spawn/` | spawn.service.ts (scheduled tasks) |
| Distance checks | `src/spawn/` | collect.dto.ts (validation) |
| Entity definitions | `src/database/entities/` | *.entity.ts |
| Global guards | `src/common/guards/` | jwt-auth.guard.ts |
| Custom decorators | `src/common/decorators/` | user.decorator.ts |
| API config | `src/config/` | jwt.config.ts, database.config.ts |

## CONVENTIONS

- **Port**: 3000 (configurable via PORT env)
- **API prefix**: All routes under `/api`
- **Database**: SQLite for dev (`treasure_hunt.db`), PostgreSQL for prod
- **Validation**: Global `ValidationPipe` with whitelist + transform
- **Auth**: JWT httpOnly cookies, Passport strategies (local + jwt)
- **Scheduling**: `@nestjs/schedule` for hourly spawns, 24h expiration cleanup

## ANTI-PATTERNS

- **DO NOT** hardcode distances (use shared constants: 50m collection radius)
- **DO NOT** bypass common guards (use `@UseGuards(JwtAuthGuard)` consistently)
- **DO NOT** place business logic in controllers (keep in services)
- **DO NOT** use `synchronize: true` in production database config
