# 🌿 Plant Bachelor Thesis

Postaram się opisać jak najsprawnij, w jaki sposób odpalam tę aplikację. Ogólnie są potrzebne diwe rzeczy - odpalić ubuntu i odpalić trzy osobne terminale w vs code. 

---

## 1. Wymagania wstępne

Upewnij się, że masz zainstalowane:

- **Node.js** ≥ 18  
  ```bash
  node -v
  npm -v
  ```
- **Python** ≥ 3.9  
  ```bash
  python3 --version
  pip3 --version
  ```
- **Docker** (z Docker Compose)  
  ```bash
  docker --version
  docker-compose --version
  ```
- **VS Code** (opcjonalnie z rozszerzeniem Python i Node.js)
- **Google Gemini API Key** – [Uzyskaj tutaj](https://developers.google.com/)

---

## 2. Upewnij się, że wykonałaś instrukcje zawarte w pierwszym ReadME.md, który jest w folderze main i że w ubuntu masz stworozny kontener

## 3. Uruchamianie w VS Code (3 terminale)

Otwórz VS Code i stwórz trzy terminale:

1. **Terminal 1 – Backend Node.js**  
```bash
cd backend_app
source .venv/Scripts/Activate.ps1
node server.js
```

2. **Terminal 2 – Python Recommendation Module**  

```bash

source ./backend_app/.venv/Scripts/Activate.ps1
cd Recommendation_module
python -m uvicorn recommender_service:app --host 127.0.0.1 --port 8765
```


3. **Terminal 3 – Frontend React**  
```bash
cd react_app
npm run dev
```

---

## 4. Dostęp do aplikacji

Po uruchomieniu wszystkich trzech usług otwórz przeglądarkę:

```
http://localhost:5173
```

- Zarejestruj się lub zaloguj
- Rozpocznij konwersację o roślinach
- Sprawdź źródła artykułów użyte przez AI
- Przeglądaj historię rozmów

---

## 5. Najważniejsze komendy Docker

- **Start PostgreSQL**:  
```bash
docker compose up -d
```

- **Stop PostgreSQL**:  
```bash
docker compose down
```

- **Stop + usuń wszystkie dane**:  
```bash
docker compose down -v
```

- **Logi PostgreSQL**:  
```bash
docker compose logs postgres
```

- **Dostęp do PostgreSQL w terminalu**:  
```bash
docker exec -it plant_app_db psql -U postgres -d plant_app_db
```

---

## 6. Rozwiązywanie problemów

- **Port 5432 zajęty** → używamy portu 5433  
- **Błędy połączenia z DB** → sprawdź `.env` i czy Docker działa (`docker ps`)  
- **Brak pgvector** → `docker-compose down && docker-compose up -d`  
- **Problemy z Pythonem** → aktywuj virtualenv i zainstaluj ponownie zależności:  
```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

