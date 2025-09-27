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
 * Categoriza puertos en buckets para la UI
 * @param {number} port - Número de puerto
 * @returns {string} - Categoría del puerto
 */
const categorizePort = (port) => {
  const portCategories = {
    web: [
      80, 443, 8080, 8443, 8000, 8888, 3000, 5000, 9000, 8008, 8081, 8082, 8083,
      8084, 8085,
    ],
    db: [
      3306, 5432, 1433, 1521, 27017, 6379, 5984, 9042, 7000, 7001, 9160, 9200,
      9300,
    ],
    remote_access: [22, 23, 3389, 5900, 5901, 5902, 4899, 5800, 5801, 5802],
    mail: [25, 110, 143, 993, 995, 465, 587, 2525],
    dns: [53],
    other: [], // Categoría por defecto
  };

  for (const [category, ports] of Object.entries(portCategories)) {
    if (category !== "other" && ports.includes(port)) {
      return category;
    }
  }
  return "other";
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
    const services = data.data || [];
    const ports = services.map((service) => service.port);
    const uniquePorts = [...new Set(ports)];

    // Categorizar puertos
    const portBuckets = {
      web: [],
      db: [],
      remote_access: [],
      mail: [],
      dns: [],
      other: [],
    };

    uniquePorts.forEach((port) => {
      const category = categorizePort(port);
      portBuckets[category].push(port);
    });

    // Procesar servicios detallados
    const processedServices = services.map((service) => {
      const serviceData = {
        port: service.port,
        transport: service.transport || "tcp",
        service: service.product || service._shodan?.module || "unknown",
        product: service.product || null,
        version: service.version || null,
        cpe: service.cpe || [],
        fingerprints: service.hash || null,
        http: null,
        ssl: null,
        raw_tags: service.tags || [],
      };

      // Información HTTP si está disponible
      if (service.http) {
        serviceData.http = {
          server: service.http.server || null,
          title: service.http.title || "",
          status: service.http.status || null,
          redirects: service.http.redirects || [],
          headers: service.http.headers || {},
        };
      }

      // Información SSL/TLS si está disponible
      if (service.ssl) {
        serviceData.ssl = {
          cert: service.ssl.cert || null,
          cipher: service.ssl.cipher || null,
          versions: service.ssl.versions || [],
        };
      }

      return serviceData;
    });

    // Identificar el servicio más común
    const serviceCount = {};
    processedServices.forEach((service) => {
      const serviceName = service.service;
      serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1;
    });
    const topService = Object.keys(serviceCount).reduce(
      (a, b) => (serviceCount[a] > serviceCount[b] ? a : b),
      "unknown"
    );

    // Detectar stack web
    const webPorts = portBuckets.web;
    let webStack = null;
    if (webPorts.length > 0) {
      const webServices = processedServices.filter((s) =>
        webPorts.includes(s.port)
      );
      const servers = webServices.map((s) => s.http?.server).filter(Boolean);
      if (servers.length > 0) {
        webStack = [...new Set(servers)].join(", ");
      }
    }

    // Resumen TLS
    let tlsSummary = null;
    const tlsServices = processedServices.filter((s) => s.ssl);
    if (tlsServices.length > 0) {
      const ciphers = tlsServices.map((s) => s.ssl?.cipher).filter(Boolean);
      tlsSummary = {
        services_count: tlsServices.length,
        common_ciphers: [...new Set(ciphers)].slice(0, 3),
      };
    }

    // Calcular risk score básico
    let riskScore = 0;
    if (portBuckets.remote_access.length > 0) riskScore += 30;
    if (portBuckets.db.length > 0) riskScore += 25;
    if (portBuckets.web.length > 0) riskScore += 10;
    if (uniquePorts.length > 10) riskScore += 15;
    riskScore = Math.min(100, riskScore);

    // Flags de exposición
    const exposureFlags = [];
    if (portBuckets.remote_access.length > 0)
      exposureFlags.push("remote_access_exposed");
    if (portBuckets.db.length > 0) exposureFlags.push("database_exposed");
    if (processedServices.some((s) => s.http && !s.ssl))
      exposureFlags.push("unencrypted_web");

    // Detectar provider
    const org = data.org || "";
    let providerHint = null;
    if (org.toLowerCase().includes("google")) providerHint = "Google";
    else if (org.toLowerCase().includes("amazon")) providerHint = "AWS";
    else if (org.toLowerCase().includes("microsoft"))
      providerHint = "Microsoft";
    else if (org.toLowerCase().includes("cloudflare"))
      providerHint = "Cloudflare";

    // Badges basados en servicios
    const badges = [];
    if (portBuckets.dns.length > 0) badges.push("dns");
    if (portBuckets.web.length > 0) badges.push("web");
    if (portBuckets.db.length > 0) badges.push("database");
    if (portBuckets.mail.length > 0) badges.push("mail");

    return {
      ip: data.ip_str,
      org: data.org || "No disponible",
      isp: data.isp || "No disponible",
      hostnames: data.hostnames || [],
      domains: data.domains || [],
      geo: {
        country: data.country_name || "No disponible",
        city: data.city || "No disponible",
        lat: data.latitude || null,
        lon: data.longitude || null,
      },
      last_update: data.last_update || null,
      summary: {
        open_ports_count: uniquePorts.length,
        open_ports: uniquePorts.sort((a, b) => a - b),
        top_service: topService,
        web_stack: webStack,
        tls_summary: tlsSummary,
        provider_hint: providerHint,
        badges: badges,
        risk_score: riskScore,
        exposure_flags: exposureFlags,
        port_buckets: portBuckets,
      },
      services: processedServices,
      vulns: data.vulns || [], // Shodan puede incluir vulnerabilidades
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
