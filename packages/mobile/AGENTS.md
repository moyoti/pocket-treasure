# Mobile App - React Native + Expo

**Package:** `@treasure-hunt/mobile`  
**Framework:** React Native + Expo with Expo Router  
**Entry Point:** `app/_layout.tsx`

## OVERVIEW

Expo-based mobile app with file-based routing, gesture support, and Chinese localization for treasure hunting game.

## STRUCTURE

```
mobile/
├── app/              # Expo Router routes (file-based)
│   ├── _layout.tsx   # Root layout with GestureHandlerRootView
│   ├── (auth)/       # Auth group: login, register
│   ├── (tabs)/       # Tab navigation: map, inventory, achievements, leaderboard, profile
│   └── item/[id].tsx # Item detail modal
├── api/              # API client modules (auth, inventory, items)
├── components/       # Reusable UI components
├── lib/              # Utilities (api.ts, storage.ts)
├── store/            # Zustand stores (currently empty)
└── types/            # TypeScript type definitions
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Root navigation | `app/_layout.tsx` |
| Tab configuration | `app/(tabs)/_layout.tsx` |
| Auth flow | `app/(auth)/`, `components/AuthProvider.tsx` |
| API calls | `lib/api.ts`, `api/*.ts` |
| State management | `components/AuthProvider.tsx` (React Context) |
| Storage | `lib/storage.ts` (secure storage) |

## CONVENTIONS

- **Routing:** Expo Router file-based routing with route groups `(auth)`, `(tabs)`
- **Navigation:** Stack navigator in root, bottom tabs in main screens
- **Localization:** Chinese UI text throughout (地图，收藏，成就，排行，我的)
- **Gesture handling:** Wrap root with `GestureHandlerRootView`
- **API client:** Axios with interceptors for JWT token injection
- **Auth state:** React Context (AuthProvider) with secure storage

## ANTI-PATTERNS

- **DO NOT** use `store/` directory for state (currently empty, use Context or add Zustand properly)
- **DO NOT** mix React Navigation with Expo Router (use Expo Router only)
- **DO NOT** hardcode API URLs (use `EXPO_PUBLIC_API_URL` environment variable)
- **DO NOT** forget `GestureHandlerRootView` wrapper for gesture-based components
