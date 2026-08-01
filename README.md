# ArquiFlow

Control de obra y presupuesto post-contrato: cronograma, presupuesto vs. gasto real, bitácora fotográfica, pagos a proveedores y reporte exportable para el cliente.

## Stack

- **Frontend**: React + Vite + TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Router.
- **Backend**: ASP.NET Core Web API (.NET 10), EF Core, ASP.NET Identity + JWT.
- **Base de datos**: PostgreSQL.

## Correr todo con Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend / Swagger: http://localhost:8080/swagger
- Postgres: localhost:5432 (db `arquiflow`, user/pass `arquiflow`)

Usuario admin sembrado automáticamente en desarrollo: `admin@arquiflow.local` / `Admin#12345` (definido en `backend/ArquiFlow.Api/appsettings.Development.json`, solo para dev).

## Desarrollo día a día (sin rebuildear imágenes)

Backend:
```bash
cd backend/ArquiFlow.Api
dotnet run
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Para ambos casos, levantar solo Postgres con Docker:
```bash
docker compose up postgres -d
```

## Estructura

```
/backend/ArquiFlow.Api   # API .NET, organizada por Features/
/frontend                # SPA React, organizada por src/features/
docker-compose.yml
```
