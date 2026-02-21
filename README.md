
# SubsGuard

Menedżer subskrypcji (aplikacja mobilna + web) z własnym backendem API. Projekt pozwala dodawać, edytować i usuwać subskrypcje (np. Netflix, Spotify), śledzić koszty oraz przeglądać podstawowe statystyki.

Repozytorium jest podzielone na:

- **`backend/`** – API (Express + TypeScript + MongoDB)
- **`mobile/`** – aplikacja Expo (React Native + `expo-router`) działająca na:
  - iOS/Android (Expo Go)
  - przeglądarce (React Native Web)

## Status projektu (stan obecny)

Aktualnie działają:

- **Autoryzacja**: rejestracja, logowanie, odświeżanie tokenu, pobranie profilu `/auth/me`.
- **Subskrypcje**:
  - lista subskrypcji,
  - dodawanie,
  - edycja,
  - usuwanie,
  - grupowanie po kategoriach, filtrowanie,
  - swipe-to-delete na ekranie listy.
- **Dashboard**: widok startowy z podsumowaniami (UI/UX).
- **Uruchamianie na telefonie**: skonfigurowany dynamiczny `API_URL` (LAN/Expo host) + poprawki stabilności na iOS.

W trakcie/rozwojowe:

- **Analytics** – routing i endpointy istnieją, część logiki/UI może być w trakcie rozwoju.
- **Payments** – szkic endpointów (np. checkout/portal/webhook), zależy od implementacji kontrolerów.

## Stos technologiczny

### Mobile (Expo)

- **Expo SDK**: `^54.0.33`
- **React**: `19.1.0`
- **React Native**: `0.81.5`
- **Routing**: `expo-router` (`6.0.23`)
- **HTTP**: `axios`
- **Stan aplikacji**: `zustand`
- **UI**: `react-native`, `expo-linear-gradient`, ikony `@expo/vector-icons`
- **Storage**: `@react-native-async-storage/async-storage` (oraz `expo-secure-store` w zależności od modułu)

### Backend

- **Node.js + TypeScript**
- **Express**
- **MongoDB** (`mongoose`)
- **Walidacja**: `zod`
- **Auth**: `jsonwebtoken`, `bcryptjs`
- **CORS**: `cors`

## Struktura aplikacji

### Mobile routing

`expo-router`:

- **`app/_layout.tsx`** – root stack.
- **`app/(auth)/`** – ekrany logowania/rejestracji:
  - `login`, `register`.
- **`app/(tabs)/`** – główne zakładki:
  - `index` (Dashboard),
  - `subscriptions`,
  - `analytics`,
  - `settings`.
- **`app/modals/`** – modale:
  - `add-subscription`,
  - `edit-subscription`.

### Store

- **`mobile/store/authStore.ts`**
  - `login`, `register`, `logout`, `loadUser`.
  - tokeny w `storage` (`accessToken`, `refreshToken`).
- **`mobile/store/subscriptionStore.ts`**
  - `fetchSubscriptions`, `addSubscription`, `updateSubscription`, `deleteSubscription`.
  - optymistyczne usuwanie + rollback w razie błędu.

### API client

`mobile/services/api.ts`:

- Ustawia `baseURL` do backendu:
  - preferuje `EXPO_PUBLIC_API_URL`,
  - web: `http://{window.location.hostname}:3000/api`,
  - mobile: próbuje odczytać host Expo i złożyć `http://{LAN_IP}:3000/api`.
- Interceptory:
  - dodawanie `Authorization: Bearer ...`,
  - refresh token flow dla `401`.
- Timeout:
  - web: 10s,
  - mobile: 30s.

## Backend

### Uruchamianie

Backend startuje na `0.0.0.0` (czyli jest osiągalny z telefonu w tej samej sieci LAN) i ma bazowy prefix routów `/api`.

Domyślny port: `3000` (konfigurowalny przez `PORT`).

### Endpointy

Base path: `http://localhost:3000/api`

**Health**:

- `GET /api/health`

**Auth** (`/api/auth`):

- `POST /register`
- `POST /login`
- `POST /refresh-token`
- `POST /logout`
- `GET /me` (chronione)

**Subscriptions** (`/api/subscriptions`):

- `GET /` – lista
- `GET /:id` – szczegóły
- `POST /` – utworzenie (walidacja)
- `PATCH /:id` – aktualizacja (walidacja)
- `DELETE /:id` – usunięcie
- dodatkowe: `stats`, `upcoming`, `cancel`, `pause`, `status`

Uwaga: w `backend/src/routes/subscriptions.routes.ts` jest adnotacja, że auth dla subskrypcji był tymczasowo wyłączony do testów (warto to uporządkować przed “produkcyjnym” użyciem).

**Analytics** (`/api/analytics`) oraz **Payments** (`/api/payments`) mają skonfigurowane routingi (część tras chroniona `verifyAuth`).

## Konfiguracja środowiska

### Backend `.env`

Minimalny zestaw:

```bash
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://.../...

JWT_SECRET=change-me
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=change-me
REFRESH_TOKEN_EXPIRES_IN=7d

API_URL=http://localhost:3000
```

### Mobile `.env` (opcjonalnie, polecane)

Żeby mieć 100% stabilne połączenie z backendem na telefonie ustaw:

```bash
EXPO_PUBLIC_API_URL=http://TWÓJ_LAN_IP:3000/api
```

`TWÓJ_LAN_IP` to adres komputera w sieci Wi‑Fi, np. `192.168.0.12`.

## Szybki start (development)

### 1) Backend

```bash
cd backend
npm install
npm run dev
```

Test:

- `GET http://localhost:3000/api/health`

### 2) Mobile

```bash
cd mobile
npm install
npx expo start -c
```

Uruchom:

- **iOS/Android**: Expo Go (QR)
- **Web**: `w`

## Troubleshooting

### Telefon nie łączy się z backendem

- Telefon i komputer muszą być w tej samej sieci Wi‑Fi.
- Windows Firewall może blokować port `3000`.
- Szybki test z telefonu:
  - `http://TWÓJ_LAN_IP:3000/api/health`

### Timeouty (`ECONNABORTED`)

Na mobile timeout jest większy (30s), ale jeśli nadal timeoutuje:

- sprawdź firewall,
- sprawdź czy backend nie “wisi” (Mongo/operacje),
- sprawdź logi backendu podczas requestu.

### Web: usuwanie w modalu edycji

Na web potwierdzenie usunięcia jest realizowane przez `window.confirm(...)` (zamiast `Alert.alert`), bo `Alert` na web bywa nieprzewidywalny.

## Ostatnie zmiany / historia (ważne naprawy)

Najważniejsze poprawki wykonane podczas stabilizacji projektu:

1. **Naprawa uszkodzonego `package.json` w root** – rozwiązało błędy `expo-doctor`.
2. **Ujednolicenie zależności pod Expo SDK 54** (m.in. `react-dom`, `expo-router`, peer deps).
3. **Stabilne API URL dla telefonu**:
   - dodany mechanizm `EXPO_PUBLIC_API_URL` + auto-detect hosta Expo.
4. **Refresh token flow** dostosowany do odpowiedzi `{ data, error, message }`.
5. **Naprawa crasha na iOS**: `document doesn't exist` w toastach (fallback na `Alert`).
6. **Swipe-to-delete**:
   - maskowanie i nieprześwitujące tło kart, żeby przycisk “Usuń” był widoczny dopiero po swipe.
7. **Web delete** w modalu edycji:
   - potwierdzenie usunięcia przez `window.confirm`.
8. **Backend listen host + typ portu**:
   - start na `0.0.0.0`,
   - `config.port` zawsze `number` (fix błędu TS overload).

## Licencja

MIT (zgodnie z `backend/package.json`).

