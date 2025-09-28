const express = require("express");
const cacheController = require("../controllers/cache.controller");

const router = express.Router();

// GET /api/v1/cache/stats - Obtener estadísticas del caché
router.get("/stats", cacheController.getCacheStats);

// POST /api/v1/cache/clean - Limpiar cachés expirados
router.post("/clean", cacheController.cleanCache);

// DELETE /api/v1/cache/clear - Vaciar todo el caché (desarrollo)
router.delete("/clear", cacheController.clearAllCache);

module.exports = router;
