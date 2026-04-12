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

docs/
├── routes.json              # Listado de rutas (método, path, auth, descripción)
└── crud-schemas.json        # Esquemas de body/query y ejemplos de respuesta
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

- **`auth.dependencies.ts`:** Recibe opcionalmente `userRepository`, `hashService`, `tokenService`. Crea los casos de uso de Users (registro, login, perfil, actualización, borrado, verificación de token, preferencias de notificación) y el `AuthController`. Exporta `authController` y `tokenService`.
- **`notificationPush.dependencies.ts`:** Crea `FirebaseAdminFcmPushService` y `NotificationsController` para envíos FCM por tópico (uso administrativo).
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
| `FIREBASE_SERVICE_ACCOUNT_JSON` | (Opcional) JSON del service account de Firebase en una sola línea, para FCM Admin SDK | — |
| `GOOGLE_APPLICATION_CREDENTIALS` | (Opcional) Ruta a un archivo JSON de credenciales de Firebase / GCP | — |
| `ADMIN_PUSH_SECRET` | (Opcional) Secreto compartido; si está definido, `POST /api/admin/push/topic` exige header `X-Admin-Secret` con este valor | — |

**Importante:** La API usa MySQL. Crea antes la base de datos y las tablas con `database/schema.sql` (ver sección [Base de datos (MySQL)](#base-de-datos-mysql)).

### Notificaciones push (FCM) y preferencias

- Las preferencias de categoría se guardan en MySQL como **JSON array de slugs** (`users.notification_category_preferences`), alineados con los **nombres de tópico** que la app debe usar en `FirebaseMessaging.subscribeToTopic(slug)`.

**Slugs canónicos (agendación / estilo de comida):** `fitness`, `high_protein`, `low_calorie`, `low_carb`, `vegan`, `quick_meals`, `meal_prep`, `family_friendly`, `budget_friendly`, `gluten_free`, `balanced`, `healthy_snacks`, `international`. Etiquetas en español equivalentes están definidas en código (`notificationCategorySlug.ts`). Por compatibilidad, siguen aceptándose temporalmente los slugs antiguos `quesadillas`, `seafood`, `antojitos`, `desserts` si un cliente aún los envía.
- El servidor mapea etiquetas de la app (orientadas a **agendación y estilo de comida**: fitness, alto en proteína, meal prep, etc.) a **slugs** estables para FCM. Lista y etiquetas en `src/shared/Notifications/notificationCategorySlug.ts`.
- Tras un `PATCH /api/users/preferences` correcto, la app debe **sincronizar suscripciones** a tópicos en el dispositivo según la lista devuelta.
- Para publicar una notificación masiva a quien esté suscrito a un tópico (p. ej. contenido `high_protein`), usar `POST /api/admin/push/topic` con cuerpo `topicSlug`, `title`, `body` y opcional `data` (p. ej. `{ "mealId": "..." }`). Requiere `ADMIN_PUSH_SECRET` y credenciales Firebase configuradas.

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

### Preferencias de notificación y FCM (modelo de datos)

En **`users`** ya existen dos columnas pensadas para este flujo:

| Columna | Tipo | Uso recomendado |
|---------|------|-----------------|
| `fcm_token` | `VARCHAR(500) NULL` | Último token de dispositivo del usuario (mensajes directos o diagnóstico). La API mantiene exclusividad: un mismo token no puede estar en dos usuarios. |
| `notification_category_preferences` | `JSON NULL` | Array JSON de **slugs** estables (`fitness`, `high_protein`, `meal_prep`, …), alineados con tópicos FCM. Ventajas: poco espacio, misma cadena que `subscribeToTopic` en Android. |

**Alternativa más normalizada:** tabla `user_notification_topics (user_id, topic_slug)` con clave `(user_id, topic_slug)` si necesitas consultas frecuentes del estilo “cuántos usuarios eligieron vegan” o joins por categoría. Para el volumen típico de una app de comidas, la columna JSON en `users` suele ser suficiente y reduce joins.

---

## Endpoints

Listado actualizado en máquina-legible: [`docs/routes.json`](docs/routes.json). Esquemas de cuerpos y ejemplos: [`docs/crud-schemas.json`](docs/crud-schemas.json).

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

### Usuarios — preferencias (`/api/users`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| PATCH | `/api/users/preferences` | Sí | Actualizar `notificationCategoryPreferences` (array o `null`) y opcionalmente `fcmToken`. El usuario se identifica por el JWT. |

### Admin — push (`/api/admin`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/admin/push/topic` | Header `X-Admin-Secret` | Enviar notificación FCM al tópico indicado (`topicSlug`). Body: `title`, `body`, `data` opcional (strings para la app, p. ej. `mealId`). |

### Meals (`/api/meals`) — todas con Bearer token

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/meals` | Crear comida (`userId`, name, date, mealTime, ingredients). Opcional: `steps` (pasos de preparación). Imagen opcional: multipart campo `image`. |
| GET | `/api/meals` | Listar comidas (query opcional: `date`). Respuesta incluye `steps` e `image`. |
| GET | `/api/meals/calories-summary` | Resumen de calorías del usuario (query: `date` opcional). |
| GET | `/api/meals/date-range` | Comidas del usuario en rango (query: `startDate`, `endDate`). |
| GET | `/api/meals/random` | Una comida aleatoria del usuario. |
| GET | `/api/meals/:id` | Detalle de una comida. |
| PUT | `/api/meals/:id` | Actualizar comida (`userId` + campos). Si envías la clave `steps`, reemplaza la lista (`[]` la vacía). Imagen opcional: multipart `image`. |
| DELETE | `/api/meals/:id` | Eliminar comida (body: `userId`). |

### Ingredients (`/api/ingredients`) — todas con Bearer token

El `createdBy` del ingrediente se toma del usuario del token.

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/ingredients` | Crear ingrediente (name, caloriesPer100g). |
| GET | `/api/ingredients` | Listar ingredientes del usuario (query opcional: `search`). |
| GET | `/api/ingredients/search` | Buscar (query: `q`, opcional `limit`). |
| POST | `/api/ingredients/calculate-calories` | Calcular calorías (body: ingredientId, amount). |
| POST | `/api/ingredients/calculate-bulk-calories` | Calcular calorías en lote (body: ingredients[]). |
| GET | `/api/ingredients/:id` | Obtener ingrediente por id. |
| PUT | `/api/ingredients/:id` | Actualizar ingrediente. |
| DELETE | `/api/ingredients/:id` | Eliminar ingrediente. |

### Dishes (`/api/dishes`) — todas con Bearer token

Las respuestas de este módulo devuelven JSON **sin** el envoltorio `{ success, data }` (objeto o array directo).

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/dishes` | Crear platillo (name, calories; description opcional; imagen opcional multipart `image`). |
| GET | `/api/dishes` | Listar platillos del usuario. |
| GET | `/api/dishes/random` | Un platillo aleatorio del usuario. |
| GET | `/api/dishes/:id` | Obtener platillo por id (solo del usuario). |
| PUT | `/api/dishes/:id` | Actualizar platillo (campos opcionales + imagen opcional). |
| DELETE | `/api/dishes/:id` | Eliminar platillo. |

### Archivos estáticos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/uploads/...` | Archivos generados al subir `image` en comidas o platillos (ruta relativa guardada en BD). |

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

Incluye `userId` (mismo id que devuelve el login). Opcional: `steps` (lista de textos de preparación).

```bash
curl -X POST http://localhost:3000/api/meals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "userId":"<id-usuario>",
    "name":"Almuerzo",
    "date":"2026-04-10",
    "mealTime":"lunch",
    "ingredients":[{"ingredientId":"<id-ingrediente>","amount":150}],
    "steps":["Cocinar el arroz","Mezclar con el resto de ingredientes"]
  }'
```

---

## Licencia

ISC