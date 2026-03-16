# WEB PACKAGE

**Generated:** 2026-03-13
**Commit:** 0ad1388
**Package:** @treasure-hunt/web
**Framework:** Next.js 14 App Router
**Port:** 3001

## OVERVIEW

Next.js 14 web frontend with Leaflet map integration. Uses React Context for auth state (Zustand listed but not used).

## STRUCTURE

```
web/
├── app/              # App Router routes
│   ├── layout.tsx    # Root: ThemeProvider, AmapProvider, AuthProvider, ToastProvider
│   ├── page.tsx      # Home redirect to /map
│   ├── login/        # Email/password login
│   ├── register/     # User registration
│   ├── map/          # Core game: Leaflet map with nearby items
│   ├── inventory/    # User's collected items
│   ├── profile/      # User profile + settings, stats, about, help
│   ├── leaderboard/  # User rankings
│   └── achievements/ # Achievement tracking
├── components/       # UI components
│   ├── AuthProvider.tsx    # React Context for auth state
│   ├── AmapProvider.tsx    # 高德地图 loader
│   ├── ToastProvider.tsx   # Toast notifications
│   ├── ThemeProvider.tsx   # Dark/light theme
│   ├── BottomNav.tsx       # Mobile-style navigation
│   ├── MapContent.tsx      # Leaflet map component
│   └── ItemModal.tsx       # Item detail modal
├── lib/
│   ├── api.ts        # Axios instance + domain functions (mixed concern)
│   └── session.ts    # Cookie-based session helpers
├── types/            # Duplicate types (should use @treasure-hunt/shared)
├── hooks/            # Empty placeholder
└── store/            # Empty placeholder (Zustand not used)
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Map rendering | `app/map/page.tsx`, `components/MapContent.tsx` |
| Auth state | `components/AuthProvider.tsx` |
| API calls | `lib/api.ts` |
| Theme/styling | `tailwind.config.js`, `components/ThemeProvider.tsx` |
| Bottom navigation | `components/BottomNav.tsx` |

## CONVENTIONS

- **Routing**: Next.js 14 App Router with file-based routing
- **State**: React Context (AuthProvider) - Zustand listed but not used
- **Styling**: Tailwind CSS with custom dark theme (`dark-100`, `dark-200`, `dark-300`)
- **Maps**: Leaflet for rendering, Amap JS API loaded in layout
- **Layout**: Root wraps with ThemeProvider > AmapProvider > AuthProvider > ToastProvider
- **Navigation**: BottomNav for mobile-style navigation
- **Path alias**: `@/*` → `./*`

## ANTI-PATTERNS

- **DO NOT** use `@ts-ignore` or `as any` (1 instance in MapContent.tsx for Leaflet)
- **DO NOT** leave `console.log` in production code
- **DO NOT** import from `packages/backend` - use `@treasure-hunt/shared`
- **DO NOT** define types in `types/` - use shared package
- **DO NOT** hardcode API URLs - use `NEXT_PUBLIC_API_URL`

## KNOWN ISSUES

- **Duplicate types**: `types/index.ts` duplicates shared package
- **Empty directories**: `store/`, `hooks/` are placeholders
- **Mixed API concerns**: `lib/api.ts` mixes axios config + domain functions
