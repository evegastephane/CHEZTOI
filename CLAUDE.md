# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CheZToi** is a French-language property rental platform (immobilier) with:
- **backend/** — Go REST API (Fiber + GORM + PostgreSQL)
- **frontend_mobile/** — React Native/Expo app (Android-focused, Expo 55 / RN 0.83)
- **frontend_mobile_ios/** — React Native/Expo app (iOS-specific, Expo 54 / RN 0.81)
- **frontend_web/** — Empty placeholder (not yet implemented)

All comments and domain names are in French.

---

## Backend (Go)

### Commands
```bash
cd backend
go run main.go        # Start API server (port 8080)
go build              # Build binary
```

Requires a `.env` file at `backend/.env` with:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=...
DB_NAME=postgres
JWT_SECRET=cheztoi
PORT=8080
```

### Architecture
- **main.go** — Bootstraps Fiber app, loads `.env`, connects DB, runs GORM auto-migrations, registers CORS + logger middleware
- **config/database.go** — PostgreSQL connection via GORM
- **models/models.go** — All 9 data models (see below)
- **handlers/handlers.go** — Empty stub (not yet implemented)
- **routes/routes.go** — Empty stub (not yet implemented)
- Only implemented endpoint: `GET /health`

### Data Models
| Model | Description |
|---|---|
| `Utilisateur` | User with role (proprietaire/agent/client) |
| `Bien` | Property listing with location, photos, autonomous mode flag |
| `Photo` | Property photo (belongs to Bien) |
| `Visite` | Scheduled property viewing |
| `Paiement` | Payment record |
| `Contrat` | Lease contract |
| `Message` | Chat between users |
| `Notification` | User notifications |
| `DocumentKYC` | Identity verification documents |

UUIDs are used as primary keys throughout.

---

## Frontend Mobile (Android — primary)

### Commands
```bash
cd frontend_mobile
npm install
npm start             # Start Expo dev server
npm run android       # Run on Android emulator
npm run ios           # Run on iOS simulator
npm run web           # Run in browser
npm run lint          # Run expo lint
```

### Architecture
- Uses **Expo Router** (file-based routing) — screens live in `src/app/`
- TypeScript with strict mode, React 19, Expo 55
- Navigation: `@react-navigation` with bottom tabs
- Animations: `react-native-reanimated` v4
- Build/deploy: EAS (Expo Application Services) — see `eas.json`
- Bundle ID: `com.aloys.chezmoi`, splash color `#208AEF`

---

## Frontend Mobile iOS

### Commands
```bash
cd frontend_mobile_ios
npm install
npm start
npm run ios
npm run lint
```

Uses Expo 54 / RN 0.81 (older versions than the Android app). Screens in `app/` directory. New Architecture enabled (`newArchEnabled: true`).

---

## Key Architectural Notes

- **No authentication implemented yet** — JWT_SECRET is set but middleware is absent
- **GORM auto-migration** runs on every backend startup — no migration files
- **No frontend↔backend integration** yet — apps are scaffolded templates
- The two mobile apps are maintained as separate directories with different Expo versions