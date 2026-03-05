# Web Package - AGENTS.md

**Package:** `@treasure-hunt/web`  
**Framework:** Next.js 14 App Router  
**Port:** 3001 (dev)

## OVERVIEW

Next.js 14 web frontend for the treasure hunt game with Leaflet map integration and Zustand state management.

## STRUCTURE

```
web/
├── app/            # App Router routes (login, register, map, inventory, profile, leaderboard, achievements)
├── components/     # UI components (AuthProvider, ToastProvider, BottomNav, map components)
├── hooks/          # Custom React hooks
├── lib/            # Utilities and helpers
├── store/          # Zustand state stores
├── types/          # TypeScript type definitions
└── public/         # Static assets
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Map integration | `app/map/`, `components/` (Leaflet) |
| Auth state | `components/AuthProvider.tsx` |
| Global state | `store/` (Zustand stores) |
| API calls | `hooks/`, `lib/` |
| UI components | `components/`, `app/*/page.tsx` |
| Tailwind config | `tailwind.config.js` |

## CONVENTIONS

- **Routing**: Next.js 14 App Router with file-based routing in `app/`
- **State**: Zustand stores for global state (auth, inventory, map)
- **Styling**: Tailwind CSS with custom dark theme (`bg-dark-300`)
- **Maps**: Leaflet for map rendering, Amap (高德地图) JS API loaded in layout
- **Layout**: Root layout wraps app with `AuthProvider` and `ToastProvider`
- **Navigation**: BottomNav component for mobile-style navigation

## ANTI-PATTERNS

- **DO NOT** use `@ts-ignore` or `as any` for type assertions
- **DO NOT** leave `console.log` in production code
- **DO NOT** import from `packages/backend` directly (use `@treasure-hunt/shared`)
- **DO NOT** use CSS modules (use Tailwind utility classes)
- **DO NOT** hardcode API URLs (use environment variables)

## ENTRY POINT

`packages/web/app/layout.tsx` - Root layout with providers and Amap script injection
