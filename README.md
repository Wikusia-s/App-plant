# App-plant

## Care Schedule TODO

- DB: utworzyć tabelę `care_tasks` z polami: `id`, `user_id` (FK), `plant_id` (FK, opcjonalnie), `type` (`water|fertilize|prune|repot|custom`), `title` (opcjonalnie), `due_at` (timestamp), `notes` (text), `status` (`pending|done`), `created_at`.
- DB: dodać indeksy: `idx_care_tasks_user_id`, `idx_care_tasks_due_at`, opcjonalnie `idx_care_tasks_status` i FK do `plants`/`users`.
- Backend: dodać kontroler `careController` (CRUD: list, create, update, delete) oraz trasy `careRoutes` pod `/api/care`.
- Backend: zabezpieczyć trasy middlewarem z autoryzacją (`auth.js`).
- Frontend: zdefiniować typ `CareTask` w `src/types.ts`.
- Frontend: dodać `src/services/careService.ts` (`getTasks`, `addTask`, `updateTask`, `deleteTask`).
- Home: w `src/pages/HomePage.tsx` zastąpić mock danych pobieraniem z API; sortowanie po `due_at` i etykiety „Today/Tomorrow/In Xd”.
- UI: dodać modal „Add Task” z wyborem rośliny (dropdown z kolekcji), typem, datą/godziną i notatkami.
- UI: akcje na zadaniach: „Mark done”, edycja (typ/data), usuwanie.
- UX: walidacja wymaganych pól, stany `loading/error/empty`, oznaczanie `status=done`.
- Testy: szybki smoke-test API (Postman/curl) i weryfikacja UI na stronie głównej.
- Opcjonalnie: powtarzalność zadań, przypomnienia, eksport iCal.