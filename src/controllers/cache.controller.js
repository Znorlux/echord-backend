const cacheService = require("../services/cache.service");

/**
 * Obtener estadísticas del caché
 */
const getCacheStats = async (req, res, next) => {
  try {
    console.log(`📊 [CACHE] Obteniendo estadísticas del caché...`);

    const stats = await cacheService.getCacheStats();

    if (!stats) {
      throw new Error("No se pudieron obtener las estadísticas del caché");
    }

    console.log(`📊 [CACHE] Estadísticas obtenidas:`);
    console.log(`   Búsquedas activas: ${stats.searches.active}`);
    console.log(`   Hosts activos: ${stats.hosts.active}`);

    res.json({
      status: "success",
      data: stats,
      cache_config: {
        search_expiry_hours: cacheService.CACHE_CONFIG.SEARCH_EXPIRY_HOURS,
        host_expiry_hours: cacheService.CACHE_CONFIG.HOST_EXPIRY_HOURS,
      },
    });
  } catch (error) {
    console.log(`❌ [CACHE] Error obteniendo estadísticas:`, error.message);
    next(error);
  }
};

/**
 * Limpiar cachés expirados manualmente
 */
const cleanCache = async (req, res, next) => {
  try {
    console.log(`🧹 [CACHE] Iniciando limpieza manual del caché...`);

    await cacheService.cleanExpiredCache();

    const stats = await cacheService.getCacheStats();

    res.json({
      status: "success",
      message: "Caché limpiado exitosamente",
      data: stats,
    });
  } catch (error) {
    console.log(`❌ [CACHE] Error limpiando caché:`, error.message);
    next(error);
  }
};

/**
 * Vaciar todo el caché (para desarrollo/testing)
 */
const clearAllCache = async (req, res, next) => {
  try {
    console.log(`🗑️ [CACHE] Vaciando todo el caché...`);

    const prisma = require("../config/prisma");

    const deletedSearches = await prisma.shodanSearchCache.deleteMany({});
    const deletedHosts = await prisma.shodanHostCache.deleteMany({});

    console.log(`🗑️ [CACHE] Caché vaciado:`);
    console.log(`   Búsquedas eliminadas: ${deletedSearches.count}`);
    console.log(`   Hosts eliminados: ${deletedHosts.count}`);

    res.json({
      status: "success",
      message: "Todo el caché ha sido vaciado",
      data: {
        searches_deleted: deletedSearches.count,
        hosts_deleted: deletedHosts.count,
      },
    });
  } catch (error) {
    console.log(`❌ [CACHE] Error vaciando caché:`, error.message);
    next(error);
  }
};

module.exports = {
  getCacheStats,
  cleanCache,
  clearAllCache,
};
