const prisma = require("../config/prisma");
const {
  getPagination,
  createPaginatedResponse,
} = require("../utils/pagination");
const { validateFavoriteData } = require("../utils/validate");

/**
 * Obtener todos los favoritos con paginación y búsqueda
 */
const getFavorites = async (req, res, next) => {
  try {
    const { search = "", page = 1, size = 20 } = req.query;
    const {
      skip,
      take,
      page: pageNum,
      size: sizeNum,
    } = getPagination(page, size);

    // Construir filtros de búsqueda
    const where = search
      ? {
          OR: [
            { ip: { contains: search, mode: "insensitive" } },
            { alias: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    // Obtener favoritos y conteo total
    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.favorite.count({ where }),
    ]);

    const response = createPaginatedResponse(
      favorites,
      total,
      pageNum,
      sizeNum
    );
    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Crear un nuevo favorito
 */
const createFavorite = async (req, res, next) => {
  try {
    const validatedData = validateFavoriteData(req.body, false);

    const favorite = await prisma.favorite.create({
      data: validatedData,
    });

    res.status(201).json({
      message: "Favorito creado exitosamente",
      data: favorite,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener un favorito por ID
 */
const getFavoriteById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const favorite = await prisma.favorite.findUnique({
      where: { id },
    });

    if (!favorite) {
      return res.status(404).json({
        error: "Favorito no encontrado",
        message: "No existe un favorito con el ID proporcionado",
      });
    }

    res.json({
      data: favorite,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar un favorito completamente (PUT)
 */
const updateFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = validateFavoriteData(req.body, false); // PUT requiere todos los campos

    const favorite = await prisma.favorite.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      message: "Favorito actualizado exitosamente",
      data: favorite,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar un favorito parcialmente (PATCH)
 */
const patchFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = validateFavoriteData(req.body, true); // PATCH permite campos opcionales

    // Verificar que se proporcionó al menos un campo para actualizar
    if (Object.keys(validatedData).length === 0) {
      return res.status(400).json({
        error: "Datos inválidos",
        message: "Debe proporcionar al menos un campo para actualizar",
      });
    }

    const favorite = await prisma.favorite.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      message: "Favorito actualizado exitosamente",
      data: favorite,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar un favorito
 */
const deleteFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.favorite.delete({
      where: { id },
    });

    res.json({
      message: "Favorito eliminado exitosamente",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFavorites,
  createFavorite,
  getFavoriteById,
  updateFavorite,
  patchFavorite,
  deleteFavorite,
};
