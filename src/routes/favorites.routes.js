const express = require("express");
const favoritesController = require("../controllers/favorites.controller");

const router = express.Router();

// GET /api/v1/favorites?search=&page=1&size=20
router.get("/", favoritesController.getFavorites);

// POST /api/v1/favorites
router.post("/", favoritesController.createFavorite);

// GET /api/v1/favorites/:id
router.get("/:id", favoritesController.getFavoriteById);

// PUT /api/v1/favorites/:id (actualización completa)
router.put("/:id", favoritesController.updateFavorite);

// PATCH /api/v1/favorites/:id (actualización parcial)
router.patch("/:id", favoritesController.patchFavorite);

// DELETE /api/v1/favorites/:id
router.delete("/:id", favoritesController.deleteFavorite);

module.exports = router;
