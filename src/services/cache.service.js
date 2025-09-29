const prisma = require("../config/prisma");

// Configuración de caché
const CACHE_CONFIG = {
  // Caché de búsquedas expira en 96 horas - 4 dias (las búsquedas son relativamente estables)
  SEARCH_EXPIRY_HOURS: 96,
  // Caché de hosts expira en 168 horas - 7 dias (la información de host puede cambiar)
  HOST_EXPIRY_HOURS: 168,
  // Caché de DNS expira en 720 horas - 30 dias (las resoluciones DNS son muy estables)
  DNS_EXPIRY_HOURS: 720,
};

/**
 * Obtiene una búsqueda del caché si existe y no ha expirado
 * @param {string} query - Query de búsqueda
 * @param {number} page - Página solicitada
 * @returns {Promise<object|null>} - Resultados cacheados o null
 */
const getCachedSearch = async (query, page) => {
  try {
    console.log(`🔍 [CACHE] Buscando en caché: query="${query}", page=${page}`);

    const cached = await prisma.shodanSearchCache.findUnique({
      where: {
        query_page: {
          query,
          page,
        },
      },
    });

    if (!cached) {
      console.log(`❌ [CACHE] No encontrado en caché`);
      return null;
    }

    // Verificar si ha expirado
    if (new Date() > cached.expiresAt) {
      console.log(`⏰ [CACHE] Caché expirado, eliminando...`);
      await prisma.shodanSearchCache.delete({
        where: { id: cached.id },
      });
      return null;
    }

    console.log(`✅ [CACHE] Encontrado en caché - creado: ${cached.createdAt}`);
    return {
      matches: cached.results,
      total: cached.total,
    };
  } catch (error) {
    console.error(`💥 [CACHE] Error obteniendo búsqueda cacheada:`, error);
    return null;
  }
};

/**
 * Guarda una búsqueda en el caché
 * @param {string} query - Query de búsqueda
 * @param {number} page - Página solicitada
 * @param {Array} results - Resultados de Shodan
 * @param {number} total - Total de resultados
 */
const cacheSearch = async (query, page, results, total) => {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CACHE_CONFIG.SEARCH_EXPIRY_HOURS);

    console.log(
      `💾 [CACHE] Guardando búsqueda en caché: query="${query}", page=${page}`
    );
    console.log(`💾 [CACHE] Expira: ${expiresAt.toISOString()}`);

    await prisma.shodanSearchCache.upsert({
      where: {
        query_page: {
          query,
          page,
        },
      },
      create: {
        query,
        page,
        results,
        total,
        expiresAt,
      },
      update: {
        results,
        total,
        expiresAt,
      },
    });

    console.log(`✅ [CACHE] Búsqueda guardada en caché`);
  } catch (error) {
    console.error(`💥 [CACHE] Error guardando búsqueda:`, error);
  }
};

/**
 * Obtiene información de host del caché si existe y no ha expirado
 * @param {string} ip - IP del host
 * @returns {Promise<object|null>} - Información cacheada o null
 */
const getCachedHost = async (ip) => {
  try {
    console.log(`🔍 [CACHE] Buscando host en caché: ip="${ip}"`);

    const cached = await prisma.shodanHostCache.findUnique({
      where: { ip },
    });

    if (!cached) {
      console.log(`❌ [CACHE] Host no encontrado en caché`);
      return null;
    }

    // Verificar si ha expirado
    if (new Date() > cached.expiresAt) {
      console.log(`⏰ [CACHE] Caché de host expirado, eliminando...`);
      await prisma.shodanHostCache.delete({
        where: { ip },
      });
      return null;
    }

    console.log(
      `✅ [CACHE] Host encontrado en caché - actualizado: ${cached.updatedAt}`
    );
    return cached.data;
  } catch (error) {
    console.error(`💥 [CACHE] Error obteniendo host cacheado:`, error);
    return null;
  }
};

/**
 * Guarda información de host en el caché
 * @param {string} ip - IP del host
 * @param {object} data - Información completa del host
 */
const cacheHost = async (ip, data) => {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CACHE_CONFIG.HOST_EXPIRY_HOURS);

    console.log(`💾 [CACHE] Guardando host en caché: ip="${ip}"`);
    console.log(`💾 [CACHE] Expira: ${expiresAt.toISOString()}`);

    await prisma.shodanHostCache.upsert({
      where: { ip },
      create: {
        ip,
        data,
        expiresAt,
      },
      update: {
        data,
        expiresAt,
      },
    });

    console.log(`✅ [CACHE] Host guardado en caché`);
  } catch (error) {
    console.error(`💥 [CACHE] Error guardando host:`, error);
  }
};

/**
 * Obtiene una resolución DNS del caché si existe y no ha expirado
 * @param {string} hostname - Hostname a resolver
 * @returns {Promise<string|null>} - IP resuelta o null
 */
const getCachedDNS = async (hostname) => {
  try {
    console.log(`🔍 [CACHE] Buscando DNS en caché: hostname="${hostname}"`);

    const cached = await prisma.shodanDNSCache.findUnique({
      where: { hostname },
    });

    if (!cached) {
      console.log(`❌ [CACHE] DNS no encontrado en caché`);
      return null;
    }

    // Verificar si ha expirado
    if (new Date() > cached.expiresAt) {
      console.log(`⏰ [CACHE] Caché de DNS expirado, eliminando...`);
      await prisma.shodanDNSCache.delete({
        where: { hostname },
      });
      return null;
    }

    console.log(
      `✅ [CACHE] DNS encontrado en caché - actualizado: ${cached.updatedAt}`
    );
    console.log(`   ${hostname} -> ${cached.ip}`);
    return cached.ip;
  } catch (error) {
    console.error(`💥 [CACHE] Error obteniendo DNS cacheado:`, error);
    return null;
  }
};

/**
 * Guarda una resolución DNS en el caché
 * @param {string} hostname - Hostname resuelto
 * @param {string} ip - IP resuelta
 */
const cacheDNS = async (hostname, ip) => {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CACHE_CONFIG.DNS_EXPIRY_HOURS);

    console.log(`💾 [CACHE] Guardando DNS en caché: ${hostname} -> ${ip}`);
    console.log(`💾 [CACHE] Expira: ${expiresAt.toISOString()}`);

    await prisma.shodanDNSCache.upsert({
      where: { hostname },
      create: {
        hostname,
        ip,
        expiresAt,
      },
      update: {
        ip,
        expiresAt,
      },
    });

    console.log(`✅ [CACHE] DNS guardado en caché`);
  } catch (error) {
    console.error(`💥 [CACHE] Error guardando DNS:`, error);
  }
};

/**
 * Limpia cachés expirados (para ejecutar periódicamente)
 */
const cleanExpiredCache = async () => {
  try {
    console.log(`🧹 [CACHE] Limpiando cachés expirados...`);

    const now = new Date();

    // Limpiar búsquedas expiradas
    const expiredSearches = await prisma.shodanSearchCache.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    // Limpiar hosts expirados
    const expiredHosts = await prisma.shodanHostCache.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    // Limpiar DNS expirados
    const expiredDNS = await prisma.shodanDNSCache.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    console.log(`🧹 [CACHE] Limpieza completada:`);
    console.log(`   Búsquedas eliminadas: ${expiredSearches.count}`);
    console.log(`   Hosts eliminados: ${expiredHosts.count}`);
    console.log(`   DNS eliminados: ${expiredDNS.count}`);
  } catch (error) {
    console.error(`💥 [CACHE] Error limpiando caché:`, error);
  }
};

/**
 * Obtiene estadísticas del caché
 */
const getCacheStats = async () => {
  try {
    const searchCount = await prisma.shodanSearchCache.count();
    const hostCount = await prisma.shodanHostCache.count();
    const dnsCount = await prisma.shodanDNSCache.count();

    const now = new Date();
    const expiredSearchCount = await prisma.shodanSearchCache.count({
      where: { expiresAt: { lt: now } },
    });
    const expiredHostCount = await prisma.shodanHostCache.count({
      where: { expiresAt: { lt: now } },
    });
    const expiredDNSCount = await prisma.shodanDNSCache.count({
      where: { expiresAt: { lt: now } },
    });

    return {
      searches: {
        total: searchCount,
        expired: expiredSearchCount,
        active: searchCount - expiredSearchCount,
      },
      hosts: {
        total: hostCount,
        expired: expiredHostCount,
        active: hostCount - expiredHostCount,
      },
      dns: {
        total: dnsCount,
        expired: expiredDNSCount,
        active: dnsCount - expiredDNSCount,
      },
    };
  } catch (error) {
    console.error(`💥 [CACHE] Error obteniendo estadísticas:`, error);
    return null;
  }
};

module.exports = {
  getCachedSearch,
  cacheSearch,
  getCachedHost,
  cacheHost,
  getCachedDNS,
  cacheDNS,
  cleanExpiredCache,
  getCacheStats,
  CACHE_CONFIG,
};
