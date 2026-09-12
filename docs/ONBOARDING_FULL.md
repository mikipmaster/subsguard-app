# SubsGuard — pełna dokumentacja wdrożeniowa (onboarding)

Ten dokument jest napisany tak, aby **początkująca osoba** mogła wejść w projekt bez znajomości kontekstu.

Zakres:

- wyjaśnia czym jest projekt i jak działa,
- opisuje technologie (co to jest i po co jest),
- pokazuje jak uruchomić projekt lokalnie,
- tłumaczy architekturę i przepływy danych,
- zawiera przewodnik „plik po pliku” (backend + mobile).

Uwaga: to nie jest „spis plików”. W przewodniku „plik po pliku” przy każdym ważnym pliku masz:

- **co to jest** (rola pliku),
- **po co istnieje** (jaki problem rozwiązuje),
- **najważniejsze elementy** (funkcje/endpointy/typy),
- **typowy przepływ** (kto to wywołuje i kiedy),
- **na co uważać** (pułapki, typowe błędy).

---

## 0. Słowniczek pojęć (żeby czytać dokument bez googlowania)

### 0.1 „Protected endpoint” / „chroniony endpoint”

To endpoint, do którego **nie można wejść bez zalogowania**.

W praktyce w tym projekcie oznacza to, że route ma podpięty middleware `verifyAuth` i wymaga nagłówka:

```http
Authorization: Bearer <accessToken>
```

Jeżeli tokena nie ma lub jest niepoprawny, backend zwraca `401`.

Przykład z kodu:

- `backend/src/routes/analytics.routes.ts` robi `router.use(verifyAuth)`, więc **każdy** endpoint w analytics jest chroniony.

### 0.2 „Placeholder”

„Placeholder” to fragment, który jest świadomie **niedokończony**.

W tym projekcie np. `payments` to placeholder pod Stripe — endpointy istnieją, ale kontroler zwraca informację „to be implemented” zamiast realnej integracji. To jest normalne w rosnącym projekcie: najpierw szkic struktury, potem dopiero implementacja.

### 0.3 „Controller”, „Service”, „Model”, „Route”

- **Route**: mapuje URL + metodę HTTP na konkretną funkcję kontrolera.
- **Controller**: obsługuje request/response (czyta `req`, woła serwis, zwraca JSON).
- **Service**: logika biznesowa (np. liczenie dat, aktualizacja pól), żeby kontroler był prosty.
- **Model**: schemat danych w MongoDB (Mongoose) + typy i indexy.

## 1. Co to jest SubsGuard

**SubsGuard** to aplikacja do zarządzania subskrypcjami (np. Netflix, Spotify):

- dodawanie/edycja/usuwanie subskrypcji,
- liczenie kosztów miesięcznych i rocznych,
- statystyki (np. per kategoria),
- powiadomienia push:
  - cykliczne (np. 3 dni przed odnowieniem),
  - jednorazowe (dokładna data i godzina).

Projekt składa się z:

- `backend/` — API (Node.js + Express + TypeScript + MongoDB/Mongoose)
- `mobile/` — aplikacja Expo (React Native + `expo-router`) uruchamiana na:
  - iOS / Android (Expo Go)
  - Web (React Native Web)

---

## 2. Wysoki poziom działania (mentalny model)

Wyobraź to sobie jako 3 warstwy:

1) **UI (mobile)**
- ekrany i modale, gdzie użytkownik wpisuje dane

2) **Stan aplikacji (mobile, Zustand)**
- store przechowuje aktualnego usera i subskrypcje
- store wywołuje API i aktualizuje stan

3) **Backend (Express + MongoDB)**
- API waliduje dane (Zod) i zapisuje je do MongoDB
- backend cyklicznie (co minutę) uruchamia „sweep” powiadomień i wysyła push przez Expo

Najważniejsza zasada:

- mobile nie wysyła powiadomień bezpośrednio — tylko zapisuje reguły (`customNotifications`, `reminders`) w subskrypcji,
- backend czyta te reguły i wysyła push.

Druga ważna zasada:

- w mobile większość logiki „aplikacyjnej” nie siedzi w ekranach, tylko w **store** (`authStore`, `subscriptionStore`) i w **API kliencie** (`services/api.ts`). Ekran to głównie UI + wywołanie akcji.

---

## 3. Technologie (co to jest i po co tego używamy)

### 3.1 Backend

Backend jest w `backend/`.

- **Node.js** — środowisko uruchomieniowe JavaScript po stronie serwera.
- **TypeScript** — JS + typy.
  - Po co: mniej błędów przy refaktorach, lepsza czytelność kontraktów danych.
- **Express** — framework HTTP.
  - Po co: routing, middleware, obsługa request/response.
- **MongoDB** — baza dokumentowa.
  - Po co: proste przechowywanie dokumentów subskrypcji i użytkowników.
- **Mongoose** — ODM dla MongoDB.
  - Po co: schematy modeli, walidacje, indexy.
- **zod** — walidator i parser danych.
  - Po co: walidacja body requestów oraz „sanityzacja” (przepuszczamy tylko dozwolone pola).
- **jsonwebtoken** — JWT.
  - Po co: access token dla autoryzacji.
- **bcryptjs** — hashowanie haseł.
  - Po co: nigdy nie zapisujemy plain-text haseł.
- **cors** — CORS.
  - Po co: umożliwia komunikację z appką w dev (inne hosty/porty).

### 3.2 Mobile

Mobile jest w `mobile/`.

- **Expo** — platforma do szybkiego developmentu RN.
  - Po co: szybkie uruchomienie na telefonie, mniej konfiguracji natywnej.
- **React Native** — UI cross-platform.
- **expo-router** — routing plikowy.
  - Po co: prosta nawigacja oparta o foldery `app/(tabs)`, `app/(auth)`, `app/modals`.
- **Zustand** — state management.
  - Po co: proste store bez boilerplate.
- **Axios** — HTTP client.
  - Po co: interceptory (Bearer token, refresh flow), spójna obsługa błędów.
- **expo-notifications** — push w środowisku Expo.
  - Po co: pobranie Expo push tokenu i obsługa powiadomień.

---

## 4. Jak uruchomić projekt (dev)

Masz też plik `instrukcja_odpalania.md`.

### 4.1 Wymagania

- Node.js (LTS)
- npm
- MongoDB (lokalnie lub Atlas)
- Telefon w tej samej sieci Wi‑Fi co komputer (dla testów w Expo Go)

### 4.2 Backend

1) Wejdź do `backend/`.
2) Zainstaluj zależności.
3) Ustaw `.env`.
4) Uruchom.

Przykład:

```bash
cd backend
npm install
npm run dev
```

Backend działa pod:

- `http://localhost:3000/api`

Jak sprawdzić, że backend działa:

- wejdź w przeglądarce na `GET http://localhost:3000/api/health`
- powinieneś dostać JSON ze statusem `OK`

Ważne env:

- `MONGODB_URI`
- `PORT` (domyślnie 3000)

### 4.3 Mobile

```bash
cd mobile
npm install
npx expo start -c
```

Jeżeli telefon nie łączy się z backendem:

- ustaw `EXPO_PUBLIC_API_URL` (np. `http://192.168.0.12:3000/api`).

Jak sprawdzić, że mobile widzi backend:

- zaloguj się
- jeśli logowanie działa, to znaczy że:
  - API URL jest poprawny,
  - backend działa,
  - CORS i firewall nie blokują komunikacji.

---

## 5. API i autoryzacja (jak to jest poskładane)

### 5.1 Format odpowiedzi

W większości endpointów backend zwraca obiekt:

- `data` — payload
- `error` — obiekt `{ message, details? }`
- `message` — string

Dlaczego tak:

- mobile może zawsze szukać błędu w tym samym miejscu (`error.message`),
- łatwiej jest ujednolicić obsługę błędów na frontendzie.

### 5.2 JWT

- mobile zapisuje `accessToken` i `refreshToken` w storage,
- przy requestach (poza publicznymi auth) axios dodaje `Authorization: Bearer ...`,
- gdy backend zwróci `401`, klient próbuje odświeżyć token przez `/auth/refresh-token`.

Ważne:

- `accessToken` jest krótkotrwały,
- `refreshToken` jest dłuższy i służy do odświeżania,
- refresh token jest też trzymany w bazie (model `RefreshToken`), więc można go revokować.

### 5.3 Mini-ściąga endpointów (najczęściej używane)

Poniżej masz „80% projektu w 20% tabeli” — najważniejsze endpointy, z informacją:

- czy wymagają logowania,
- jakie dane wchodzą,
- co zwykle wychodzi.

Uwaga: pełna ścieżka ma prefix `/api`.

| Metoda | URL | Auth? | Body (skrót) | Zwraca (skrót) |
|---|---|---:|---|---|
| POST | `/auth/register` | nie | `{ name, email, password }` | `{ user, accessToken, refreshToken }` |
| POST | `/auth/login` | nie | `{ email, password }` | `{ user, accessToken, refreshToken }` |
| POST | `/auth/refresh-token` | nie | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| GET | `/auth/me` | tak | — | `user` |
| POST | `/users/push-token` | tak | `{ pushToken }` | `{ pushToken }` |
| POST | `/notifications/test` | tak | — | `{ ok: true, response }` |
| GET | `/subscriptions` | tak | — | `Subscription[]` |
| POST | `/subscriptions` | tak | `Subscription payload` | `Subscription` |
| PATCH | `/subscriptions/:id` | tak | `Partial<Subscription>` | `Subscription` |
| DELETE | `/subscriptions/:id` | tak | — | `null` |
| GET | `/subscriptions/stats` | tak | — | `{ totalMonthly, ... }` |
| GET | `/analytics/summary` | tak | — | `{ totalMonthly, ... }` |

#### Przykład: login (request/response)

Request:

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "a@a.pl", "password": "12345678" }
```

Response (skrót):

```json
{
  "data": {
    "user": { "_id": "...", "email": "a@a.pl", "name": "..." },
    "accessToken": "...",
    "refreshToken": "..."
  },
  "error": null,
  "message": "Login successful"
}
```

#### Przykład: tworzenie subskrypcji z jednorazowym powiadomieniem

Request (koncept):

```http
POST /api/subscriptions
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "Netflix",
  "category": "STREAMING",
  "price": 49.99,
  "currency": "PLN",
  "billingCycle": "MONTHLY",
  "customNotifications": [
    { "notifyAt": "2026-06-02T20:00:00.000Z", "note": "Zapłacić", "enabled": true }
  ]
}
```

Response (skrót):

```json
{
  "data": {
    "_id": "...",
    "name": "Netflix",
    "nextBillingDate": "...",
    "customNotifications": [ { "notifyAt": "..." } ]
  },
  "error": null,
  "message": "Subscription created successfully"
}
```

---

## 6. Powiadomienia push (jak działa mechanizm)

### 6.1 Rejestracja tokenu

- mobile pobiera Expo push token (`expo-notifications`)
- zapisuje go w backendzie: `POST /api/users/push-token`

Co to znaczy „Expo push token”:

- to identyfikator urządzenia w infrastrukturze Expo,
- backend wysyła push na `https://exp.host/--/api/v2/push/send`, a Expo przekazuje go dalej na telefon.

### 6.2 Sweep na backendzie

Backend co minutę uruchamia `runPushNotificationsSweep()`.

- buduje okno czasowe `now ± 5 minut`
- bierze wszystkie aktywne subskrypcje
- wylicza, czy dana reguła powinna wpaść w okno
- deduplikuje wysyłki przez `Notification.key`
- wysyła push przez Expo endpoint

Dlaczego jest okno `± 5 minut`:

- serwer nie jest real-time co do sekundy (GC, opóźnienia event loop),
- setInterval może „przeskoczyć” kilka sekund,
- okno daje odporność na takie przesunięcia.

Co jest „deduplikacją”:

- jeśli sweep odpali się 2 razy i oba razy uzna, że powiadomienie jest „w oknie”, to bez deduplikacji wysłałby 2 push.
- w tym projekcie deduplikacja jest robiona przez **unikalny index** w `Notification` i klucz `key`.

---

## 7. Dane i modele (MongoDB)

### 7.1 `Subscription`

To jest najważniejszy model projektu — opisuje pojedynczą subskrypcję.

Główne pola (z uproszczonym wytłumaczeniem):

- `userId` — właściciel subskrypcji (string)
- `name`, `category`, `price`, `currency`, `billingCycle`
- daty:
  - `startDate` (anchor)
  - `startAt?` (opcjonalny dokładny start)
  - `nextBillingDate`
- powiadomienia:
  - `reminders[]` (cykliczne)
  - `customNotifications[]` (jednorazowe)

Jak myśleć o datach:

- `startDate` to „kotwica” do obliczeń.
- `startAt` to opcjonalna precyzyjna data startu (data+godzina); jeśli ustawiona, staje się kotwicą.
- `nextBillingDate` to **kolejna** data odnowienia, którą backend wylicza.

### 7.2 `User`

Model użytkownika. Najważniejsze pola:

- `email`, `password` (hash), `name`
- `pushToken?` (Expo push token) — potrzebny do wysyłania push
- `settings` — ustawienia użytkownika (np. domyślna waluta, theme, itp.)

### 7.3 `Notification`

Model do:

- deduplikacji wysyłek
- logu statusów (`PENDING/SENT/FAILED`)

Jak to działa w praktyce:

- zanim backend wyśle push, najpierw robi `Notification.create({ key: ... })`
- jeśli index mówi, że taki `key` już istnieje, backend wie że to powiadomienie już było i przerywa.

### 7.4 `RefreshToken`

- token refresh (przechowywany w bazie)
- ma TTL index `expiresAt` (sam się usuwa po wygaśnięciu)

Po co refresh token jest w bazie:

- można go unieważnić (logout),
- można wykrywać wygasłe tokeny,
- można rotować tokeny (zwiększa bezpieczeństwo).

---

## 8. Przewodnik po plikach (backend)

W tej sekcji masz szczegółowe opisy „co robi dany plik”.

Wskazówka: gdy szukasz „gdzie jest logika X”, zwykle:

- routing jest w `routes/*`
- kontroler w `controllers/*`
- logika biznesowa w `services/*`
- schemat danych w `models/*`

### 8.1 Entry point

#### `backend/src/server.ts`

To jest **główny plik startowy backendu**.

Co robi krok po kroku:

1) `dotenv.config()` — wczytuje zmienne środowiskowe z `.env`.
2) Tworzy aplikację Express (`const app = express()`).
3) Podpina middleware:
   - `cors(...)` — pozwala na requesty z appki w dev,
   - `express.json()` — parsuje JSON body,
   - `express.urlencoded(...)` — parsuje form-encoded.
4) Podpina routing: `app.use('/api', routes)`.
5) Podpina globalny error handler: `app.use(errorHandler)`.
6) Łączy się z bazą przez `connectDatabase()`.
7) Ustawia `setInterval`, który uruchamia sweep powiadomień co minutę.
8) Startuje serwer na `0.0.0.0`, żeby telefon w LAN też mógł się połączyć.

Najważniejsze „dlaczego”:

- `0.0.0.0` w dev rozwiązuje problem: telefon nie zobaczy backendu, jeśli backend nasłuchuje tylko na `localhost`.

### 8.2 Konfiguracja

#### `backend/src/config/app.config.ts`

To jest mały moduł, który centralizuje ustawienia z `.env`.

Ważne pola:

- `port` — port serwera (z parsowaniem na `number`).
- `nodeEnv` — tryb (development/production).
- `apiUrl` — adres API używany np. w logach.
- `allowedOrigins` — lista originów (obecnie CORS w `server.ts` jest liberalny, ale ten config pozwala to kiedyś uporządkować).

#### `backend/src/config/db.config.ts`

Ten plik odpowiada wyłącznie za połączenie z MongoDB.

Kluczowe zachowania:

- bierze `MONGODB_URI` z env, a jeśli go nie ma, używa lokalnego: `mongodb://localhost:27017/subsguard`.
- wymusza `dbName: 'subsguard'`, żeby uniknąć sytuacji, że Atlas podłączy Cię do „losowej” bazy.
- w razie błędu kończy proces (`process.exit(1)`), bo bez bazy backend nie ma sensu działać.

### 8.3 Middleware

#### `backend/src/middleware/auth.middleware.ts`

To jest „bramka” autoryzacji.

Co robi `verifyAuth`:

- czyta `Authorization` z nagłówków.
- sprawdza format `Bearer <token>`.
- weryfikuje token przez `verifyAccessToken`.
- jeśli token jest OK, zapisuje payload w `req.user`.

Co to daje:

- każdy chroniony endpoint ma łatwy dostęp do `req.user.userId`.
- subskrypcje są przypisywane do właściwego użytkownika.

#### `backend/src/middleware/validate.middleware.ts`

To jest walidacja wejścia na API.

Najważniejsze: middleware nie tylko sprawdza, ale też **parsuje i podmienia** `req.body`.

Dlaczego to ważne:

- w UI czasem istnieją pola „pomocnicze” (drafty, toggles), których nie chcemy w bazie.
- Zod pozwala wprost zdefiniować, które pola są dozwolone.

#### `backend/src/middleware/errorHandler.ts`

Globalna obsługa błędów.

Co robi:

- loguje błąd w konsoli,
- wybiera `statusCode` (domyślnie 500),
- zwraca JSON w standardowym formacie,
- w `development` dokłada stack trace.

### 8.4 Utils

#### `backend/src/utils/jwt.util.ts`

To są funkcje kryptograficzne dla logowania.

Co tu zwykle jest:

- `generateAccessToken(payload)` — podpisanie JWT.
- `verifyAccessToken(token)` — weryfikacja JWT i odzyskanie `userId/email/tier`.
- `generateRefreshToken()` — losowy string.
- `getRefreshTokenExpiry()` — data wygaśnięcia refresh tokenu.

To jest fundament middleware `verifyAuth`.

#### `backend/src/utils/date.util.ts`

To jest „mózg” logiki dat i kosztów.

Najważniejsze funkcje (konceptualnie):

- `calculateNextBillingDate(startDate, billingCycle, now?)` — liczy kolejną datę odnowienia.
- `calculateUpcomingBillingDate(anchor, billingCycle, now)` — liczy „nadchodzącą” datę przy zmianie cyklu.
- `normalizeMonthlyCost(price, cycle)` — przelicza cenę z cyklu na miesięczny ekwiwalent.

Poniżej jest opis bardziej „krok po kroku”, bazujący na aktualnej implementacji.

##### `addBillingCycle(date, billingCycle)` (wewnętrzne)

To helper, który bierze `Date` i dodaje do niego:

- `DAILY` → +1 dzień
- `WEEKLY` → +7 dni
- `MONTHLY` → +1 miesiąc
- `QUARTERLY` → +3 miesiące
- `YEARLY` → +1 rok

To jest podstawowy klocek dla pozostałych funkcji.

##### `calculateNextBillingDate(startDate, billingCycle, now = new Date())`

Cel: wyliczyć **pierwszą datę odnowienia po starcie**, a jeśli już minęła — przeskoczyć do pierwszej daty w przyszłości.

Jak działa:

1) `next = addBillingCycle(startDate, billingCycle)`
2) dopóki `next <= now`, dodaje kolejny cykl
3) zwraca `next`

Przykłady (opisowo):

- jeśli `startDate = 2026-06-01 10:00`, `billingCycle = MONTHLY`, a `now = 2026-06-02`:
  - `next = 2026-07-01 10:00`.

- jeśli `startDate = 2026-01-01`, `billingCycle = MONTHLY`, a `now = 2026-06-02`:
  - pętla przeskoczy kolejne miesiące aż do `2026-07-01`.

Ważna konsekwencja:

- ta funkcja zawsze zwróci datę **w przyszłości** względem `now`.

##### `calculateUpcomingBillingDate(anchorDate, billingCycle, now = new Date())`

Cel: policzyć „najbliższą przyszłą” datę odnowienia, ale startując od `anchorDate`.

Różnica względem `calculateNextBillingDate`:

- `calculateNextBillingDate` zaczyna od `startDate` i od razu robi `+1 cykl`.
- `calculateUpcomingBillingDate` zaczyna od `anchorDate` i dopiero gdy `anchorDate <= now`, przesuwa w przód.

To jest używane np. przy zmianie `billingCycle`, żeby zachować sensowną datę „od teraz”.

##### `normalizeMonthlyCost(price, billingCycle)`

Cel: sprowadzić każdy cykl do miesięcznego ekwiwalentu.

Aktualna logika (mnożnik):

- `MONTHLY` → `price * 1`
- `YEARLY` → `price * (1/12)`
- `QUARTERLY` → `price * (1/3)`
- `WEEKLY` → `price * (30/7)`
- `DAILY` → `price * 30`

Przykłady:

- `price=120`, `YEARLY` → `10` miesięcznie
- `price=30`, `WEEKLY` → ok. `128.57` miesięcznie

##### `getDaysUntil(date)`

Zwraca liczbę dni (zaokrągloną w górę) do wskazanej daty.

Użyteczne do UI typu „za ile dni odnowienie?”.

#### `backend/src/utils/currency.util.ts`

- pomocnicze funkcje dla walut (np. normalizacja kodu)

### 8.5 Modele

#### `backend/src/models/User.model.ts`

Model użytkownika (Mongoose).

Ważne rzeczy w tym schemacie:

- `email` ma walidację regex i jest `unique`.
- `password` jest przechowywany jako hash.
- `toJSON.transform` usuwa pola wrażliwe przy zwracaniu użytkownika na API.
- `pushToken` jest przechowywany jako string i używany do powiadomień.

#### `backend/src/models/Subscription.model.ts`

Model subskrypcji.

Ważne szczegóły:

- `userId` jest stringiem (nie ObjectId) — to działa, ale trzeba o tym pamiętać w miejscach, gdzie robisz `User.findById(sub.userId)`.
- `reminders` i `customNotifications` to tablice obiektów, które backend później interpretuje w sweep.
- indexy:
  - `{ userId, status }` i `{ userId, nextBillingDate }` przyspieszają listy i statystyki.
- virtual `monthlyCost` to wygodny skrót do przeliczenia ceny na „per miesiąc”.

#### `backend/src/models/Notification.model.ts`

Model logu powiadomień.

Najważniejszy mechanizm:

- unikalny index `{ subscriptionId, type, key }` zapewnia, że to samo powiadomienie nie zostanie „zarejestrowane” 2 razy.
- statusy:
  - `PENDING` — utworzone, ale jeszcze nie wysłane
  - `SENT` — wysłane
  - `FAILED` — próba wysyłki się nie udała

#### `backend/src/models/RefreshToken.model.ts`

- refresh token w DB
- TTL index na `expiresAt`

### 8.6 Services

#### `backend/src/services/auth.service.ts`

To jest „logika logowania” (biznesowa) poza kontrolerem.

Najważniejsze funkcje:

- `registerUser(email, password, name)`:
  - sprawdza czy user istnieje,
  - hashuje hasło,
  - tworzy usera,
  - generuje accessToken + refreshToken,
  - zapisuje refresh token w DB.
- `loginUser(email, password)`:
  - sprawdza dane,
  - aktualizuje `lastLoginAt`,
  - generuje nowe tokeny i zapisuje refresh.
- `refreshAccessToken(refreshToken)`:
  - weryfikuje refresh w DB,
  - jeśli OK → generuje nowy access,
  - rotuje refresh token (stary revokuje, nowy zapisuje).
- `logoutUser(refreshToken)`:
  - ustawia `revokedAt` na refresh tokenie.

Dlaczego to jest w serwisie:

- kontroler ma tylko „przełożyć” HTTP na wywołanie logiki,
- serwis jest łatwiejszy do testowania i refaktoru.

#### `backend/src/services/subscription.service.ts`

To jest centrum logiki subskrypcji.

Co robi `createSubscription(userId, data)`:

- parsuje `startAt` jeśli jest,
- wybiera `startDate` (startAt > startDate > now),
- liczy `nextBillingDate`,
- zapisuje subskrypcję w DB.

Co robi `updateSubscription(id, userId, data)`:

- pobiera subskrypcję (zabezpieczenie, że należy do usera),
- `Object.assign(subscription, data)` — wgrywa pola,
- jeśli zmienił się `startAt` lub `billingCycle`, przelicza `nextBillingDate`.

Na co uważać:

- dlatego ważna jest walidacja i sanityzacja payloadu (Zod), bo `Object.assign` potrafi nadpisać wszystko.

#### `backend/src/services/pushNotifications.service.ts`

To jest backendowy „scheduler” powiadomień.

Ważne elementy:

- `buildReminderDate(nextBillingDate, daysBefore, time)`:
  - bierze `nextBillingDate`, cofa o `daysBefore`, ustawia godzinę `time`.
- `sendExpoPush(token, title, body, data)`:
  - wysyła POST do Expo.

`runPushNotificationsSweep(now)`:

1) Ustala okno czasowe `windowStart/windowEnd`.
2) Pobiera aktywne subskrypcje.
3) Dla każdej:
   - pobiera usera i jego `pushToken`.
   - sprawdza reminders i customNotifications.
4) Dla każdej reguły w oknie:
   - próbuje utworzyć `Notification` (deduplikacja),
   - jeśli się uda → wysyła push,
   - aktualizuje `Notification` na `SENT` lub `FAILED`.

To jest powód, dla którego test push może działać, a powiadomienia z subskrypcji nie: sweep zależy od tego, czy `sub.userId` wskazuje usera z tokenem.

### 8.7 Controllers

#### `backend/src/controllers/auth.controller.ts`

Ten kontroler jest „adapterem HTTP” do logiki w `auth.service.ts`. To znaczy:

- kontroler czyta dane z `req.body`/`req.user`,
- woła funkcję serwisu,
- zwraca JSON w standardowym formacie `{ data, error, message }`.

Endpointy (pełne ścieżki to `/api/auth/...`):

1) `POST /api/auth/register`

- **Po co**: założenie konta.
- **Walidacja**: `registerSchema` (`validators/auth.validator.ts`).
- **Body**:
  - `name: string`
  - `email: string`
  - `password: string`
- **Co się dzieje**:
  - serwis sprawdza czy email już istnieje,
  - hashuje hasło,
  - tworzy usera,
  - generuje `accessToken` i `refreshToken`.
- **Odpowiedź**: `data: { user, accessToken, refreshToken }`.

2) `POST /api/auth/login`

- **Po co**: logowanie.
- **Walidacja**: `loginSchema`.
- **Body**:
  - `email: string`
  - `password: string`
- **Co się dzieje**:
  - serwis porównuje hasło przez bcrypt,
  - aktualizuje `lastLoginAt`,
  - generuje nowe tokeny.

3) `POST /api/auth/refresh-token`

- **Po co**: odświeżenie access tokenu, gdy API zwróci `401`.
- **Walidacja**: `refreshTokenSchema`.
- **Body**:
  - `refreshToken: string`
- **Co się dzieje**:
  - serwis szuka refresh tokenu w DB,
  - jeśli jest OK → generuje nowy access,
  - rotuje refresh token (stary revokuje, nowy zapisuje).

4) `POST /api/auth/logout`

- **Po co**: wylogowanie.
- **Body**:
  - `refreshToken: string`
- **Co się dzieje**:
  - serwis zaznacza refresh token jako revokowany.

5) `GET /api/auth/me` (chronione)

- **Po co**: pobranie profilu aktualnie zalogowanego usera (np. na start aplikacji).
- **Auth**: wymagany `Authorization: Bearer <accessToken>`.
- **Co się dzieje**:
  - middleware `verifyAuth` wstawia `req.user.userId`,
  - kontroler pobiera usera po ID,
  - zwraca obiekt usera (bez `password`).

Typowe błędy i komunikaty:

- `401 Invalid credentials` — login.
- `400 User already exists` — register.
- `401 Invalid or expired refresh token` — refresh.
- `401 No token provided` / `Invalid or expired token` — chronione endpointy.

#### `backend/src/controllers/subscriptions.controller.ts`

Ten kontroler obsługuje cały CRUD subskrypcji. Jest powiązany z:

- `routes/subscriptions.routes.ts` (routing + walidacja),
- `services/subscription.service.ts` (logika biznesowa i daty),
- `models/Subscription.model.ts` (schema w MongoDB).

Wszystkie endpointy w `/api/subscriptions` są chronione (router używa `verifyAuth`), więc w praktyce:

- kontroler bierze `userId = req.user.userId`,
- i wszystkie operacje filtrują po `userId`.

Endpointy:

1) `GET /api/subscriptions`

- **Po co**: lista subskrypcji usera.
- **Sortowanie**: po `nextBillingDate` rosnąco.
- **Uwaga**: filtruje `status != EXPIRED`.

2) `GET /api/subscriptions/:id`

- **Po co**: szczegóły jednej subskrypcji.
- **Bezpieczeństwo**: szuka po `_id` i `userId` (nie da się pobrać cudzej subskrypcji).

3) `POST /api/subscriptions`

- **Po co**: tworzenie subskrypcji.
- **Walidacja**: `createSubscriptionSchema`.
- **Najważniejsze w logice**:
  - jeśli podasz `startAt` → staje się kotwicą,
  - backend wylicza `nextBillingDate`.
- **Powiadomienia**:
  - możesz wysłać `reminders[]` i/lub `customNotifications[]`.

4) `PATCH /api/subscriptions/:id`

- **Po co**: edycja.
- **Walidacja**: `updateSubscriptionSchema`.
- **Najważniejsze w logice**:
  - `Object.assign(subscription, data)` w serwisie nadpisuje pola,
  - jeśli zmieni się `startAt`/`billingCycle`, serwis przelicza `nextBillingDate`.

5) `DELETE /api/subscriptions/:id`

- **Po co**: usuwanie.
- **Szczegół**: w mobile store jest „optymistyczne usuwanie” (UI usuwa od razu, rollback na błędzie).

Endpointy „statusowe”:

- `POST /api/subscriptions/:id/cancel` — ustawia status `CANCELLED` i `cancelledAt`.
- `POST /api/subscriptions/:id/pause` — ustawia status `PAUSED` i `pausedAt`.
- `PATCH /api/subscriptions/:id/status` — ręczna zmiana statusu.

Statystyki:

- `GET /api/subscriptions/stats` — agregaty per user (totalMonthly/totalYearly, breakdown kategorii, cheapest, mostExpensive).
- `GET /api/subscriptions/upcoming?days=30` — subskrypcje z `nextBillingDate` w najbliższych N dniach.

Typowe błędy:

- `404 Subscription not found` — gdy ID nie istnieje lub należy do innego usera.
- `400 Validation failed` — payload nie przechodzi Zod.

#### `backend/src/controllers/analytics.controller.ts`

Analytics to „warstwa raportowa” ponad subskrypcjami.

Ważne: analytics nie ma osobnej kolekcji w DB — liczy wszystko na podstawie `Subscription.find({ userId, status: 'ACTIVE' })`.

Endpointy (wszystkie chronione):

1) `GET /api/analytics/summary`

- zwraca:
  - `totalMonthly` (suma miesięczna po normalizacji cyklu),
  - `totalYearly` (miesięczne * 12),
  - `activeSubscriptions`,
  - `avgPerSubscription`,
  - `categoryBreakdown`.

2) `GET /api/analytics/trends?months=6`

- tworzy listę miesięcy `YYYY-MM` wstecz,
- dla każdego miesiąca liczy, które subskrypcje już „istniały” (`startDate <= pierwszy dzień miesiąca`),
- zwraca tablicę `{ month, total }`.

3) `GET /api/analytics/upcoming?days=30`

- zwraca aktywne subskrypcje z `nextBillingDate` w oknie `now..now+days`.

4) `GET /api/analytics/spending-by-category`

- liczy miesięczny koszt per kategoria,
- zwraca posortowaną listę (malejąco po koszcie).

5) `GET /api/analytics/upcoming-payments`

- podobne do `upcoming`, ale mapuje wynik do prostszego formatu,
- przydatne pod UI listy „nadchodzących płatności”.

Na co uważać:

- to są obliczenia „w locie” — przy bardzo dużej liczbie subskrypcji trzeba by dodać cache/agregacje.

#### `backend/src/controllers/users.controller.ts`

Ten kontroler ma jeden cel: zapisać token push urządzenia do użytkownika.

`POST /api/users/push-token` (chronione):

- **Body**:
  - `pushToken: string | null`
- **Zachowanie**:
  - jeśli wyślesz `null` → backend usuwa token (np. wyłączenie powiadomień).
  - token jest `trim()` i zapisywany do `User.pushToken`.

Po co to istnieje:

- sweep powiadomień musi wiedzieć, na jakie urządzenie wysyłać.

#### `backend/src/controllers/notifications.controller.ts`

Ten kontroler służy do **diagnostyki** push.

`POST /api/notifications/test` (chronione):

- bierze `req.user.userId`,
- pobiera usera,
- jeśli user nie ma `pushToken` → zwraca 400 z instrukcją, żeby zarejestrować token w ustawieniach,
- jeśli ma → wysyła push przez Expo.

Dlaczego test push jest ważny:

- potwierdza, że token jest zapisany,
- potwierdza, że backend ma internet i może dobić do Expo,
- pomaga odróżnić błąd „token nie zapisany / sweep nie działa” od błędu „Expo / permission / urządzenie”.

#### `backend/src/controllers/payments.controller.ts`

Ten kontroler jest **placeholderem** pod Stripe.

Co to oznacza w praktyce:

- endpointy istnieją, żeby móc zbudować UI i routing,
- ale nie ma jeszcze logiki Stripe (klucze API, checkout, webhook verification).

Jakie endpointy są planowane (po nazwach funkcji):

- `createCheckout` — tworzenie sesji płatności (Stripe Checkout)
- `handleWebhook` — odbiór webhooków od Stripe
- `getPortal` — link do portalu klienta (zarządzanie subskrypcją)

### 8.8 Routes

#### `backend/src/routes/index.ts`

- agreguje routery:
  - `/auth`, `/users`, `/notifications`, `/subscriptions`, `/analytics`, `/payments`
- `/health`
- endpoint debug `/debug/subscriptions-count`

Wskazówka dla początkujących:

- jeśli nie wiesz „skąd jest dany endpoint”, zacznij od `routes/index.ts`, bo to jest główna mapa.

#### `backend/src/routes/auth.routes.ts`

- public: `/register`, `/login`, `/refresh-token`, `/logout`
- protected: `/me`

Co to znaczy „public” tutaj:

- endpoint nie wymaga tokenu, bo dopiero służy do zalogowania.

Co to znaczy „protected”:

- endpoint wymaga `verifyAuth` (token z mobile).

#### `backend/src/routes/subscriptions.routes.ts`

- wszystkie trasy chronione `verifyAuth`
- create/update walidowane Zod

Ważne: właśnie tutaj kontrolujesz, które endpointy są walidowane.

- `POST /` ma `validateRequest(createSubscriptionSchema)`
- `PATCH /:id` ma `validateRequest(updateSubscriptionSchema)`

Gdy dodasz nowe pola do modelu subskrypcji, musisz zwykle zaktualizować:

1) `Subscription.model.ts`
2) `validators/subscription.validator.ts`
3) UI w mobile (add/edit)

#### `backend/src/routes/users.routes.ts`

- `/push-token` (protected)

Pełny endpoint:

- `POST /api/users/push-token`

To jest ważny element łańcucha push.

#### `backend/src/routes/notifications.routes.ts`

- `/test` (protected)

Pełny endpoint:

- `POST /api/notifications/test`

#### `backend/src/routes/analytics.routes.ts`

Wszystkie endpointy są **chronione** (`router.use(verifyAuth)`), czyli musisz być zalogowany.

Endpointy:

- `GET /api/analytics/summary` — zwraca sumy miesięczne/roczne i breakdown kategorii.
- `GET /api/analytics/trends?months=6` — zwraca listę miesięcy z sumą.
- `GET /api/analytics/upcoming?days=30` — zwraca subskrypcje z `nextBillingDate` w najbliższym okresie.
- `GET /api/analytics/spending-by-category` — ranking kategorii.
- `GET /api/analytics/upcoming-payments` — uproszczony format „nadchodzących płatności”.

#### `backend/src/routes/payments.routes.ts`

To jest routing dla płatności.

Co znaczy „część protected”:

- `POST /create-checkout` i `GET /portal` wymagają `verifyAuth` (tylko zalogowany user).
- `POST /webhook` nie jest chroniony tokenem użytkownika, bo webhook przychodzi z serwera Stripe.

Aktualnie kontroler zwraca placeholderowe odpowiedzi — dopóki nie ma Stripe, te endpointy są „szkieletem”.

### 8.9 Seed

#### `backend/src/seed.ts`

- skrypt seedujący bazę (dev)

Jak go uruchomić:

```bash
cd backend
npm run seed
```

Po co:

- żeby szybko napełnić bazę danymi w dev.

---

### 8.10 Validators (Zod)

W tym projekcie walidacja requestów jest bardzo ważna, bo w serwisie subskrypcji jest `Object.assign(subscription, data)`.

#### `backend/src/validators/auth.validator.ts`

- `registerSchema` — waliduje `name/email/password`.
- `loginSchema` — waliduje `email/password`.
- `refreshTokenSchema` — waliduje `refreshToken`.

#### `backend/src/validators/subscription.validator.ts`

To jest kontrakt API dla subskrypcji. Przykładowo pilnuje:

- typów pól (`price` jako number, `billingCycle` jako enum),
- formatów (`time` jako `HH:MM`),
- struktur tablic (`reminders[]`, `customNotifications[]`).

Jeżeli UI wysyła pole, które nie jest w schemacie — middleware `validateRequest` usunie je z `req.body`.

---

## 9. Przewodnik po plikach (mobile)

### 9.1 Routing (expo-router)

#### `mobile/app/_layout.tsx`

To jest root layout aplikacji (expo-router).

Jak to działa:

- Expo-router mapuje strukturę folderów `app/` na ścieżki.
- `Stack` to kontener na ekrany.
- Tutaj deklarujemy, że istnieją grupy: `index`, `(auth)`, `(tabs)`, `modals`.

Po co grupy:

- `(auth)` trzyma ekrany logowania
- `(tabs)` to główna aplikacja po zalogowaniu
- `modals` to formularze „nad” tabami

#### `mobile/app/index.tsx`

To jest „boot screen”. Nie pokazuje UI aplikacji, tylko:

1) Hydratuje ustawienia (`loadSettings`) — np. waluta/motyw.
2) Próbuje odtworzyć sesję (`loadUser`).
3) Robi redirect.

Ważna rzecz dla początkujących:

- redirect zależy od `isAuthenticated`, ale to pole jest ustawiane w store.
- jeżeli chcesz zmienić logikę „kiedy user jest zalogowany”, to patrz `mobile/store/authStore.ts`.

#### `mobile/app/(auth)/_layout.tsx`

- stack dla auth
- ekrany: `login`, `register`

#### `mobile/app/(auth)/login.tsx`

To jest ekran logowania.

Co robi:

- zbiera `email` i `password`,
- normalizuje email (`trim().toLowerCase()`),
- woła `useAuthStore().login`,
- po sukcesie robi `router.replace('/(tabs)')`.

Na co uważać:

- to store (`authStore.ts`) odpowiada za rzeczy typu: zapis tokenów, komunikaty o braku połączenia.

#### `mobile/app/(auth)/register.tsx`

- formularz rejestracji
- wywołuje `useAuthStore().register`

Ekran robi też walidacje po stronie UI (minimum):

- password == confirmPassword,
- min 8 znaków.

#### `mobile/app/(tabs)/_layout.tsx`

Definiuje dolne zakładki aplikacji.

Co robi oprócz tabów:

- wywołuje `useNotifications(isAuthenticated)`.

Po co to jest tutaj:

- jak user jest zalogowany i wchodzi do głównej części appki, to jest dobry moment aby:
  - poprosić o permission,
  - pobrać Expo push token,
  - zapisać token w backendzie.

#### `mobile/app/(tabs)/index.tsx`

- dashboard (podsumowania, UI)

#### `mobile/app/(tabs)/subscriptions.tsx`

- lista subskrypcji

#### `mobile/app/(tabs)/analytics.tsx`

- ekran statystyk i wykresów

#### `mobile/app/(tabs)/settings.tsx`

- ekran ustawień + linki do podstron

### 9.2 Modale

#### `mobile/app/modals/add-subscription.tsx`


To jest jeden z najważniejszych plików w mobile, bo tu składany jest payload do backendu.

Co robi w praktyce:

- zbiera podstawowe pola (name, category, price, currency, billingCycle),
- opcjonalnie pozwala ustawić `startAt` (data+godzina),
- pozwala dodać dowolną liczbę `customNotifications`:
  - użytkownik wpisuje `date` + `time` + `note`,
  - kod zamienia to na `notifyAt: ISO string` i wysyła do backendu.

Typowy payload do `POST /api/subscriptions` wygląda konceptualnie tak:

```json
{
  "name": "Netflix",
  "category": "STREAMING",
  "price": 49.99,
  "currency": "PLN",
  "billingCycle": "MONTHLY",
  "startAt": "2026-06-02T08:00:00.000Z",
  "customNotifications": [
    { "notifyAt": "2026-06-02T20:00:00.000Z", "note": "Zapłacić", "enabled": true }
  ]
}
```

Na co uważać:

- `toISOString()` zamienia lokalny czas na UTC — dlatego w edycji jest osobna logika konwersji.

#### `mobile/app/modals/edit-subscription.tsx`


To jest „siostrzany” modal do `add-subscription`.

Dlaczego jest trudniejszy:

- dane przychodzą z backendu jako ISO/Date w UTC,
- UI pokazuje datę i czas lokalny,
- przy edycji musimy:
  - poprawnie przeliczyć ISO → local (żeby nie było przesunięć o godzinę),
  - a potem local → ISO przy zapisie.

Najważniejsze helpery w tym pliku:

- `toLocalDateInput(...)` i `toLocalTimeInput(...)` — biorą ISO i robią `YYYY-MM-DD` oraz `HH:MM` w lokalnym czasie.
- `toNotifyAtIso(date, time)` — składa local `YYYY-MM-DD + HH:MM` i zwraca ISO.

### 9.3 Settings

#### `mobile/app/settings/notifications.tsx`

To jest ekran diagnostyczno-konfiguracyjny powiadomień.

Co daje użytkownikowi:

1) status permission (granted/denied)
2) przycisk „Zarejestruj token” (zapis tokenu w backendzie)
3) przycisk „Wyślij testowe powiadomienie” (sprawdza end-to-end: backend → Expo → telefon)

Jak działa „Odśwież”:

- woła `Notifications.getPermissionsAsync()` i pokazuje wynik.

Jak działa „Zarejestruj token” krok po kroku:

1) jeśli web → kończy (push w tym projekcie testujemy na urządzeniu)
2) próbuje wykryć `projectId` z konfiguracji Expo:
   - jeśli nie ma, pokazuje alert i przechodzi w tryb kompatybilny
3) sprawdza permission:
   - `getPermissionsAsync()`
   - jeśli nie granted → `requestPermissionsAsync()`
4) pobiera token Expo:
   - jeśli ma `projectId` → `getExpoPushTokenAsync({ projectId })`
   - jeśli nie ma → `getExpoPushTokenAsync()`
5) zapisuje token w backendzie:

```http
POST /api/users/push-token
Authorization: Bearer <accessToken>
Content-Type: application/json

{ "pushToken": "ExponentPushToken[...]" }
```

Jak działa „Wyślij testowe powiadomienie”:

- wysyła request:

```http
POST /api/notifications/test
Authorization: Bearer <accessToken>
```

- backend sprawdza czy user ma zapisany token i jeśli tak, robi request do Expo.

Typowe problemy (co sprawdzać):

- Permission `denied` → system nie pozwoli pokazać powiadomień.
- Brak tokenu w backendzie → test endpoint zwróci błąd „No pushToken saved...”.
- Test działa, ale powiadomienia „z subskrypcji” nie → wtedy problem jest w sweep / terminach / przypisaniu subskrypcji do usera.

Pozostałe pliki `mobile/app/settings/*`:

- `currency.tsx` — ustawienia waluty
- `theme.tsx` — ustawienia motywu
- `privacy.tsx`, `support.tsx`, `premium.tsx` — ekrany informacyjne

### 9.4 Services

#### `mobile/services/api.ts`

To jest centralny klient HTTP.

Jak wybierany jest `API_URL`:

1) Jeśli jest ustawione `EXPO_PUBLIC_API_URL` → używa tego (najlepsze w dev).
2) Na web → bierze hostname z przeglądarki.
3) Na mobile → próbuje wykryć host Expo (LAN IP) i zbudować URL.

Interceptory request:

- jeśli endpoint nie jest publicznym auth, dodaje token z `storage`.

Interceptory response:

- jeśli dostanie `401` na endpointach „biznesowych”, robi refresh:
  - `POST /auth/refresh-token`
  - zapis nowych tokenów
  - ponawia oryginalny request.

To jest kluczowy plik jeśli coś „nie łączy się” z backendem.

#### `mobile/services/storage.ts`

To jest jedna warstwa abstrakcji nad przechowywaniem danych.

Dlaczego dwa storage:

- `SecureStore` jest bezpieczniejszy na urządzeniu.
- Na web `SecureStore` nie działa, więc używamy `AsyncStorage`.

Jak to wpływa na kod:

- reszta aplikacji nie musi sprawdzać platformy — zawsze woła `storage.getItem/setItem/removeItem`.

### 9.5 Store (Zustand)

#### `mobile/store/authStore.ts`

To jest miejsce, które decyduje „czy użytkownik jest zalogowany”.

Najważniejsze funkcje:

- `login(email, password)`:
  - wywołuje `/auth/login`,
  - zapisuje tokeny,
  - ustawia `user` i `isAuthenticated`.
- `register(...)`:
  - analogicznie, ale przez `/auth/register`.
- `loadUser()`:
  - jeśli nie ma accessToken → ustawia `isAuthenticated=false`.
  - jeśli jest → próbuje `/auth/me`.
  - jeśli backend zwraca 401 → czyści tokeny.
- `logout()`:
  - próbuje `/auth/logout`,
  - czyści tokeny.

Ważne: store ma rozbudowane komunikaty błędów sieci (timeout/network), żeby łatwiej diagnozować LAN/firewall.

#### `mobile/store/subscriptionStore.ts`


To jest „źródło prawdy” o subskrypcjach po stronie mobile.

Najważniejsze funkcje:

- `fetchSubscriptions()`:
  - `GET /subscriptions`
  - zapisuje listę do stanu.

- `addSubscription(data)`:
  - `POST /subscriptions`
  - dopina nową subskrypcję do listy.

- `updateSubscription(id, data)`:
  - `PATCH /subscriptions/:id`
  - podmienia element w tablicy.

- `deleteSubscription(id)`:
  - usuwa z listy od razu (optymistycznie),
  - woła `DELETE /subscriptions/:id`,
  - na błędzie przywraca element (rollback).

- `getTotalMonthly()`:
  - liczy sumę miesięczną po stronie UI,
  - robi to prostym mnożnikiem zależnym od cyklu.

Na co uważać:

- UI i backend mają podobne przeliczenia kosztów — warto pilnować spójności.

#### `mobile/store/settingsStore.ts`

- trzyma ustawienia lokalne:
  - waluta
  - preferencja motywu

### 9.6 Hooks

#### `mobile/hooks/useNotifications.ts`

Hook od powiadomień.

Co robi:

- ustawia `Notifications.setNotificationHandler`, czyli mówi systemowi:
  - czy pokazać alert,
  - czy grać dźwięk,
  - czy pokazać listę/banner.

- po zalogowaniu (enabled=true):
  1) prosi o permission
  2) pobiera token Expo (z `projectId` jeśli jest; w razie braku robi fallback)
  3) wysyła token do backendu

To jest krytyczne do działania push: bez tego backend nie ma `pushToken`.

### 9.7 UI Components

#### `mobile/components/SubscriptionCard.tsx`

- karta subskrypcji w liście

#### `mobile/components/ui/*`

- `Button`, `Input`, `GlassCard`, `FAB`, `AnimatedButton`

### 9.8 Utils

- `mobile/utils/date.ts` — formatowanie dat / helpery
- `mobile/utils/currency.ts` — helpery walut
- `mobile/utils/toast.ts` — komunikaty toast z fallbackiem

---

## 10. Najczęstsze problemy (dla początkujących)

### 10.1 Telefon nie łączy się z backendem

- ustaw `EXPO_PUBLIC_API_URL`
- upewnij się, że backend słucha na `0.0.0.0`
- firewall na Windows może blokować port 3000

### 10.2 Push nie przychodzi

Checklist:

- czy masz `pushToken` zapisany na userze? (Settings → Powiadomienia → Zarejestruj token)
- czy test push działa? (to sprawdza połączenie z Expo)
- czy subskrypcje są przypisane do tego samego usera co token? (wymaga auth na subscriptions)

---

## 11. Co warto poprawić przed „produkcyjnym” użyciem

- odchodzenie od Expo push (APNs/FCM)
- rate limiting i hardening backendu
- wielourządzeniowość tokenów push
- polityka stref czasowych end-to-end

---

## 12. Dodatkowe materiały

- `README.md` — skrócony opis
- `instrukcja_odpalania.md` — szybkie uruchomienie
- `docs/PROJECT_DEEP_DIVE.md` — bardziej techniczny „deep dive” i historia zmian
