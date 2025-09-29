const shodanService = require("../services/shodan.service");
const {
  isValidIPOrHostname,
  isDomain,
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

    console.log(`🔍 [SHODAN SEARCH] Búsqueda iniciada:`);
    console.log(`   Query: "${query}"`);
    console.log(`   Página: ${pageNum}`);
    console.log(`   Tamaño solicitado: ${sizeNum}`);

    // Buscar en Shodan
    const results = await shodanService.searchHosts(query, pageNum);

    console.log(`📊 [SHODAN SEARCH] Resultados obtenidos:`);
    console.log(`   Total en Shodan: ${results.total}`);
    console.log(`   Resultados en esta página: ${results.matches.length}`);

    // Limitar resultados al tamaño solicitado
    const limitedMatches = results.matches.slice(0, sizeNum);

    console.log(`✂️ [SHODAN SEARCH] Resultados limitados:`);
    console.log(`   Tamaño solicitado: ${sizeNum}`);
    console.log(`   Elementos después del corte: ${limitedMatches.length}`);

    // Crear respuesta paginada
    const response = createPaginatedResponse(
      limitedMatches,
      results.total,
      pageNum,
      sizeNum
    );

    console.log(`✅ [SHODAN SEARCH] Respuesta enviada:`);
    console.log(`   Elementos devueltos: ${response.data.length}`);
    console.log(`   Páginas totales: ${response.pagination.totalPages}`);
    console.log(`   ----------------------------------------`);

    res.json(response);
  } catch (error) {
    console.log(`❌ [SHODAN SEARCH] Error en búsqueda:`);
    console.log(`   Query: "${req.query.q}"`);
    console.log(`   Error: ${error.message}`);
    console.log(`   ----------------------------------------`);
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

    console.log(`🔍 [HOST INFO] Solicitud recibida:`);
    console.log(`   Target: ${ip}`);
    console.log(`   Tipo: ${isDomain(ip) ? "Dominio" : "IP"}`);

    // Obtener información del host (resuelve DNS automáticamente si es dominio)
    const hostInfo = await shodanService.getHostInfo(ip);

    console.log(`✅ [HOST INFO] Información obtenida exitosamente`);
    console.log(`   IP final: ${hostInfo.ip}`);
    if (hostInfo.original_hostname) {
      console.log(`   Hostname original: ${hostInfo.original_hostname}`);
    }
    console.log(
      `   Puertos encontrados: ${hostInfo.summary?.open_ports_count || "N/A"}`
    );

    res.json({
      data: hostInfo,
    });
  } catch (error) {
    console.log(`❌ [HOST INFO] Error procesando solicitud:`);
    console.log(`   Target: ${req.params.ip}`);
    console.log(`   Error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  searchHosts,
  getHostInfo,
};
