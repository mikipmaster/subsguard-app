# SubsGuard — propozycja uproszczeń pod prezentację pracy inżynierskiej

Cel tego dokumentu: pomóc Ci przygotować **stabilne demo** na prezentację pracy inżynierskiej, bez ryzykownych/niedopracowanych elementów, które mogą się „wysypać” (sieć, usługi zewnętrzne, strefy czasowe, edge-case’y).

Założenie: zostawiamy to, co najlepiej pokazuje wartość projektu (CRUD + analiza kosztów + sensowna architektura), a wycinamy lub „zamrażamy” rzeczy niedokończone albo trudne do przewidzenia.

---

## 1. Obecny stan projektu (w skrócie)

### 1.1 Co działa i jest sensownym core do prezentacji

- **Autoryzacja**: rejestracja/logowanie/JWT + refresh token (backend + mobile axios interceptors)
- **Subskrypcje**:
  - dodawanie/edycja/usuwanie
  - pola: nazwa, cena, waluta, kategoria, cykl rozliczeniowy
  - backend liczy `nextBillingDate`
- **Analityka kosztów**:
  - backend ma endpointy `/analytics/*`
  - mobile ma ekran Analytics i potrafi robić fallback obliczeń lokalnie
- **Web** (RN Web) potrafi działać stabilniej niż mobile w LAN (mniej problemów z IP/firewall)

### 1.2 Elementy, które są „ryzykowne” na demo

- **Powiadomienia push** (Expo + backend sweep):
  - zależne od:
    - tokenu Expo w urządzeniu,
    - poprawnej konfiguracji `projectId` (EAS),
    - internetu na backendzie (fetch do Expo),
    - okna czasowego ±5 minut,
    - stref czasowych + konwersji `toISOString()`.
  - dużo edge-case’ów i łatwo o sytuację: „u mnie działało, teraz nie działa”.

- **Reguły powiadomień i daty** w UI:
  - `add-subscription.tsx` i `edit-subscription.tsx` składają daty z `YYYY-MM-DD` + `HH:MM` i robią `toISOString()`.
  - to jest podatne na przesunięcia czasu (UTC vs lokalny), oraz wymaga, żeby backend i urządzenie miały spójny czas.

- **Stripe / payments**:
  - `backend/src/controllers/payments.controller.ts` to jawny placeholder (`TODO: Implement Stripe...`).
  - na demo to jest mina: pytania „czemu to nie działa?”.

- **Premium / ekrany informacyjne w settings**:
  - w mobile są ekrany `premium/privacy/support`.
  - same w sobie nie są groźne, ale mogą rozpraszać i sugerować „płatności”, których nie ma.

---

## 2. Propozycja „wersji demo” (prosty zakres do obrony)

### 2.1 Minimalny zakres, który wygląda profesjonalnie

Zostaw:

- **Auth**: register/login/logout/me + refresh
- **Subskrypcje**: CRUD + status ACTIVE/PAUSED/CANCELLED (jeśli to masz w UI)
- **Analityka**: summary + upcoming (lista nadchodzących płatności) + category breakdown
- **Settings**: tylko waluta i motyw (opcjonalnie)

W praktyce demo ma wtedy jasną historię:

1) loguję się
2) dodaję 2–3 subskrypcje
3) pokazuję listę + sumy miesięczne/roczne
4) pokazuję analytics (wydatki per kategoria)

To jest świetne pod pracę inżynierską, bo prezentuje:

- architekturę klient-serwer
- DB + modele
- walidację
- autoryzację
- podstawową analitykę

### 2.2 Co wyciąć / schować (najmniej ryzyka)

#### A) Wyłączyć push w wersji demo

Najbezpieczniejsze jest:

- **wyłączyć uruchamianie sweepa** w backendzie (`setInterval(runPushNotificationsSweep...)`),
- oraz **ukryć**/usunąć w UI:
  - ekran Settings → Powiadomienia,
  - pola do ustawiania `customNotificationsDraft` i `reminders`.

To usuwa największy „generator edge-case’ów”.

Co zamiast push?

- pokaż w UI sekcję: **„Nadchodzące odnowienia (nextBillingDate)”**.
- to daje podobną wartość (użytkownik wie co się zbliża), ale bez ryzyka usług zewnętrznych.

#### B) Wyciąć payments/Stripe

- ukryć zakładkę/sekcję „Premium” jeśli prowadzi do wrażeń płatności,
- usunąć route `/api/payments` z `routes/index.ts` albo zostawić, ale **nie linkować nigdzie** i nie wspominać.

#### C) Uprościć daty

W wersji demo proponuję:

- usunąć `useStartAt` + wybór godziny startu,
- w backendzie trzymać tylko `startDate` (dzień),
- `nextBillingDate` liczyć bez godziny (np. zawsze 09:00 lokalnie lub 00:00 UTC).

To usuwa cały temat „dlaczego o godzinę inaczej”.

---

## 3. Szybki audyt: konkretne miejsca ryzyka w kodzie

### 3.1 Backend

- **`backend/src/services/pushNotifications.service.ts`**
  - sweep co minutę
  - okno ±5 min
  - wysyłka do Expo `https://exp.host/--/api/v2/push/send`
  - deduplikacja przez `Notification.create` z key
  - zależność od `User.pushToken`

Wniosek: bardzo dużo elementów zewnętrznych → wysokie ryzyko demo.

- **`backend/src/controllers/payments.controller.ts`**
  - placeholder z `TODO`

Wniosek: wyciąć z demo.

### 3.2 Mobile

- **`mobile/app/modals/add-subscription.tsx`**
  - `useStartAt`
  - `customNotificationsDraft` → mapowanie na ISO

- **`mobile/app/modals/edit-subscription.tsx`**
  - konwersje ISO ↔ lokalny czas
  - obsługa `reminders` (wyświetlanie/edycja)

Wniosek: uprościć formularze i wywalić opcje dot. powiadomień.

---

## 4. Proponowany plan zmian (najmniej pracy → największa stabilność)

### Etap 1 (1–2h): „nie da się wysypać na prezentacji”

- Wyłączyć sweep push w backendzie.
- Ukryć/wyciąć ekran Settings → Powiadomienia.
- Usunąć z modali pola dot. `customNotificationsDraft` / `reminders` / `useStartAt`.
- Wyciąć linki do Premium.
- Payments/Stripe: usunąć z routingu albo nie linkować.

### Etap 2 (opcjonalnie, 2–4h): „ładna narracja pracy”

- Dodać ekran/sekcję: „Nadchodzące płatności” (z `nextBillingDate`) i to pokazać jako zamiennik powiadomień.
- Ujednolicić analitykę:
  - preferować backendowe `/subscriptions/stats` i `/analytics/summary` (bez fallback liczenia w UI),
  - albo odwrotnie: jedna ścieżka.

---

## 5. Jak zweryfikować, że wersja demo jest stabilna (checklista)

- Backend:
  - `GET /api/health` działa
  - login/register działa
  - CRUD subscriptions działa
  - analytics działa
  - brak sweep push (nie spamuje logów, nie wymaga internetu)

- Mobile/Web:
  - daje się zalogować
  - da się dodać 2–3 subskrypcje
  - analityka pokazuje liczby

- Demo offline-friendly:
  - minimum usług zewnętrznych (Expo push/Stripe) wyłączone

---

## 6. Moja rekomendacja “co zostawić do obrony” (argument pod pracę)

Najlepiej broni się zakres:

- aplikacja klient-serwer
- autoryzacja JWT + refresh token
- modelowanie danych w MongoDB
- walidacja danych wejściowych (Zod)
- logika biznesowa liczenia cykli i kosztów
- analityka + wizualizacja

To brzmi “inżyniersko” i jest demonstracyjnie stabilne.
