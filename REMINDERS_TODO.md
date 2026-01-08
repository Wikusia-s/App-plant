# 📋 User Plant Care Reminders - TODO

## Overview
Implementacja systemu przypomnień o pielęgnacji roślin, którymi może zarządzać użytkownik. System powinien umożliwić dodawanie custom przypomnień z datami, powtarzalnością i wyświetlać je na głównej stronie obok domyślnych zadań.

---

## Backend (Node.js)

### 1. ✅ Create user_reminders table in database
- [ ] Dodaj nową tabelę `user_reminders` w `initDb.js`
- [ ] Kolumny:
  - `id` SERIAL PRIMARY KEY
  - `user_id` INTEGER (FK to users)
  - `plant_id` INTEGER (FK to plants)
  - `care_type` VARCHAR (water/fertilize/prune)
  - `scheduled_date` DATE
  - `repeat_interval` VARCHAR (none/daily/weekly/monthly)
  - `is_active` BOOLEAN DEFAULT true
  - `created_at` TIMESTAMP
  - `updated_at` TIMESTAMP
- [ ] Dodaj indeksy na `user_id`, `plant_id`, `scheduled_date`

### 2. 🔨 Build reminder CRUD API endpoints
- [ ] POST `/api/reminders` - dodaj nowe przypomnienie
- [ ] GET `/api/reminders/user/:userId` - pobierz wszystkie przypomnienia użytkownika
- [ ] GET `/api/reminders/:id` - pobierz jedno przypomnienie
- [ ] PUT `/api/reminders/:id` - edytuj przypomnienie
- [ ] DELETE `/api/reminders/:id` - usuń przypomnienie
- [ ] Utwórz `reminderController.js` w `/controllers`
- [ ] Dodaj routes w `/routes/reminderRoutes.js`
- [ ] Validation input danych

### 3. 🔄 Implement reminder date recurrence logic
- [ ] Funkcja do generowania przyszłych dat na podstawie `repeat_interval`
- [ ] Obsługa: none (jeden raz), daily, weekly, monthly
- [ ] Obliczenie następnej daty dla bieżącego i przyszłych przypomnień
- [ ] Endpoint do pobrania "active" przypomnień na dzisiejszy dzień

---

## Frontend (React)

### 4. 📝 Create ReminderModal component for adding reminders
- [ ] Komponent `ReminderModal.tsx` w `/src/pages`
- [ ] Form fields:
  - Select rośliny (z kolekcji użytkownika)
  - Typ pielęgnacji (water/fertilize/prune)
  - Date picker do wyboru daty
  - Select powtarzalności (none/daily/weekly/monthly)
- [ ] Validacja formularza
- [ ] Submit button + Cancel button
- [ ] Integracja z API (POST request)

### 5. ⚙️ Build reminder management UI (edit/delete)
- [ ] Komponent `ReminderList.tsx` - wyświetl wszystkie przypomnienia użytkownika
- [ ] Każde przypomnienie:
  - Nazwa rośliny
  - Typ pielęgnacji
  - Następna data
  - Powtarzalność
  - Edit button
  - Delete button
- [ ] Modal/form do edycji istniejącego przypomnienia
- [ ] Potwierdzenie przed usunięciem

### 6. 🔗 Create reminders service (API calls)
- [ ] Nowy plik `src/services/reminderService.ts`
- [ ] Funkcje:
  - `createReminder(data)` - POST
  - `getUserReminders(userId)` - GET
  - `getReminder(id)` - GET
  - `updateReminder(id, data)` - PUT
  - `deleteReminder(id)` - DELETE
  - `getTodayReminders()` - GET aktywne na dzisiaj

### 7. 🔀 Merge user reminders with default tasks on HomePage
- [ ] W `HomePage.tsx` - pobierz zarówno default tasks i user reminders
- [ ] Merge obu tablic
- [ ] Sortuj po `daysUntil` (dla default) i `scheduled_date` (dla user reminders)
- [ ] Konwertuj format danych aby były kompatybilne

### 8. 📊 Display reminders in Care Schedule section
- [ ] Wyświetl merged reminders w istniejącym `Care Schedule` na HomePage
- [ ] Pokaż zarówno default tasks jak i user reminders
- [ ] Wizualne rozróżnienie między typami
- [ ] Kliknięcie na reminder → edycja/usunięcie
- [ ] Button "+ Add Reminder" do otworzenia ReminderModal

---

## Status Progress

| Task | Status | Notes |
|------|--------|-------|
| Backend: Create table | ⏳ Not Started | |
| Backend: Build API | ⏳ Not Started | |
| Backend: Recurrence logic | ⏳ Not Started | |
| Frontend: ReminderModal | ⏳ Not Started | |
| Frontend: Management UI | ⏳ Not Started | |
| Frontend: Service | ⏳ Not Started | |
| Frontend: Merge data | ⏳ Not Started | |
| Frontend: Display | ⏳ Not Started | |

---

## Notes
- Baza danych: PostgreSQL z pgvector extension
- Frontend framework: React + TypeScript
- Backend: Node.js/Express
- Taski domyślne są mock data w `HomePage.tsx`
- User reminders będą prawdziwą bazą danych
