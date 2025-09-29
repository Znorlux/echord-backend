# Echord Backend

Backend mínimo y funcional para la aplicación Echord (frontend en Flutter). Proporciona integración con la API de Shodan para búsqueda de hosts y gestión de favoritos con persistencia en PostgreSQL (se usó Neon para pruebas).

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
- **Sistema de caché** - Caché inteligente para optimizar uso de API Key

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
GET /api/v1/shodan/host/:target
```

**Parámetros:**

- `target` (obligatorio): Dirección IP válida (IPv4/IPv6) o dominio (ej: scanme.nmap.org)

**Ejemplos:**

```bash
# Con IP directa
curl "http://localhost:4000/api/v1/shodan/host/8.8.8.8"

# Con dominio (se resuelve automáticamente)
curl "http://localhost:4000/api/v1/shodan/host/scanme.nmap.org"
```

**Respuesta:**

```json
{
  "data": {
    "ip": "8.8.8.8",
    "org": "Google LLC",
    "isp": "Google LLC",
    "hostnames": ["dns.google"],
    "domains": ["google.com"],
    "original_hostname": "scanme.nmap.org",
    "geo": {
      "country": "United States",
      "city": "Mountain View",
      "lat": 37.4056,
      "lon": -122.0775
    },
    "last_update": "2025-09-25T10:12:03Z",
    "summary": {
      "open_ports_count": 2,
      "open_ports": [53, 443],
      "top_service": "dns",
      "web_stack": null,
      "tls_summary": null,
      "provider_hint": "Google",
      "badges": ["dns"],
      "risk_score": 12,
      "exposure_flags": [],
      "port_buckets": {
        "web": [443],
        "db": [],
        "remote_access": [],
        "mail": [],
        "dns": [53],
        "other": []
      }
    },
    "services": [
      {
        "port": 53,
        "transport": "udp",
        "service": "dns",
        "product": "Google Public DNS",
        "version": null,
        "cpe": [],
        "fingerprints": null,
        "http": null,
        "ssl": null,
        "raw_tags": []
      },
      {
        "port": 443,
        "transport": "tcp",
        "service": "https",
        "product": "Google Frontend",
        "version": null,
        "cpe": [],
        "http": {
          "server": "gws",
          "title": "",
          "status": 200,
          "redirects": [],
          "headers": {
            "strict-transport-security": "max-age=31536000; includeSubDomains"
          }
        },
        "ssl": {
          "cert": "...",
          "cipher": "TLS_AES_256_GCM_SHA384",
          "versions": ["TLSv1.3"]
        },
        "fingerprints": "abc123...",
        "raw_tags": []
      }
    ],
    "vulns": [
      {
        "cve": "CVE-2023-12345",
        "cvss": 9.8,
        "refs": ["https://nvd.nist.gov/..."]
      }
    ]
  }
}
```

**Campos de la respuesta:**

- `ip`: Dirección IP del host (resuelta si se envió un dominio)
- `org`: Organización propietaria
- `isp`: Proveedor de servicios de internet
- `hostnames`: Lista de nombres de host asociados
- `domains`: Lista de dominios asociados
- `original_hostname`: Dominio original (solo aparece si se envió un dominio)
- `geo`: Información geográfica (país, ciudad, coordenadas)
- `last_update`: Última actualización en Shodan
- `summary`: Resumen con información clave
  - `open_ports_count`: Cantidad de puertos abiertos
  - `open_ports`: Lista de puertos abiertos
  - `top_service`: Servicio más común
  - `web_stack`: Stack de tecnologías web detectado
  - `tls_summary`: Resumen de servicios TLS/SSL
  - `provider_hint`: Proveedor detectado
  - `badges`: Etiquetas de categorías
  - `risk_score`: Puntuación de riesgo (0-100)
  - `exposure_flags`: Banderas de exposición
  - `port_buckets`: Categorización de puertos
    - `web`: Puertos web (80, 443, 8080, etc.)
    - `db`: Puertos de bases de datos (3306, 5432, etc.)
    - `remote_access`: Acceso remoto (22, 3389, etc.)
    - `mail`: Servicios de correo (25, 110, etc.)
    - `dns`: Servicios DNS (53)
    - `other`: Otros puertos
- `services`: Lista detallada de servicios por puerto
- `vulns`: Vulnerabilidades detectadas (si las hay)

### Gestión de Caché

#### Estadísticas del Caché

```http
GET /api/v1/cache/stats
```

**Respuesta:**

```json
{
  "status": "success",
  "data": {
    "searches": {
      "total": 25,
      "expired": 3,
      "active": 22
    },
    "hosts": {
      "total": 15,
      "expired": 1,
      "active": 14
    }
  },
  "cache_config": {
    "search_expiry_hours": 6,
    "host_expiry_hours": 24
  }
}
```

#### Limpiar Caché Expirado

```http
POST /api/v1/cache/clean
```

**Respuesta:**

```json
{
  "status": "success",
  "message": "Caché limpiado exitosamente",
  "data": {
    "searches": {
      "total": 22,
      "expired": 0,
      "active": 22
    },
    "hosts": {
      "total": 14,
      "expired": 0,
      "active": 14
    }
  }
}
```

#### Vaciar Todo el Caché

```http
DELETE /api/v1/cache/clear
```

**Respuesta:**

```json
{
  "status": "success",
  "message": "Todo el caché ha sido vaciado",
  "data": {
    "searches_deleted": 22,
    "hosts_deleted": 14
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

### Modelos de Caché

```prisma
model ShodanSearchCache {
  id          String   @id @default(uuid())
  query       String   // Query de búsqueda original
  page        Int      // Página solicitada
  results     Json     // Resultados JSON de Shodan
  total       Int      // Total de resultados disponibles
  expiresAt   DateTime // Cuándo expira este caché
  createdAt   DateTime @default(now())

  @@unique([query, page])
}

model ShodanHostCache {
  id        String   @id @default(uuid())
  ip        String   @unique // IP del host
  data      Json     // Información completa del host
  expiresAt DateTime // Cuándo expira este caché
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 🚀 Sistema de Caché

### ¿Por qué usar caché?

- **Ahorro de API Key**: Evita peticiones repetidas a Shodan
- **Mejor rendimiento**: Respuestas instantáneas para datos ya consultados
- **Experiencia mejorada**: Sin esperas para consultas recientes

### Configuración del caché:

- **Búsquedas** (`/search`): Expiran en **96 horas** (4 días)
- **Hosts** (`/host/:ip`): Expiran en **168 horas** (7 días)
- **DNS** (resoluciones): Expiran en **720 horas** (30 días)

### Flujo de funcionamiento:

1. **Primera consulta**: Se consulta Shodan API y se guarda en caché
2. **Consultas posteriores**: Se sirve desde caché (mucho más rápido)
3. **Expiración**: Después del tiempo configurado, se vuelve a consultar Shodan

### Logs de caché en consola:

```bash
# Búsqueda desde caché
🔍 [CACHE] Buscando en caché: query="apache", page=1
✅ [CACHE] Encontrado en caché - creado: 2025-09-28T10:15:00.000Z
🎯 [SHODAN] Usando resultados desde caché

# Resolución DNS desde caché
🔍 [CACHE] Buscando DNS en caché: hostname="scanme.nmap.org"
✅ [CACHE] DNS encontrado en caché - actualizado: 2025-09-28T10:15:00.000Z
   scanme.nmap.org -> 45.33.32.156

# Host con dominio
🔍 [HOST INFO] Solicitud recibida:
   Target: scanme.nmap.org
   Tipo: Dominio
🌐 [SHODAN] Detectado dominio: scanme.nmap.org
🎯 [SHODAN DNS] Usando resolución desde caché
   scanme.nmap.org -> 45.33.32.156
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
2. Usar una base de datos PostgreSQL (ej: Neon, AWS RDS)
3. Configurar CORS más restrictivo si es necesario
