# API Foodii

API REST para gestión de usuarios y planificación de comidas: registro/login, ingredientes y calorías por porción, y comidas (meals) con resumen de calorías por fecha.

---

## Stack tecnológico

- **Runtime:** Node.js
- **Lenguaje:** TypeScript
- **Framework:** Express 5
- **Autenticación:** JWT (jsonwebtoken) + bcrypt
- **Otros:** cors, dotenv

---

## Estructura del proyecto

El código sigue una **arquitectura en capas** (inspirada en Clean/Hexagonal): dominio, aplicación (casos de uso) e infraestructura (controladores, adaptadores, rutas).

```
src/
├── index.ts                 # Punto de entrada: Express, CORS, JSON, inyección de dependencias y registro de rutas
├── routes.ts                # Definición de todos los endpoints (auth, meals, ingredients)
│
├── Core/                    # Código compartido entre módulos
│   ├── Application/Ports/   # Interfaces (puertos) de servicios externos
│   │   ├── HashService.interface.ts
│   │   └── TokenService.interface.ts
│   └── Infraestructure/
│       ├── Adapters/Segurity/   # Implementaciones de los puertos
│       │   ├── Bcrypt.adapter.ts   # Hash de contraseñas
│       │   └── Json.adapter.ts    # JWT (generar/verificar)
│       └── Middleware/
│           └── auth.middleware.ts # Middleware que valida JWT y asigna req.user
│
├── Users/                   # Módulo de usuarios y autenticación
│   ├── Domain/
│   │   ├── Entities/User.ts
│   │   └── Interfaces/IUser.ts, UserRepository.ts
│   ├── Application/UseCase/  # Casos de uso: Register, Login, GetProfile, UpdateProfile, DeleteAccount, VerifyToken
│   └── infrastructure/
│       ├── auth.dependencies.ts   # Inyección de dependencias del módulo (repos, adaptadores, use cases, controller)
│       └── Controllers/UsersController.ts
│
├── Planner/                 # Módulo de planificación (ingredientes y comidas)
│   ├── Domain/
│   │   ├── Entities/Ingredients.ts, Meal.ts
│   │   └── interfaces/      # IIngredients, IMeal, IMealIngredient, IngredientRepository, MealRepository
│   ├── application/UseCase/
│   │   ├── Ingredients/    # CRUD, búsqueda, cálculo de calorías (simple y bulk)
│   │   └── Meal/           # CRUD, por fecha, por rango, resumen de calorías
│   └── Infraestructure/
│       ├── Ingredients/
│       │   ├── ingredient.dependencies.ts
│       │   └── Controllers/IngredientsController.ts
│       └── Meals/
│           ├── meal.dependencies.ts
│           └── Controllers/MealControllers.ts
│
└── shared/
    └── Errors/AppErrors.ts   # Clase de error con statusCode (AppError)
```

### Resumen por capa

| Capa | Ubicación | Responsabilidad |
|------|-----------|-----------------|
| **Dominio** | `*/Domain/` | Entidades, interfaces de repositorios y de entidades. Sin dependencias de framework. |
| **Aplicación** | `*/Application/UseCase/` | Casos de uso: orquestan repositorios y servicios (Hash, Token), validan y devuelven DTOs. |
| **Infraestructura** | `*/Infraestructure/` o `infrastructure/` | Controladores HTTP, adaptadores (Bcrypt, JWT), middleware, archivos de dependencias que instancian y conectan todo. |

---

## Funcionamiento

### Flujo de una petición

1. **Entrada:** La petición llega a Express y pasa por `routes.ts`, que asocia método y ruta a un controlador (y opcionalmente al `authMiddleware`).
2. **Middleware (rutas protegidas):** Si la ruta lleva `authMiddleware`, se valida el header `Authorization: Bearer <token>`, se verifica el JWT con `TokenService` y se asigna `req.user = { id, username }`. Si falla, se responde 401.
3. **Controlador:** Recibe `req`/`res`, extrae body/params/query y llama al **caso de uso** correspondiente con un DTO. Devuelve JSON con el resultado o con el error (usando `error.statusCode` cuando existe).
4. **Caso de uso:** Valida la entrada, usa **repositorios** (y en Auth también **HashService** y **TokenService**) y devuelve un resultado tipado. Los errores de negocio se lanzan con `AppError(message, statusCode)`.
5. **Repositorios:** Las interfaces están en el dominio; la aplicación usa implementaciones MySQL (`UserRepositoryMySQL`, `IngredientRepositoryMySQL`, `MealRepositoryMySQL`) que se inyectan desde `index.ts`. Los casos de uso dependen de las interfaces, no de la implementación.

### Inyección de dependencias

- **`auth.dependencies.ts`:** Recibe opcionalmente `userRepository`, `hashService`, `tokenService`. Crea los 6 use cases de Users y el `AuthController`. Exporta `authController` y `tokenService`.
- **`ingredient.dependencies.ts`:** Recibe opcionalmente `ingredientRepository`. Crea los use cases de Ingredients y el `IngredientController`.
- **`meal.dependencies.ts`:** Recibe opcionalmente `mealRepository` e `ingredientRepository`. Crea los use cases de Meal y el `MealController`.

En **`index.ts`** se crea el pool MySQL, se instancian los repositorios MySQL y se pasan a las funciones de dependencias; luego se crea el middleware de auth y se registran las rutas.

---

## Cómo ejecutar

### Requisitos

- Node.js (recomendado v18+)
- npm

### Instalación

```bash
git clone <url-del-repo>
cd API_foodii
npm install
```

### Variables de entorno

Copia `.env.example` a `.env` y ajusta los valores:

```bash
cp .env.example .env
```

Variables usadas por la API:

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `PORT` | Puerto del servidor | 3000 |
| `JWT_SECRET` | Clave para firmar tokens | (valor por defecto en código) |
| `DB_HOST` | Host de MySQL | localhost |
| `DB_PORT` | Puerto de MySQL | 3306 |
| `DB_USER` | Usuario de MySQL | root |
| `DB_PASSWORD` | Contraseña de MySQL | (vacío) |
| `DB_NAME` | Nombre de la base de datos | foodii_db |

**Importante:** La API usa MySQL. Crea antes la base de datos y las tablas con `database/schema.sql` (ver sección [Base de datos (MySQL)](#base-de-datos-mysql)).

### Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor en modo desarrollo con recarga automática (ts-node-dev). |
| `npm run build` | Compila TypeScript a `dist/`. |
| `npm start` | Ejecuta la app compilada: `node dist/index.js` (ejecutar después de `npm run build`). |

```bash
npm run dev
```

El servidor quedará en `http://localhost:3000` (o en el `PORT` definido en `.env`).

---

## Base de datos (MySQL)

La API persiste los datos en MySQL. En la carpeta `database/` están los scripts:

| Archivo | Descripción |
|---------|-------------|
| `database/schema.sql` | Crea la base `foodii_db` y las tablas: `users`, `ingredients`, `meals`, `meal_ingredients`. |
| `database/drop.sql` | Elimina la base `foodii_db`. |

**Crear la base de datos antes de arrancar la API:**

```bash
mysql -u root -p < database/schema.sql
```

Desde el cliente MySQL: `source /ruta/al/proyecto/database/schema.sql`

---

## Endpoints

### Auth (`/api/auth`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Registrar usuario (username, password). Devuelve user + token. |
| POST | `/api/auth/login` | No | Login. Devuelve user + token. |
| POST | `/api/auth/verify-token` | No | Verificar token enviado en body: `{ "token": "..." }`. |
| GET | `/api/auth/health` | No | Health check del servicio de auth. |
| GET | `/api/auth/profile` | Sí | Perfil del usuario autenticado. |
| PUT | `/api/auth/profile` | Sí | Actualizar username. |
| GET | `/api/auth/verify-token` | Sí | Verificar token del header Bearer. |
| DELETE | `/api/auth/account` | Sí | Eliminar cuenta (body: `{ "password": "..." }`). |
| POST | `/api/auth/logout` | Sí | Cerrar sesión (sin invalidación de token en esta versión). |

### Meals (`/api/meals`) — todas con Bearer token

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/meals` | Crear comida (name, date, mealTime, ingredients). |
| GET | `/api/meals` | Listar comidas (query opcional: `date`). |
| GET | `/api/meals/calories-summary` | Resumen de calorías (query: `date`). |
| GET | `/api/meals/date-range` | Comidas en rango (query: `startDate`, `endDate`). |
| GET | `/api/meals/:id` | Obtener una comida por id. |
| PUT | `/api/meals/:id` | Actualizar comida. |
| DELETE | `/api/meals/:id` | Eliminar comida. |

### Ingredients (`/api/ingredients`) — todas con Bearer token

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/ingredients` | Crear ingrediente (name, caloriesPer100g). |
| GET | `/api/ingredients` | Listar ingredientes (query opcional: `search`). |
| GET | `/api/ingredients/search` | Buscar (query: `q`, opcional `limit`). |
| POST | `/api/ingredients/calculate-calories` | Calcular calorías (body: ingredientId, amount). |
| POST | `/api/ingredients/calculate-bulk-calories` | Calcular calorías en lote (body: ingredients[]). |
| GET | `/api/ingredients/:id` | Obtener ingrediente por id. |
| PUT | `/api/ingredients/:id` | Actualizar ingrediente. |
| DELETE | `/api/ingredients/:id` | Eliminar ingrediente. |

---

## Ejemplos de uso

### Health

```bash
curl http://localhost:3000/api/auth/health
```

### Registrar y obtener token

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"maria","password":"123456"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"maria","password":"123456"}'
```

### Llamada con token (sustituir `TOKEN` por el valor recibido)

```bash
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

### Crear ingrediente

```bash
curl -X POST http://localhost:3000/api/ingredients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name":"Arroz","caloriesPer100g":130}'
```

### Crear comida

```bash
curl -X POST http://localhost:3000/api/meals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name":"Almuerzo",
    "date":"2025-02-05",
    "mealTime":"lunch",
    "ingredients":[{"ingredientId":"<id-ingrediente>","amount":150}]
  }'
```

---

## Licencia

ISC