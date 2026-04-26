# Frontend (React + Vite)

## Установка
```bash
npm install
```

## Запуск dev-сервера
```bash
npm run dev
```

По умолчанию: `http://127.0.0.1:5173`

## Проверки
```bash
npm run lint
npm run build
```

## Конфигурация API
- Базовый URL задается в клиенте API (`src/api/client.ts` / `src/api/clients.ts`).
- Язык передаётся через `?lang=` и синхронизируется в запросах к backend.
