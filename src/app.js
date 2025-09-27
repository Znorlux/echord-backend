const express = require("express");
const morgan = require("morgan");

// Importar configuraciones
const corsConfig = require("./config/cors");
const rateLimitConfig = require("./config/rateLimit");

// Importar rutas
const routes = require("./routes");

// Importar middlewares
const errorHandler = require("./middlewares/errorHandler");
const notFound = require("./middlewares/notFound");

// Crear aplicación Express
const app = express();

// Middlewares globales
app.use(corsConfig); // CORS
app.use(rateLimitConfig); // Rate limiting
app.use(morgan("dev")); // Logger
app.use(express.json({ limit: "10mb" })); // Parser JSON
app.use(express.urlencoded({ extended: true })); // Parser URL encoded

// Rutas principales
app.use("/api/v1", routes);

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    name: "Echord Backend",
    version: "1.0.0",
    description:
      "Backend para la aplicación Echord - Búsqueda con Shodan y gestión de favoritos",
    endpoints: {
      health: "/api/v1/health",
      shodan: {
        search: "/api/v1/shodan/search?q=<query>&page=1&size=10",
        host: "/api/v1/shodan/host/:ip",
      },
      favorites: {
        list: "/api/v1/favorites?search=&page=1&size=20",
        create: "POST /api/v1/favorites",
        get: "/api/v1/favorites/:id",
        update: "PUT /api/v1/favorites/:id",
        patch: "PATCH /api/v1/favorites/:id",
        delete: "DELETE /api/v1/favorites/:id",
      },
    },
  });
});

// Middleware para rutas no encontradas
app.use(notFound);

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

module.exports = app;
