const axios = require("axios");
const { SHODAN_API_KEY } = require("../config/env");

const SHODAN_BASE_URL = "https://api.shodan.io/shodan";

// Validar que la API key esté configurada
if (!SHODAN_API_KEY) {
  throw new Error(
    "SHODAN_API_KEY no está configurada en las variables de entorno"
  );
}

/**
 * Busca hosts en Shodan
 * @param {string} query - Query de búsqueda
 * @param {number} page - Página (1-based)
 * @returns {Promise<object>} - Resultados de búsqueda
 */
const searchHosts = async (query, page = 1) => {
  try {
    const response = await axios.get(`${SHODAN_BASE_URL}/host/search`, {
      params: {
        key: SHODAN_API_KEY,
        query,
        page,
      },
      timeout: 10000, // 10 segundos timeout
    });

    const { matches, total } = response.data;

    // Transformar datos para devolver solo campos útiles
    const transformedMatches = matches.map((match) => ({
      ip_str: match.ip_str,
      port: match.port,
      org: match.org || "No disponible",
      country_name: match.location?.country_name || "No disponible",
      hostnames: match.hostnames || [],
    }));

    return {
      matches: transformedMatches,
      total,
    };
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        throw new Error(
          "API Key de Shodan inválida o expirada. Verifica tu SHODAN_API_KEY en el archivo .env"
        );
      }
      if (error.response.status === 403) {
        throw new Error(
          "Acceso denegado. Verifica los permisos de tu API Key de Shodan"
        );
      }
      throw new Error(
        `Error de Shodan API (${error.response.status}): ${
          error.response.data?.error || error.message
        }`
      );
    } else if (error.code === "ECONNABORTED") {
      throw new Error("Timeout en la solicitud a Shodan API");
    } else {
      throw new Error(`Error al conectar con Shodan API: ${error.message}`);
    }
  }
};

/**
 * Obtiene información detallada de un host
 * @param {string} ip - Dirección IP del host
 * @returns {Promise<object>} - Información del host
 */
const getHostInfo = async (ip) => {
  try {
    const response = await axios.get(`${SHODAN_BASE_URL}/host/${ip}`, {
      params: {
        key: SHODAN_API_KEY,
      },
      timeout: 10000, // 10 segundos timeout
    });

    const data = response.data;

    // Extraer puertos de todos los servicios
    const ports = data.data ? data.data.map((service) => service.port) : [];

    return {
      ip: data.ip_str,
      ports: [...new Set(ports)], // Eliminar duplicados
      org: data.org || "No disponible",
      isp: data.isp || "No disponible",
      country: data.country_name || "No disponible",
      city: data.city || "No disponible",
      last_update: data.last_update || null,
      tags: data.tags || [],
    };
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error("Host no encontrado en Shodan");
      }
      if (error.response.status === 401) {
        throw new Error(
          "API Key de Shodan inválida o expirada. Verifica tu SHODAN_API_KEY en el archivo .env"
        );
      }
      if (error.response.status === 403) {
        throw new Error(
          "Acceso denegado. Verifica los permisos de tu API Key de Shodan"
        );
      }
      throw new Error(
        `Error de Shodan API (${error.response.status}): ${
          error.response.data?.error || error.message
        }`
      );
    } else if (error.code === "ECONNABORTED") {
      throw new Error("Timeout en la solicitud a Shodan API");
    } else {
      throw new Error(`Error al conectar con Shodan API: ${error.message}`);
    }
  }
};

module.exports = {
  searchHosts,
  getHostInfo,
};
