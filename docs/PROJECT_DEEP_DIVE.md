# SubsGuard — Deep Dive (specyfikacja techniczna + historia zmian)

Ten dokument jest celowo bardzo szczegółowy. Ma pełnić rolę „źródła prawdy” o architekturze i implementacji projektu, tak aby nowy programista mógł odtworzyć system od zera (mobile + backend) oraz zrozumieć wszystkie kluczowe decyzje i mechanizmy.

Repo: **SubsGuard** — menedżer subskrypcji (aplikacja mobilna + backend API).

---

## 1. Cel produktu i zakres

### 1.1. Co robi aplikacja

SubsGuard pozwala użytkownikowi:

- dodawać subskrypcje (np. Netflix, Spotify),
- przechowywać: nazwę, kategorię, cenę, walutę, cykl rozliczeniowy, notatki,
- śledzić koszty miesięczne/roczne i statystyki per kategoria,
- przeglądać listę subskrypcji i szczegóły,
- edytować i usuwać subskrypcje,
- ustawiać powiadomienia:
  - cykliczne (np. 3 dni przed odnowieniem o 09:00),
  - jednorazowe (dokładna data+godzina + notatka w treści powiadomienia),
- dynamicznie wyliczać najbliższą datę odnowienia (`nextBillingDate`) na podstawie cyklu.

### 1.2. Co jest w repo

Repozytorium jest monorepo w folderze `subsguard/`:

- `backend/` — **API** (Express + TypeScript + MongoDB/Mongoose)
- `mobile/` — aplikacja **Expo/React Native** (iOS/Android/Web)
- `docs/` — dokumentacja projektowa

---

## 2. Stos technologiczny (dlaczego i jak)

### 2.1. Backend (Node.js + TypeScript)

 Plik: `backend/package.json`
 
 Najważniejsze biblioteki:
 
 - **express** — framework HTTP dla Node.js.
   - Używamy go do budowy API (routing, middleware, obsługa request/response) w prosty i przewidywalny sposób.
 - **mongoose** — ODM (Object Data Modeling) dla MongoDB.
   - Ułatwia definiowanie schematów (`Schema`), walidację na poziomie modelu, pracę z relacjami i zapytaniami.
 - **mongodb** — natywny driver MongoDB.
   - Nie jest głównym sposobem dostępu do bazy (to robi Mongoose), ale bywa przydatny do diagnostyki i operacji „low-level”.
 - **zod** — walidator i parser danych.
   - Służy do walidacji wejścia na API (np. payload subskrypcji), a dodatkowo „sanityzuje” body (przepuszcza tylko dozwolone pola).
 - **jsonwebtoken** — implementacja JWT.
   - Używana do podpisywania i weryfikacji `accessToken` (autoryzacja żądań).
 - **bcryptjs** — hashowanie haseł.
   - Chroni hasła użytkowników (nigdy nie przechowujemy plain text), umożliwia bezpieczne porównanie hasła przy logowaniu.
 - **dotenv** — ładowanie zmiennych środowiskowych z pliku `.env`.
   - Ułatwia konfigurację developmentu (URI Mongo, sekrety JWT itp.) bez hardcodowania w kodzie.
 - **cors** — kontrola CORS.
   - W dev pozwala aplikacji mobilnej/webowej odpytywać API (często z innego hosta/portu) bez błędów przeglądarki.

Dlaczego TypeScript:

- kontrakty danych (np. kształt `Subscription`),
- minimalizacja regresji przy przebudowach (powiadomienia, daty, auth),
- przewidywalność refactorów.

### 2.2. Mobile (Expo / React Native)

Plik: `mobile/package.json`

 Najważniejsze biblioteki:
 
 - **expo** — runtime + tooling (uruchamianie, buildy dev, szybkie iteracje).
   - Używamy Expo, bo skraca czas developmentu (hot reload, prosta konfiguracja iOS/Android) i pozwala szybko testować UI.
 - **expo-router** — routing plikowy dla React Native.
   - Używany do struktury aplikacji (Stack + grupy ekranów `(tabs)`, `(auth)`, `modals`) bez ręcznego konfigurowania nawigacji.
 - **react-native** — framework UI.
   - Zapewnia komponenty natywne i wspólny kod dla iOS/Android (oraz częściowo web).
 - **zustand** — lekki state management.
   - Trzymamy tu stan autoryzacji i list subskrypcji, bo jest prosty, mało „ceremonialny” i dobrze pasuje do aplikacji tej skali.
 - **axios** — klient HTTP.
   - Używany do komunikacji z backendem (interceptory, tokeny, refresh flow, jednolita obsługa błędów).
 - **expo-constants** — dostęp do informacji o uruchomieniu w Expo.
   - Dzięki temu możemy wyliczyć adres backendu w LAN (w dev) bez ręcznego wpisywania IP za każdym razem.
 - **expo-secure-store** + **AsyncStorage** — trwałe przechowywanie danych.
   - Tokeny auth trzymamy w SecureStore na urządzeniu (bezpieczniej), a na web w AsyncStorage (bo SecureStore nie działa w przeglądarce).
 - **expo-notifications** — obsługa powiadomień w środowisku Expo.
   - Pozwala pobrać token push i odbierać powiadomienia w dev; docelowo przy migracji poza Expo jego rola będzie ograniczona/zmieniona.

Uwaga strategiczna:

- Aktualnie push działa przez **Expo push service** (backend wysyła na `https://exp.host/--/api/v2/push/send`).
- Docelowo (sprzedaż w sklepach) planowana jest migracja do **APNs (iOS)** + **FCM (Android)** bez Expo push service.

---

## 3. Struktura katalogów (ważne entrypointy)

### 3.1. Backend

- `backend/src/server.ts`
  - ładowanie `.env` (`dotenv.config()`),
  - start Express,
  - podpięcie routów pod `/api`,
  - `setInterval(... runPushNotificationsSweep ...)` co 60 sekund,
  - listen na `0.0.0.0` (dostęp z LAN).

 - `backend/src/routes/index.ts`
  - agregacja modułów:
    - `/auth`
    - `/users`
    - `/notifications`
    - `/subscriptions`
    - `/analytics`
    - `/payments`
  - endpoint `GET /api/health`
  - endpoint debug `GET /api/debug/subscriptions-count` (do wglądu w bazę).

 - `backend/src/models/*.ts`
  - `User.model.ts`
  - `Subscription.model.ts`
  - `Notification.model.ts`
 
 Modele są „źródłem prawdy” dla kształtu danych w MongoDB:
 
 - definiują schematy (pola, typy, wymagania),
 - pozwalają trzymać spójność danych,
 - ułatwiają deduplikację (np. unikalny index w `Notification`).

 - `backend/src/services/*.ts`
  - `subscription.service.ts` — logika subskrypcji i dat.
  - `pushNotifications.service.ts` — sweep wysyłki push.
 
 Serwisy wydzielają logikę biznesową poza kontrolery:
 
 - kontroler jest „cienki” (parsing requestu, response),
 - serwis robi przeliczenia dat, walidacje biznesowe i mechanizmy powiadomień.

 - `backend/src/middleware/*.ts`
  - `auth.middleware.ts` — verifyAuth
  - `validate.middleware.ts` — walidacja Zod i sanityzacja body
 
 Middleware służą do rozdzielenia odpowiedzialności:
 
 - auth: weryfikacja użytkownika zanim request trafi do logiki biznesowej,
 - validateRequest: gwarantuje, że kontroler/serwis dostaje dane w poprawnym kształcie.

### 3.2. Mobile

- `mobile/app/_layout.tsx`
  - root stack (bez headerów)
  - To centralne miejsce, w którym aplikacja definiuje „szkielet” nawigacji.

- `mobile/app/(auth)/*`
  - logowanie/rejestracja
  - Oddzielna grupa ekranów dla flow autoryzacji.

- `mobile/app/(tabs)/*`
  - dashboard, subscriptions, analytics, settings
  - Główne ekrany aplikacji dostępne po zalogowaniu.

- `mobile/app/modals/*`
  - `add-subscription.tsx`
  - `edit-subscription.tsx`
  - Modale formularzy (dodawanie/edycja) trzymają logikę walidacji i mapowania pól UI ↔ payload API.

- `mobile/store/authStore.ts`
  - `login`, `register`, `logout`, `loadUser`
  - Store odpowiada za stan sesji i zarządzanie tokenami (w praktyce: źródło prawdy „czy user jest zalogowany”).

- `mobile/store/subscriptionStore.ts`
  - `fetchSubscriptions`, `addSubscription`, `updateSubscription`, `deleteSubscription`
  - Store odpowiada za dane subskrypcji oraz spójne odświeżanie listy po operacjach CRUD.

- `mobile/services/api.ts`
  - wyliczenie `baseURL` (LAN)
  - interceptory (Bearer token + refresh flow)
  - Jeden centralny klient HTTP, żeby nie powielać logiki tokenów/refresh i mapowania błędów w wielu miejscach UI.

- `mobile/services/storage.ts`
  - abstrakcja storage zależna od platformy (web vs native)
  - Umożliwia wspólną logikę auth na mobile i web, jednocześnie używając właściwego mechanizmu przechowywania na danej platformie.

---

## 4. Kontrakty danych (modele i pola)

### 4.1. Subscription (backend)

Plik: `backend/src/models/Subscription.model.ts`

Najważniejsze pola:

- `userId: string`
  - uwaga: w tym projekcie `userId` w `Subscription` jest stringiem (nie ObjectId).

- `name: string`
- `category: enum` (`STREAMING`, `FITNESS`, `SAAS`, `GAMING`, `MUSIC`, `CLOUD_STORAGE`, `NEWS`, `EDUCATION`, `OTHER`)
- `price: number`
- `currency: string` (np. `PLN`, `USD`)
- `billingCycle: enum` (`DAILY`, `WEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`)

Daty:

- `startAt?: Date`
  - opcjonalna dokładna data+godzina startu subskrypcji.
- `startDate: Date`
  - „anchor” do wyliczeń.
  - gdy `startAt` ustawione, `startDate = startAt`.
- `nextBillingDate: Date`
  - najbliższa data odnowienia (z godziną).

Powiadomienia:

- `reminderDays: number` (0..14)
- `reminders?: { daysBefore: number; time: string; enabled: boolean }[]`
  - wieloelementowe powiadomienia „X dni przed o HH:MM”.
- `customNotifications?: { notifyAt: Date; note?: string; enabled: boolean }[]`
  - jednorazowe powiadomienia o dokładnej dacie.

Status:

- `status: enum` (`ACTIVE`, `CANCELLED`, `PAUSED`, `EXPIRED`)
- `cancelledAt?: Date`
- `pausedAt?: Date`

Inne:

- `notes?: string` (max 500)

### 4.2. Notification (backend)

Plik: `backend/src/models/Notification.model.ts`

Cel: deduplikacja wysyłek + audyt.

Pola:

- `userId: ObjectId`
- `subscriptionId: ObjectId`
- `type: 'EMAIL' | 'PUSH'`
- `status: 'PENDING' | 'SENT' | 'FAILED'`
- `key: string`
  - unikalny klucz deduplikacji (index unique):
    - dla odnowień: `renewal:<subId>:<nextBillingDateISO>:<daysBefore>:<time>`
    - dla jednorazowych: `custom:<subId>:<notifyAtISO>`
- `sentAt?: Date`
- `failureReason?: string`
- `metadata?: any`

Index:

- `NotificationSchema.index({ subscriptionId: 1, type: 1, key: 1 }, { unique: true, sparse: true })`

To zapewnia, że nawet jeśli sweep uruchomi się kilka razy w oknie +/- 5 minut, powiadomienie nie pójdzie drugi raz.

### 4.3. User (backend)

Plik: `backend/src/models/User.model.ts`

Najważniejsze dla powiadomień:

- `pushToken?: string`
  - obecnie: token expo (rejestrowany z appki przez `/users/push-token`).

Docelowo do migracji poza Expo:

- rozbudowa o osobne tokeny per platforma (APNs/FCM) i/lub wielourządzeniowo.

---

## 5. Backend: request flow, walidacja, bezpieczeństwo

### 5.1. Standard odpowiedzi API

W wielu kontrolerach stosowany jest format:

- `data` — payload
- `error` — obiekt z message (czasem details)
- `message` — string

Przykład (idea):

- success: `{ data: ..., error: null, message: null }`
- fail: `{ data: null, error: { message }, message }`

### 5.2. Walidacja Zod (`validateRequest`)

Plik: `backend/src/middleware/validate.middleware.ts`

Kluczowa cecha: middleware nie tylko waliduje, ale też **podmienia** `req.body` na wynik `schema.parse(req.body)`.

Dlaczego to ważne:

- w UI istnieją pola techniczne (`useStartAt`, `startTime`, drafty), które nie powinny trafić do DB.
- `schema.parse` usuwa pola nieprzewidziane przez schemat (w praktyce — kształtuje payload do „dozwolonego” kontraktu), co chroni przed przypadkowymi nadpisaniami w `Object.assign(subscription, data)`.

### 5.3. Auth

- `/api/auth/*`:
  - `register`, `login`, `refresh-token`, `logout`, `me`.
- `verifyAuth` chroni wybrane endpointy.

Uwaga projektowa:

- w `subscriptions.routes.ts` auth jest chwilowo wyłączony (linia zakomentowana). To należy włączyć przed produkcją.

---

## 6. Logika subskrypcji i dat

### 6.1. Wyliczanie `nextBillingDate`

Plik: `backend/src/services/subscription.service.ts`

Podstawowa idea:

- przy tworzeniu:
  - jeśli przesłano `startAt`, to jest to główny anchor.
  - w przeciwnym razie fallback na `startDate` albo `now`.
  - `nextBillingDate = calculateNextBillingDate(startDate, billingCycle)`.

- przy aktualizacji:
  - jeśli zmienia się `startAt`:
    - `startDate = startAt` i przelicz `nextBillingDate`.
  - jeśli `startAt: null`:
    - usuń ręczne ustawienie i wróć do liczenia od `createdAt`.
  - jeśli zmienia się `billingCycle`:
    - przelicz w oparciu o `calculateUpcomingBillingDate` tak, by zachować logikę „nadchodzącej” daty.

Ta logika jest kluczowa, aby:

- `nextBillingDate` był zawsze sensowny (w przyszłości),
- zmiana cyklu nie powodowała skoków wstecz.

### 6.2. Strefy czasowe (ważne)

W UI występuje napięcie pomiędzy:

- przechowywaniem dat w formie ISO (`toISOString()` => UTC)
- wyświetlaniem lokalnie na urządzeniu.

W edycji naprawiono problem „cofania godziny o 1h” przez:

- parsowanie `new Date(iso)` i formatowanie lokalne `getHours()/getMinutes()`, a nie `slice(11,16)`.

---

## 7. Powiadomienia PUSH (stan obecny: Expo)

### 7.1. Architektura „sweep”

Plik: `backend/src/services/pushNotifications.service.ts`

Mechanizm:

- `server.ts` uruchamia co 60 sekund `runPushNotificationsSweep()`.
- sweep definiuje okno:
  - `windowStart = now - 5 min`
  - `windowEnd = now + 5 min`

Dzięki temu:

- nie musimy mieć idealnej synchronizacji co do sekundy,
- opóźnienia w Node/cron nie psują powiadomień,
- deduplikacja przez unikalny `Notification.key` zapobiega duplikatom.

### 7.2. Dwa typy powiadomień

1) Powiadomienia cykliczne (odnowienia):

- `reminders[]` albo fallback na `{ reminderDays, time: '09:00' }`
- `dueAt` budowane z `nextBillingDate - daysBefore` i ustawieniem godziny.

2) Powiadomienia jednorazowe (dokładne):

- `customNotifications[]` z `notifyAt`.
- jeśli `notifyAt` w oknie sweepa → wysyłka.

### 7.3. Deduplikacja

Deduplikacja oparta jest o zapis `Notification.create(...)` z unikalnym `key`.

- Jeśli insert powoduje błąd duplicate key, sweep ignoruje wysyłkę (bo była już obsłużona).

### 7.4. Debug logi

Dodano logi:

- `[pushSweep] start ... window=[...]`
- `[pushSweep] activeSubs=...`
- `skip reason=noPushToken`
- `custom due ... key=...`
- `custom dedupe ...`
- `custom sent/failed ...`

### 7.5. Ograniczenia Expo Go / Expo push

W fazie dev:

- backend wysyła payload na Expo push endpoint.

W praktyce:

- Expo Go może mieć ograniczenia dot. remote push (szczególnie Android w niektórych wersjach).
- W produkcji (sklepy) planowane jest odejście od Expo push service na rzecz APNs/FCM.

---

## 8. Mobile: architektura aplikacji i przepływy

### 8.1. Routing (expo-router)

Plik: `mobile/app/_layout.tsx`

Root:

- `Stack` z wyłączonym header.

Grupy:

- `(auth)` — logowanie, rejestracja.
- `(tabs)` — dashboard + lista subskrypcji + analytics + settings.
- `modals` — dodawanie/edycja subskrypcji.

### 8.2. Warstwa danych (Zustand)

#### authStore

Plik: `mobile/store/authStore.ts`

- `login(email, password)`:
  - POST `/auth/login`
  - zapis tokenów do storage
  - ustaw `user` + `isAuthenticated`.

- `register(name, email, password)`:
  - POST `/auth/register`
  - analogicznie.

- `logout()`:
  - opcjonalnie POST `/auth/logout`
  - usuń tokeny.

- `loadUser()`:
  - GET `/auth/me`
  - jeśli 401 → usuń tokeny i nie spamuj logów.

#### subscriptionStore

Plik: `mobile/store/subscriptionStore.ts`

- `fetchSubscriptions()`:
  - GET `/subscriptions`

- `addSubscription(data)`:
  - POST `/subscriptions`

- `updateSubscription(id, data)`:
  - PATCH `/subscriptions/:id`

- `deleteSubscription(id)`:
  - DELETE `/subscriptions/:id`

### 8.3. API client (Axios)

Plik: `mobile/services/api.ts`

Wyliczanie `baseURL`:

- preferencja: `EXPO_PUBLIC_API_URL`.
- web: hostname z przeglądarki.
- native: `Constants.expoConfig.hostUri` / `debuggerHost` (LAN IP) → `http://{ip}:3000/api`.

Interceptory:

- request:
  - dla endpointów nie-auth dodaje `Authorization: Bearer ...`.
- response:
  - 401 → refresh token flow (poza endpointami auth).
  - wyciszenie `console.error` dla 401 w auth.

### 8.4. Storage

Plik: `mobile/services/storage.ts`

- web: AsyncStorage
- native: SecureStore

Powód:

- tokeny na urządzeniu powinny być przechowywane bezpieczniej niż w plain storage.

---

## 9. UI: kluczowe ekrany / modale

### 9.1. Add subscription

Plik: `mobile/app/modals/add-subscription.tsx`

Najważniejsze sekcje:

- nazwa, kategoria, cena/waluta, cykl.
- `Ustaw datę startu`:
  - po włączeniu odblokowuje pola `YYYY-MM-DD` oraz `HH:MM`.
  - payload wysyła `startAt` jako ISO.

- `Dokładne powiadomienie`:
  - lista wpisów: `date`, `time`, `note`.
  - mapowanie do payload `customNotifications[{ notifyAt: ISO, note, enabled: true }]`.

### 9.2. Edit subscription

Plik: `mobile/app/modals/edit-subscription.tsx`

- analogiczne pola.
- naprawiona konwersja ISO → lokalny czas dla `startAt` i `customNotifications`.

---

## 10. Uruchamianie projektu (dev)

Dokument operacyjny: `docs/DEPLOYMENT.md`.

Skrót:

- Backend:

```bash
cd backend
npm install
npm run dev
```

- Mobile:

```bash
cd mobile
npm install
npx expo start -c
```

Wskazówki:

- Telefon i komputer muszą być w tej samej sieci.
- Ustawienie `EXPO_PUBLIC_API_URL` eliminuje problemy z autodetekcją.

---

## 11. Chronologiczny harmonogram prac i zmian (rekonstrukcja)

Poniższa lista jest rekonstrukcją zmian na podstawie obecnego kodu repo + prac wykonanych w trakcie implementacji.

### Etap 1 — Fundamenty backendu

- Utworzenie backendu w Express + TypeScript.
- Konfiguracja `.env` przez `dotenv`.
- Połączenie z MongoDB przez Mongoose.
- Wprowadzenie middleware:
  - CORS (dev), JSON body parser.

### Etap 2 — Autoryzacja

- Endpointy `/auth/register`, `/auth/login`, `/auth/refresh-token`, `/auth/me`.
- JWT access token + refresh token.
- Hashowanie haseł `bcryptjs`.

### Etap 3 — Subskrypcje (CRUD)

- Model `Subscription`.
- Endpointy:
  - GET list
  - POST create
  - PATCH update
  - DELETE delete

- Walidacja requestów przez Zod.

### Etap 4 — API response contract + stabilizacja

- Ujednolicenie odpowiedzi `{ data, error, message }`.
- Poprawki w mobile, aby lepiej mapować błędy z backendu.

### Etap 5 — Mobile: routing i UI

- Implementacja `expo-router`.
- Ekrany `(tabs)` + `(auth)`.
- Modale add/edit.

### Etap 6 — Dynamiczny `API_URL` (LAN)

- `mobile/services/api.ts`:
  - automatyczne wyciąganie hosta i składanie `http://{LAN_IP}:3000/api`.
  - opcjonalny override `EXPO_PUBLIC_API_URL`.

### Etap 7 — Powiadomienia: sweep + deduplikacja

- Wprowadzenie `Notification` modelu.
- Wprowadzenie `runPushNotificationsSweep()` uruchamianego co 60 sekund.
- Deduplikacja przez unikalny `Notification.key`.

### Etap 8 — Ręczna data startu subskrypcji (`startAt`)

Cel: użytkownik może wskazać dokładny start (data + godzina), co wpływa na `nextBillingDate`.

Zmiany:

- Backend:
  - dodanie `startAt?: Date`.
  - `createSubscription`: jeśli `startAt`, to `startDate=startAt`.
  - `updateSubscription`:
    - `startAt === null` wyłącza ręczny start.
  - walidacja `startAt` w Zod.

- Mobile:
  - toggle `Ustaw datę startu`.
  - pola `YYYY-MM-DD` + `HH:MM`.

### Etap 9 — Jednorazowe powiadomienia (`customNotifications`)

Cel: użytkownik ustawia dokładną datę+godzinę i notatkę w treści.

Zmiany:

- Backend:
  - `customNotifications[]` w `Subscription`.
  - walidacja `customNotifications`.
  - sweep obsługuje `customNotifications`.

- Mobile:
  - sekcja `Dokładne powiadomienie` w add/edit.

### Etap 10 — Poprawki logów 401 i stabilizacja auth na mobile

- wyciszenie `console.error` dla spodziewanych 401 na endpointach auth.
- `loadUser`: 401 czyści tokeny i nie spamuje logami.

### Etap 11 — Naprawa strefy czasowej (UI)

- naprawa cofania godziny o 1h w edycji:
  - ISO UTC nie jest wyświetlane przez `slice`.
  - konwersja do czasu lokalnego przez `new Date(iso)` + `getHours()/getMinutes()`.

---

## 12. Lista „kluczowych punktów ryzyka” (co dopracować przed produkcją)

- **Auth w subscriptions**: obecnie `verifyAuth` bywa wyłączony do testów. W produkcji musi być włączony.
- **Push niezależne od Expo**: docelowo APNs/FCM i własne tokeny urządzeń.
- **Strefy czasowe**: ustalić jednoznaczną politykę:
  - przechowywanie UTC w DB,
  - wyświetlanie w local,
  - wejście użytkownika interpretować jako local i zapisywać jako UTC.
- **Rate limiting / security hardening** backendu.
- **Obsługa wielu urządzeń** na jednym koncie (tokeny push per device).

---

## 13. Jak odtworzyć projekt od zera (plan techniczny)

Jeśli masz odtworzyć projekt od zera, minimalna kolejność wygląda tak:

1) Backend:
- Express + TS + Mongo/Mongoose.
  - Cel: wystawić API i mieć typy po stronie backendu, a dane trzymać w MongoDB.
- Modele: User, Subscription, Notification.
  - Cel: mieć kontrakty danych w DB oraz deduplikować wysyłki push przez unikalny `Notification.key`.
- Auth: register/login/refresh/me.
  - Cel: bezpieczne logowanie i utrzymanie sesji (JWT + refresh flow).
- Middleware: verifyAuth, validateRequest(Zod) + sanitize.
  - Cel: request ma być autoryzowany i walidowany zanim trafi do logiki, a payload ma być „oczyszczony” z nieznanych pól.
- Subscriptions CRUD.
  - Cel: pełna obsługa subskrypcji (create/update/delete/list), bo to rdzeń funkcji aplikacji.

2) Mobile:
- Expo RN + expo-router.
  - Cel: szybki development i prosta nawigacja oparta o strukturę plików.
- Auth screens + token storage.
  - Cel: logowanie/rejestracja oraz utrzymanie sesji między uruchomieniami aplikacji.
- API client z LAN baseURL.
  - Cel: stabilne połączenie w dev (telefon w tej samej sieci co komputer) i spójna obsługa tokenów.
- Subscriptions list + add/edit modals.
  - Cel: podstawowy UX, na którym opierają się powiadomienia i dalsze funkcje.

3) Powiadomienia:
- Notification model + sweep co minute.
  - Cel: backend sam decyduje kiedy wysłać powiadomienie (nie polegamy na harmonogramie telefonu).
- Deduplikacja przez unikalny key.
  - Cel: brak duplikatów nawet jeśli sweep obejmie to samo okno czasowe kilka razy.
- Wersja dev: expo push.
  - Cel: szybkie testy w development bez konfiguracji certyfikatów.
- Wersja prod: APNs/FCM.
  - Cel: pełna niezależność od Expo push service i poprawna ścieżka pod App Store/Google Play.

---

## 14. Aneks: dokumenty w `docs/`

- `docs/DEPLOYMENT.md` — jak uruchomić dev.
- `docs/API.md` — (placeholder, do uzupełnienia pełnym opisem endpointów).
- `docs/PROJECT_DEEP_DIVE.md` — ten dokument.
