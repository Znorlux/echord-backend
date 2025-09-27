# Echord Backend

Backend mínimo y funcional para la aplicación Echord (frontend en Flutter). Proporciona integración con la API de Shodan para búsqueda de hosts y gestión de favoritos con persistencia en PostgreSQL.

## 🚀 Características

- **Node.js + Express** - Framework web minimalista
- **Prisma ORM** - Manejo de base de datos PostgreSQL (Neon)
- **API de Shodan** - Búsqueda y detalle de hosts
- **Sin autenticación** - API abierta para desarrollo
- **CORS habilitado** - Compatible con aplicaciones frontend
- **Rate limiting** - 60 requests por minuto por IP
- **Logging** - Registro de requests con Morgan
- **Validación** - Validación manual de entrada
- **Paginación** - Respuestas paginadas
- **Manejo de errores** - Middleware centralizado

## 📁 Estructura del Proyecto

```
echord-backend/
├── src/
│   ├── config/          # Configuraciones (CORS, rate-limit, env, prisma)
│   ├── routes/          # Definición de rutas
│   ├── controllers/     # Controladores de lógica de negocio
│   ├── services/        # Servicios externos (Shodan API)
│   ├── middlewares/     # Middlewares personalizados
│   ├── utils/           # Utilidades (paginación, validación)
│   ├── app.js           # Configuración de Express
│   └── server.js        # Punto de entrada de la aplicación
├── prisma/
│   └── schema.prisma    # Esquema de base de datos
├── package.json         # Dependencias y scripts
├── env.example          # Ejemplo de variables de entorno
└── README.md           # Documentación
```

## ⚙️ Instalación y Configuración

### Prerrequisitos

- Node.js 16+
- npm o yarn
- Base de datos PostgreSQL (recomendado: Neon)
- API Key de Shodan

### Pasos de instalación

1. **Clonar el repositorio e instalar dependencias:**

```bash
npm install
```

2. **Configurar variables de entorno:**

Copia `env.example` a `.env` y configura las variables:

```bash
cp env.example .env
```

Edita el archivo `.env`:

```env
PORT=4000
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require
SHODAN_API_KEY=tu_api_key_de_shodan
```

3. **Configurar base de datos:**

```bash
# Generar cliente de Prisma
npm run prisma:generate

# Aplicar migraciones (o push para desarrollo)
npm run prisma:push
```

4. **Iniciar el servidor:**

```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:4000`

## 🛠️ Scripts NPM

```bash
npm start              # Iniciar servidor en producción
npm run dev            # Iniciar servidor en desarrollo (nodemon)
npm run build          # No build requerido (JavaScript puro)
npm run prisma:generate # Generar cliente de Prisma
npm run prisma:migrate  # Ejecutar migraciones
npm run prisma:push     # Push schema a base de datos (desarrollo)
```

## 📚 API Endpoints

### Health Check

```http
GET /api/v1/health
```

**Respuesta:**

```json
{
  "status": "OK",
  "message": "Echord Backend está funcionando correctamente",
  "timestamp": "2023-10-15T10:30:00.000Z"
}
```

### Shodan API

#### Buscar Hosts

```http
GET /api/v1/shodan/search?q=<query>&page=1&size=10
```

**Parámetros:**

- `q` (obligatorio): Query de búsqueda
- `page` (opcional): Número de página (default: 1)
- `size` (opcional): Tamaño de página (default: 10, máx: 100)

**Ejemplo:**

```bash
curl "http://localhost:4000/api/v1/shodan/search?q=apache&page=1&size=5"
```

**Respuesta:**

```json
{
  "data": [
    {
      "ip_str": "192.168.1.1",
      "port": 80,
      "org": "Example Org",
      "country_name": "United States",
      "hostnames": ["example.com"]
    }
  ],
  "pagination": {
    "page": 1,
    "size": 5,
    "total": 1000,
    "totalPages": 200,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Información de Host

```http
GET /api/v1/shodan/host/:ip
```

**Parámetros:**

- `ip` (obligatorio): Dirección IP válida (IPv4/IPv6) o hostname (ej: scanme.nmap.org)

**Ejemplo:**

```bash
curl "http://localhost:4000/api/v1/shodan/host/8.8.8.8"
```

**Respuesta:**

```json
{
  "data": {
    "ip": "8.8.8.8",
    "ports": [53, 443],
    "org": "Google LLC",
    "isp": "Google LLC",
    "country": "United States",
    "city": "Mountain View",
    "last_update": "2023-10-15T08:00:00.000Z",
    "tags": ["dns", "resolver"]
  }
}
```

### Favoritos

#### Listar Favoritos

```http
GET /api/v1/favorites?search=&page=1&size=20
```

**Parámetros:**

- `search` (opcional): Buscar por IP o alias
- `page` (opcional): Número de página (default: 1)
- `size` (opcional): Tamaño de página (default: 20, máx: 100)

**Ejemplo:**

```bash
curl "http://localhost:4000/api/v1/favorites?search=google&page=1&size=10"
```

#### Crear Favorito

```http
POST /api/v1/favorites
Content-Type: application/json

{
  "ip": "8.8.8.8",
  "alias": "Google DNS",
  "notes": "Servidor DNS público de Google",
  "tags": ["dns", "google", "público"]
}
```

**Ejemplo:**

```bash
curl -X POST "http://localhost:4000/api/v1/favorites" \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "8.8.8.8",
    "alias": "Google DNS",
    "notes": "Servidor DNS público de Google",
    "tags": ["dns", "google"]
  }'
```

#### Obtener Favorito

```http
GET /api/v1/favorites/:id
```

**Ejemplo:**

```bash
curl "http://localhost:4000/api/v1/favorites/123e4567-e89b-12d3-a456-426614174000"
```

#### Actualizar Favorito (Completo)

```http
PUT /api/v1/favorites/:id
Content-Type: application/json

{
  "ip": "8.8.4.4",
  "alias": "Google DNS Secundario",
  "notes": "Servidor DNS secundario de Google",
  "tags": ["dns", "google", "secundario"]
}
```

#### Actualizar Favorito (Parcial)

```http
PATCH /api/v1/favorites/:id
Content-Type: application/json

{
  "notes": "Notas actualizadas",
  "tags": ["dns", "actualizado"]
}
```

#### Eliminar Favorito

```http
DELETE /api/v1/favorites/:id
```

**Ejemplo:**

```bash
curl -X DELETE "http://localhost:4000/api/v1/favorites/123e4567-e89b-12d3-a456-426614174000"
```

## 🔧 Configuración

### Variables de Entorno

| Variable         | Descripción                  | Ejemplo                                               |
| ---------------- | ---------------------------- | ----------------------------------------------------- |
| `PORT`           | Puerto del servidor          | `4000`                                                |
| `DATABASE_URL`   | URL de conexión a PostgreSQL | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `SHODAN_API_KEY` | API Key de Shodan            | `your_shodan_api_key`                                 |

### Rate Limiting

- **Límite:** 60 requests por minuto por IP
- **Ventana:** 1 minuto
- **Headers:** `RateLimit-*` incluidos en respuestas

### CORS

- **Origen:** `*` (todos los dominios permitidos)
- **Métodos:** `GET, POST, PUT, PATCH, DELETE`
- **Headers:** `Content-Type, Authorization`

## 🚨 Manejo de Errores

La API devuelve errores en formato JSON consistente:

```json
{
  "error": "Tipo de error",
  "message": "Descripción detallada del error",
  "timestamp": "2023-10-15T10:30:00.000Z"
}
```

### Códigos de Estado HTTP

- `200` - Éxito
- `201` - Creado
- `400` - Petición inválida
- `404` - Recurso no encontrado
- `409` - Conflicto (recurso duplicado)
- `429` - Demasiadas peticiones (rate limit)
- `500` - Error interno del servidor

### Errores Comunes de Configuración

**Variables de entorno faltantes:**

```json
{
  "error": "Error de configuración",
  "message": "Variable de entorno DATABASE_URL no configurada. Verifica tu archivo .env"
}
```

**Error de conexión a base de datos:**

```json
{
  "error": "Error de conexión a base de datos",
  "message": "No se pudo conectar a la base de datos. Verifica la configuración de DATABASE_URL"
}
```

**API Key de Shodan faltante:**

```json
{
  "error": "Error de configuración",
  "message": "Variable de entorno SHODAN_API_KEY no configurada. Verifica tu archivo .env"
}
```

**API Key de Shodan inválida:**

```json
{
  "error": "Error en servicio externo",
  "message": "API Key de Shodan inválida o expirada. Verifica tu SHODAN_API_KEY en el archivo .env"
}
```

## 🗄️ Base de Datos

### Modelo Favorite

```prisma
model Favorite {
  id        String   @id @default(uuid())
  ip        String
  alias     String
  notes     String?
  tags      String[] @default([])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 🐛 Desarrollo y Debug

### Logs

Los logs se muestran en consola con el formato de Morgan 'dev':

```
GET /api/v1/favorites 200 45.123 ms - 1234
POST /api/v1/favorites 201 12.456 ms - 567
```

### Validaciones

- **IP:** Validación IPv4/IPv6 usando regex
- **Campos obligatorios:** `ip` y `alias` en favoritos
- **Tags:** Debe ser array de strings
- **Paginación:** Límites automáticos (máx 100 por página)

## 🚀 Despliegue

Para producción, asegúrate de:

1. Configurar variables de entorno apropiadas
2. Usar una base de datos PostgreSQL confiable (ej: Neon, AWS RDS)
3. Configurar CORS más restrictivo si es necesario
4. Considerar usar HTTPS
5. Configurar logging más avanzado
6. Implementar monitoreo

## 📄 Licencia

ISC

## 🤝 Contribuciones

Este es un proyecto base mínimo. Para mejoras:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

---

**Desarrollado para Echord** 🎯
