# MOBILE PACKAGE

**Generated:** 2026-03-13
**Commit:** 0ad1388
**Package:** @treasure-hunt/mobile
**Framework:** React Native + Expo Router

## OVERVIEW

Expo-based mobile app with file-based routing and Chinese localization. Uses React Context for auth state.

## STRUCTURE

```
mobile/
├── app/              # Expo Router routes (file-based)
│   ├── _layout.tsx   # Root: GestureHandlerRootView, SafeAreaProvider, AuthProvider, Stack
│   ├── (auth)/       # Auth group: login.tsx, register.tsx
│   ├── (tabs)/       # Tab navigation
│   │   ├── _layout.tsx    # Bottom tabs config
│   │   ├── map.tsx        # 地图 - Amap integration
│   │   ├── inventory.tsx  # 收藏
│   │   ├── achievements.tsx # 成就
│   │   ├── leaderboard.tsx # 排行
│   │   └── profile.tsx     # 我的
│   ├── item/[id].tsx # Item detail modal
│   └── profile/      # stats.tsx, settings.tsx
├── api/              # Domain API modules
│   ├── auth.ts       # Login, register, OAuth
│   ├── items.ts      # Nearby items, collect
│   └── inventory.ts  # User inventory
├── components/
│   └── AuthProvider.tsx    # React Context for auth
├── lib/
│   ├── api.ts        # Axios instance with interceptors
│   └── storage.ts    # SecureStore wrapper for tokens
├── types/            # TypeScript definitions
├── hooks/            # Empty placeholder
└── store/            # Empty placeholder
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Root navigation | `app/_layout.tsx` |
| Tab configuration | `app/(tabs)/_layout.tsx` |
| Auth flow | `app/(auth)/`, `components/AuthProvider.tsx` |
| API client | `lib/api.ts`, `api/*.ts` |
| Map screen | `app/(tabs)/map.tsx` |
| Token storage | `lib/storage.ts` |

## CONVENTIONS

- **Routing**: Expo Router file-based with route groups `(auth)`, `(tabs)`
- **Navigation**: Stack in root, bottom tabs in main screens
- **Localization**: Chinese UI text throughout (地图, 收藏, 成就, 排行, 我的)
- **Gestures**: Root wrapped with `GestureHandlerRootView`
- **API**: Axios with interceptors for JWT injection
- **Auth**: React Context (AuthProvider) with SecureStore
- **Path alias**: `@/*` → `./*`

## ANTI-PATTERNS

- **DO NOT** use `store/` directory (empty, use Context or Zustand properly)
- **DO NOT** mix React Navigation with Expo Router
- **DO NOT** hardcode API URLs - use `EXPO_PUBLIC_API_URL`
- **DO NOT** forget `GestureHandlerRootView` wrapper
- **DO NOT** use `catch (error: any)` - type properly

## KNOWN ISSUES

- **Empty directories**: `store/`, `hooks/` are placeholders
- **Dual API structure**: `lib/api.ts` + `api/` folder split concerns
- **Broken lint**: `"lint": "lint:."` will fail

## TESTING

- **Config**: `jest.config.js` with jest-expo preset
- **Setup**: `jest.setup.js` with extensive Expo mocks (location, secure-store, amap3d, router)
- **Pattern**: `__tests__/` for integration tests, snapshots used
- **Matchers**: `@testing-library/jest-native/extend-expect`