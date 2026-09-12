# SubsGuard — krótki opis projektu (dla nowej osoby)

## 1. Co to jest SubsGuard

SubsGuard to aplikacja do zarządzania subskrypcjami (np. Netflix, Spotify, SaaS).

Pozwala:

- dodawać/edytować/usuwać subskrypcje,
- trzymać informacje o cenie, walucie i cyklu rozliczeniowym,
- liczyć koszty (miesięczne i roczne),
- przeglądać analitykę (np. wydatki per kategoria, nadchodzące płatności),
- wysyłać powiadomienia push:
  - cykliczne (np. X dni przed odnowieniem),
  - jednorazowe (dokładna data i godzina).

Projekt jest podzielony na:

- `backend/` — API + logika biznesowa + połączenie z bazą
- `mobile/` — aplikacja Expo (React Native) na iOS/Android oraz WEB

---

## 2. Technologie (co to jest i po co jest)

### Backend (`backend/`)

- **Node.js** — uruchamia kod serwera w JavaScript/TypeScript.
- **TypeScript** — typy i lepsza kontrola nad strukturą danych (mniej błędów).
- **Express** — framework HTTP do tworzenia API (routing + middleware).
- **MongoDB Atlas** — baza danych w chmurze (dokumentowa).
- **Mongoose** — warstwa do pracy z MongoDB (schematy, walidacje, zapytania).
- **Zod** — walidacja danych wejściowych (request body) zanim trafią do serwisu/bazy.
- **JWT (jsonwebtoken)** — tokeny logowania (autoryzacja requestów).

### Mobile (`mobile/`)

- **Expo** — ułatwia development RN, uruchamianie na telefonie i szybkie buildy.
- **React Native** — UI cross-platform.
- **expo-router** — routing oparty o strukturę plików w `mobile/app/`.
- **Zustand** — proste store do stanu aplikacji (user, tokeny, subskrypcje).
- **Axios** — klient HTTP do komunikacji z backendem.
- **expo-notifications** — pobieranie tokenu push i obsługa powiadomień.

---

## 3. Architektura (jak to jest zbudowane)

Najprościej: **mobile** wyświetla UI i wysyła requesty do **backendu**, a backend zapisuje dane w **MongoDB**.

### 3.1 Warstwy na backendzie

Backend jest podzielony na typowe warstwy:

- **Routes** (`backend/src/routes/*`)
  - mapują URL + metodę HTTP na kontroler.
- **Controllers** (`backend/src/controllers/*`)
  - czytają dane z requestu (`req.body`, `req.params`, `req.user`),
  - wywołują serwisy,
  - zwracają odpowiedź JSON.
- **Services** (`backend/src/services/*`)
  - zawierają logikę biznesową (np. liczenie `nextBillingDate`, statystyki).
- **Models** (`backend/src/models/*`)
  - opisują schematy danych w MongoDB (Mongoose).

### 3.2 Autoryzacja

- Użytkownik loguje się przez `/api/auth/login`.
- Backend zwraca `accessToken` i `refreshToken`.
- Mobile wysyła większość requestów z nagłówkiem:

```http
Authorization: Bearer <accessToken>
```

- Gdy token wygaśnie i backend odpowie `401`, mobile próbuje odświeżyć token przez `/api/auth/refresh-token`.

### 3.3 Powiadomienia push — jak to działa

To ważne, bo w tym projekcie push nie jest „z telefonu bezpośrednio”.

- Mobile:
  - pobiera **Expo Push Token** (identyfikator urządzenia),
  - zapisuje go w backendzie (`POST /api/users/push-token`),
  - w subskrypcji zapisuje reguły powiadomień (`reminders`, `customNotifications`).

- Backend:
  - ma cykliczny job (co minutę), który odpala sweep,
  - sprawdza, czy jakieś powiadomienia wpadają w okno czasu,
  - wysyła push przez Expo.

Dzięki temu:

- nie trzeba utrzymywać „lokalnych alarmów” w telefonie,
- push działa nawet jeśli aplikacja jest zamknięta,
- logika “kiedy wysłać” jest w jednym miejscu.

---

## 4. Najważniejsze przepływy (co po czym następuje)

### 4.1 Logowanie

1) `mobile` → `POST /api/auth/login`
2) backend → weryfikuje dane, generuje tokeny
3) `mobile` zapisuje tokeny w storage
4) kolejne requesty idą z `Authorization: Bearer ...`

### 4.2 Dodanie subskrypcji

1) użytkownik wypełnia formularz
2) `mobile` → `POST /api/subscriptions`
3) backend:
   - waliduje payload (Zod),
   - liczy `nextBillingDate`,
   - zapisuje w MongoDB
4) `mobile` odświeża listę / aktualizuje store

### 4.3 Powiadomienia

1) `mobile` rejestruje token i zapisuje w backendzie
2) `mobile` zapisuje reguły powiadomień w subskrypcji
3) backend co minutę sprawdza, czy powinien wysłać push

---

## 5. Jak uruchomić (high-level)

### Backend

- `npm install`
- ustaw `.env` (MongoDB URI, sekrety JWT)
- `npm run dev`

Backend powinien odpowiadać na:

- `GET http://localhost:3000/api/health`

### Mobile

- `npm install`
- `npx expo start -c`

W dev na telefonie najczęściej trzeba ustawić:

- `EXPO_PUBLIC_API_URL=http://<IP_KOMPUTERA>:3000/api`

---

## 6. Struktura repo (co warto znać)

- `backend/src/server.ts`
  - start Express, middleware, routy, error handler, połączenie z DB.
- `mobile/services/api.ts`
  - axios + interceptory (Bearer token + refresh token flow).
- `mobile/store/*`
  - logika stanu (auth/subscriptions/settings).

---

## 7. Najczęstsze problemy (szybka diagnoza)

- Mobile ma `request timed out`, a web działa:
  - zwykle zły `API_URL` na telefonie lub firewall,
  - sprawdź `GET http://<IP_KOMPUTERA>:3000/api/health` w przeglądarce telefonu.

- Backend nie łączy się z MongoDB Atlas po długiej przerwie:
  - klaster mógł zostać spauzowany przez nieaktywność — wznowić w panelu Atlas.
