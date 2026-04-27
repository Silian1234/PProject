# PProject - Student Jobs & Internships

Учебный fullstack-прототип сервиса поиска временной работы и стажировок для студентов университета.

## Стек

- Backend: Django + Django REST Framework + drf-spectacular
- Frontend: React + TypeScript + Vite
- DB: SQLite по умолчанию
- API docs: Swagger UI (`/api/docs/swagger/`) и Redoc (`/api/docs/redoc/`)
- Локализация: `en`, `de`, `ru` через query `?lang=` и `Accept-Language`

## Структура проекта

- `backend/` - Django API и база данных
- `frontend/` - React-клиент
- `docs/db-diagram.md` - ER-диаграмма предметной модели в Markdown
- `docs/db-diagram.html` - ER-диаграмма для открытия в браузере
- `main.py` - единый запуск backend + frontend

## Быстрый запуск

```bash
python main.py --migrate --seed-demo
```

После запуска:

- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:8000/api/v1/`
- Swagger: `http://127.0.0.1:8000/api/docs/swagger/`
- Redoc: `http://127.0.0.1:8000/api/docs/redoc/`

## Ручной запуск

### Backend

```bash
cd backend
python -m venv ../.venv
../.venv/Scripts/pip install -r requirements.txt
../.venv/Scripts/python manage.py migrate
../.venv/Scripts/python manage.py seed_demo
../.venv/Scripts/python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Демо-аккаунты

После `seed_demo` доступны:

- Student: `student_demo / demo12345`
- Employer: `employer_demo / demo12345`
- Admin: `admin_demo / demo12345`

## Проверки

### Backend

```bash
cd backend
../.venv/Scripts/python manage.py test
```

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

## Ключевой сценарий

1. Список вакансий: `GET /api/v1/vacancies/`
2. Просмотр вакансии: `GET /api/v1/vacancies/{id}/`
3. Отклик: `POST /api/v1/applications/`
4. Мои заявки: `GET /api/v1/my-applications/`
5. Управление откликами работодателем: `GET /api/v1/vacancies/{id}/applications/` и `PATCH /api/v1/applications/{id}/status/`

## Локальные секреты

Локальные ключи и настройки лежат в `backend/PProject/local_settings.py`. Этот файл добавлен в `.gitignore`.
Шаблон находится в `backend/PProject/local_settings.example.py`.
