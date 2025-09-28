const express = require("express");
const shodanRoutes = require("./shodan.routes");
const favoritesRoutes = require("./favorites.routes");
const cacheRoutes = require("./cache.routes");

const router = express.Router();

// Rutas de Shodan
router.use("/shodan", shodanRoutes);

// Rutas de Favoritos
router.use("/favorites", favoritesRoutes);

// Rutas de Caché
router.use("/cache", cacheRoutes);

// Ruta de health check
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Echord Backend está funcionando correctamente",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
