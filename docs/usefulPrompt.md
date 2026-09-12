# SubsGuard – Kompletny Plan Rozbudowy Aplikacji

## Priorytet 1: Analytics – Wykresy i Wizualizacje

### Instalacja biblioteki wykresów

Przed implementacją zainstaluj jedną bibliotekę, która obsługuje wszystkie typy wykresów:

```bash
cd mobile
npm install react-native-gifted-charts
npm install react-native-linear-gradient  # wymagana przez gifted-charts
```

### Donut Chart – Rozkład kategorii

**Jak ma wyglądać:** Okrągły wykres w środku ekranu Analytics, poniżej kart z sumami. Każda kategoria (SaaS, Fitness, Streaming, Cloud) ma swój kolor. W środku koła widnieje napis „Łącznie" i suma miesięczna. Pod wykresem legenda z kolorowymi kropkami i nazwami kategorii z procentem.

**Dane:** Już masz je w `/api/subscriptions/stats` – kategorie z sumami. Przelicz każdą na procent całości.

**Przykład implementacji:**
```typescript
import { PieChart } from 'react-native-gifted-charts';

const data = [
  { value: 318.99, color: '#6C63FF', label: 'SaaS' },
  { value: 77.00,  color: '#FF6584', label: 'Inne' },
  { value: 70.00,  color: '#43D9AD', label: 'Fitness' },
  { value: 40.00,  color: '#FFB347', label: 'Streaming' },
];

<PieChart
  donut
  data={data}
  radius={90}
  innerRadius={60}
  centerLabelComponent={() => (
    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
      {totalMonthly} zł
    </Text>
  )}
/>
```

### Bar Chart – Wydatki miesięczne (ostatnie 6 miesięcy)

**Jak ma wyglądać:** Słupki w fioletowym kolorze, oś X z nazwami miesięcy (Wrz, Paź, Lis, Gru, Sty, Lut), oś Y z kwotami. Słupek bieżącego miesiąca podświetlony jaśniejszym kolorem. Nad całością nagłówek „Trend wydatków".

**Dane:** Backend musi zwrócić historię miesięczną. Dodaj endpoint lub obliczaj po stronie frontu z dat odnowień subskrypcji.

**Przykład implementacji:**
```typescript
import { BarChart } from 'react-native-gifted-charts';

const barData = [
  { value: 480, label: 'Wrz', frontColor: '#4B3F8A' },
  { value: 510, label: 'Paź', frontColor: '#4B3F8A' },
  { value: 495, label: 'Lis', frontColor: '#4B3F8A' },
  { value: 530, label: 'Gru', frontColor: '#4B3F8A' },
  { value: 520, label: 'Sty', frontColor: '#4B3F8A' },
  { value: 542, label: 'Lut', frontColor: '#6C63FF' }, // aktualny
];

<BarChart data={barData} barWidth={30} spacing={20} />
```

### Przełącznik okresu (Tabs)

**Jak ma wyglądać:** Na samej górze ekranu Analytics trzy zakładki: `[ Miesiąc ]  [ Kwartał ]  [ Rok ]`. Aktywna zakładka ma fioletowe tło, pozostałe są przezroczyste z obramowaniem. Kliknięcie zmienia dane na wszystkich wykresach jednocześnie.

**Implementacja:** Lokalny stan `const [period, setPeriod] = useState<'month'|'quarter'|'year'>('month')`, który filtruje dane przekazywane do wykresów.

### Sekcja Insights – Alerty i porady

**Jak ma wyglądać:** Pod wykresami sekcja zatytułowana „Spostrzeżenia" z kartami alertów. Każda karta ma ikonę z lewej (emoji lub Ionicons), tekst z informacją i kolor obramowania zależny od priorytetu:
- 🔴 czerwony – pilne (odnowienie za mniej niż 3 dni)
- 🟡 żółty – uwaga (wzrost kosztów, nieużywane subskrypcje)
- 🟢 zielony – pozytywne (oszczędność, brak zmian)

**Przykładowe komunikaty generowane dynamicznie:**
- „Za 2 dni odnowienie Adobe – 318,99 zł. Czy chcesz anulować?"
- „Twoje wydatki wzrosły o 8% vs poprzedni miesiąc."
- „Masz 2 subskrypcje bez aktywności w tym miesiącu."
- „Rocznie wydasz 6503,76 zł – to więcej niż przeciętny Polak na wakacje."

### Prognoza roczna

**Jak ma wyglądać:** Karta na dole Analytics z trzema liczbami:
- „Do końca roku wydasz: X zł" (obliczone z aktualnych subskrypcji × pozostałe miesiące)
- „Potencjalna oszczędność przy anulowaniu 1 subskrypcji: Y zł/rok"
- Progress bar pokazujący „% roku za Tobą"

***

## Priorytet 2: Notatki do Subskrypcji

### Co to ma robić

Każda subskrypcja może mieć krótki opis/notatkę wpisaną przez użytkownika. Przykłady użycia:
- „Współdzielę z Anią – płaci połowę"
- „Do anulowania po sezonie"
- „Konto firmowe – do rozliczenia"
- „Trial kończy się 15 marca"

### Zmiany w backendzie

**Model MongoDB** – dodaj pole `notes` do schematu subskrypcji:

```typescript
// backend/src/models/Subscription.model.ts
notes: {
  type: String,
  default: '',
  maxlength: 500,  // limit znaków
}
```

**Endpoint PATCH** – już masz `PATCH /api/subscriptions/:id`, wystarczy że `notes` jest w walidacji Zod:

```typescript
// backend/src/validators/subscription.validator.ts
const updateSubscriptionSchema = z.object({
  // ... istniejące pola ...
  notes: z.string().max(500).optional(),
});
```

### Zmiany w mobilnym frontendzie

**Ekran edycji subskrypcji** (`app/modals/edit-subscription.tsx`) – dodaj pole TextInput na notatki:

```typescript
<TextInput
  style={styles.notesInput}
  placeholder="Dodaj notatkę do tej subskrypcji..."
  placeholderTextColor="#888"
  value={notes}
  onChangeText={setNotes}
  multiline
  numberOfLines={3}
  maxLength={500}
/>
<Text style={styles.charCount}>{notes.length}/500</Text>
```

**Karta subskrypcji na liście** – jeśli notatka istnieje, pokaż małą ikonę 📝 na karcie i pierwsze 50 znaków notatki w szarej czcionce pod nazwą subskrypcji.

**Store** (`subscriptionStore.ts`) – upewnij się że `notes` jest w typie `Subscription` i jest wysyłane przy update.

***

## Priorytet 3: Ustawienia – Działające Podstrony

### Powiadomienia (ekran /settings/notifications)

**Jak ma wyglądać:** Lista toggleów z opisami:

| Toggle | Opis |
|--------|------|
| Przypomnienia o odnowieniu | Włącz/wyłącz wszystkie przypomnienia |
| Ile dni wcześniej | Picker: 1 / 3 / 7 / 14 dni |
| Podsumowanie miesięczne | Wysyłaj raport 1. dnia każdego miesiąca |
| Alerty o wzroście kosztów | Powiadom gdy miesięczny koszt wzrośnie |

**Implementacja:** Zapisuj preferencje w `AsyncStorage` po stronie frontu. Faktyczne powiadomienia push wymagają `expo-notifications` – dodaj to jako kolejny krok.

```bash
npx expo install expo-notifications
```

### Waluta domyślna (modal dolny)

**Jak ma wyglądać:** Po kliknięciu „Waluta domyślna" wysuwa się Bottom Sheet z listą walut. Każda pozycja: flaga emoji + kod waluty + nazwa. Aktualnie wybrana z checkmarkiem.

```
🇵🇱 PLN – Polski złoty     ✓
🇪🇺 EUR – Euro
🇺🇸 USD – Dolar amerykański
🇬🇧 GBP – Funt brytyjski
🇨🇭 CHF – Frank szwajcarski
```

**Implementacja:** Zapisz wybraną walutę w `AsyncStorage` i użyj jej wszędzie przy formatowaniu kwot (`Intl.NumberFormat`).

### Motyw (3 opcje zamiast 2)

**Jak ma wyglądać:** Trzy kafelki z ikonami:
```
☀️ Jasny    🌙 Ciemny    📱 Systemowy
```
Aktywny kafelek ma fioletowe obramowanie i wypełnienie. Zmiana działa natychmiast bez restartu.

**Implementacja:** Użyj `useColorScheme()` z React Native i kontekstu tematu. Przechowuj wybór w `AsyncStorage`.

### Premium (ekran sprzedażowy /settings/premium)

**Jak ma wyglądać:** Ekran podzielony na sekcje:
1. **Hero** – gradient fiolet/niebieski, napis „SubsGuard Premium", ikona korony 👑
2. **Lista funkcji** – checkmarki przy każdej:
   - Nieograniczona liczba subskrypcji
   - Zaawansowane wykresy i analizy
   - Eksport danych do PDF/CSV
   - Powiadomienia push
   - Wsparcie priorytetowe
3. **Ceny** – dwie karty: miesięczna (np. 9,99 zł/mies.) i roczna (np. 79,99 zł/rok, z etykietą „Oszczędzasz 40%")
4. **Przycisk CTA** – „Wypróbuj 7 dni za darmo" + mały tekst „Anuluj w dowolnym momencie"

### Prywatność i RODO (/settings/privacy)

**Jak ma wyglądać:** Ekran informacyjny z sekcjami accordion (rozwijane):
- Co zbieramy (email, hasło zaszyfrowane, dane subskrypcji)
- Jak przechowujemy (MongoDB Atlas, szyfrowanie bcrypt)
- Twoje prawa (dostęp, eksport, usunięcie)
- Na dole czerwony przycisk „Usuń konto i wszystkie dane"

**Implementacja przycisku usunięcia:** Wywołuje `DELETE /api/auth/account` po potwierdzeniu alertem. Backend usuwa usera i wszystkie jego subskrypcje z MongoDB.

### Pomoc i wsparcie (/settings/support)

**Jak ma wyglądać:** Trzy duże przyciski:
- 💬 „Napisz do nas" → `Linking.openURL('mailto:support@subsguard.app')`
- ⭐ „Oceń aplikację" → link do App Store / Play Store
- ❓ „FAQ" → lista pytań w accordionie

***

## Priorytet 4: Dashboard – Ulepszenia

### Header z powitaniem

Zastąp statyczny tytuł dynamicznym:
```typescript
const hour = new Date().getHours();
const greeting = hour < 12 ? 'Dzień dobry' : hour < 18 ? 'Dzień dobry' : 'Dobry wieczór';
// "Dobry wieczór, Michał 👋"
```

### Sekcja „Najbliższe płatności"

**Jak ma wyglądać:** Pod hero kartą z sumą miesięczną, lista 3 najbliższych odnowień posortowanych po dacie. Każda pozycja:
- Kolorowy placeholder ikony serwisu (lub logo jeśli dodasz)
- Nazwa subskrypcji
- Data odnowienia (np. „za 3 dni")
- Kwota w PLN

**Dane:** Endpoint `GET /api/subscriptions/upcoming` – już go masz w backendzie.

### Empty state

Gdy użytkownik nie ma żadnych subskrypcji, zamiast pustego ekranu pokaż:
- Ilustrację (np. emoji 📭 duże)
- Tekst „Nie masz jeszcze żadnych subskrypcji"
- Przycisk „Dodaj pierwszą" który otwiera modal dodawania

### Skeleton loader

Podczas ładowania danych zamiast białego/ciemnego ekranu pokaż animowane szare placeholdery kart (`react-native-skeleton-placeholder` lub własna implementacja z `Animated`).

***

## Priorytet 5: Ulepszenia UX na liście subskrypcji

### Logo serwisu

Zamiast kolorowego kwadratu z literą, pobieraj automatycznie favicon serwisu:
```typescript
// Dla url "netflix.com" pobierz:
const logoUrl = `https://logo.clearbit.com/netflix.com`;
<Image source={{ uri: logoUrl }} style={{ width: 40, height: 40, borderRadius: 8 }} />
```
Clearbit Logo API jest darmowe dla podstawowego użycia.

### Swipe actions – rozszerzenie

Oprócz „Usuń" dodaj drugi przycisk przy swipe:
- **Edytuj** (niebieski) – otwiera modal edycji
- **Usuń** (czerwony) – potwierdza i usuwa

### Status subskrypcji

Na karcie dodaj kolorową kropkę statusu:
- 🟢 Aktywna
- 🟡 Wygasa wkrótce (mniej niż 7 dni)
- 🔴 Przeterminowana / anulowana

***

## Kolejność Implementacji (Roadmapa)

| Etap | Co robić | Czas szacowany |
|------|----------|----------------|
| **1** | Donut chart + Bar chart w Analytics | 2–3 godziny |
| **2** | Notatki do subskrypcji (backend + frontend) | 2 godziny |
| **3** | Sekcja Insights z alertami w Analytics | 1–2 godziny |
| **4** | Waluta i Motyw w Ustawieniach | 1 godzina |
| **5** | Ekran Premium (sprzedażowy) | 2 godziny |
| **6** | Powiadomienia push (expo-notifications) | 3–4 godziny |
| **7** | Dashboard – powitanie + najbliższe płatności | 1 godzina |
| **8** | Logo serwisów (Clearbit API) | 1 godzina |
| **9** | Prywatność + usunięcie konta | 1–2 godziny |
| **10** | Skeleton loadery | 1 godzina |

Łącznie: **~16–20 godzin** pracy z Windsurfem, przy czym każdy etap daje widoczny, działający efekt.