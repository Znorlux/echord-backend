const shodanService = require("../services/shodan.service");
const {
  isValidIPOrHostname,
  isNotEmpty,
  createValidationError,
} = require("../utils/validate");
const { createPaginatedResponse } = require("../utils/pagination");

/**
 * Buscar hosts en Shodan
 */
const searchHosts = async (req, res, next) => {
  try {
    const { q: query, page = 1, size = 10 } = req.query;

    // Validar query
    if (!isNotEmpty(query)) {
      throw createValidationError(
        "El parámetro q (query) es obligatorio y no puede estar vacío"
      );
    }

    // Validar página y tamaño
    const pageNum = Math.max(1, parseInt(page) || 1);
    const sizeNum = Math.min(100, Math.max(1, parseInt(size) || 10));

    // Buscar en Shodan
    const results = await shodanService.searchHosts(query, pageNum);

    // Crear respuesta paginada
    const response = createPaginatedResponse(
      results.matches,
      results.total,
      pageNum,
      sizeNum
    );

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener información detallada de un host
 */
const getHostInfo = async (req, res, next) => {
  try {
    const { ip } = req.params;

    // Validar IP o hostname
    if (!isValidIPOrHostname(ip)) {
      throw createValidationError(
        "La dirección IP o hostname proporcionado no es válido"
      );
    }

    // Obtener información del host
    const hostInfo = await shodanService.getHostInfo(ip);

    res.json({
      data: hostInfo,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchHosts,
  getHostInfo,
};
